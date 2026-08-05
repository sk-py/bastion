import { forwardRef } from "react";

export const TerminalViewport = forwardRef<HTMLDivElement, {}>((props, ref) => {
  return (
    <div className="flex flex-col flex-1 bg-black overflow-hidden relative">
      {/* xterm.js mounts directly onto this element. No additional wrappers. */}
      <div ref={ref} className="flex-1 h-full w-full outline-none" />
    </div>
  );
});

TerminalViewport.displayName = "TerminalViewport";