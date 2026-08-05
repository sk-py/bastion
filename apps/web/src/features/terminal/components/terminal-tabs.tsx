import { X, Plus } from "lucide-react";

interface TerminalTabsProps {
  activeTabName: string;
}

export function TerminalTabs({ activeTabName }: TerminalTabsProps) {
  return (
    <div className="flex items-center bg-zinc-900 border-b border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 border-r border-zinc-800 border-t-2 border-t-[#8089FE] text-sm font-medium min-w-[200px] justify-between cursor-default">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {activeTabName}
        </div>
        <button className="text-zinc-500 hover:text-zinc-300 rounded p-0.5 transition-colors">
          <X size={14} />
        </button>
      </div>
      
      <button className="p-2 mx-2 text-zinc-500 hover:text-zinc-300 rounded transition-colors">
        <Plus size={16} />
      </button>
    </div>
  );
}