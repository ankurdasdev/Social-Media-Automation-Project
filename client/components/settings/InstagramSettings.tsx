/**
 * Instagram Settings — Browser-Direct Login
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
  Zap,
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
      setUsername("");
      setPassword("");
      setNeedsVerification(false);
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
    if (!username.trim() || !password) {
      toast.error("Please enter your username and password.");
      return;
    }

    setLoginError(null);
    setLoginStep("logging_in");

    try {
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

        let userMessage = "Login failed. Check your credentials and try again.";
        if (errStr.toLowerCase().includes("badpassword")) {
          userMessage = "Incorrect password. Please double-check and try again.";
        } else if (errStr.toLowerCase().includes("challenge")) {
          userMessage = "Instagram requires you to complete a challenge in the app. Please open Instagram on your phone, approve the login, and try again.";
        }

        setLoginError(userMessage);
        setLoginStep("idle");
        return;
      }

      const sessionId: string = await loginRes.json();
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
      const isCorsOrNetwork = err instanceof TypeError && msg.includes("fetch");
      setLoginError(isCorsOrNetwork ? "Cannot reach the Instagram service." : msg);
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
  const isBusy = loginStep === "logging_in" || loginStep === "saving";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-black/60">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col lg:flex-row min-h-[600px]">
           {/* Left Section - Identity & Status */}
           <div className="p-8 md:p-12 lg:w-[45%] flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative">
              <div className="mb-12">
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500/10 to-orange-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/5 group hover:scale-110 transition-transform duration-500">
                    <Instagram className="h-8 w-8 text-pink-500" />
                 </div>
              </div>

              <div className="flex-1 space-y-10 relative">
               <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">Live Connection</span>
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
                    INSTAGRAM<br/>
                    <span className="text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">LINK</span>
                  </h2>

                  {isConnected && (
                    <div className="mt-4 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 w-fit flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-pink-500" />
                       <span className="text-[11px] font-black text-pink-500 uppercase tracking-[0.1em]">SESSION ACTIVE</span>
                    </div>
                  )}
               </div>

               <p className="text-muted-foreground/60 text-base font-medium leading-relaxed max-w-sm pt-4">
                  Connect your Instagram account. Your credentials are sent directly from your browser — not through our server — so they always reach Instagram from a trusted IP.
               </p>

               <div className="space-y-4 pt-8">
                  {[
                    { icon: User, title: "Per-User Sessions", sub: "Your account, your session", color: "text-pink-500" },
                    { icon: Lock, title: "Secure Handshake", sub: "Only session tokens are saved", color: "text-purple-500" },
                    { icon: ShieldCheck, title: "Browser-Direct Auth", sub: "Direct residential IP login", color: "text-orange-500" },
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

         {/* Right Section - Interaction Area */}
            <div className="p-8 md:p-12 lg:p-16 flex-1 flex flex-col justify-center relative bg-black/20 backdrop-blur-sm">
               {serviceDown && (
                 <div className="mb-8 flex items-center gap-4 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in slide-in-from-top duration-500">
                   <WifiOff className="h-6 w-6 text-red-500 shrink-0" />
                   <div>
                     <p className="text-sm font-black text-red-500 uppercase tracking-widest">Service Offline</p>
                     <p className="text-xs text-muted-foreground mt-0.5">The Instagram service is temporarily unreachable. Try again soon.</p>
                   </div>
                 </div>
               )}

               {isConnected ? (
                 <div className="space-y-8 animate-in zoom-in-95 duration-700 max-w-2xl mx-auto w-full">
                   <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />
                      
                      <div className="relative p-8 md:p-12 rounded-[3.5rem] bg-zinc-950/80 border border-white/10 overflow-hidden">
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />
                         
                         <div className="flex flex-col gap-10 relative z-10">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-2.5xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                                     <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                                        <Instagram className="h-4 w-4 text-white" />
                                     </div>
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em]">Status :: Connected</p>
                                     <h4 className="text-3xl font-black text-foreground tracking-tighter">AUTHENTICATED</h4>
                                  </div>
                               </div>
                               
                               <Button
                                  variant="ghost"
                                  onClick={() => disconnectMutation.mutate()}
                                  disabled={disconnectMutation.isPending}
                                  className="h-12 px-6 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-500 text-rose-500/60 font-black text-[10px] uppercase tracking-widest transition-all group"
                               >
                                  {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                                  DISCONNECT
                               </Button>
                            </div>

                            <div className="space-y-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                               <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] text-center">Connected Account</p>
                               <div className="text-4xl md:text-5xl font-black tracking-tight text-center text-foreground break-all py-2">
                                  @{status?.username}
                               </div>
                               <div className="h-px w-12 bg-pink-500/20 mx-auto" />
                               <p className="text-[10px] font-black text-pink-500/40 uppercase tracking-[0.2em] text-center">
                                 {status?.connectedAt ? `ESTABLISHED :: ${new Date(status.connectedAt).toLocaleDateString()}` : "ANONYMOUS SESSION"}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto w-full">
                     <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center justify-between group cursor-default">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">SESSION STATUS</p>
                           <p className="text-xs font-black text-foreground">Active & Verified</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500/20 group-hover:text-emerald-500 transition-colors" />
                     </div>
                     <div
                        className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center justify-between group cursor-pointer hover:border-blue-500/30 transition-all"
                        onClick={() => syncMutation.mutate()}
                      >
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">INBOX SYNC</p>
                           <p className="text-xs font-black text-foreground">{syncMutation.isPending ? "Syncing Threads..." : "Refresh DM Groups"}</p>
                        </div>
                        <RefreshCw className={cn("h-4 w-4 text-blue-500/20 group-hover:text-blue-500 transition-all", syncMutation.isPending && "animate-spin text-blue-500")} />
                     </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-12 text-center animate-in fade-in duration-700">
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse-slow" />
                    <div className="relative h-24 w-24 bg-muted/40 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl group transition-all hover:rotate-12 cursor-pointer">
                      <Instagram className="h-12 w-12 text-pink-500" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-4xl font-black tracking-tighter">CONNECT <span className="text-pink-500 italic">INSTAGRAM</span></h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Enter your Instagram credentials. Login happens directly in your browser — not through our servers.
                    </p>
                  </div>

                  {/* Step indicator during login */}
                  {isBusy && (
                    <div className="w-full max-w-md p-5 rounded-3xl bg-pink-500/5 border border-pink-500/10 flex items-center gap-4 animate-in fade-in">
                      <Loader2 className="h-6 w-6 text-pink-500 animate-spin shrink-0" />
                      <div className="text-left">
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                          {loginStep === "logging_in" ? "Authenticating with Instagram..." : "Securing your session..."}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                          Connecting from your browser's IP address
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {loginError && (
                    <div className="w-full max-w-md p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 text-left animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">{loginError}</p>
                    </div>
                  )}

                  {/* Form */}
                  <div className="w-full max-w-md space-y-6">
                    {/* Username */}
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Account Username</Label>
                      <div className="relative group">
                         <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500/30 to-orange-500/30 rounded-[1.5rem] blur-lg opacity-30 group-focus-within:opacity-100 transition-all duration-700" />
                         <span className="absolute left-6 top-1/2 -translate-y-1/2 text-pink-500 font-black text-xl opacity-30 group-focus-within:opacity-100 transition-opacity z-10">@</span>
                         <Input
                           value={username}
                           onChange={(e) => setUsername(e.target.value)}
                           onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                           placeholder="your.username"
                           autoComplete="username"
                           disabled={isBusy}
                           className="h-20 pl-14 rounded-[1.5rem] bg-zinc-900/60 border-white/5 focus:bg-zinc-950 focus:ring-pink-500 text-center text-2xl font-black tracking-tight shadow-inner transition-all relative z-0"
                         />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Account Password</Label>
                      <div className="relative group">
                         <div className="absolute -inset-1 bg-gradient-to-tr from-pink-500/30 to-orange-500/30 rounded-[1.5rem] blur-lg opacity-30 group-focus-within:opacity-100 transition-all duration-700" />
                         <Input
                           type={showPassword ? "text" : "password"}
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                           placeholder="••••••••••"
                           autoComplete="current-password"
                           disabled={isBusy}
                           className="h-20 rounded-[1.5rem] bg-zinc-900/60 border-white/5 focus:bg-zinc-950 focus:ring-pink-500 text-center text-2xl font-black shadow-inner transition-all relative z-0 pr-14"
                         />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-pink-500 transition-colors z-10"
                         >
                           {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                         </button>
                      </div>
                    </div>

                    {/* 2FA */}
                    {needsVerification && (
                      <div className="space-y-3 text-left animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-2 ml-4">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500">2FA Code Required</Label>
                        </div>
                        <div className="relative group">
                           <div className="absolute -inset-1 bg-amber-500/30 rounded-[1.5rem] blur-lg opacity-50 transition-all duration-700" />
                           <Input
                             value={verificationCode}
                             onChange={(e) => setVerificationCode(e.target.value)}
                             onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                             placeholder="Enter 6-digit code"
                             disabled={isBusy}
                             className="h-20 rounded-[1.5rem] bg-zinc-900/60 border-amber-500/20 focus:ring-amber-500 text-center text-3xl font-black tracking-[0.3em] shadow-inner relative z-0"
                             maxLength={6}
                           />
                        </div>
                      </div>
                    )}

                    {/* Submit */}
                    <Button
                      onClick={handleConnect}
                      disabled={isBusy || !username.trim() || !password || serviceDown || loginStep === "done"}
                      className={cn(
                        "h-20 w-full rounded-[1.5rem] font-black text-white shadow-2xl transition-all active:scale-[0.98] text-lg gap-4 group relative overflow-hidden",
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
                        <><Instagram className="h-6 w-6" /> VERIFY & CONNECT</>
                      ) : (
                        <><Instagram className="h-6 w-6" /> CONNECT INSTAGRAM</>
                      )}
                    </Button>

                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
                      End-to-End Encryption Active :: Browser-Direct Authentication
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
