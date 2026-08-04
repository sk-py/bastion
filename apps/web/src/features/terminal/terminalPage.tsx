import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useServers } from "../dashboard/hooks/use-servers";
import { TerminalHeader } from "./components/terminal-header";
import { TerminalTabs } from "./components/terminal-tabs";
import { TerminalViewport } from "./components/terminal-viewport";
import { TerminalStatusBar } from "./terminal-status-bar";
import { FitAddon } from "@xterm/addon-fit";


export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export default function TerminalPage() {
    const { id: serverId } = useParams<{ id: string }>();

    // Fetch all servers and find the one matching the URL param
    const { data: servers, isLoading, isError } = useServers();

    console.log(servers);

    const navigate = useNavigate();

    const server = servers?.find((s: any) => s.id === serverId);

    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermInstance = useRef<Terminal | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");

    useEffect(() => {
        if (!terminalRef.current || !server) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: "#000000", foreground: "#ffffff" },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        xtermInstance.current = term;
        term.open(terminalRef.current);

        fitAddon.fit();

        const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        // Ignore layout calculation errors during unmounts
      }
    });
    resizeObserver.observe(terminalRef.current);

        const ws = new WebSocket(`ws://localhost:18400/ws/terminal?serverId=${server.id}`);
        wsRef.current = ws;

        ws.onopen = () => setConnectionStatus("connected");
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
            } else {
                term.write(event.data);
            }
        };

        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
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

    if (isLoading) return <div className="p-6 text-foreground">Loading terminal...</div>;
    if (isError || !server) return <div className="p-6 text-destructive">Server not found.</div>;

    return (
        <div className="flex flex-col h-screen bg-background text-foreground p-6 gap-4">
            <div className="text-sm text-muted-foreground flex gap-2">
                <span>Servers</span>
                <span>&gt;</span>
                <span>{server.name}</span>
                <span>&gt;</span>
                <span className="text-foreground font-medium">Terminal</span>
            </div>

            <TerminalHeader
                server={{
                    name: server.name,
                    os: server.operatingSystem || "Unknown OS",
                    ip: server.host,
                    username: server.username
                }}
                status={connectionStatus}
                onDisconnect={handleDisconnect}
            />

            <div className="flex flex-col flex-1 border border-border rounded-lg overflow-hidden bg-zinc-950">
                <TerminalTabs activeTabName={server.name} />
                <TerminalViewport ref={terminalRef} />
                <TerminalStatusBar status={connectionStatus} rows={32} cols={120} />
            </div>
        </div>
    );
}