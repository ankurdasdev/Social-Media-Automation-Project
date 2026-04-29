import * as React from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  Mail,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  LogOut,
  Instagram,
  MessageSquare,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { getOrCreateUserId } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import InstagramSettings from "@/components/settings/InstagramSettings";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();

  // Read defaultTab from URL params (used by OAuth redirects back to /settings?defaultTab=instagram)
  const defaultTab = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("defaultTab") || "google";
  }, []);

  // ── Google Status ──────────────────────────────────────────────────────────
  const { data: googleStatus, isLoading: googleLoading, refetch: refetchGoogle } = useQuery({
    queryKey: ["google-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/status?userId=${userId}`);
      return res.json() as Promise<{
        connected: boolean;
        needsReauth: boolean;
        userEmail?: string;
        userName?: string;
        driveFolderId?: string;
        driveFolderName?: string;
      }>;
    },
  });

  // ── Check if token has gmail.send scope ──────────────────────────────────
  const { data: scopeCheck } = useQuery({
    queryKey: ["google-scopes", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/check-scopes?userId=${userId}`);
      return res.json() as Promise<{ hasSendScope: boolean; needsReauth: boolean }>;
    },
    enabled: !!googleStatus?.connected && !googleStatus?.needsReauth,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ── Drive folders (when connected) ────────────────────────────────────────
  const { data: foldersData } = useQuery({
    queryKey: ["drive-folders", userId],
    queryFn: async () => {
      const res = await fetch(`/api/drive/folders?userId=${userId}`);
      return res.json() as Promise<{ folders: { id: string; name: string }[] }>;
    },
    enabled: !!googleStatus?.connected && !googleStatus?.needsReauth,
  });

  const handleConnectGoogle = () => {
    window.location.href = `/api/auth/google?userId=${userId}`;
  };

  const handleDisconnectGoogle = async () => {
    await fetch(`/api/auth/google?userId=${userId}`, { method: "DELETE" });
    await refetchGoogle();
    toast({ title: "Disconnected", description: "Google account disconnected." });
  };

  const handleSetFolder = async (folderId: string) => {
    const folder = foldersData?.folders.find((f) => f.id === folderId);
    await fetch("/api/auth/google/folder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, folderId, folderName: folder?.name }),
    });
    await refetchGoogle();
    toast({ title: "Folder Set", description: `Drive folder "${folder?.name}" saved.` });
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      const serverUserId = params.get("userId");
      if (serverUserId) {
        localStorage.setItem("casthub_user_id", serverUserId);
      }
      refetchGoogle();
      toast({ title: "Google Connected!", description: "Your account has been linked successfully." });
      window.history.replaceState({}, "", "/settings");
    }
  }, [refetchGoogle, toast]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-2 md:p-6 lg:p-10 space-y-12 pb-24 relative">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <div className="inline-flex items-center self-center md:self-start gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3" />
            Security Verified
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground flex flex-col md:flex-row items-center gap-4">
            <span className="text-primary"><Globe className="h-10 w-10 md:h-12 md:w-12" /></span>
            Integrations Center
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Connect your networks to enable automated outreach.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-10">
          <TabsList className="bg-muted/50 border border-border/50 p-1.5 h-14 rounded-2xl w-full md:w-auto overflow-x-auto justify-start md:justify-center">
            <TabsTrigger value="google" className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-8 font-bold transition-all">
              <Mail className="h-4 w-4 text-primary" />
              Google
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-8 font-bold transition-all">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="instagram" className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-8 font-bold transition-all">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </TabsTrigger>
          </TabsList>

          {/* ── Google Tab ────────────────────────────────────────────────── */}
          <TabsContent value="google" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card className="glass-card border-white/10 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row">
                 <div className="p-8 md:p-12 md:w-1/3 border-b md:border-b-0 md:border-r border-border/50 bg-muted/20">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner shadow-primary/20">
                       <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-black mb-3">Google Workspace</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Connect your Google account to enable automated email outreach via Gmail and document management via Drive.
                    </CardDescription>
                 </div>
                 
                 <div className="p-8 md:p-12 flex-1 flex flex-col justify-center">
                   {googleLoading ? (
                     <div className="flex flex-col items-center gap-4 text-muted-foreground py-10">
                       <Loader2 className="h-10 w-10 animate-spin text-primary" />
                       <span className="text-xs font-bold uppercase tracking-widest">Verifying Connection...</span>
                     </div>
                   ) : googleStatus?.connected ? (
                     <div className="space-y-8">
                       <div className="p-6 rounded-2xl bg-background/50 border border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
                         <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-full border-2 border-emerald-500/30 p-1">
                               <div className="w-full h-full rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                               </div>
                            </div>
                           <div>
                             <p className="text-lg font-black">{googleStatus.userName}</p>
                             <p className="text-sm text-muted-foreground font-medium">{googleStatus.userEmail}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           {googleStatus.needsReauth && (
                             <Button onClick={handleConnectGoogle} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 font-bold shadow-lg shadow-primary/20">
                               <RefreshCw className="h-4 w-4" /> RE-AUTHENTICATE
                             </Button>
                           )}
                           <Button
                             variant="ghost"
                             onClick={handleDisconnectGoogle}
                             className="h-12 px-6 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 font-bold transition-all"
                           >
                             <LogOut className="h-4 w-4" /> DISCONNECT
                           </Button>
                         </div>
                       </div>

                       {!googleStatus.needsReauth && (
                           <div className="space-y-4">
                             {scopeCheck?.needsReauth && (
                               <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4 animate-in fade-in duration-300">
                                 <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                 <div className="flex-1 space-y-2">
                                   <p className="text-sm font-black text-amber-500 uppercase tracking-widest">Gmail Send Permission Missing</p>
                                   <p className="text-xs text-muted-foreground leading-relaxed">
                                     Your Google account was connected before Gmail sending was enabled. Re-authenticate to grant the permission — it only takes a second.
                                   </p>
                                   <Button
                                     onClick={handleConnectGoogle}
                                     className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg shadow-amber-500/20"
                                   >
                                     <RefreshCw className="h-3.5 w-3.5" />
                                     RE-AUTHENTICATE GOOGLE
                                   </Button>
                                 </div>
                               </div>
                             )}
                             <div className="flex flex-wrap gap-4 pt-2">
                               <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-500">
                                 <HardDrive className="h-5 w-5" />
                                 <span className="text-sm font-bold uppercase tracking-wider">Drive Connected</span>
                               </div>
                               <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
                                 scopeCheck?.needsReauth
                                   ? "bg-amber-500/5 border-amber-500/20 text-amber-500"
                                   : "bg-indigo-500/5 border-indigo-500/10 text-indigo-500"
                               }`}>
                                 <Mail className="h-5 w-5" />
                                 <span className="text-sm font-bold uppercase tracking-wider">
                                   {scopeCheck?.needsReauth ? "Gmail — Needs Re-auth" : "Gmail Connected"}
                                 </span>
                               </div>
                             </div>
                           </div>
                       )}
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-3xl bg-muted/10 space-y-6 text-center">
                       <div className="h-20 w-20 bg-muted rounded-[2rem] flex items-center justify-center border border-border group-hover:rotate-12 transition-transform">
                         <Globe className="h-10 w-10 text-muted-foreground" />
                       </div>
                       <div className="space-y-2">
                         <h3 className="text-xl font-bold">Connection Not Found</h3>
                         <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                           Establish a secure Oauth 2.0 connection with Google to unlock CastHub's automation sequence.
                         </p>
                       </div>
                       <Button onClick={handleConnectGoogle} className="h-14 px-10 bg-foreground text-background hover:bg-foreground/90 rounded-2xl text-base font-black shadow-2xl transition-all active:scale-95">
                         CONNECT GOOGLE WORKSPACE
                       </Button>
                     </div>
                   )}
                 </div>
              </div>
            </Card>
          </TabsContent>

          {/* ── WhatsApp Tab ──────────────────────────────────────────────── */}
          <TabsContent value="whatsapp" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <WhatsAppSettings />
          </TabsContent>

          {/* ── Instagram Tab ─────────────────────────────────────────────── */}
          <TabsContent value="instagram" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <InstagramSettings />
          </TabsContent>
        </Tabs>

        {/* ── Security / Info ───────────────────────────────────────────── */}
        <section className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                 <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <h3 className="text-2xl font-black">Security Settings</h3>
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  CastHub utilizes AES-256 encryption for all OAuth tokens. Your credentials never touch our databases in plain text and are physically isolated to your unique environment.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                   <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/30 text-primary bg-primary/5 font-bold text-[10px] uppercase">User ID: {userId}</Badge>
                   <Badge variant="outline" className="px-3 py-1 rounded-full border-border text-muted-foreground font-bold text-[10px] uppercase">Environment: Production</Badge>
                </div>
              </div>
           </div>
        </section>
      </div>
    </AppLayout>
  );
}
