import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Pipette } from "lucide-react";

interface AdvancedColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
];

const GRADIENTS = [
  { name: "Sunset", value: "linear-gradient(to right, #ff5f6d, #ffc371)" },
  { name: "Ocean", value: "linear-gradient(to right, #2193b0, #6dd5ed)" },
  { name: "Lush", value: "linear-gradient(to right, #56ab2f, #a8e063)" },
  { name: "Purple Bliss", value: "linear-gradient(to right, #360033, #0b8793)" },
  { name: "Midnight", value: "linear-gradient(to right, #232526, #414345)" },
  { name: "Candy", value: "linear-gradient(to right, #d397fa, #8364e8)" },
];

export function AdvancedColorPicker({ color, onChange }: AdvancedColorPickerProps) {
  const [hex, setHex] = React.useState(color.startsWith("#") ? color : "#ffffff");
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (color.startsWith("#")) setHex(color);
  }, [color]);

  const mainPresets = PRESET_COLORS.slice(0, 4);

  return (
    <div className="p-4 space-y-4 w-full max-w-[280px] max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 animate-in fade-in zoom-in-95 duration-200">
      {/* Quick Presets */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Style</label>
        <div className="flex items-center gap-2">
          {mainPresets.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange(c.value)}
              className={cn(
                "w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center shadow-sm",
                color === c.value ? "border-primary shadow-lg" : "border-white/10"
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {color === c.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
            </button>
          ))}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-9 h-9 rounded-full border-2 border-white/10 bg-muted/20 flex items-center justify-center transition-all hover:bg-muted/40 hover:scale-110 active:scale-95",
              isExpanded && "bg-primary/20 border-primary/30 text-primary"
            )}
            title="More Colors"
          >
            <Pipette className={cn("w-4 h-4", isExpanded ? "text-primary" : "text-muted-foreground")} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-2 animate-in slide-in-from-top-2 duration-300">
          {/* Expanded Presets */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">More Solids</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.slice(4).map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChange(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center",
                    color === c.value ? "border-primary shadow-lg" : "border-white/10"
                  )}
                  style={{ backgroundColor: c.value }}
                >
                  {color === c.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Picker */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Hex</label>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-white/5 shadow-inner">
               <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                  <input 
                    type="color" 
                    value={hex} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setHex(val);
                      onChange(val);
                    }}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pipette className="w-4 h-4 text-white" />
                  </div>
               </div>
               <div className="flex-1">
                 <Input 
                   value={hex} 
                   onChange={(e) => {
                     const val = e.target.value;
                     setHex(val);
                     if (/^#[0-9A-F]{6}$/i.test(val)) onChange(val);
                   }}
                   className="h-10 rounded-xl bg-background/50 border-white/5 font-mono text-xs font-black uppercase tracking-wider"
                 />
               </div>
            </div>
          </div>

          {/* Gradients */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Premium Gradients</label>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => onChange(g.value)}
                  className={cn(
                    "h-10 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center overflow-hidden relative",
                    color === g.value ? "border-primary shadow-lg shadow-primary/10" : "border-white/10"
                  )}
                  style={{ background: g.value }}
                >
                  {color === g.value && <Check className="w-4 h-4 text-white drop-shadow-md z-10" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button 
        variant="ghost" 
        onClick={() => onChange("transparent")}
        className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 gap-3 border border-dashed border-rose-500/20"
      >
        <X className="w-4 h-4" /> CLEAR STYLES
      </Button>
    </div>
  );
}
