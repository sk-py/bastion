import { Clock, Lock, ShieldAlert, ShieldCheck, Signal, TerminalSquare, Wifi } from "lucide-react";
import type { ConnectionStatus } from "../terminalPage";

interface TerminalStatusBarProps {
  status: ConnectionStatus;
  rows: number;
  cols: number;
  uptime: number; // in seconds
  latency: number | null; // in milliseconds
}

export function TerminalStatusBar({ status, rows, cols, latency, uptime }: TerminalStatusBarProps) {
  
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const isConnected = status === "connected";
  
 return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-t border-border text-xs text-muted-foreground select-none shrink-0 h-8">
      <div className="flex items-center gap-4">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <ShieldCheck size={14} className="text-green-500" />
          ) : (
            <ShieldAlert size={14} className="text-red-500" />
          )}
          <span className="capitalize">{status}</span>
        </div>

        {/* Network Latency */}
        <div className="flex items-center gap-1.5 hidden sm:flex">
          <Wifi size={14} className={latency && latency < 100 ? "text-green-500" : latency && latency > 250 ? "text-red-500" : ""} />
          <span>{latency ? `${latency}ms` : "--ms"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Dimensions */}
        <div className="flex items-center gap-1.5 hidden sm:flex">
          <TerminalSquare size={14} />
          <span>{cols}x{rows}</span>
        </div>

        {/* Session Timer */}
        <div className="flex items-center gap-1.5 text-foreground font-mono bg-zinc-950 px-2 py-0.5 rounded border border-border">
          <Clock size={12} className="text-muted-foreground" />
          <span>{formatTime(uptime)}</span>
        </div>
      </div>
    </div>
  );
}