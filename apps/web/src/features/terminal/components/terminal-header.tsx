import { Terminal as TerminalIcon, Copy, ExternalLink, Power, Globe, User } from "lucide-react";
import type { ConnectionStatus } from "../terminalPage";

interface TerminalHeaderProps {
  server: { name: string; os: string; ip: string; username: string };
  status: ConnectionStatus;
  onDisconnect: () => void;
}

export function TerminalHeader({ server, status, onDisconnect }: TerminalHeaderProps) {
  const isConnected = status === "connected";

  return (
    <div className="flex justify-between items-start mb-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {server.name}
            <button className="text-muted-foreground hover:text-foreground p-1 rounded">
              <Copy size={16} />
            </button>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TerminalIcon size={14} /> {server.os}
          </span>
          <span className="flex items-center gap-1.5">
            <Globe size={14} /> {server.ip}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={14} /> {server.username}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors">
          Open in new tab <ExternalLink size={14} />
        </button>
        <button 
          onClick={onDisconnect}
          disabled={!isConnected}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-950/30 text-red-500 border border-red-900/50 rounded-md hover:bg-red-900/30 disabled:opacity-50 transition-colors"
        >
          Disconnect <Power size={14} />
        </button>
      </div>
    </div>
  );
}