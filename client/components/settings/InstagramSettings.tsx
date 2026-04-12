import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Instagram, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Lock,
  User,
  LogOut,
  RefreshCw
} from "lucide-react";
import { getOrCreateUserId } from "@/lib/utils";
import { InstagramStatusResponse, InstagramLoginResponse } from "@shared/api";

export default function InstagramSettings() {
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);

  // ── Status Polling ────────────────────────────────────────────────────────
  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["instagram-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/status?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json() as Promise<InstagramStatusResponse>;
    },
    refetchInterval: 60000,
  });

  // ── Login Mutation ────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/instagram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username,
          password: show2FA ? undefined : password,
          verificationCode: show2FA ? verificationCode : undefined,
        }),
      });
      
      const data = await res.json() as InstagramLoginResponse;
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: (data) => {
      if (data.twoFactorRequired) {
        setShow2FA(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
        setUsername("");
        setPassword("");
        setVerificationCode("");
        setShow2FA(false);
      }
    },
  });

  // ── Disconnect Mutation ────────────────────────────────────────────────────
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/instagram/disconnect?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-status", userId] });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Connection Status Card */}
      <Card className="glass-card border-white/10 dark:border-white/5 overflow-hidden shadow-2xl rounded-[2rem]">
        <CardHeader className="p-10 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-orange-500/20 flex items-center justify-center border border-pink-500/20 shadow-lg shadow-pink-500/10">
                <Instagram className="h-8 w-8 text-pink-500" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-black tracking-tighter">Instagram <span className="text-pink-500 italic">Access</span></CardTitle>
                <CardDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                  Secure protocol management for Instagram automation.
                </CardDescription>
              </div>
            </div>
            {status?.isConnected ? (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/5 animate-in zoom-in duration-500">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                <span className="text-xs font-black uppercase tracking-widest">PROTOCOL ACTIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-muted/30 border border-border/50 text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <span className="text-xs font-black uppercase tracking-widest">OFFLINE</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-10 py-6">
          {status?.isConnected ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2rem] bg-muted/20 border border-border/40 group hover:bg-muted/30 transition-all duration-300">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Linked Identifier</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                      <User className="h-6 w-6 text-pink-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tight">@{status.username}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verified Session</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 rounded-[2rem] bg-muted/20 border border-border/40 group hover:bg-muted/30 transition-all duration-300">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Stream Integrity</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <RefreshCw className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tight">{status.connectedAt ? "HEALTHY" : "SYNCING"}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Up: {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "Initializing..."}
                        </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-yellow-500/5 border border-yellow-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                    <AlertTriangle className="w-24 h-24 text-yellow-500" />
                </div>
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black tracking-tight text-yellow-700 dark:text-yellow-500 uppercase tracking-widest">Security Protocol Alpha</p>
                    <p className="text-xs font-medium text-yellow-600/80 leading-relaxed max-w-2xl">
                      Automated scraping nodes mimic human latency. Excessive parallel requests may trigger IG-CHECKPOINTS. 
                      Maintain a target rate of &lt;100 extractions per 6-hour cycle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-xl">
                 <form onSubmit={handleLogin} className="space-y-8 group">
                  {!show2FA ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User Agent Identifier</Label>
                        <div className="relative group/field">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/field:text-pink-500 transition-colors" />
                          <Input
                            id="username"
                            placeholder="Type username..."
                            className="h-14 pl-12 rounded-2xl bg-muted/30 border-border/50 focus:ring-pink-500 font-bold shadow-inner transition-all focus:bg-background"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Key (Password)</Label>
                        <div className="relative group/field">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/field:text-pink-500 transition-colors" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-14 pl-12 rounded-2xl bg-muted/30 border-border/50 focus:ring-pink-500 font-bold shadow-inner transition-all focus:bg-background"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-right duration-500">
                      <div className="space-y-3">
                        <Label htmlFor="2fa" className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Verification Protocol Required</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-500" />
                          <Input
                            id="2fa"
                            placeholder="Enter 6-digit sync code"
                            className="h-16 pl-12 rounded-2xl bg-pink-500/5 border-pink-500/20 focus:ring-pink-500 font-black text-lg tracking-[0.5em] shadow-inner text-center"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            required
                          />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                          Retrieve sync tokens from your mobile device.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {loginMutation.isError && (
                    <div className="text-[10px] font-black text-destructive uppercase tracking-widest bg-destructive/10 p-5 rounded-2xl border border-destructive/20 animate-in shake duration-500">
                      CRITICAL ERROR: {(loginMutation.error as any).message || "Access Denied"}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-16 rounded-2xl font-black bg-foreground text-background hover:bg-foreground/90 gap-3 shadow-2xl transition-all active:scale-[0.98]"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Instagram className="h-6 w-6" />
                    )}
                    {show2FA ? "COMMIT AUTHENTICATION" : "INITIALIZE HANDSHAKE"}
                  </Button>
                </form>
            </div>
          )}
        </CardContent>

        {status?.isConnected && (
          <CardFooter className="px-10 py-8 bg-muted/10 border-t border-border/30">
            <Button 
              variant="ghost" 
              className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-3" />
              )}
              Terminate Active Session
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
