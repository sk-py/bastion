import { forwardRef } from "react";
import { Copy, ClipboardPaste, Trash2, Maximize, Settings, MoreVertical } from "lucide-react";

export const TerminalViewport = forwardRef<HTMLDivElement, {}>((props, ref) => {
  return (
    <div className="flex flex-col flex-1 bg-black overflow-hidden relative">
      {/* Future Compatibility Toolbar: Structural UI only. */}
      <div className="flex items-center justify-end gap-5 p-2 text-xs text-zinc-400 bg-zinc-950/50 border-b border-zinc-900">
        <button className="flex items-center gap-1.5 hover:text-white transition-colors"><Copy size={14} /> Copy</button>
        <button className="flex items-center gap-1.5 hover:text-white transition-colors"><ClipboardPaste size={14} /> Paste</button>
        <button className="flex items-center gap-1.5 hover:text-white transition-colors"><Trash2 size={14} /> Clear</button>
        <button className="flex items-center gap-1.5 hover:text-white transition-colors"><Maximize size={14} /> Resize</button>
        <button className="flex items-center gap-1.5 hover:text-white transition-colors"><Settings size={14} /> Settings</button>
        <button className="hover:text-white transition-colors"><MoreVertical size={14} /></button>
      </div>

      {/* xterm.js mounts directly onto this element. No additional wrappers. */}
      <div ref={ref} className="flex-1 h-full w-full outline-none" />
    </div>
  );
});

TerminalViewport.displayName = "TerminalViewport";