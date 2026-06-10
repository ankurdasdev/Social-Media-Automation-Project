import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Global search", section: "Navigation" },
  { keys: ["Ctrl", "N"], description: "Add new contact", section: "Navigation" },
  { keys: ["Esc"], description: "Close dialogs / popups", section: "Navigation" },
  { keys: ["F11"], description: "Toggle fullscreen table", section: "Contacts Table" },
  { keys: ["Ctrl", "A"], description: "Select all visible rows", section: "Contacts Table" },
  { keys: ["Delete"], description: "Delete selected contacts", section: "Contacts Table" },
  { keys: ["Enter"], description: "Open contact detail drawer", section: "Contacts Table" },
  { keys: ["↑", "↓"], description: "Navigate between rows", section: "Contacts Table" },
  { keys: ["Ctrl", "Z"], description: "Undo last action", section: "General" },
  { keys: ["Ctrl", "S"], description: "Save current changes", section: "General" },
];

function KbdKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-muted/50 border border-border/60 text-[11px] font-mono font-black text-foreground shadow-[0_2px_0_0] shadow-border/30">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcuts() {
  // Group by section
  const sections = SHORTCUTS.reduce<Record<string, typeof SHORTCUTS>>((acc, s) => {
    if (!acc[s.section]) acc[s.section] = [];
    acc[s.section].push(s);
    return acc;
  }, {});

  return (
    <Card className="glass-card border-border overflow-hidden">
      <CardHeader className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <Keyboard className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-black tracking-tight">Keyboard Shortcuts</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Power-user productivity tips
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {Object.entries(sections).map(([sectionName, shortcuts]) => (
          <div key={sectionName} className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{sectionName}</p>
            <div className="space-y-2">
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-bold text-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, kIdx) => (
                      <span key={kIdx} className="flex items-center gap-1">
                        <KbdKey>{key}</KbdKey>
                        {kIdx < shortcut.keys.length - 1 && <span className="text-muted-foreground/30 text-xs mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
