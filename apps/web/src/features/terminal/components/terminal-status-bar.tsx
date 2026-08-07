import { Clock, ShieldAlert, ShieldCheck, TerminalSquare, Wifi } from "lucide-react";
import type { RefObject } from "react";
import type { ConnectionStatus } from "../terminalPage";
import { useTerminalMetrics } from "../hooks/use-terminal-metrics";

interface TerminalStatusBarProps {
  status: ConnectionStatus;
  rows: number;
  cols: number;
  wsRef: RefObject<WebSocket | null>;
  isFullscreen: boolean;
}

export function TerminalStatusBar({ status, rows, cols, wsRef, isFullscreen }: TerminalStatusBarProps) {
  const { uptime, latency } = useTerminalMetrics(status, wsRef);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  // State continues tracking in the background; UI is just hidden.
  if (isFullscreen) return null;

  const isConnected = status === "connected";

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-background border-t border-border text-xs text-muted-foreground select-none shrink-0 h-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <ShieldCheck size={14} className="text-green-500" />
          ) : (
            <ShieldAlert size={14} className="text-red-500" />
          )}
          <span className="capitalize">{status}</span>
        </div>

        <div className=" items-center gap-1.5 hidden sm:flex">
          <Wifi size={14} className={latency && latency < 100 ? "text-green-500" : latency && latency > 250 ? "text-red-500" : ""} />
          <span>{latency ? `${latency}ms` : "--ms"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="items-center gap-1.5 hidden sm:flex">
          <TerminalSquare size={14} />
          <span>{cols}x{rows}</span>
        </div>

        <div className="flex items-center gap-1.5 text-foreground font-mono bg-secondary px-2 py-0.5 rounded border border-border">
          <Clock size={12} className="text-muted-foreground" />
          <span>{formatTime(uptime)}</span>
        </div>
      </div>
    </div>
  );
}