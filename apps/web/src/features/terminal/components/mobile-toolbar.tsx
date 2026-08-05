import { Button } from "@/components/ui/button";

interface MobileTerminalToolbarProps {
  ctrlActive: boolean;
  altActive: boolean;
  onToggleCtrl: () => void;
  onToggleAlt: () => void;
  onSendInput: (data: string) => void;
}

export function MobileTerminalToolbar({
  ctrlActive,
  altActive,
  onToggleCtrl,
  onToggleAlt,
  onSendInput,
}: MobileTerminalToolbarProps) {
  const KEYS = {
    ESC: "\x1B",
    TAB: "\x09",
    HOME: "\x1B[H",
    END: "\x1B[F",
    UP: "\x1B[A",
    DOWN: "\x1B[B",
    LEFT: "\x1B[D",
    RIGHT: "\x1B[C",
    PGUP: "\x1B[5~",
    PGDN: "\x1B[6~",
  };

  return (
    <div className="flex flex-col md:hidden bg-zinc-900 border-t border-border p-1 gap-1 shrink-0">
      <div className="flex gap-1 justify-between">
         <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.TAB)}>TAB</Button>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.ESC)}>ESC</Button>
        {/* <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.HOME)}>HOME</Button> */}
        {/* <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.END)}>END</Button> */}
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.UP)}>↑</Button>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.PGUP)}>PGUP</Button>
      </div>
      <div className="flex gap-1 justify-between">
       
        <Button 
          variant={ctrlActive ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-2 text-xs flex-1" 
          onClick={onToggleCtrl}
        >
          CTRL
        </Button>
        <Button 
          variant={altActive ? "default" : "outline"} 
          size="sm" 
          className="h-8 px-2 text-xs flex-1" 
          onClick={onToggleAlt}
        >
          ALT
        </Button>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.LEFT)}>←</Button>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.DOWN)}>↓</Button>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.RIGHT)}>→</Button>
        <Button variant="outline" size="sm" className="h-8 px-2 text-xs flex-1" onClick={() => onSendInput(KEYS.PGDN)}>PGDN</Button>
      </div>
    </div>
  );
}