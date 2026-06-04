/**
 * Instagram Settings — Login First + Guide Popup
 */
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  User,
  LogOut,
  Lock,
  RefreshCw,
  WifiOff,
  CheckCircle2,
  ShieldCheck,
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

  const [sessionId, setSessionId] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loginStep, setLoginStep] = React.useState<"idle" | "logging_in" | "done">("idle");
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [guideTab, setGuideTab] = React.useState<"install" | "session">("install");
  const [markedInstalled, setMarkedInstalled] = React.useState(
    !!localStorage.getItem(INSTALL_DONE_KEY)
  );

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
      setSessionId("");
      setUsername("");
      setLoginStep("idle");
      setLoginError(null);
    },
    onError: () => toast.error("Failed to disconnect Instagram."),
  });

  const handleConnect = async () => {
    if (!serviceConfig) {
      toast.error("Service configuration not loaded. Please try again.");
      return;
    }
    if (!sessionId.trim()) {
      toast.error("Please paste your Session ID first. Click 'How to Get Session ID?' above if you need help.");
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
          username: (username || "user").trim().toLowerCase().replace(/^@/, ""),
          sessionId: sessionId.trim(),
        }),
      });

      if (!connectRes.ok) {
        const errBody = await connectRes.json();
        setLoginError(errBody.message || "Failed to connect. Make sure the Session ID is valid and not expired.");
        setLoginStep("idle");
        return;
      }

      setLoginStep("done");
      toast.success("Instagram session connected!");
      setSessionId("");
      queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
      setTimeout(() => syncMutation.mutate(), 500);
    } catch (err: any) {
      setLoginError(err?.message || "An unexpected error occurred.");
      setLoginStep("idle");
    }
  };

  const handleMarkInstalled = () => {
    localStorage.setItem(INSTALL_DONE_KEY, "true");
    setMarkedInstalled(true);
    toast.success("Extension marked as installed!");
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

  // ── Install Steps ──────────────────────────────────────────────────────────
  const installSteps = [
    {
      icon: Download,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
      num: "01",
      title: "Download the Extension Files",
      desc: "Click the Download button below to download the CastHub extension as a ZIP file to your computer.",
      action: (
        <a href="/casthub-extension.zip" download className="inline-block mt-3">
          <Button
            size="sm"
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:opacity-90 gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Download ZIP
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
      desc: 'Find the downloaded file (usually in your Downloads folder). Right-click it → "Extract All" on Windows, or just double-click on Mac. Note where you saved the unzipped folder.',
    },
    {
      icon: FolderOpen,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      num: "03",
      title: 'Open "Manage Extensions"',
      desc: (
        <>
          In Chrome or Edge, type{" "}
          <code className="px-1.5 py-0.5 rounded bg-white/10 text-yellow-300 font-mono text-[10px]">
            chrome://extensions
          </code>{" "}
          in the address bar and press <strong className="text-foreground">Enter</strong>.
        </>
      ),
    },
    {
      icon: ToggleRight,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      num: "04",
      title: 'Enable "Developer Mode"',
      desc: 'Look at the top-right corner of the Extensions page. Find the "Developer Mode" toggle and click it to turn it ON.',
    },
    {
      icon: MousePointerClick,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      num: "05",
      title: 'Click "Load Unpacked"',
      desc: 'A new "Load Unpacked" button will appear at the top-left. Click it, navigate to and select the unzipped CastHub folder you saved in Step 2.',
    },
    {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      num: "06",
      title: "You're Done! (One-Time Only)",
      desc: "The CastHub extension is now installed in your browser. You'll see it in the top-right toolbar. You only need to do this once ever!",
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
      desc: 'Find the CastHub icon in the top-right of your browser (look in the puzzle-piece extensions menu). Click it to open the extension.',
    },
    {
      icon: Copy,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      num: "03",
      title: 'Click "Copy Session ID"',
      desc: 'The extension popup will show your Session ID. Click "Copy Session ID" button — the ID is now in your clipboard.',
    },
    {
      icon: Clipboard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      num: "04",
      title: "Paste It Here & Connect",
      desc: "Close this guide, paste the Session ID in the field below, and click CONNECT INSTAGRAM. That's it — done in under 30 seconds!",
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
              Your Instagram session has been terminated. Open Instagram, click the CastHub extension, copy a fresh Session ID, and paste it below to reconnect.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-background/60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col lg:flex-row min-h-fit">
          {/* Left — Identity */}
          <div className="p-6 md:p-8 lg:w-[40%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/10 to-orange-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/5 hover:scale-110 transition-transform duration-500">
                <Instagram className="h-8 w-8 text-pink-500" />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">Session ID Login</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">
                  INSTAGRAM<br />
                  <span className="text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">INTEGRATION</span>
                </h2>
                {isConnected && (
                  <div className="mt-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 w-fit flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-pink-500" />
                    <span className="text-[11px] font-black text-pink-500 uppercase tracking-[0.1em]">SESSION ACTIVE</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground/60 text-sm font-medium leading-relaxed">
                Connect using a Session ID from your browser. No password challenges, no account blocks.
              </p>

              <div className="space-y-3">
                {[
                  { icon: User, title: "Per-User Sessions", sub: "Your account, your session", color: "text-pink-500" },
                  { icon: Lock, title: "No Password Stored", sub: "Only session tokens saved", color: "text-purple-500" },
                  { icon: ShieldCheck, title: "Block-Resistant", sub: "Session ID bypasses challenges", color: "text-orange-500" },
                ].map(({ icon: Icon, title, sub, color }) => (
                  <div key={title} className="flex items-center gap-4 group p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-pink-500/20 transition-all">
                    <div className={cn("w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0", color.replace("text-", "bg-") + "/10")}>
                      <Icon className={cn("h-4 w-4", color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{title}</p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Interaction */}
          <div className="p-6 md:p-8 lg:p-10 flex-1 flex flex-col gap-6 relative bg-muted/20 backdrop-blur-sm">

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
              <div className="space-y-6 animate-in zoom-in-95 duration-700">
                <div className="p-6 rounded-[2rem] bg-muted/80 border border-border/50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                        <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center">
                          <Instagram className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em]">Status :: Connected</p>
                        <h4 className="text-xl font-black text-foreground tracking-tighter uppercase">AUTHENTICATED</h4>
                        <p className="text-sm font-black text-foreground/60">@{status?.username || "–"}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      className="h-11 px-5 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 text-rose-500/70 hover:text-rose-500 font-black text-[10px] uppercase tracking-widest"
                    >
                      {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                      DISCONNECT
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
                    <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">SESSION STATUS</p>
                    <p className="text-xs font-black text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active & Verified
                    </p>
                  </div>
                  <div
                    className="p-5 rounded-2xl bg-muted/40 border border-border/50 space-y-1 cursor-pointer hover:border-blue-500/30 transition-all"
                    onClick={() => syncMutation.mutate()}
                  >
                    <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">INBOX SYNC</p>
                    <p className="text-xs font-black text-foreground flex items-center gap-2">
                      <RefreshCw className={cn("h-3.5 w-3.5 text-blue-500", syncMutation.isPending && "animate-spin")} />
                      {syncMutation.isPending ? "Syncing..." : "Refresh DMs"}
                    </p>
                  </div>
                </div>

                {/* Reconnect tip */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <AlertCircle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                    If Instagram logs you out, click the CastHub extension on instagram.com, copy a new Session ID, disconnect here and reconnect.
                  </p>
                </div>
              </div>
            ) : (
              /* ── DISCONNECTED ── */
              <div className="space-y-6 animate-in fade-in duration-700">

                {/* ── GUIDE BUTTON — dancing, always visible ── */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Connect Your Account</h3>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Paste your Session ID below to connect</p>
                  </div>
                  <button
                    onClick={() => { setGuideTab(markedInstalled ? "session" : "install"); setGuideOpen(true); }}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all",
                      "bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/30 text-pink-400",
                      "hover:from-pink-500/20 hover:to-purple-500/20 hover:border-pink-500/50 hover:scale-105",
                      "animate-pulse shadow-lg shadow-pink-500/10"
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {markedInstalled ? "How to Get Session ID?" : "Setup Guide"}
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-pink-500 rounded-full animate-ping" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-pink-500 rounded-full" />
                  </button>
                </div>

                {/* Error */}
                {loginError && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">{loginError}</p>
                  </div>
                )}

                {/* Username */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Instagram Username <span className="text-muted-foreground/40 normal-case font-medium">(optional)</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-pink-500/20 to-orange-500/20 rounded-[1.2rem] blur-md opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-500 font-black text-lg opacity-30 group-focus-within:opacity-100 transition-opacity z-10">@</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your.username"
                      disabled={isBusy}
                      className="h-14 pl-10 rounded-[1.2rem] bg-muted/60 border-border/50 focus:bg-background focus:ring-pink-500 font-black tracking-tight shadow-inner transition-all relative z-0"
                    />
                  </div>
                </div>

                {/* Session ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Session ID <span className="text-pink-500">*</span>
                    </Label>
                    <button
                      onClick={() => { setGuideTab("session"); setGuideOpen(true); }}
                      className="text-[10px] font-black text-pink-500/60 hover:text-pink-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" /> How to get this?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-[1.2rem] blur-md opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                    <Input
                      type="text"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                      placeholder="Paste your Session ID here..."
                      disabled={isBusy}
                      className="h-14 rounded-[1.2rem] bg-muted/60 border-border/50 focus:bg-background focus:ring-purple-500 font-mono text-sm shadow-inner transition-all relative z-0 px-5"
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleConnect}
                  disabled={isBusy || !sessionId.trim() || serviceDown || loginStep === "done"}
                  className={cn(
                    "h-16 w-full rounded-[1.2rem] font-black text-white shadow-2xl transition-all active:scale-[0.98] text-base gap-3",
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

                <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] text-center">
                  Session ID is stored securely · No passwords saved
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── GUIDE POPUP DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-card border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Fixed Header */}
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500/10 to-purple-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground uppercase tracking-widest">Extension Setup Guide</DialogTitle>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Follow the steps to connect Instagram seamlessly</p>
                </div>
              </div>
              <button
                onClick={() => setGuideOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
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
                {markedInstalled ? "Install Guide ✓" : "Install Extension"}
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
                Get Session ID
              </button>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
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
              </>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
              {guideTab === "install" ? "One-time setup · Takes ~2 minutes" : "Do this every time your session expires"}
            </p>
            <div className="flex items-center gap-3">
              {guideTab === "install" && !markedInstalled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkInstalled}
                  className="h-9 px-4 rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Installed
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => { setGuideOpen(false); }}
                className="h-9 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest gap-2"
              >
                Got It, Let's Connect!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
