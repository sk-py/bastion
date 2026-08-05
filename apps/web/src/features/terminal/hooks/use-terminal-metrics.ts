import { useState, useEffect, type RefObject } from "react";
import type { ConnectionStatus } from "../terminalPage";

export function useTerminalMetrics(
    connectionStatus: ConnectionStatus,
    wsRef: RefObject<WebSocket | null>
) {
    const [uptime, setUptime] = useState(0);
    const [latency, setLatency] = useState<number | null>(null);

    // Session Timer Effect
    useEffect(() => {
        let interval: number;
        if (connectionStatus === "connected") {
            interval = setInterval(() => {
                setUptime((prev) => prev + 1);
            }, 1000);
        } else {
            setUptime(0);
            setLatency(null);
        }
        return () => clearInterval(interval);
    }, [connectionStatus]);

    // Ping Interval Effect
    useEffect(() => {
        let pingInterval: number;
        if (connectionStatus === "connected") {
            pingInterval = setInterval(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ 
                        type: "ping", 
                        timestamp: Date.now() 
                    }));
                }
            }, 3000);
        }
        return () => clearInterval(pingInterval);
    }, [connectionStatus, wsRef]);

    const handlePong = (timestamp: number) => {
        setLatency(Date.now() - timestamp);
    };

    return { uptime, latency, handlePong };
}