/**
 * Instagram Settings — Browser-Direct Login
 *
 * The login call (username/password → instagrapi-rest) is made DIRECTLY from
 * the user's browser, so it uses their residential IP instead of the server's
 * data-centre IP that Instagram rate-limits/blocks.
 *
 * Flow:
 *   1.  GET /api/instagram/service-config   ← server sends instagrapi-rest URL + key
 *   2.  POST {instagrapi-rest}/auth/login   ← user's browser sends credentials
 *   3.  POST /api/instagram/connect-session ← backend stores the session string
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
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { getOrCreateUserId } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function InstagramSettings() {
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [needsVerification, setNeedsVerification] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginStep, setLoginStep] = React.useState<"idle" | "logging_in" | "saving" | "done">("idle");
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // ── Status ───────────────────────────────────────────────────────────────
  const { data: status, isLoading } = useQuery({
    queryKey: ["instagram-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/status?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json() as Promise<InstagramStatus>;
    },
    refetchInterval: 30000,
  });

  // ── Service Config (instagrapi-rest URL) ─────────────────────────────────
  const { data: serviceConfig } = useQuery({
    queryKey: ["instagram-service-config"],
    queryFn: async () => {
      const res = await fetch("/api/instagram/service-config");
      if (!res.ok) throw new Error("Failed to fetch service config");
      return res.json() as Promise<ServiceConfig>;
    },
    staleTime: Infinity,
  });

  // ── Thread Sync ───────────────────────────────────────────────────────────
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/instagram/sync-threads?userId=${userId}`);
      if (!res.ok) throw new Error("Sync failed");
      return res.json();
    },
    onSuccess: (data) => toast.success(`Synced ${data.count} Instagram threads.`),
    onError: () => toast.error("Failed to sync Instagram threads."),
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/instagram/disconnect?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Disconnect failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
      toast.success("Instagram disconnected.");
      setUsername("");
      setPassword("");
      setNeedsVerification(false);
      setLoginStep("idle");
      setLoginError(null);
    },
    onError: () => toast.error("Failed to disconnect Instagram."),
  });

  /**
   * Core login flow — runs entirely in the user's browser.
   * Step 1: Call instagrapi-rest directly (residential IP).
   * Step 2: Forward the session string to OUR server to persist.
   */
  const handleConnect = async () => {
    if (!serviceConfig) {
      toast.error("Service configuration not loaded. Please try again.");
      return;
    }
    if (!username.trim() || !password) {
      toast.error("Please enter your username and password.");
      return;
    }

    setLoginError(null);
    setLoginStep("logging_in");

    try {
      // ── Step 1: Login directly from the browser ──────────────────────────
      const { baseUrl, apiKey } = serviceConfig;
      const form = new URLSearchParams();
      form.append("username", username.trim().toLowerCase().replace(/^@/, ""));
      form.append("password", password);
      if (verificationCode.trim()) {
        form.append("verification_code", verificationCode.trim());
      }

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(apiKey ? { "X-API-KEY": apiKey } : {}),
        },
        body: form,
      });

      if (!loginRes.ok) {
        let errBody: any;
        try {
          errBody = await loginRes.json();
        } catch {
          errBody = await loginRes.text();
        }

        const errStr = typeof errBody === "object" ? JSON.stringify(errBody) : String(errBody || "");
        const isTwoFactor =
          errStr.toLowerCase().includes("two_factor") ||
          errStr.toLowerCase().includes("verification_code");

        if (isTwoFactor) {
          setNeedsVerification(true);
          setLoginStep("idle");
          toast.info("Two-factor authentication required. Enter your code and try again.");
          return;
        }

        // Surface a clean message instead of raw JSON
        let userMessage = "Login failed. Check your credentials and try again.";
        if (errStr.toLowerCase().includes("badpassword")) {
          userMessage = "Incorrect password. Please double-check and try again.";
        } else if (errStr.toLowerCase().includes("two_factor")) {
          userMessage = "Two-factor authentication required.";
        } else if (errStr.toLowerCase().includes("challenge")) {
          userMessage = "Instagram requires you to complete a challenge in the app. Please open Instagram on your phone, approve the login, and try again.";
        }

        setLoginError(userMessage);
        setLoginStep("idle");
        return;
      }

      // instagrapi-rest returns the sessionid string as a JSON value
      const sessionId: string = await loginRes.json();

      // ── Step 2: Persist session on our server ────────────────────────────
      setLoginStep("saving");

      const saveRes = await fetch("/api/instagram/connect-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username: username.trim().toLowerCase().replace(/^@/, ""),
          sessionId,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err?.error || "Failed to save session");
      }

      setLoginStep("done");
      toast.success(`Instagram connected as @${username.trim()}!`);
      setPassword("");
      setVerificationCode("");
      setNeedsVerification(false);
      queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
      setTimeout(() => syncMutation.mutate(), 500);
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred.";
      // Network errors (CORS / service down)
      const isCorsOrNetwork =
        err instanceof TypeError && msg.includes("fetch");
      setLoginError(
        isCorsOrNetwork
          ? "Cannot reach the Instagram service. Make sure the instagrapi-rest service is running."
          : msg
      );
      setLoginStep("idle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
      </div>
    );
  }

  const isConnected = status?.isConnected;
  const serviceDown = status?.serviceReachable === false;
  const isBusy = loginStep === "logging_in" || loginStep === "saving";

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden glass-card border-white/10 rounded-[3rem] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -z-10" />

        <div className="flex flex-col md:flex-row">
          {/* ── Left panel ─────────────────────────────────────────────── */}
          <div className="p-10 md:p-14 md:w-[40%] border-b md:border-b-0 md:border-r border-white/5 bg-muted/20 backdrop-blur-xl">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-orange-500/20 border border-pink-500/20 flex items-center justify-center mb-10 shadow-xl shadow-pink-500/10">
              <Instagram className="h-10 w-10 text-pink-500" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4 flex items-center gap-3">
              INSTAGRAM{" "}
              <span className="text-pink-500 italic">LINK</span>
              {isConnected && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              )}
            </h2>
            <p className="text-muted-foreground/80 text-sm font-medium leading-relaxed mb-8">
              Connect your Instagram account. Your credentials are sent directly from your browser — not through our server — so they always reach Instagram from a trusted IP.
            </p>

            <div className="space-y-4">
              {[
                { icon: User, title: "Per-User Sessions", sub: "Your account, your session" },
                { icon: Lock, title: "Password Not Stored", sub: "Only the session cookie is saved" },
                { icon: ShieldCheck, title: "Browser-Direct Auth", sub: "Credentials never touch our server" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{title}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel ────────────────────────────────────────────── */}
          <div className="p-10 md:p-14 flex-1 flex flex-col justify-center min-h-[450px]">
            {/* Service offline banner */}
            {serviceDown && (
              <div className="mb-8 flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                <WifiOff className="h-6 w-6 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-red-500 uppercase tracking-widest">Service Offline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">The Instagram service is temporarily unreachable. Try again soon.</p>
                </div>
              </div>
            )}

            {isConnected ? (
              /* ── Connected state ─────────────────────────────────────── */
              <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <div className="p-10 rounded-[2.5rem] bg-pink-500/5 border border-pink-500/10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="h-24 w-24 rounded-full border-4 border-pink-500/20 p-2 shadow-2xl shadow-pink-500/20 bg-background/50 backdrop-blur-3xl">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-orange-500/10 flex items-center justify-center border border-pink-500/20">
                        <Instagram className="h-10 w-10 text-pink-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Connected Account</p>
                      <h3 className="text-3xl font-black tracking-tighter text-foreground">@{status?.username}</h3>
                      <p className="text-[11px] font-black text-muted-foreground mt-1 opacity-50 uppercase tracking-widest">
                        {status?.connectedAt ? `Since ${new Date(status.connectedAt).toLocaleDateString()}` : "Session active"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    className="h-14 px-10 rounded-2xl border-white/10 hover:border-destructive/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 relative z-10"
                  >
                    {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 mr-3 animate-spin" /> : <LogOut className="h-4 w-4 mr-3" />}
                    DISCONNECT
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 rounded-3xl bg-muted/20 border border-white/5 hover:border-pink-500/30 transition-all group shadow-inner">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500/70 mb-4">Session Status</h4>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <p className="text-base font-black text-foreground group-hover:translate-x-1 transition-transform">Active &amp; Verified</p>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">Session cookie stored securely.</p>
                  </div>
                  <div
                    className="p-8 rounded-3xl bg-muted/20 border border-white/5 hover:border-blue-500/30 transition-all group shadow-inner cursor-pointer"
                    onClick={() => syncMutation.mutate()}
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/70 mb-4">
                      {syncMutation.isPending ? "Syncing..." : "Sync Threads"}
                    </h4>
                    <p className="text-base font-black text-foreground group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      {syncMutation.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        : <RefreshCw className="h-4 w-4 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />}
                      Refresh DM Groups
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">Pull latest inbox threads.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Login form ──────────────────────────────────────────── */
              <div className="flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-700">
                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-500/15 blur-3xl rounded-full animate-pulse-slow" />
                  <div className="relative h-24 w-24 rounded-[2.5rem] bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-orange-500/10 border border-pink-500/20 flex items-center justify-center shadow-2xl">
                    <Instagram className="h-12 w-12 text-pink-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-4xl font-black tracking-tighter">CONNECT <span className="text-pink-500 italic">INSTAGRAM</span></h3>
                  <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Enter your Instagram credentials. Login happens directly in your browser — not through our servers.
                  </p>
                </div>

                {/* Step indicator during login */}
                {isBusy && (
                  <div className="w-full max-w-md p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20 flex items-center gap-4 animate-in fade-in">
                    <Loader2 className="h-5 w-5 text-pink-500 animate-spin shrink-0" />
                    <div className="text-left">
                      <p className="text-[11px] font-black text-pink-500 uppercase tracking-widest">
                        {loginStep === "logging_in" ? "Authenticating with Instagram..." : "Securing your session..."}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {loginStep === "logging_in"
                          ? "Connecting from your browser's IP address"
                          : "Saving session to your account"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {loginError && (
                  <div className="w-full max-w-md p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{loginError}</p>
                  </div>
                )}

                {/* Form */}
                <div className="w-full max-w-md space-y-4">
                  {/* Username */}
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">@</span>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                        placeholder="your.username"
                        autoComplete="username"
                        disabled={isBusy}
                        className="h-16 pl-12 rounded-2xl bg-muted/30 border-white/5 focus:bg-background focus:ring-pink-500 font-black text-lg tracking-tight shadow-inner transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2 text-left">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                        placeholder="••••••••••"
                        autoComplete="current-password"
                        disabled={isBusy}
                        className="h-16 rounded-2xl bg-muted/30 border-white/5 focus:bg-background focus:ring-pink-500 font-black text-lg shadow-inner transition-all pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 2FA */}
                  {needsVerification && (
                    <div className="space-y-2 text-left animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500">2FA Code Required</Label>
                      </div>
                      <Input
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                        placeholder="Enter 6-digit code"
                        disabled={isBusy}
                        className="h-16 rounded-2xl bg-amber-500/5 border-amber-500/20 focus:ring-amber-500 font-black text-lg text-center tracking-[0.3em] shadow-inner"
                        maxLength={6}
                      />
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    onClick={handleConnect}
                    disabled={isBusy || !username.trim() || !password || serviceDown || loginStep === "done"}
                    className={cn(
                      "h-20 w-full rounded-[1.5rem] font-black text-white shadow-2xl transition-all active:scale-[0.98] text-lg gap-3",
                      loginStep === "done"
                        ? "bg-emerald-500 shadow-emerald-500/20"
                        : "bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:opacity-90 shadow-pink-500/20"
                    )}
                  >
                    {loginStep === "done" ? (
                      <><CheckCircle2 className="h-6 w-6" /> CONNECTED!</>
                    ) : isBusy ? (
                      <><Loader2 className="h-6 w-6 animate-spin" /> {loginStep === "saving" ? "SECURING SESSION..." : "CONNECTING..."}</>
                    ) : needsVerification ? (
                      <><Instagram className="h-6 w-6" /> VERIFY &amp; CONNECT</>
                    ) : (
                      <><Instagram className="h-6 w-6" /> CONNECT INSTAGRAM</>
                    )}
                  </Button>

                  <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    Your password is never sent to our servers. Only the session is stored.
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
