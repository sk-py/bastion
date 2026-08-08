import { useState } from "react";
import { Terminal as TerminalIcon, Power, Globe, User, ChevronDown } from "lucide-react";
import type { ConnectionStatus } from "../terminalPage";

interface TerminalHeaderProps {
  server: { name: string; os: string; ip: string; username: string };
  status: ConnectionStatus;
  onDisconnect: () => void;
}

export function TerminalHeader({ server, status, onDisconnect }: TerminalHeaderProps) {
  const isConnected = status === "connected";
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ---------- Mobile: floating capsule ---------- */}
      <div className="sm:hidden  flex justify-center mb-2 fixed inset-0 mx-auto h-fit w-fit top-3 z-9">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
          className={`flex flex-col bg-background backdrop-blur-md border border-border shadow-lg shadow-black/40 text-foreground overflow-hidden transition-all duration-300 ease-out cursor-pointer ${expanded ? "w-72 rounded-3xl" : "w-fit rounded-full"
            }`}
        >
          {/* Collapsed row - always visible */}
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
            <span className="flex flex-row items-center justify-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
              />
              <span className="text-sm font-semibold truncate max-w-35">{server.name}</span>
            </span>
            <ChevronDown
              size={14}
              className={`text-secondary-foreground transition-transform duration-300 shrink-0 ${expanded ? "rotate-180" : ""
                }`}
            />
          </div>

          {/* Expanded detail panel */}
          <div
            className={`grid transition-all duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-2 px-4 pb-3 pt-1 border-t border-border">
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <TerminalIcon size={13} className="shrink-0" /> {server.os}
                </span>
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <Globe size={13} className="shrink-0" /> {server.ip}
                </span>
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  <User size={13} className="shrink-0" /> {server.username}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisconnect();
                  }}
                  disabled={!isConnected}
                  className="flex items-center justify-center  shadow-xs gap-2 mt-1 py-2 text-xs text-white font-medium bg-destructive/70 border border-destructive rounded-full disabled:opacity-50 active:bg-destructive transition-colors"
                >
                  <Power size={13} />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Desktop / tablet: unchanged original header ---------- */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-4 mb-2">
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-1 min-w-0">
              <span className="truncate">{server.name}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
        <button
          onClick={onDisconnect}
          disabled={!isConnected}
          className="flex items-center justify-center gap-2 w-auto px-4 py-2 text-sm font-medium bg-destructive/70 dark:bg-destructive/30 text-white border cursor-pointer border-destructive rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors shrink-0"
        >
          <Power size={14} />
          <span>Disconnect</span>
        </button>
      </div>
    </>
  );
}