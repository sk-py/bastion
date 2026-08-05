import { Terminal as TerminalIcon, Copy, Power, Globe, User } from "lucide-react";
import type { ConnectionStatus } from "../terminalPage";

interface TerminalHeaderProps {
  server: { name: string; os: string; ip: string; username: string };
  status: ConnectionStatus;
  onDisconnect: () => void;
}

export function TerminalHeader({ server, status, onDisconnect }: TerminalHeaderProps) {
  const isConnected = status === "connected";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-1 min-w-0">
            <span className="truncate">{server.name}</span>
          </h1>
        </div>
        
        {/* flex-wrap and gap-y-2 ensure items wrap to a new line instead of overflowing the screen */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <TerminalIcon size={14} /> {server.os}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Globe size={14} /> {server.ip}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <User size={14} /> {server.username}
          </span>
        </div>
      </div>

      {/* w-full on mobile creates a large, easy-to-tap block button; w-auto on sm+ restores desktop sizing */}
      <button 
        onClick={onDisconnect}
        disabled={!isConnected}
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium bg-red-950/30 text-red-500 border border-red-900/50 rounded-md hover:bg-red-900/30 disabled:opacity-50 transition-colors shrink-0"
      >
        <Power size={14} />
        <span>Disconnect</span>
      </button>
    </div>
  );
}