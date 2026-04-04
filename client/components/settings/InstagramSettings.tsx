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
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                <Instagram className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Instagram Connection</CardTitle>
                <CardDescription>
                  Status of your Instagram session for outreach automation.
                </CardDescription>
              </div>
            </div>
            {status?.isConnected ? (
              <Badge variant="outline" className="h-7 border-emerald-500/50 text-emerald-500 bg-emerald-500/5 gap-1.5 px-3">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="h-7 border-zinc-800 text-zinc-500 bg-zinc-900 gap-1.5 px-3">
                <XCircle className="h-3.5 w-3.5" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status?.isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Username</div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    @{status.username}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Last Connected</div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    {status.connectedAt ? new Date(status.connectedAt).toLocaleDateString() : "Never"}
                  </div>
                </div>
              </div>

              <Alert className="bg-yellow-500/5 border-yellow-500/20 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Account Safety Note</AlertTitle>
                <AlertDescription className="text-xs">
                  Using unofficial APIs carries a risk. Avoid heavy batch messaging and consider 
                  using a secondary account for automation.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 max-w-sm">
              {!show2FA ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Instagram Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        placeholder="username"
                        className="pl-9"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Instagram Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="2fa">Verification Code (2FA)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="2fa"
                      placeholder="6-digit code"
                      className="pl-9"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Check your Instagram app or authenticator for a code.
                  </p>
                </div>
              )}
              
              {loginMutation.isError && (
                <div className="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
                  Error: {(loginMutation.error as any).message || "Login failed"}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-10 gap-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Instagram className="h-4 w-4" />
                )}
                {show2FA ? "Verify Code" : "Connect Account"}
              </Button>
            </form>
          )}
        </CardContent>
        {status?.isConnected && (
          <CardFooter className="border-t bg-muted/20 pt-4">
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:bg-destructive/10 border-destructive/20 h-10 gap-2"
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              Disconnect Instagram Account
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
