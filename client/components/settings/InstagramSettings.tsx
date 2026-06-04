/**
 * Instagram Settings — Session ID Login + Extension Guide
 */
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Copy,
  Puzzle,
  ToggleRight,
  MousePointerClick,
  PackageOpen,
  Clipboard,
  AlertCircle,
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
  const [showInstallGuide, setShowInstallGuide] = React.useState(
    !localStorage.getItem(INSTALL_DONE_KEY)
  );
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

  // Track session expiry
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
      toast.error("Please paste your Session ID.");
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
    setShowInstallGuide(false);
    toast.success("Great! Extension marked as installed.");
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

  const installSteps = [
    {
      icon: Download,
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
      title: "Download the Extension Files",
      desc: "Click the button below to download the CastHub extension as a ZIP file.",
      action: (
        <a href="/api/download/extension" download>
          <Button size="sm" className="mt-2 h-9 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:opacity-90 gap-2">
            <Download className="w-3.5 h-3.5" /> Download ZIP
          </Button>
        </a>
      ),
    },
    {
      icon: PackageOpen,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      title: "Unzip the Folder",
      desc: 'Find the downloaded file (usually in Downloads). Right-click it → select "Extract All" (Windows) or double-click (Mac). Remember where you save the unzipped folder.',
    },
    {
      icon: FolderOpen,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      title: 'Open "Manage Extensions"',
      desc: (
        <>
          In Chrome or Edge, type{" "}
          <code className="px-1.5 py-0.5 rounded bg-white/10 text-yellow-300 font-mono text-[10px]">chrome://extensions</code>{" "}
          in the address bar and press <strong>Enter</strong>.
        </>
      ),
    },
    {
      icon: ToggleRight,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: 'Enable "Developer Mode"',
      desc: 'Look for the "Developer Mode" toggle in the top-right corner of the Extensions page. Click it to turn it ON.',
    },
    {
      icon: MousePointerClick,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: 'Click "Load Unpacked"',
      desc: 'A new button "Load Unpacked" will appear. Click it, then navigate to and select the unzipped CastHub folder you saved in Step 2.',
    },
    {
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Extension Installed!",
      desc: "The CastHub extension will now appear in your browser toolbar. You only need to do this once!",
    },
  ];

  const sessionSteps = [
    {
      icon: Instagram,
      color: "text-pink-400",
      num: "01",
      title: "Open Instagram",
      desc: "Go to instagram.com in the same browser where you installed the extension and make sure you're logged in.",
    },
    {
      icon: Puzzle,
      color: "text-purple-400",
      num: "02",
      title: "Click the CastHub Extension",
      desc: 'Look for the CastHub icon in the top-right corner of your browser (puzzle piece icon → CastHub). Click it.',
    },
    {
      icon: Clipboard,
      color: "text-blue-400",
      num: "03",
      title: 'Click "Copy Session ID"',
      desc: 'The extension will show your Session ID. Click "Copy Session ID" — it\'s now in your clipboard.',
    },
    {
      icon: Copy,
      color: "text-emerald-400",
      num: "04",
      title: "Paste It Below & Connect",
      desc: "Paste the copied Session ID into the field below and click Connect. That's it!",
    },
  ];

  return (
    <div id="tutorial-settings-instagram" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Session Expiry Banner */}
      {sessionExpired && !isConnected && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in slide-in-from-top duration-500">
          <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-black text-amber-400 uppercase tracking-widest">⚠️ Session Expired</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your Instagram session has been terminated. Open Instagram in your browser, click the CastHub extension, copy a fresh Session ID, and paste it below to reconnect.
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-background/60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col lg:flex-row min-h-fit lg:min-h-[500px]">
          {/* Left — Identity */}
          <div className="p-6 md:p-8 lg:w-[42%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/10 to-orange-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/5 group hover:scale-110 transition-transform duration-500">
                <Instagram className="h-8 w-8 text-pink-500" />
              </div>
            </div>

            <div className="flex-1 space-y-8 relative">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">Session ID Login</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none break-words">
                  INSTAGRAM<br />
                  <span className="text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">INTEGRATION</span>
                </h2>

                {isConnected && (
                  <div className="mt-4 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 w-fit flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-pink-500" />
                    <span className="text-[11px] font-black text-pink-500 uppercase tracking-[0.1em]">SESSION ACTIVE</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground/60 text-base font-medium leading-relaxed max-w-sm pt-2">
                Connect using a Session ID extracted from your browser. It's the most reliable method — no password challenges, no blocks.
              </p>

              <div className="space-y-4 pt-6">
                {[
                  { icon: User, title: "Per-User Sessions", sub: "Your account, your session", color: "text-pink-500" },
                  { icon: Lock, title: "No Password Stored", sub: "Only session tokens are saved", color: "text-purple-500" },
                  { icon: ShieldCheck, title: "Block-Resistant", sub: "Session ID bypasses challenges", color: "text-orange-500" },
                ].map(({ icon: Icon, title, sub, color }) => (
                  <div key={title} className="flex items-center gap-5 group p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-pink-500/20 transition-all">
                    <div className={cn("w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center transition-all group-hover:scale-110", color.replace("text-", "bg-") + "/10")}>
                      <Icon className={cn("h-5 w-5", color)} />
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
          <div className="p-6 md:p-8 lg:p-10 flex-1 flex flex-col gap-8 relative bg-muted/20 backdrop-blur-sm overflow-hidden">

            {serviceDown && (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in slide-in-from-top duration-500">
                <WifiOff className="h-6 w-6 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-red-500 uppercase tracking-widest">Service Offline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">The Instagram service is temporarily unreachable. Try again soon.</p>
                </div>
              </div>
            )}

            {isConnected ? (
              /* ── CONNECTED STATE ── */
              <div className="space-y-6 animate-in zoom-in-95 duration-700 max-w-2xl mx-auto w-full">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />
                  <div className="relative p-6 md:p-8 rounded-[2.5rem] bg-muted/80 border border-border/50 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />
                    <div className="flex flex-col gap-8 relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-6 w-full">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.1)] shrink-0">
                            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                              <Instagram className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] whitespace-nowrap">Status :: Connected</p>
                            <h4 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase leading-none whitespace-nowrap">AUTHENTICATED</h4>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => disconnectMutation.mutate()}
                          disabled={disconnectMutation.isPending}
                          className="h-12 px-6 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-500 text-rose-500/60 font-black text-[10px] uppercase tracking-widest transition-all shrink-0"
                        >
                          {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                          DISCONNECT
                        </Button>
                      </div>

                      <div className="space-y-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden">
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] text-center">Connected Account</p>
                        <div className="text-2xl md:text-3xl font-black tracking-tight text-center text-foreground py-2 truncate max-w-full px-2">
                          @{status?.username || "–"}
                        </div>
                        <div className="h-px w-12 bg-pink-500/20 mx-auto" />
                        <p className="text-[10px] font-black text-pink-500/40 uppercase tracking-[0.2em] text-center truncate max-w-full px-2">
                          {status?.connectedAt ? `ESTABLISHED :: ${new Date(status.connectedAt).toLocaleDateString()}` : "ANONYMOUS SESSION"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto w-full">
                  <div className="p-6 rounded-3xl bg-muted/40 border border-border/50 flex items-center justify-between group cursor-default">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">SESSION STATUS</p>
                      <p className="text-xs font-black text-foreground">Active & Verified</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500/20 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div
                    className="p-6 rounded-3xl bg-muted/40 border border-border/50 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all"
                    onClick={() => syncMutation.mutate()}
                  >
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">INBOX SYNC</p>
                      <p className="text-xs font-black text-foreground">{syncMutation.isPending ? "Syncing Threads..." : "Refresh DM Groups"}</p>
                    </div>
                    <RefreshCw className={cn("h-4 w-4 text-blue-500/20 group-hover:text-blue-500 transition-all", syncMutation.isPending && "animate-spin text-blue-500")} />
                  </div>
                </div>

                {/* Reconnect reminder */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Session Tip</p>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    If Instagram logs you out, just open Instagram → click the CastHub extension → copy a new Session ID → disconnect here and reconnect.
                  </p>
                </div>
              </div>
            ) : (
              /* ── DISCONNECTED STATE ── */
              <div className="space-y-8 w-full animate-in fade-in duration-700">

                {/* ─── PART A: ONE-TIME INSTALL GUIDE ─── */}
                <div className={cn(
                  "rounded-[2rem] border overflow-hidden transition-all duration-500",
                  markedInstalled ? "border-emerald-500/20 bg-emerald-500/5" : "border-pink-500/20 bg-pink-500/5"
                )}>
                  {/* Header */}
                  <button
                    onClick={() => setShowInstallGuide(!showInstallGuide)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {markedInstalled ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Puzzle className="h-5 w-5 text-pink-400 shrink-0" />
                      )}
                      <div>
                        <p className={cn("text-[11px] font-black uppercase tracking-widest", markedInstalled ? "text-emerald-400" : "text-pink-400")}>
                          {markedInstalled ? "Extension Installed ✓" : "Step 1: Install the Browser Extension (One-Time Setup)"}
                        </p>
                        {markedInstalled && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Click to review installation steps again</p>
                        )}
                      </div>
                    </div>
                    {showInstallGuide ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Steps */}
                  {showInstallGuide && (
                    <div className="px-5 pb-5 space-y-3 animate-in slide-in-from-top duration-300">
                      <div className="h-px w-full bg-white/5 mb-4" />
                      {installSteps.map((step, i) => (
                        <div key={i} className={cn("flex gap-4 p-4 rounded-2xl border", step.bg)}>
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border", step.bg)}>
                            <step.icon className={cn("w-4 h-4", step.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", step.color)}>Step {i + 1}</span>
                            </div>
                            <p className="text-[11px] font-black text-foreground uppercase tracking-wide">{step.title}</p>
                            <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">{step.desc}</p>
                            {step.action && <div className="mt-3">{step.action}</div>}
                          </div>
                        </div>
                      ))}

                      {!markedInstalled && (
                        <Button
                          onClick={handleMarkInstalled}
                          variant="outline"
                          className="w-full h-11 mt-2 rounded-2xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> I've Installed the Extension
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── PART B: GET SESSION ID ─── */}
                <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Clipboard className="h-5 w-5 text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">
                          {markedInstalled ? "Get Your Session ID (Do This Every Time)" : "Step 2: Get Your Session ID (Do This Every Time)"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">Quick 4-step process, takes under 30 seconds</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sessionSteps.map((step, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-black text-blue-400">{step.num}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-foreground uppercase tracking-wide">{step.title}</p>
                            <p className="text-[10px] text-muted-foreground/60 leading-relaxed mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── CONNECT FORM ─── */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Paste & Connect</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* Error */}
                  {loginError && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">{loginError}</p>
                    </div>
                  )}

                  {/* Username */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Your Instagram Username <span className="text-muted-foreground/40">(optional)</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500/20 to-orange-500/20 rounded-[1.5rem] blur-lg opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-500 font-black text-lg opacity-30 group-focus-within:opacity-100 transition-opacity z-10">@</span>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="your.username"
                        disabled={isBusy}
                        className="h-14 pl-10 rounded-[1.5rem] bg-muted/60 border-border/50 focus:bg-background focus:ring-pink-500 font-black tracking-tight shadow-inner transition-all relative z-0"
                      />
                    </div>
                  </div>

                  {/* Session ID */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Session ID <span className="text-pink-500">*</span>
                    </Label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 rounded-[1.5rem] blur-lg opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                      <Input
                        type="text"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                        placeholder="Paste the Session ID copied from the extension..."
                        disabled={isBusy}
                        className="h-16 rounded-[1.5rem] bg-muted/60 border-border/50 focus:bg-background focus:ring-purple-500 text-center text-sm font-mono tracking-tight shadow-inner transition-all relative z-0 px-6"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleConnect}
                    disabled={isBusy || !sessionId.trim() || serviceDown || loginStep === "done"}
                    className={cn(
                      "h-16 w-full rounded-[1.5rem] font-black text-white shadow-2xl transition-all active:scale-[0.98] text-base gap-3 group relative overflow-hidden",
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
                    Session ID is stored securely on our server
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
