import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useServers } from "../servers/hooks/use-servers";
import { TerminalHeader } from "./components/terminal-header";
import { TerminalTabs } from "./components/terminal-tabs";
import { TerminalViewport } from "./components/terminal-viewport";
import { TerminalStatusBar } from "./components/terminal-status-bar";
import { FitAddon } from "@xterm/addon-fit";
import { MobileTerminalToolbar } from "./components/mobile-toolbar";
import { useViewport } from "./hooks/use-viewport";
import { Button } from "@/components/ui/button";
import { CheckCheck, ChevronRight, Maximize, Minimize, Upload } from "lucide-react";
import { useTerminalMetrics } from "./hooks/use-terminal-metrics";
import { TERMINAL_THEMES } from "./utils/terminal-themes";
import { useTheme } from "next-themes";
import { api } from "@/api/axios";


export type ConnectionStatus = "connecting" | "connected" | "disconnected";
const DESKTOP_FONT_SIZE = 14;
const MOBILE_FONT_SIZE = 12;

type UploadStatus =
    | { state: "idle" }
    | { state: "uploading"; filename: string; percent: number }
    | { state: "success"; filename: string }
    | { state: "error"; filename: string; message: string };

export default function TerminalPage() {
    const { id: serverId } = useParams<{ id: string }>();
    const [termDimensions, setTermDimensions] = useState({ rows: 32, cols: 120 });
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ state: "idle" });

    const { resolvedTheme } = useTheme()

    const isDark = resolvedTheme === "dark"

    useEffect(() => {
        if (!xtermInstance.current) return;
        xtermInstance.current.options.theme = TERMINAL_THEMES[isDark ? "dark" : "light"];
    }, [isDark]);


    // Fetch all servers and find the one matching the URL param
    const { data: servers, isLoading, isError } = useServers();
    const server = servers?.find((s: any) => s.id === serverId);

    const navigate = useNavigate();
    const viewportHeight = useViewport()

    const [mods, setMods] = useState({ ctrl: false, alt: false });
    const modsRef = useRef({ ctrl: false, alt: false });

    const toggleMod = (key: "ctrl" | "alt") => {
        modsRef.current[key] = !modsRef.current[key];
        setMods({ ...modsRef.current });
        xtermInstance.current?.focus();
    };

    const applyModifiers = (data: string): string => {
        const { ctrl, alt } = modsRef.current;
        if (!ctrl && !alt) return data;
        if (data.length !== 1) return data; // never mangle pasted/multi-char blocks

        let payload = data;

        if (ctrl) {
            const charCode = data.toLowerCase().charCodeAt(0);
            if (charCode >= 97 && charCode <= 122) {
                payload = String.fromCharCode(charCode - 96);
            }
        }
        if (alt) {
            payload = "\x1B" + payload;
        }

        modsRef.current = { ctrl: false, alt: false };
        setMods({ ctrl: false, alt: false });
        return payload;
    };

    const handleSendInput = (data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const encoder = new TextEncoder();
            wsRef.current.send(encoder.encode(applyModifiers(data)));
            xtermInstance.current?.focus();
        }
    };

    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermInstance = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const redirectTimeoutRef = useRef<number | null>(null);

    // To handle cases where drops landing outside the dropzone navigates the tab to the raw file and kills the live session
    useEffect(() => {
        const preventDefault = (e: DragEvent) => e.preventDefault();
        window.addEventListener("dragover", preventDefault);
        window.addEventListener("drop", preventDefault);
        return () => {
            window.removeEventListener("dragover", preventDefault);
            window.removeEventListener("drop", preventDefault);
        };
    }, []);


    useEffect(() => {
        if (!terminalRef.current || !server) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: TERMINAL_THEMES[isDark ? "dark" : "light"],
            rightClickSelectsWord: true,
            fontSize: window.innerWidth < 768 ? MOBILE_FONT_SIZE : DESKTOP_FONT_SIZE,
        });

        term.attachCustomKeyEventHandler((event) => {
            if (event.ctrlKey && event.code === "KeyC" && event.type === "keydown") {
                if (term.hasSelection()) {
                    navigator.clipboard.writeText(term.getSelection());
                    term.clearSelection();
                    return false; // To suppress the \x03 SIGINT payload
                }
                // If nothing is selected, let it pass through to kill the running process
                return true;
            }

            return true; // Allow all other key events to pass through
        })

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        xtermInstance.current = term;
        term.open(terminalRef.current);

        fitAddon.fit();

        // xterm.js has no native touch-to-scroll support on mobile (xtermjs/xterm.js#5377, still open).
        // .xterm-viewport is technically overflow:scroll but doesn't reliably respond to touch drags,
        // so we translate touch deltas into term.scrollLines() calls ourselves.
        const viewportEl = terminalRef.current.querySelector<HTMLElement>(".xterm-viewport");
        let touchStartY = 0;
        let accumulatedDelta = 0;

        const onTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
            accumulatedDelta = 0;
        };

        const onTouchMove = (e: TouchEvent) => {
            const currentY = e.touches[0].clientY;
            const deltaY = touchStartY - currentY; // finger moves up -> positive -> scroll down
            touchStartY = currentY;
            accumulatedDelta += deltaY;

            const rowHeight = term.element ? term.element.clientHeight / term.rows : 20;
            const lineDelta = Math.trunc(accumulatedDelta / rowHeight);

            if (lineDelta !== 0) {
                term.scrollLines(lineDelta);
                accumulatedDelta -= lineDelta * rowHeight;
            }

            e.preventDefault(); // we're handling the gesture now — don't let the page do anything with it
        };

        viewportEl?.addEventListener("touchstart", onTouchStart, { passive: true });
        viewportEl?.addEventListener("touchmove", onTouchMove, { passive: false });

        const resizeObserver = new ResizeObserver(() => {
            try {
                const currentIsMobile = window.innerWidth < 768;
                const targetFontSize = currentIsMobile ? MOBILE_FONT_SIZE : DESKTOP_FONT_SIZE;

                if (term.options.fontSize !== targetFontSize) {
                    term.options.fontSize = targetFontSize;
                }

                fitAddon.fit();
            } catch (err) {
                // Ignore layout calculation errors during unmounts
            }
        });
        resizeObserver.observe(terminalRef.current);

        const hostIp = window.location.hostname;
        // Check for an existing session ID for this specific server
        const savedSessionId = sessionStorage.getItem(`bastion_term_${server.id}`);

        // Append it to the query string if it exists
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = new URL(`${protocol}//${window.location.host}/ws/terminal`);
        
        wsUrl.searchParams.set("serverId", server.id);
        wsUrl.searchParams.set("cols", term.cols.toString());
        wsUrl.searchParams.set("rows", term.rows.toString());
        if (savedSessionId) {
            wsUrl.searchParams.set("sessionId", savedSessionId);
        }

        const ws = new WebSocket(wsUrl.toString());
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                let sanitizedData = data.replace(/\x1b\[200~/g, '').replace(/\x1b\[201~/g, '');
                sanitizedData = sanitizedData.replace(/\r\n/g, '\r').replace(/\n/g, '\r');
                const payload = applyModifiers(sanitizedData);
                const encoder = new TextEncoder();
                ws.send(encoder.encode(payload));
            }
        });

        term.onResize(({ cols, rows }) => {
            setTermDimensions({ cols, rows });

            if (ws.readyState === WebSocket.OPEN) {
                const width = terminalRef.current?.clientWidth || 0;
                const height = terminalRef.current?.clientHeight || 0;

                ws.send(JSON.stringify({
                    type: "resize",
                    cols,
                    rows,
                    width,
                    height
                }));
            }
        });

        ws.onopen = () => {
            setConnectionStatus("connected");
            // Force initial size sync
            const width = terminalRef.current?.clientWidth || 0;
            const height = terminalRef.current?.clientHeight || 0;
            ws.send(JSON.stringify({
                type: "resize",
                cols: term.cols,
                rows: term.rows,
                width,
                height
            }));
            xtermInstance.current?.focus();
        };

        ws.onclose = (event) => {
            setConnectionStatus("disconnected");

            // code 1000 is what your gateway sends for every real, final termination —
            // explicit disconnect, remote shell exit, and SSH errors are all consolidated
            // through sshSessionManager's "terminated" event, which closes with 1000.
            // Anything else (1006 abnormal closure, 1001 going away, etc.) means the
            // socket just dropped — network blip, phone lock, backgrounding — while the
            // backend session is still alive and waiting to be reattached. Don't destroy
            // the one piece of info (sessionId) needed to reattach to it.
            const isFinalClose = event.code === 1000;

            if (isFinalClose) {
                sessionStorage.removeItem(`bastion_term_${server!.id}`);
            }

            if (term) {
                term.write(`\r\n\x1b[31m[System] Connection closed (Code: ${event.code}).\x1b[0m\r\n`);
                term.write(
                    isFinalClose
                        ? `\x1b[33m[System] Redirecting to home in 3 seconds...\x1b[0m\r\n`
                        : `\x1b[33m[System] Connection lost — attempting to reconnect...\x1b[0m\r\n`
                );
                term.options.cursorBlink = false;
            }

            // Only force a redirect on a final close. A dropped connection should let
            // the component re-render/reconnect on its own, not boot the user out.
            if (isFinalClose) {
                redirectTimeoutRef.current = window.setTimeout(() => {
                    navigate("/servers");
                }, 3000);
            }
        };

        ws.onerror = () => {
            setConnectionStatus("disconnected");

            if (term) {
                term.write("\r\n\x1b[31m[System] WebSocket connection error.\x1b[0m\r\n");
            }
        };

        ws.onmessage = async (event) => {
            if (event.data instanceof ArrayBuffer) {
                term.write(new Uint8Array(event.data));  // <--- Synchronous, zero-copy render
                return;
            }
            try {
                const payload = JSON.parse(event.data);

                if (payload.type === "session") {
                    // Save the ID so we can reconnect
                    sessionStorage.setItem(`bastion_term_${server.id}`, payload.sessionId);
                } else if (payload.type === "upload-progress") {
                    // Update React state directly from the backend SFTP progress stream
                    setUploadStatus(prev => prev.state === "uploading" ? { ...prev, percent: payload.percent } : prev)
                }
            } catch (e) {
                // Ignore parse errors on control frames
            }
        };

        return () => {

            if (redirectTimeoutRef.current !== null) {
                clearTimeout(redirectTimeoutRef.current);
                redirectTimeoutRef.current = null;
            }

            // 1. Nullify the listeners so they don't fire on intentional unmount/cleanup
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;

            // 2. Now it is safe to close the socket without triggering the 5-second time bomb
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }

            resizeObserver.disconnect();
            viewportEl?.removeEventListener("touchstart", onTouchStart);
            viewportEl?.removeEventListener("touchmove", onTouchMove);
            ws.close();
            term.dispose();
            xtermInstance.current = null;
            wsRef.current = null;
        };
    }, [server?.id]);


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.dataTransfer.types.includes("Files")) return
        if (!isDragging && uploadStatus.state !== "uploading") setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Ensure we only dismiss if leaving the parent container, not hovering over child text nodes
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (uploadStatus.state === "uploading") return;

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const sessionId = sessionStorage.getItem(`bastion_term_${server!.id}`);
        if (!sessionId) {
            setUploadStatus({ state: "error", filename: file.name, message: "No active session found." });
            setTimeout(() => setUploadStatus({ state: "idle" }), 4000);
            return;
        }

        // 1. Pre-flight check: Verify if the file already exists on the remote host
        try {
            const existsRes = await api.get("/terminal/file/exists", {
                params: { filename: file.name },
                headers: { "x-session-id": sessionId }
            });

            if (existsRes.data.exists) {
                setUploadStatus({
                    state: "error",
                    filename: file.name,
                    message: "A file with this name already exists."
                });
                setTimeout(() => setUploadStatus({ state: "idle" }), 4000);
                return; // Halt immediately. The upload request never fires.
            }
        } catch (err) {
            // If the stat check fails (e.g. network blip or 500 error), 
            // swallow it and let the main upload block attempt the transfer anyway.
            // The backend 'wx' flag will serve as the final safety net.
        }

        // 2. Proceed with actual upload
        setUploadStatus({ state: "uploading", filename: file.name, percent: 0 });

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post("/terminal/file/upload", formData, {
                headers: { "x-session-id": sessionId }
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || "Upload failed");
            }

            setUploadStatus({ state: "success", filename: file.name });
        } catch (err: any) {
            // Handle standard network failures and the rare TOCTOU 'wx' collision race
            let errorMessage = err.response?.data?.error || err.message || "Upload failed";
            if (errorMessage.toLowerCase().includes("network error")) {
                errorMessage = "Upload connection interrupted.";
            }

            setUploadStatus({ state: "error", filename: file.name, message: errorMessage });
        } finally {
            setTimeout(() => {
                setUploadStatus(prev => (prev.state !== "uploading" ? { state: "idle" } : prev));
            }, 4000);
        }
    };


    const handleDisconnect = () => {
        // let the server close it after processing "disconnect". 
        // Closing client-side first risks the message and the close racing each other
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "disconnect" }));
        }

        // Execute the cleanup and navigation
        if (server) sessionStorage.removeItem(`bastion_term_${server.id}`);
        navigate("/servers");
    };

    if (isLoading) return <div className="p-4 md:p-6 text-foreground">Loading terminal...</div>;
    if (isError || !server) return <div className="p-4 md:p-6 text-destructive">Server not found.</div>;

    return (
        <div className={`flex flex-col bg-background text-foreground ${isFullscreen ? "pl-2" : "p-2 md:p-6 gap-2 md:gap-4"} overflow-hidden`} style={{ height: viewportHeight }}>

            <div className="hidden md:flex flex-row items-center justify-start text-sm text-muted-foreground gap-1">
                <span>Servers</span>
                <span><ChevronRight className="size-4" /></span>
                <span>{server.name}</span>
                <span><ChevronRight className="size-4" /></span>
                <span className="text-foreground font-medium">Terminal</span>
            </div>

            {!isFullscreen && <TerminalHeader
                server={{
                    name: server.name,
                    os: server.operatingSystem || "Unknown OS",
                    ip: server.host,
                    username: server.username
                }}
                status={connectionStatus}
                onDisconnect={handleDisconnect}
            />
            }
            <div className={`flex flex-col flex-1  overflow-hidden bg-background min-h-0 ${isFullscreen ? "border-none rounded-none sm:pt-2 sm:pl-1" : "border border-border rounded-lg"}`}>
                {!isFullscreen && <TerminalTabs activeTabName={server.name} />}
                {/* Fullscreen Toggle Button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 cursor-pointer text-xs text-muted-foreground hover:text-foreground absolute top-4 right-4 z-10"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                >
                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </Button>
                <div
                    className="relative flex-1 flex flex-col overflow-hidden"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm border-2 border-dashed border-border rounded-lg">
                            <div className="flex flex-col items-center gap-4 text-primary pointer-events-none">
                                <Upload className="w-16 h-16 animate-bounce" />
                                <h3 className="text-xl font-bold text-foreground">Drop file to upload</h3>
                                <p className="text-sm text-muted-foreground">File will be transferred to your remote home directory</p>
                            </div>
                        </div>
                    )}

                    {uploadStatus.state !== "idle" && (
                        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-secondary border border-border px-4 py-3 rounded-md shadow-lg shadow-black/50 w-72">
                            {uploadStatus.state === "uploading" && (
                                <>
                                    <div className="flex justify-between items-center text-sm font-medium text-indigo-400">
                                        <span className="truncate pr-2">Uploading {uploadStatus.filename}</span>
                                        <span className="shrink-0">{uploadStatus.percent}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-1.5 transition-all duration-200"
                                            style={{ width: `${uploadStatus.percent}%` }}
                                        />
                                    </div>
                                </>
                            )}
                            {uploadStatus.state === "success" && (
                                <div className="text-sm font-medium text-green-500 truncate line-clamp-2 flex">
                                    {/* <CheckCheck /> */}
                                    <p>
                                        Successfully uploaded {uploadStatus.filename}
                                    </p>
                                </div>
                            )}
                            {uploadStatus.state === "error" && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium text-red-500 truncate">Failed to upload {uploadStatus.filename}</span>
                                    <span className="text-xs text-red-500/70">{uploadStatus.message}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <TerminalViewport ref={terminalRef} />
                </div>

                <MobileTerminalToolbar
                    ctrlActive={mods.ctrl}
                    altActive={mods.alt}
                    onToggleCtrl={() => toggleMod("ctrl")}
                    onToggleAlt={() => toggleMod("alt")}
                    onSendInput={handleSendInput}
                />
                {!isFullscreen && (
                    <TerminalStatusBar
                        status={connectionStatus}
                        rows={termDimensions.rows}
                        cols={termDimensions.cols}
                        isFullscreen={isFullscreen}
                        wsRef={wsRef}
                    />
                )}
            </div>
        </div>
    );
}