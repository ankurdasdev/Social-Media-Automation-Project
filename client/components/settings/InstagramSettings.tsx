/**
 * Instagram Settings — PDF UI Revision
 */
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Instagram,
  Loader2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  WifiOff,
  CheckCircle2,
  Download,
  FolderOpen,
  ToggleRight,
  MousePointerClick,
  PackageOpen,
  Clipboard,
  AlertCircle,
  BookOpen,
  Puzzle,
  Copy,
  X,
  ChevronRight,
  Users,
  BarChart3,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { getOrCreateUserId, cn } from "@/lib/utils";
import { toast } from "sonner";

interface InstagramStatus {
  isConnected: boolean;
  username: string | null;
  connectedAt: string | null;
  serviceReachable?: boolean;
}

interface ServiceConfig {
  baseUrl: string;
  apiKey: string;
}

const INSTALL_DONE_KEY = "casthub-ig-extension-installed";
const HAD_CONNECTED_KEY = "casthub-ig-had-connected";

export default function InstagramSettings() {
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();

  const [connectionCode, setConnectionCode] = React.useState("");
  const [loginStep, setLoginStep] = React.useState<"idle" | "logging_in" | "done">("idle");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [guideTab, setGuideTab] = React.useState<"install" | "session">("install");
  const [warningAccepted, setWarningAccepted] = React.useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["instagram-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/status?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json() as Promise<InstagramStatus>;
    },
    refetchInterval: 30000,
  });

  const { data: serviceConfig } = useQuery({
    queryKey: ["instagram-service-config"],
    queryFn: async () => {
      const res = await fetch("/api/instagram/service-config");
      if (!res.ok) throw new Error("Failed to fetch service config");
      return res.json() as Promise<ServiceConfig>;
    },
    staleTime: Infinity,
  });

  React.useEffect(() => {
    if (status?.isConnected) {
      localStorage.setItem(HAD_CONNECTED_KEY, "true");
    }
  }, [status?.isConnected]);

  const hadConnected = !!localStorage.getItem(HAD_CONNECTED_KEY);
  const sessionExpired = hadConnected && status && !status.isConnected;

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/instagram/sync-threads?userId=${userId}`);
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onSuccess: (data) => toast.success(`Synced ${data.count} Instagram threads.`),
    onError: () => toast.error("Failed to sync Instagram threads."),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/instagram/disconnect?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Disconnect failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
      toast.success("Instagram disconnected.");
      setConnectionCode("");
      setLoginStep("idle");
      setLoginError(null);
      setWarningAccepted(false);
    },
    onError: () => toast.error("Failed to disconnect Instagram."),
  });

  const handleConnect = async () => {
    if (!serviceConfig) {
      toast.error("Service configuration not loaded. Please try again.");
      return;
    }
    if (!connectionCode.trim()) {
      toast.error("Please paste your Connection Code first.");
      return;
    }

    setLoginError(null);
    setLoginStep("logging_in");

    try {
      const connectRes = await fetch("/api/instagram/connect-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username: "user",
          sessionId: connectionCode.trim(),
        }),
      });

      if (!connectRes.ok) {
        const errBody = await connectRes.json();
        setLoginError(errBody.message || "Failed to connect. Make sure the Connection Code is valid and not expired.");
        setLoginStep("idle");
        return;
      }

      setLoginStep("done");
      toast.success("Instagram connected!");
      setConnectionCode("");
      queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
      setTimeout(() => syncMutation.mutate(), 500);
    } catch (err: any) {
      setLoginError(err?.message || "An unexpected error occurred.");
      setLoginStep("idle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
        <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Loading Instagram Settings...</p>
      </div>
    );
  }

  const isConnected = status?.isConnected;
  const serviceDown = status?.serviceReachable === false;
  const isBusy = loginStep === "logging_in";

  // ── Unlock Cards ──────────────────────────────────────────────────────────
  const unlockCards = [
    {
      icon: MessageSquare,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
      title: "Send Instagram DMs",
      sub: "Automated DM Outreach",
    },
    {
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: "Reach New Contacts",
      sub: "Increase Your Chances By Increasing The Number Of People Contacted. Minimum Repetition.",
    },
    {
      icon: LayoutDashboard,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      title: "Manage Campaigns From One Dashboard",
      sub: "Personalise Your Outreach",
    },
    {
      icon: Copy,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "Template Sending",
      sub: "No More Repetition, All Messages With A Click Of One Button",
    },
    {
      icon: BarChart3,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Track Outreach Activity",
      sub: "So You Can Decide What To Do Next",
    },
  ];

  // ── Install Steps ──────────────────────────────────────────────────────────
  const installSteps = [
    {
      icon: Download,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
      num: "01",
      title: "Download the CastHub Extension",
      desc: "Click the button below to download the CastHub extension.",
      action: (
        <a href="/casthub-extension.zip" download className="inline-block mt-3">
          <Button
            size="sm"
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:opacity-90 gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Download Extension
          </Button>
        </a>
      ),
    },
    {
      icon: PackageOpen,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      num: "02",
      title: "Unzip the Folder",
      desc: 'Find the downloaded file (usually in your Downloads folder). Right-click it → "Extract All" on Windows, or just double-click on Mac.',
    },
    {
      icon: FolderOpen,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      num: "03",
      title: 'Open "Manage Extensions"',
      desc: 'In Chrome or Edge, type chrome://extensions in the address bar and press Enter.',
    },
    {
      icon: ToggleRight,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      num: "04",
      title: 'Enable "Developer Mode"',
      desc: 'Look at the top-right corner of the Extensions page. Find the "Developer Mode" toggle and turn it ON.',
    },
    {
      icon: MousePointerClick,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      num: "05",
      title: 'Click "Load Unpacked"',
      desc: 'A "Load Unpacked" button will appear. Click it, navigate to and select the unzipped CastHub folder.',
    },
    {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      num: "06",
      title: "You're Done! (One-Time Only)",
      desc: "The CastHub extension is now installed. You'll see it in the top-right toolbar. You only need to do this once!",
    },
  ];

  // ── Session Steps ──────────────────────────────────────────────────────────
  const sessionSteps = [
    {
      icon: Instagram,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
      num: "01",
      title: "Open Instagram",
      desc: "Go to instagram.com in the same browser where you installed the extension and make sure you are logged in.",
    },
    {
      icon: Puzzle,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      num: "02",
      title: "Click the CastHub Extension",
      desc: 'Find the CastHub icon in the top-right of your browser (look in the puzzle-piece extensions menu). Click it.',
    },
    {
      icon: Copy,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      num: "03",
      title: 'Click "Copy Session ID"',
      desc: 'The extension popup will show your Connection Code. Click "Copy Session ID" — the code is now in your clipboard.',
    },
    {
      icon: Clipboard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      num: "04",
      title: "Paste It Here & Connect",
      desc: "Close this guide, paste the Connection Code in the field below, and click CONNECT INSTAGRAM.",
    },
  ];

  return (
    <div id="tutorial-settings-instagram" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Session Expiry Banner */}
      {sessionExpired && !isConnected && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in slide-in-from-top duration-500">
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-400 uppercase tracking-widest">⚠️ Session Expired</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your Instagram session has expired. Open Instagram, click the CastHub extension, copy a fresh Connection Code, and paste it below to reconnect.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-background/60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* ── Left Section ── */}
          <div className="p-8 md:p-12 lg:w-[45%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/10 to-orange-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/5 hover:scale-110 transition-transform duration-500">
                {/* Instagram gradient logo */}
                <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none">
                  <defs>
                    <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285AEB"/>
                    </radialGradient>
                  </defs>
                  <rect width="32" height="32" rx="8" fill="url(#ig-grad)"/>
                  <circle cx="16" cy="16" r="5.5" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="22.5" cy="9.5" r="1.5" fill="white"/>
                  <rect x="4" y="4" width="24" height="24" rx="6" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>

            <div className="flex-1 space-y-8">
              <div className="flex flex-col gap-3">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">
                  CONNECT<br/>
                  <span className="text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">INSTAGRAM</span>
                </h2>
                <p className="text-muted-foreground/70 text-sm font-medium leading-relaxed max-w-sm">
                  Send personalised outreach campaigns through your Instagram DM.
                </p>
              </div>

              {/* Unlock cards */}
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase leading-none">
                  {isConnected ? "What You Unlocked" : "What You Will Unlock"}
                </h2>
                <div className="space-y-2">
                  {unlockCards.map((card, i) => (
                    <div key={i} className={cn("flex items-start gap-3 p-3 rounded-2xl border transition-all", card.bg)}>
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", card.bg)}>
                        <card.icon className={cn("w-4 h-4", card.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide leading-tight">{card.title}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">{card.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Section ── */}
          <div className="p-8 md:p-10 flex-1 flex flex-col gap-6 relative bg-muted/20 backdrop-blur-sm">

            {serviceDown && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <WifiOff className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest">Service Offline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">The Instagram service is temporarily unreachable.</p>
                </div>
              </div>
            )}

            {isConnected ? (
              /* ── CONNECTED ── */
              <div className="space-y-6 animate-in zoom-in-95 duration-700 max-w-xl mx-auto w-full">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />

                  <div className="relative p-8 md:p-10 rounded-[3rem] bg-muted/80 border border-border/50 overflow-hidden space-y-8">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />

                    {/* Green tick + Connected title */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                        <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase leading-none">Instagram Connected</h4>
                      </div>
                    </div>

                    {/* Account info */}
                    <div className="space-y-3 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative z-10">
                      <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">Connected Instagram ID</p>
                      <div className="text-xl font-black tracking-tight text-center text-foreground break-all max-w-full px-2">
                        @{status?.username || "–"}
                      </div>
                      <div className="h-px w-12 bg-pink-500/20 mx-auto" />
                      {/* Warning in grey */}
                      <p className="text-[10px] text-muted-foreground/50 leading-relaxed text-center px-2">
                        If Instagram logs you out, click the CastHub extension on instagram.com, copy a new Connection Code, disconnect here and reconnect.
                      </p>
                    </div>

                    {/* Limitations */}
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative z-10">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-muted-foreground/60 leading-relaxed space-y-1">
                        <p className="font-black text-amber-400 uppercase tracking-widest text-[9px]">Limitations</p>
                        <p>Instagram controls its own platform and policies. If your session expires, generate a new Connection Code and reconnect. CastHub cannot control Instagram restrictions or enforcement actions.</p>
                      </div>
                    </div>

                    {/* Disconnect at bottom */}
                    <div className="relative z-10">
                      <Button
                        variant="ghost"
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                        className="h-12 w-full rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-rose-500/50 font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                        DISCONNECT
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── DISCONNECTED ── */
              <div className="space-y-6 animate-in fade-in duration-700 max-w-md mx-auto w-full">

                {/* Guide Button (no blinker) + header */}
                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">Connect Instagram</h3>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed px-4">
                    Send personalised outreach campaigns through your Instagram DM
                  </p>
                </div>

                <div className="flex items-center justify-end gap-4 flex-wrap w-full">
                  <button
                    onClick={() => { setGuideTab("install"); setGuideOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20 hover:scale-105"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Setup Guide
                  </button>
                </div>

                {/* Error */}
                {loginError && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">{loginError}</p>
                  </div>
                )}

                {/* Before Connecting Warning */}
                <div className="w-full space-y-4 text-left p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">⚠ Before Connecting Instagram</h4>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium leading-relaxed space-y-1.5 pl-8">
                    <p>Instagram controls its own platform and policies.</p>
                    <p>If your session expires, simply generate a new Connection Code and reconnect.</p>
                    <p>CastHub cannot control Instagram restrictions or enforcement actions.</p>
                  </div>
                  <div className="flex items-center gap-3 pl-8 pt-1">
                    <Checkbox
                      id="ig-understand"
                      checked={warningAccepted}
                      onCheckedChange={(c) => setWarningAccepted(!!c)}
                    />
                    <Label htmlFor="ig-understand" className="text-xs text-muted-foreground font-medium cursor-pointer">I understand</Label>
                  </div>
                </div>

                {/* Extension notice */}
                {warningAccepted && (
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300/80 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300">
                    Instagram requires a quick one-time setup using the CastHub Extension. Please review the{" "}
                    <button
                      className="underline text-pink-400 hover:text-pink-300"
                      onClick={() => { setGuideTab("install"); setGuideOpen(true); }}
                    >
                      Setup Guide
                    </button>{" "}
                    before connecting. The process takes less than 2 minutes and only needs to be completed once.
                  </div>
                )}

                {/* Connection Code Input */}
                {warningAccepted && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Connection Code <span className="text-pink-500">*</span>
                        </Label>
                        <button
                          onClick={() => { setGuideTab("install"); setGuideOpen(true); }}
                          className="text-[10px] font-black text-pink-500/60 hover:text-pink-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" /> How to get this?
                        </button>
                      </div>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-[1.2rem] blur-md opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                        <Input
                          type="text"
                          value={connectionCode}
                          onChange={(e) => setConnectionCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                          placeholder="Paste Code Here"
                          disabled={isBusy}
                          className="h-14 rounded-[1.2rem] bg-muted/60 border-border/50 focus:bg-background focus:ring-purple-500 font-mono text-sm shadow-inner transition-all relative z-0 px-5"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleConnect}
                      disabled={isBusy || !connectionCode.trim() || serviceDown || loginStep === "done"}
                      className={cn(
                        "h-16 w-full rounded-[1.2rem] font-black text-white shadow-2xl transition-all active:scale-[0.98] text-sm gap-3",
                        loginStep === "done"
                          ? "bg-emerald-500 shadow-emerald-500/20"
                          : "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90 shadow-pink-500/20"
                      )}
                    >
                      {loginStep === "done" ? (
                        <><CheckCircle2 className="h-5 w-5" /> CONNECTED!</>
                      ) : isBusy ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> CONNECTING...</>
                      ) : (
                        <><Instagram className="h-5 w-5" /> CONNECT INSTAGRAM</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── GUIDE POPUP DIALOG ── */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-card border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500/10 to-purple-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground uppercase tracking-widest">
                    Connect Instagram in 2 Minutes
                  </DialogTitle>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Follow the steps to connect Instagram seamlessly</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setGuideTab("install")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  guideTab === "install"
                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                    : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                )}
              >
                <Puzzle className="w-3.5 h-3.5" />
                Install Extension
              </button>
              <button
                onClick={() => setGuideTab("session")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  guideTab === "session"
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                )}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Get Connection Code
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-3">
            {guideTab === "install" ? (
              <>
                {installSteps.map((step, i) => (
                  <div key={i} className={cn("flex gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01]", step.bg)}>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", step.bg)}>
                      <step.icon className={cn("w-4 h-4", step.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", step.color)}>Step {step.num}</span>
                      </div>
                      <p className="text-[11px] font-black text-foreground uppercase tracking-wide leading-tight">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1 break-words">{step.desc}</p>
                      {step.action && <div>{step.action}</div>}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 mb-2">
                  <p className="text-[11px] text-blue-300/80 leading-relaxed">
                    Make sure you've installed the CastHub extension first! If not, switch to the "Install Extension" tab above.
                  </p>
                </div>
                {sessionSteps.map((step, i) => (
                  <div key={i} className={cn("flex gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01]", step.bg)}>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", step.bg)}>
                      <step.icon className={cn("w-4 h-4", step.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1 block", step.color)}>Step {step.num}</span>
                      <p className="text-[11px] font-black text-foreground uppercase tracking-wide leading-tight">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1 break-words">{step.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Limitations box */}
                <div className="flex gap-4 p-4 rounded-2xl border bg-amber-500/10 border-amber-500/20 mt-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-amber-500/10 border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-foreground uppercase tracking-wide leading-tight mb-1">Limitations</p>
                    <div className="text-[11px] text-muted-foreground/70 leading-relaxed space-y-1">
                      <p>Instagram controls its own platform and policies.</p>
                      <p>If your session expires, simply generate a new Connection Code and reconnect.</p>
                      <p>CastHub cannot control Instagram restrictions or enforcement actions.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-end gap-4">
            <Button
              size="sm"
              onClick={() => setGuideOpen(false)}
              className="h-9 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest"
            >
              Connect Instagram
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
