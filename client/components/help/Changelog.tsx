import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  type: "new" | "fix" | "improve";
}

const CHANGELOG: ChangelogEntry[] = [
  {
    date: "Jun 2026",
    title: "Help & Support Centre",
    description: "Launched AI Help Assistant, interactive FAQ, contact form, platform status dashboard, and keyboard shortcuts reference.",
    type: "new",
  },
  {
    date: "Jun 2026",
    title: "Advanced Row Coloring",
    description: "Added premium gradients, custom hex colors, and cell-level coloring with improved fullscreen persistence.",
    type: "improve",
  },
  {
    date: "May 2026",
    title: "AI Image-to-Contact Parsing",
    description: "Upload screenshots of casting calls and let AI extract contact details automatically into your table.",
    type: "new",
  },
  {
    date: "May 2026",
    title: "Instagram DM Automation",
    description: "Full Instagram integration with session-based login, DM sending, and thread-based auto-ingestion.",
    type: "new",
  },
  {
    date: "May 2026",
    title: "Analytics AI Data Analyst",
    description: "Chat with your analytics data using natural language. Ask about conversion rates, failures, and trends.",
    type: "new",
  },
  {
    date: "Apr 2026",
    title: "Subscription & Payments",
    description: "Razorpay integration with Weekly/Monthly plans, coupon codes, payment history, and invoice generation.",
    type: "new",
  },
  {
    date: "Apr 2026",
    title: "WhatsApp Stability Fix",
    description: "Resolved connection drops during high-volume sending. Improved QR code reconnection flow.",
    type: "fix",
  },
  {
    date: "Apr 2026",
    title: "Fullscreen Table Mode",
    description: "Added immersive fullscreen mode for the contacts table with persistent toolbar and keyboard navigation.",
    type: "improve",
  },
];

const TYPE_CONFIG = {
  new: { label: "NEW", className: "bg-emerald-500/20 text-emerald-500 border-none" },
  fix: { label: "FIX", className: "bg-red-500/20 text-red-500 border-none" },
  improve: { label: "IMPROVE", className: "bg-blue-500/20 text-blue-500 border-none" },
};

export default function Changelog() {
  return (
    <Card className="glass-card border-border overflow-hidden">
      <CardHeader className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Newspaper className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-black tracking-tight">What's New</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Recent platform updates & releases
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-6 bottom-6 w-px bg-border/40" />

          <div className="divide-y divide-border/20">
            {CHANGELOG.map((entry, idx) => {
              const typeConfig = TYPE_CONFIG[entry.type];
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 pl-4 hover:bg-muted/10 transition-colors group"
                >
                  {/* Timeline dot */}
                  <div className="relative z-10 mt-1.5 shrink-0">
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 border-background",
                      entry.type === "new" ? "bg-emerald-500" :
                      entry.type === "fix" ? "bg-red-500" : "bg-blue-500"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0", typeConfig.className)}>
                        {typeConfig.label}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{entry.date}</span>
                    </div>
                    <p className="text-sm font-black tracking-tight text-foreground">{entry.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
