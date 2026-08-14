import { useEffect, useRef, useState } from "react";
import * as AsciinemaPlayer from "asciinema-player";
import "asciinema-player/dist/bundle/asciinema-player.css";
import { api } from "@/api/axios";
import { toast } from "sonner";
import type { Session } from "@/api/sessions";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

const formatBytes = (bytesStr: string | null): string => {
  if (!bytesStr) return "—";
  const bytes = Number(bytesStr);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const RecordingModal = ({ isOpen, onClose, session }: RecordingModalProps) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !session || !playerRef.current) return;

    let cancelled = false;
    let playerInstance: any = null;
    let blobUrl: string | null = null;

    const loadStream = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/sessions/${session.id}/stream`, { responseType: "blob" });
        if (cancelled) return; // modal closed while the fetch was in flight

        blobUrl = URL.createObjectURL(response.data);

        playerInstance = AsciinemaPlayer.create(blobUrl, playerRef.current!, {
          autoPlay: true,
          speed: 1,
          theme: "dracula",
          fit: "width",
          keystrokeOverlay: true
        });

        playerInstance.addEventListener("marker", (event: any) => toast.info(event.label));
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.error || "Failed to load session recording.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStream();

    return () => {
      cancelled = true;
      if (playerInstance) playerInstance.dispose();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const formatDuration = (sec: number | null) => {
    if (sec === null) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m > 0 ? `${m}m ` : ""}${s}s`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-5xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h3 className="text-lg font-semibold text-foreground">Session Recording</h3>
          <button onClick={onClose} className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors">
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-3 bg-background border-b border-border text-xs text-muted-foreground">
          <div>
            <span className="block text-zinc-500 font-medium">Server</span>
            <span className="text-foreground font-medium">{session.serverName}</span>
            <span className="block text-zinc-500 text-[11px]">as {session.serverUsername}</span>
          </div>
          <div>
            <span className="block text-zinc-500 font-medium">User</span>
            <span className="text-foreground font-medium">{session.userName}</span>
            <span className="block text-zinc-500 text-[11px]">{session.userEmail}</span>
          </div>
          <div>
            <span className="block text-zinc-500 font-medium">Started</span>
            <span className="text-foreground">{new Date(session.startedAt).toLocaleString()}</span>
            <span className="block text-zinc-500 text-[11px]">{formatDuration(session.durationSeconds)}</span>
          </div>
          <div>
            <span className="block text-zinc-500 font-medium">Connected from</span>
            <span className="text-foreground">{session.ipAddress || "—"}</span>
            <span className="block text-zinc-500 text-[11px] truncate" title={session.userAgent ?? undefined}>
              {session.userAgent || "—"}
            </span>
          </div>
        </div>

        <div className="px-6 py-1.5 bg-background border-b border-border text-[11px] text-zinc-500 flex gap-4">
          <span>Storage: {session.provider}</span>
          <span>File size: {formatBytes(session.fileSizeBytes)}</span>
        </div>

        <div className="p-4 bg-background flex-1 h-120 flex flex-col items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Fetching recording stream...</p>
            </div>
          )}
          {error && <p className="text-red-400 text-sm bg-red-950/40 p-3 rounded border border-red-900">{error}</p>}
          <div ref={playerRef} className="w-full h-full " />
        </div>
      </div>
    </div>
  );
};