const fs = require('fs');
let content = fs.readFileSync('client/pages/Onboarding.tsx', 'utf8');

// 1. Imports
content = content.replace(
  /import { Button } from "@\/components\/ui\/button";/,
  `import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import InstagramSettings from "@/components/settings/InstagramSettings";`
);

content = content.replace(
  /Trophy, Sparkles, Star\n} from "lucide-react";/,
  `Trophy, Sparkles, Star, Sun, Moon\n} from "lucide-react";`
);

// 2. AnimatedBackground & ThemeToggle
const componentsStr = `
function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden dark:bg-[#03020a] bg-slate-50">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: \`translate(\${mousePos.x * 60}px, \${mousePos.y * 60}px)\` }}>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[140px] animate-float-1" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: \`translate(\${mousePos.x * -80}px, \${mousePos.y * -80}px)\` }}>
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[160px] animate-float-2" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: \`translate(\${mousePos.x * 120}px, \${mousePos.y * 120}px)\` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px] animate-float-3" />
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('casthub-theme', next ? 'dark' : 'light');
  };
  return (
    <button onClick={toggleTheme} className="absolute top-4 right-6 z-50 w-10 h-10 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-border/50 flex items-center justify-center text-foreground/60 hover:text-foreground hover:dark:bg-white/10 hover:bg-black/10 transition-all backdrop-blur-md">
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
`;

content = content.replace(
  /export default function SetupWizard\(\) {/,
  componentsStr + '\nexport default function SetupWizard() {'
);

// 3. States for dialogs
content = content.replace(
  /const \[checkingIG, setCheckingIG\] = useState\(false\);/,
  `const [checkingIG, setCheckingIG] = useState(false);
  const [showWADialog, setShowWADialog] = useState(false);
  const [showIGDialog, setShowIGDialog] = useState(false);`
);

// 4. Update WhatsApp button
content = content.replace(
  /onClick=\{\(\) => \{ window\.open\("\/integrations\?defaultTab=whatsapp", "_blank"\); setTimeout\(checkWhatsApp, 10000\); \}\}/g,
  `onClick={() => setShowWADialog(true)}`
);
content = content.replace(
  /<ExternalLink className="w-4 h-4" \/> Open WhatsApp QR Scanner/,
  `<MessageCircle className="w-4 h-4" /> Open WhatsApp QR Scanner`
);

// 5. Update Instagram button
content = content.replace(
  /onClick=\{\(\) => \{ window\.open\("\/integrations\?defaultTab=instagram", "_blank"\); setTimeout\(checkInstagram, 10000\); \}\}/g,
  `onClick={() => setShowIGDialog(true)}`
);
content = content.replace(
  /<ExternalLink className="w-4 h-4" \/> Connect Instagram/,
  `<Instagram className="w-4 h-4" /> Connect Instagram`
);

// 6. Layout updates
content = content.replace(
  /<div className="min-h-screen bg-\[#060610\] flex flex-col">/,
  `<div className="min-h-screen flex flex-col relative text-foreground">
      <AnimatedBackground />
      <ThemeToggle />`
);
content = content.replace(
  /bg-\[#060610\]\/80/g,
  `bg-background/80`
);

// 7. Add Dialogs at the end
const dialogs = `
      {/* WhatsApp Dialog */}
      <Dialog open={showWADialog} onOpenChange={setShowWADialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="bg-background rounded-[2rem] overflow-hidden max-h-[85vh] overflow-y-auto">
            <WhatsAppSettings />
          </div>
        </DialogContent>
      </Dialog>

      {/* Instagram Dialog */}
      <Dialog open={showIGDialog} onOpenChange={setShowIGDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="bg-background rounded-[2rem] overflow-hidden max-h-[85vh] overflow-y-auto">
            <InstagramSettings />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}`;

content = content.replace(
  /    <\/div>\n  \);\n\}/,
  dialogs
);

fs.writeFileSync('client/pages/Onboarding.tsx', content);
console.log("Replaced successfully!");
