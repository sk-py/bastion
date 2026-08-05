import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useServers } from "../dashboard/hooks/use-servers";
import { TerminalHeader } from "./components/terminal-header";
import { TerminalTabs } from "./components/terminal-tabs";
import { TerminalViewport } from "./components/terminal-viewport";
import { TerminalStatusBar } from "./components/terminal-status-bar";
import { FitAddon } from "@xterm/addon-fit";
import { MobileTerminalToolbar } from "./components/mobile-toolbar";
import { useViewport } from "./hooks/use-viewport";
import { Button } from "@/components/ui/button";
import { ChevronRight, Maximize, Minimize } from "lucide-react";
import { useTerminalMetrics } from "./hooks/use-terminal-metrics";


export type ConnectionStatus = "connecting" | "connected" | "disconnected";
const DESKTOP_FONT_SIZE = 14;
const MOBILE_FONT_SIZE = 12;

export default function TerminalPage() {
    const { id: serverId } = useParams<{ id: string }>();
    const [termDimensions, setTermDimensions] = useState({ rows: 32, cols: 120 });
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const [isFullscreen, setIsFullscreen] = useState(false);

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

        let payload = data;

        if (ctrl && data.length === 1) {
            const charCode = data.toLowerCase().charCodeAt(0);
            if (charCode >= 97 && charCode <= 122) {
                payload = String.fromCharCode(charCode - 96);
            }
        } else if (alt) {
            payload = "\x1B" + data;
        }

        // Turn off toggles after consumption
        modsRef.current = { ctrl: false, alt: false };
        setMods({ ctrl: false, alt: false });

        return payload;
    };

    const handleSendInput = (data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "input", data: applyModifiers(data) }));
            xtermInstance.current?.focus();
        }
    };

    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermInstance = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const { uptime, latency, handlePong } = useTerminalMetrics(connectionStatus, wsRef);


    useEffect(() => {
        if (!terminalRef.current || !server) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: "#000000", foreground: "#ffffff" },
            rightClickSelectsWord: true,
            fontSize: window.innerWidth < 768 ? MOBILE_FONT_SIZE : DESKTOP_FONT_SIZE,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        xtermInstance.current = term;
        term.open(terminalRef.current);

        fitAddon.fit();

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
        const ws = new WebSocket(
            `ws://${hostIp}:18400/ws/terminal?serverId=${server.id}&cols=${term.cols}&rows=${term.rows}`
        );
        wsRef.current = ws;

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

        ws.onclose = () => {
            setConnectionStatus("disconnected");
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
                navigate("/");
                resizeObserver.disconnect();
            }

        }
        ws.onerror = () => setConnectionStatus("disconnected");

        ws.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                term.write(await event.data.text());
                return;
            }
            try {
                const payload = JSON.parse(event.data);

                if (payload.type === "pong") {
                    handlePong(payload.timestamp);
                    return;
                }
            } catch (e) {
                term.write(event.data);
            }
        };

        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "input", data: applyModifiers(data) }));
            }
        });

        return () => {
            resizeObserver.disconnect();
            ws.close();
            term.dispose();
            xtermInstance.current = null;
            wsRef.current = null;
        };
    }, [server]);

    const handleDisconnect = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
            navigate("/")
        }
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
            <div className={`flex flex-col flex-1  overflow-hidden bg-zinc-950 min-h-0 ${isFullscreen ? "border-none rounded-none sm:pt-2 sm:pl-1" : "border border-border rounded-lg"}`}>
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
                <TerminalViewport ref={terminalRef} />

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
                        latency={latency}
                        uptime={uptime}
                    />
                )}
            </div>
        </div>
    );
}