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
import { getOrCreateUserId, cn } from "@/lib/utils";
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

          <TabsContent value="google" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-black/60">
              {/* Decorative ambient lighting */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

              <div className="flex flex-col lg:flex-row min-h-[600px]">
                 {/* Left Section - Identity & Status */}
                 <div className="p-8 md:p-12 lg:w-[45%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative">
                    <div className="mb-12">
                       <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 group hover:scale-110 transition-transform duration-500">
                          <Mail className="h-8 w-8 text-primary" />
                       </div>
                    </div>

                    <div className="flex-1 space-y-10 relative">
                       <div className="flex flex-col gap-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Secure Gateway</span>
                          </div>
                          
                          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none whitespace-nowrap">
                            GOOGLE<br/>
                            <span className="text-primary drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">WORKSPACE</span>
                          </h2>

                          {googleStatus?.connected && !googleStatus?.needsReauth && (
                            <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit flex items-center gap-2">
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                               <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.1em]">ACCOUNT LINKED</span>
                            </div>
                          )}
                       </div>

                       <p className="text-muted-foreground/60 text-base font-medium leading-relaxed max-w-sm pt-4">
                          Connect your Google account to enable automated email outreach via Gmail and document management via Drive.
                       </p>

                       <div className="space-y-4 pt-8">
                          {[
                            { icon: Mail, title: "Gmail Integration", sub: "Automated email outreach" },
                            { icon: HardDrive, title: "Google Drive", sub: "Document & asset management" },
                            { icon: ShieldCheck, title: "OAuth 2.0 Secure", sub: "Enterprise-grade encryption" },
                          ].map(({ icon: Icon, title, sub }) => (
                            <div key={title} className="flex items-center gap-5 group p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground whitespace-nowrap">{title}</p>
                                <p className="text-[10px] text-muted-foreground font-bold mt-0.5 whitespace-nowrap">{sub}</p>
                              </div>
                            </div>
                          ))}
                            <div className="flex items-center gap-5 group p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
                               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                               </div>
                               <div className="flex flex-col">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground whitespace-nowrap">Action Required</p>
                                  <p className="text-xs text-muted-foreground font-bold mt-1 whitespace-nowrap">IMPORTANT: Check all permission boxes</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">Google hides these by default. You MUST check them to send emails.</p>
                               </div>
                            </div>
                       </div>
                    </div>
                 </div>

                 {/* Right Section - Interaction Area */}
                 <div className="p-8 md:p-12 lg:p-16 flex-1 flex flex-col justify-center relative bg-black/20 backdrop-blur-sm">
                    {googleLoading ? (
                      <div className="flex flex-col items-center gap-4 text-muted-foreground py-10 opacity-50">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Verifying Protocol...</span>
                      </div>
                    ) : googleStatus?.connected ? (
                      <div className="space-y-8 animate-in zoom-in-95 duration-700 max-w-2xl mx-auto w-full">
                        {/* Status Banners */}
                        {scopeCheck?.needsReauth && (
                          <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in slide-in-from-top duration-500">
                            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                            <div>
                              <p className="text-sm font-black text-amber-500 uppercase tracking-widest">Permissions Required</p>
                              <p className="text-xs text-muted-foreground font-medium mt-0.5">Gmail send permissions are missing. Please re-authenticate.</p>
                            </div>
                          </div>
                        )}

                        <div className="relative group">
                           <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />
                           
                           <div className="relative p-8 md:p-12 rounded-[3.5rem] bg-zinc-950/80 border border-white/10 overflow-hidden">
                              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />
                              
                              <div className="flex flex-col gap-10 relative z-10">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-16 h-16 rounded-2.5xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                             <CheckCircle2 className="h-4 w-4 text-white" />
                                          </div>
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] whitespace-nowrap">Protocol :: Secure</p>
                                          <h4 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter whitespace-nowrap uppercase leading-none">AUTHENTICATED</h4>
                                       </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {googleStatus.needsReauth && (
                                        <Button onClick={handleConnectGoogle} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                                          <RefreshCw className="h-4 w-4" /> RE-AUTH
                                        </Button>
                                      )}
                                      <Button
                                         variant="ghost"
                                         onClick={handleDisconnectGoogle}
                                         className="h-12 px-6 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-500 text-rose-500/60 font-black text-[10px] uppercase tracking-widest transition-all group"
                                      >
                                         <LogOut className="h-4 w-4 mr-2" /> DISCONNECT
                                      </Button>
                                    </div>
                                 </div>

                                 <div className="space-y-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] md:tracking-[0.4em] text-center whitespace-nowrap">Connected Workspace Account</p>
                                    <div className="text-center whitespace-nowrap">
                                       <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">{googleStatus.userName}</h3>
                                       <p className="text-[12px] font-black text-primary/60 uppercase tracking-widest mt-1">{googleStatus.userEmail}</p>
                                    </div>
                                    <div className="h-px w-12 bg-primary/20 mx-auto" />
                                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] text-center whitespace-nowrap">
                                       SESSION ACTIVE :: OAUTH 2.0 VERIFIED
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto w-full">
                           <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center justify-between group cursor-default">
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">DRIVE STATUS</p>
                                 <p className="text-xs font-black text-foreground">Cloud Storage Linked</p>
                              </div>
                              <HardDrive className="h-4 w-4 text-blue-500/20 group-hover:text-blue-500 transition-colors" />
                           </div>
                           <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center justify-between group cursor-default">
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest">GMAIL PROTOCOL</p>
                                 <p className="text-xs font-black text-foreground">{scopeCheck?.needsReauth ? "Needs Permission" : "Outreach Active"}</p>
                              </div>
                              <Mail className={cn("h-4 w-4 transition-colors", scopeCheck?.needsReauth ? "text-amber-500/20 group-hover:text-amber-500" : "text-indigo-500/20 group-hover:text-indigo-500")} />
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-12 text-center animate-in fade-in duration-700">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
                          <div className="relative h-24 w-24 bg-muted/40 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl group transition-all hover:rotate-12 cursor-pointer">
                            <Globe className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-4xl font-black tracking-tighter">LINK <span className="text-primary italic">GOOGLE</span></h3>
                          <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            Establish a secure OAuth 2.0 connection with Google to unlock CastHub's automation sequence.
                          </p>
                        </div>

                        <Button onClick={handleConnectGoogle} className="h-20 w-full max-w-md bg-foreground text-background hover:bg-foreground/90 rounded-[1.5rem] text-lg font-black tracking-widest shadow-2xl transition-all active:scale-[0.98] group relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           CONNECT GOOGLE WORKSPACE
                        </Button>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <WhatsAppSettings />
          </TabsContent>

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
