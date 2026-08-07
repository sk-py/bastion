import { useEffect, useState, type RefObject } from "react";
import type { ConnectionStatus } from "../terminalPage";

export function useTerminalMetrics(
    connectionStatus: ConnectionStatus,
    wsRef: RefObject<WebSocket | null>
) {
    const [uptime, setUptime] = useState(0);
    const [latency, setLatency] = useState<number | null>(null);

    // Session timer
    useEffect(() => {
        if (connectionStatus !== "connected") {
            setUptime(0);
            setLatency(null);
            return;
        }
        
        const interval = window.setInterval(() => {
            setUptime((prev) => prev + 1);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [connectionStatus]);

    // Independent Ping/Pong listener
    useEffect(() => {
        if (connectionStatus !== "connected") return;
        const ws = wsRef.current;
        if (!ws) return;

        const pingInterval = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
            }
        }, 3000);

        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data !== "string") return; // Ignore binary terminal frames
            
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === "pong") {
                    setLatency(Date.now() - payload.timestamp);
                }
            } catch {
                // Ignore non-JSON frames
            }
        };

        ws.addEventListener("message", handleMessage);

        return () => {
            clearInterval(pingInterval);
            ws.removeEventListener("message", handleMessage);
        };
    }, [connectionStatus, wsRef]);

    return { uptime, latency };
}