import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings2,
  BarChart3,
  HelpCircle,
} from "lucide-react";

// Page-specific guides
const PAGE_GUIDES: Record<string, { title: string; icon: any; content: React.ReactNode }> = {
  "/dashboard": {
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-6 text-sm text-muted-foreground mt-6">
        <p>Welcome to your CastHub Dashboard! This is your central hub for monitoring all automated casting activities.</p>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <h4 className="font-bold text-foreground mb-1">Global Metrics</h4>
            <p>Keep an eye on total contacts, messages sent, and success rates at a glance.</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <h4 className="font-bold text-foreground mb-1">Recent Contacts</h4>
            <p>A live feed of the newest talent pulled directly from your connected WhatsApp and Instagram groups.</p>
          </div>
        </div>
      </div>
    ),
  },
  "/contacts": {
    title: "Managing Contacts",
    icon: Users,
    content: (
      <div className="space-y-6 text-sm text-muted-foreground mt-6">
        <p>Your entire talent database lives here. You can manually add, edit, or seamlessly import large sheets of contacts.</p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Import Excel:</strong> Upload a spreadsheet and map your columns to instantly populate your database.</li>
          <li><strong>Grid Tools:</strong> Treat the grid like Excel! Drag to fill, right-click to color code.</li>
          <li><strong>AI Search:</strong> Click the sparkles icon to use natural language to filter contacts (e.g., "Show me male actors from NY").</li>
        </ul>
      </div>
    ),
  },
  "/templates": {
    title: "Template Library",
    icon: MessageSquare,
    content: (
      <div className="space-y-6 text-sm text-muted-foreground mt-6">
        <p>Create reusable outreach messages here to speed up your casting workflow.</p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Placeholders:</strong> Use tags like <code className="text-amber-500 font-bold">{'{Name}'}</code> to personalize bulk messages.</li>
          <li><strong>Channel Specific:</strong> Templates are scoped per channel (WhatsApp, Email, Instagram).</li>
          <li><strong>Attachments:</strong> You can also template casting sides, briefs, or media files to send instantly.</li>
        </ul>
      </div>
    ),
  },
  "/controller": {
    title: "Source Controller",
    icon: Settings2,
    content: (
      <div className="space-y-6 text-sm text-muted-foreground mt-6">
        <p>This is where the automation magic happens. Connect your social channels and let CastHub ingest data.</p>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <h4 className="font-bold text-amber-500 mb-1">AI Casting Radar</h4>
            <p className="text-amber-500/80">Our vision AI scans group chats for casting flyers, extracts the text, and populates your contacts sheet automatically.</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <h4 className="font-bold text-foreground mb-1">Auto-Scheduler</h4>
            <p>Set up timing intervals so CastHub runs sweeps and sends messages while you sleep.</p>
          </div>
        </div>
      </div>
    ),
  },
  "/analytics": {
    title: "Performance Analytics",
    icon: BarChart3,
    content: (
      <div className="space-y-6 text-sm text-muted-foreground mt-6">
        <p>Track the health and success rate of your outreach campaigns.</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Filter metrics by Daily, Weekly, or Monthly.</li>
          <li>See exactly which channels are performing best.</li>
          <li>Monitor failed deliveries to diagnose connection issues.</li>
        </ul>
      </div>
    ),
  },
  "/integrations": {
    title: "Integrations Center",
    icon: Settings2,
    content: (
      <div className="space-y-6 text-sm text-muted-foreground mt-6">
        <p>Connect and monitor your security-verified outreach networks. Set credentials, authentication, and API variables here.</p>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <h4 className="font-bold text-foreground mb-1">1. Connect Your Channels</h4>
            <p>Connect Gmail, WhatsApp, or Instagram to enable outreach through CastHub. You'll only need to do this once.</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <h4 className="font-bold text-foreground mb-1">2. Connect Google</h4>
            <p>Follow the setup instructions and approve the requested permissions to connect Google. Once connected you will be able to access your Drive for attachments/documents/assets and send mails from your Gmail.</p>
          </div>
        </div>
      </div>
    ),
  },
};

// Fallback guide if the page doesn't have one specifically defined
const FALLBACK_GUIDE = {
  title: "CastHub Page Guide",
  icon: HelpCircle,
  content: (
    <div className="space-y-6 text-sm text-muted-foreground mt-6">
      <p>Navigate through the sidebar to explore CastHub's features. If you need dedicated help, click <strong>Help & Support</strong> in the sidebar.</p>
    </div>
  ),
};

export function HelpDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-page-guide", handleOpen);
    return () => window.removeEventListener("open-page-guide", handleOpen);
  }, []);

  // Determine the guide for the current route
  // e.g. "/dashboard" matches exactly. For nested routes, we might do location.pathname.startsWith
  const activeGuideKey = Object.keys(PAGE_GUIDES).find(key => location.pathname.startsWith(key));
  const guide = activeGuideKey ? PAGE_GUIDES[activeGuideKey] : FALLBACK_GUIDE;
  const Icon = guide.icon;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md border-l border-white/10 bg-background/95 backdrop-blur-xl z-[9999] p-0 flex flex-col">
        {/* Header styling matching the Amber theme */}
        <div className="relative overflow-hidden p-6 border-b border-border/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10" />
          <SheetHeader className="text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-black uppercase tracking-tight">{guide.title}</SheetTitle>
              <SheetDescription className="font-medium text-xs uppercase tracking-widest mt-1">
                Contextual Help
              </SheetDescription>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {guide.content}
          
          <div className="mt-8 pt-6 border-t border-border/50 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Still need help?</h4>
            <Button variant="outline" className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500/10" onClick={() => { setIsOpen(false); window.location.href = '/help'; }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Visit Support Center
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
