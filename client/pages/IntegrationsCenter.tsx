import * as React from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Loader2,
  HardDrive,
  Mail,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Instagram,
  MessageSquare,
  ShieldCheck,
  Globe,
  BarChart3,
  BookOpen,
  X,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { getOrCreateUserId, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import InstagramSettings from "@/components/settings/InstagramSettings";
import { Link } from "react-router-dom";

// ── Mini Google SVG Logo ──────────────────────────────────────────────────────
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function IntegrationsCenter() {
  const { toast } = useToast();

  // Google Pre-connection State
  const [googleAccepted, setGoogleAccepted] = React.useState(false);
  const [googleGuideOpen, setGoogleGuideOpen] = React.useState(false);
  const [pageGuideOpen, setPageGuideOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();

  React.useEffect(() => {
    const handleOpenPageGuide = () => setPageGuideOpen(true);
    window.addEventListener('open-page-guide', handleOpenPageGuide);
    return () => window.removeEventListener('open-page-guide', handleOpenPageGuide);
  }, []);

  // Read defaultTab from URL params
  const defaultTab = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("defaultTab") || "google";
  }, [window.location.search]);

  // ── Google Status ────────────────────────────────────────────────────────────
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

  const { data: scopeCheck } = useQuery({
    queryKey: ["google-scopes", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/check-scopes?userId=${userId}`);
      return res.json() as Promise<{ hasSendScope: boolean; needsReauth: boolean }>;
    },
    enabled: !!googleStatus?.connected && !googleStatus?.needsReauth,
    staleTime: 5 * 60 * 1000,
  });

  const handleConnectGoogle = () => {
    window.location.href = `/api/auth/google?userId=${userId}`;
  };

  const handleDisconnectGoogle = async () => {
    await fetch(`/api/auth/google?userId=${userId}`, { method: "DELETE" });
    await refetchGoogle();
    toast({ title: "Disconnected", description: "Google account disconnected." });
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      const serverUserId = params.get("userId");
      if (serverUserId) localStorage.setItem("casthub_user_id", serverUserId);
      refetchGoogle();
      toast({ title: "Google Connected!", description: "Your account has been linked successfully." });
      window.history.replaceState({}, "", "/integrations");
    }
  }, [refetchGoogle, toast]);

  // ── Google unlock cards ───────────────────────────────────────────────────
  const googleUnlockCards = [
    { icon: Mail, color: "text-primary", bg: "bg-primary/10 border-primary/20", title: "Email Campaigns", sub: "Automated Email Outreach" },
    { icon: HardDrive, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", title: "Google Drive", sub: "Document and Asset Management" },
    { icon: Users, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", title: "Personalised Outreach", sub: "Your Email, Your Channel" },
    { icon: LayoutDashboard, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", title: "Template Sending", sub: "No More Repetition, All Mails With A Click Of One Button" },
    { icon: BarChart3, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", title: "Analytics Tracking", sub: "So You Can Decide What To Do Next" },
  ];

  // ── Google Guide Steps ────────────────────────────────────────────────────
  const googleSetupSteps = [
    {
      icon: Globe,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      num: "01",
      title: "Click Connect Google",
      desc: "We'll redirect you to Google.",
    },
    {
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      num: "02",
      title: "Grant Permissions",
      desc: "Check all permission boxes.",
    },
    {
      icon: CheckCircle2,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      num: "03",
      title: "Return To CastHub",
      desc: "Your Google account will be connected automatically.",
    },
  ];

  const googleConnected = !!googleStatus?.connected && !googleStatus?.needsReauth;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-2 md:p-6 lg:p-10 space-y-10 pb-24 relative">
        {/* ── Page Header ── */}
        <div id="tutorial-settings-welcome" className="flex flex-col gap-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
            Connect Your Outreach Channels
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl">
            Connect WhatsApp, Gmail and Instagram to start sending campaigns.
          </p>
        </div>


        {/* ── TABS FOR CHANNELS ── */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full max-w-md mx-auto flex p-1 h-12 bg-muted/50 rounded-2xl mb-8">
            <TabsTrigger value="google" className="flex-1 rounded-xl font-black text-xs gap-2">
              <Globe className="w-4 h-4" /> GOOGLE
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex-1 rounded-xl font-black text-xs gap-2">
              <MessageSquare className="w-4 h-4" /> WHATSAPP
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex-1 rounded-xl font-black text-xs gap-2">
              <Instagram className="w-4 h-4" /> INSTAGRAM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="m-0 focus-visible:outline-none">
            {/* ── GOOGLE SECTION ── */}
            <div id="section-google" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-background/60">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

            <div className="flex flex-col lg:flex-row min-h-[600px]">
              {/* Left Section */}
              <div className="p-8 md:p-12 lg:w-[45%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative">
                <div className="mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 hover:scale-110 transition-transform duration-500">
                    <GoogleLogo className="h-9 w-9" />
                  </div>
                </div>

                <div className="flex-1 space-y-8">
                  <div className="flex flex-col gap-3">
                  </div>

                  {/* Unlock cards */}
                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase leading-none">
                      {googleConnected ? "What You Unlocked" : "What You Will Unlock"}
                    </h2>
                    <div className="space-y-2">
                      {googleUnlockCards.map((card, i) => (
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

              {/* Right Section */}
              <div className="p-8 md:p-12 lg:p-16 flex-1 flex flex-col justify-center relative bg-muted/20 backdrop-blur-sm">
                {googleLoading ? (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground py-10 opacity-50">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Loading...</span>
                  </div>
                ) : googleStatus?.connected ? (
                  /* ── Connected ── */
                  <div className="space-y-6 animate-in zoom-in-95 duration-700 max-w-xl mx-auto w-full">
                    {scopeCheck?.needsReauth && (
                      <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-black text-amber-500 uppercase tracking-widest">Permissions Required</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">Gmail send permissions are missing. Please re-authenticate.</p>
                        </div>
                      </div>
                    )}

                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />

                      <div className="relative p-8 md:p-10 rounded-[3rem] bg-muted/80 border border-border/50 overflow-hidden space-y-8">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />

                        {/* Green tick + Connected */}
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                            <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-xl md:text-2xl font-black text-foreground tracking-tighter uppercase leading-none">Google Connected</h4>
                          </div>
                        </div>

                        {/* Account info */}
                        <div className="space-y-3 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative z-10">
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">Connected Account</p>
                          <div className="text-center w-full min-w-0">
                            <h3 className="text-xl md:text-2xl font-black tracking-tighter text-foreground truncate max-w-full px-2">{googleStatus.userName}</h3>
                            <p className="text-[12px] font-black text-primary/60 uppercase tracking-widest mt-1 truncate max-w-full px-2">{googleStatus.userEmail}</p>
                          </div>
                          <div className="h-px w-12 bg-primary/20 mx-auto" />
                          <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] text-center">OAUTH 2.0 VERIFIED</p>
                        </div>

                        {/* Re-auth if needed */}
                        {googleStatus.needsReauth && (
                          <div className="relative z-10">
                            <Button onClick={handleConnectGoogle} className="h-12 w-full px-6 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                              <RefreshCw className="h-4 w-4" /> RE-AUTHENTICATE
                            </Button>
                          </div>
                        )}

                        {/* Disconnect at bottom */}
                        <div className="relative z-10">
                          <Button
                            variant="ghost"
                            onClick={handleDisconnectGoogle}
                            className="h-12 w-full rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-rose-500/50 font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            <LogOut className="h-4 w-4 mr-2" /> DISCONNECT
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Not Connected ── */
                  <div id="tutorial-settings-google" className="flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-700 max-w-md mx-auto w-full">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                      <div className="relative h-24 w-24 bg-muted/40 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl">
                        <Globe className="h-12 w-12 text-foreground/80" />
                      </div>
                    </div>

                    <div className="text-center space-y-3">
                      <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">Connect Google</h3>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed px-4">
                        Send personalised outreach campaigns through your Gmail account.
                      </p>
                    </div>

                    {/* Guide button (no blinker) */}
                    <div className="flex items-center justify-end gap-4 flex-wrap w-full">
                      <button
                        onClick={() => setGoogleGuideOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:scale-105"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Setup Guide
                      </button>
                    </div>

                    {/* Before Connecting Warning */}
                    <div className="w-full space-y-4 text-left p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">⚠ Before Connecting Gmail</h4>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium leading-relaxed space-y-1.5 pl-8">
                        <p>Google will ask for permissions.</p>
                        <p>Please check <strong className="text-foreground">ALL</strong> permission boxes.</p>
                        <p>If permissions are skipped, email outreach will not work correctly.</p>
                      </div>
                      <div className="flex items-center gap-3 pl-8 pt-1">
                        <Checkbox
                          id="google-ack"
                          checked={googleAccepted}
                          onCheckedChange={(c) => setGoogleAccepted(!!c)}
                        />
                        <Label htmlFor="google-ack" className="text-xs text-muted-foreground font-medium cursor-pointer">
                          I understand
                        </Label>
                      </div>
                    </div>

                    <Button
                      onClick={handleConnectGoogle}
                      disabled={!googleAccepted}
                      className="h-16 w-full bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] text-sm font-black tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CONNECT GOOGLE
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── GOOGLE SETUP GUIDE DIALOG ── */}
          <Dialog open={googleGuideOpen} onOpenChange={setGoogleGuideOpen}>
            <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-card border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-black text-foreground uppercase tracking-widest">Connect Google</DialogTitle>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Follow the steps to connect your Gmail & Drive</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGoogleGuideOpen(false)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-3">
                {/* Steps */}
                {googleSetupSteps.map((step, i) => (
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
                      <p>Please use Gmail responsibly and follow Google's policies.</p>
                      <p>Excessive sending may result in restrictions imposed by Google.</p>
                      <p>Gmail may limit you to ~500 email/day.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-end gap-4">
                <Button
                  size="sm"
                  onClick={() => setGoogleGuideOpen(false)}
                  className="h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest"
                >
                  Connect Google
                </Button>
              </div>
            </DialogContent>
          </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="m-0 focus-visible:outline-none">
            {/* ── WHATSAPP SECTION ── */}
            <div id="section-whatsapp" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <WhatsAppSettings />
            </div>
          </TabsContent>

          <TabsContent value="instagram" className="m-0 focus-visible:outline-none">
            {/* ── INSTAGRAM SECTION ── */}
            <div id="section-instagram" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <InstagramSettings />
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Security / Info ── */}
        <section className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-3 text-center md:text-left">
              <h3 className="text-2xl font-black">Security</h3>
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

      {/* Page Guide Modal */}
      <Dialog open={pageGuideOpen} onOpenChange={setPageGuideOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-white/10 shadow-2xl rounded-[2rem] bg-card/95 backdrop-blur-3xl">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground tracking-tight">Integrations Center</DialogTitle>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 leading-relaxed">Connect and monitor your security-verified outreach networks. Set credentials, authentication, and API variables here.</p>
                </div>
              </div>
              <button
                onClick={() => setPageGuideOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="px-6 py-6 space-y-6">
            <div className="space-y-2">
              <h4 className="text-[13px] font-black uppercase text-foreground tracking-wide">1. Connect Your Channels</h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Connect Gmail, WhatsApp, or Instagram to enable outreach through CastHub.<br/>
                You'll only need to do this once.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[13px] font-black uppercase text-foreground tracking-wide">2. Connect Google</h4>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Follow the setup instructions and approve the requested permissions to connect Google.<br/>
                Once connected you will be able to access your Drive for attachments/documents/assets and send mails from your Gmail.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
