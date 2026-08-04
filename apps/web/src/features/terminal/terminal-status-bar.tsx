import { Clock, Lock, Signal } from "lucide-react";
import type { ConnectionStatus } from "./terminalPage";

interface TerminalStatusBarProps {
  status: ConnectionStatus;
  rows: number;
  cols: number;
}

export function TerminalStatusBar({ status, rows, cols }: TerminalStatusBarProps) {
  const isConnected = status === "connected";

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-t border-zinc-900 text-xs text-zinc-400">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="capitalize">{status}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock size={12} />
          {/* Mock session time */}
          <span>00:02:14</span>
        </div>

        <div className="flex items-center gap-2">
          <Lock size={12} />
          <span>SSH</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span>Rows: {rows}</span>
        <span>Cols: {cols}</span>
        
        <div className="flex items-center gap-2 text-green-500">
          <Signal size={12} />
          <span>Auto</span>
        </div>
      </div>
    </div>
  );
}