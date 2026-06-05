import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Mail, MessageCircle, Instagram, Zap, ArrowRight, ArrowLeft,
  CheckCircle2, Circle, SkipForward, ShieldCheck, ExternalLink,
  Wifi, WifiOff, Loader2, Trophy, Sparkles, Star
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StepStatus {
  google: "pending" | "connected" | "skipped";
  whatsapp: "pending" | "connected" | "skipped";
  instagram: "pending" | "connected" | "skipped";
}

// ── Progress Stepper ──────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xs mx-auto">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-700",
            i < current ? "bg-primary" : i === current ? "bg-primary/40" : "dark:bg-white/[0.02] bg-black/5"
          )}
        />
      ))}
    </div>
  );
}

// ── Integration Status Dot ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "pending" | "connected" | "skipped" }) {
  if (status === "connected") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
      <CheckCircle2 className="w-3 h-3" /> Connected
    </span>
  );
  if (status === "skipped") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full dark:bg-white/5 bg-black/5 border border-border text-foreground/40 text-[10px] font-black uppercase tracking-widest">
      <SkipForward className="w-3 h-3" /> Skipped
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full dark:bg-white/5 bg-black/5 border border-border text-foreground/40 text-[10px] font-black uppercase tracking-widest">
      <Circle className="w-3 h-3" /> Not Connected
    </span>
  );
}

// ── Feature Pill ──────────────────────────────────────────────────────────────
function FeaturePill({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold", color)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=welcome, 1=google, 2=whatsapp, 3=instagram, 4=done
  const [statuses, setStatuses] = useState<StepStatus>({
    google: "pending",
    whatsapp: "pending",
    instagram: "pending",
  });
  const [checkingGoogle, setCheckingGoogle] = useState(false);
  const [checkingWA, setCheckingWA] = useState(false);
  const [checkingIG, setCheckingIG] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const userId = (() => {
    try {
      const token = localStorage.getItem("casthub_auth_token");
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1])).userId;
    } catch { return null; }
  })();

  // Check integration statuses from API
  const checkGoogle = async () => {
    setCheckingGoogle(true);
    try {
      const res = await fetch("/api/google/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("casthub_auth_token")}` },
      });
      const data = await res.json();
      if (data.connected) setStatuses((p) => ({ ...p, google: "connected" }));
    } catch {}
    setCheckingGoogle(false);
  };

  const checkWhatsApp = async () => {
    setCheckingWA(true);
    try {
      const res = await fetch("/api/whatsapp/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("casthub_auth_token")}` },
      });
      const data = await res.json();
      if (data.status === "connected" || data.connected) setStatuses((p) => ({ ...p, whatsapp: "connected" }));
    } catch {}
    setCheckingWA(false);
  };

  const checkInstagram = async () => {
    setCheckingIG(true);
    try {
      const res = await fetch("/api/instagram/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("casthub_auth_token")}` },
      });
      const data = await res.json();
      if (data.connected || data.status === "connected") setStatuses((p) => ({ ...p, instagram: "connected" }));
    } catch {}
    setCheckingIG(false);
  };

  useEffect(() => {
    if (step === 1) checkGoogle();
    if (step === 2) checkWhatsApp();
    if (step === 3) checkInstagram();
    if (step === 4) {
      setConfetti(true);
      completeOnboarding();
    }
  }, [step]);

  const completeOnboarding = async () => {
    if (!userId) return;
    await fetch("/api/auth/complete-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("casthub_auth_token")}` },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
  };

  const markSkipped = (key: keyof StepStatus) => {
    if (statuses[key] === "pending") setStatuses((p) => ({ ...p, [key]: "skipped" }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleSkipStep = () => {
    if (step === 1) markSkipped("google");
    if (step === 2) markSkipped("whatsapp");
    if (step === 3) markSkipped("instagram");
    setStep(step + 1);
  };

  const handleSkipAll = () => {
    setStatuses({ google: "skipped", whatsapp: "skipped", instagram: "skipped" });
    setStep(4);
  };

  const goToDashboard = () => navigate("/dashboard", { replace: true });

  // ── Step 0 — Welcome Splash ──────────────────────────────────────────────
  const WelcomeSplash = () => (
    <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="space-y-6">
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-28 h-28 bg-gradient-to-br from-primary/20 to-indigo-500/10 border border-primary/30 rounded-[2rem] flex items-center justify-center">
            <Zap className="w-14 h-14 text-primary fill-current" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Email Verified Successfully</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground">Welcome to<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">CastHub</span></h1>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
            Let's set up your workspace in 3 quick steps so you can start automating your casting outreach right away.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {[
          { icon: Mail, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Gmail" },
          { icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "WhatsApp" },
          { icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", label: "Instagram" },
        ].map((item, i) => (
          <div key={i} className={cn("flex flex-col items-center gap-2 p-4 rounded-2xl border", item.bg)}>
            <item.icon className={cn("w-6 h-6", item.color)} />
            <span className="text-[10px] font-black text-foreground uppercase tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={handleNext}
          className="h-14 px-10 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
        >
          Let's Get Started <ArrowRight className="w-5 h-5" />
        </Button>
        <Button variant="ghost" onClick={handleSkipAll} className="h-14 px-8 rounded-2xl text-muted-foreground hover:text-foreground font-bold gap-2">
          <SkipForward className="w-4 h-4" /> Skip Setup
        </Button>
      </div>
    </div>
  );

  // ── Step 1 — Google Setup ────────────────────────────────────────────────
  const GoogleStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
          <Mail className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-foreground">Connect Google</h2>
        <StatusBadge status={statuses.google} />
        <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm leading-relaxed">
          Connect your Google account to send personalized Gmail outreach campaigns and store attachments on Google Drive.
        </p>
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2 justify-center">
        <FeaturePill icon={Mail} label="Gmail outreach" color="bg-blue-500/10 border-blue-500/20 text-blue-400" />
        <FeaturePill icon={Zap} label="Drive attachments" color="bg-indigo-500/10 border-indigo-500/20 text-indigo-400" />
        <FeaturePill icon={ShieldCheck} label="Secure OAuth" color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" />
      </div>

      {/* How to connect */}
      <div className="p-5 rounded-2xl dark:bg-white/3 bg-black/5 border border-border/50 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">How to connect</p>
        <ol className="space-y-2">
          {[
            "Click 'Connect Google' below",
            "Sign in with your Google account",
            "Grant CastHub access to Gmail & Drive",
            "Return here — we'll auto-detect your connection",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="pt-2 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-400/80 font-medium">
            <strong>Tip:</strong> On the consent screen, make sure to manually check all checkboxes including Gmail and Drive permissions.
          </p>
        </div>
      </div>

      {/* Limits */}
      <div className="p-4 rounded-xl dark:bg-white/3 bg-black/5 border border-border/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">Limitations</p>
        <p className="text-xs text-muted-foreground font-medium">Gmail allows ~500 emails/day for regular accounts. Excessive bounces or spam reports may temporarily restrict sending. Always use personalized templates.</p>
      </div>

      <div className="flex flex-col gap-3">
        {statuses.google !== "connected" && (
          <Button
            onClick={() => { window.open("/api/google/auth", "_blank"); setTimeout(checkGoogle, 5000); }}
            className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-500 text-foreground font-black gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4" /> Connect Google Account
          </Button>
        )}
        <Button
          onClick={checkGoogle}
          variant="outline"
          disabled={checkingGoogle}
          className="w-full h-11 rounded-xl border-border font-bold gap-2"
        >
          {checkingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {checkingGoogle ? "Checking..." : "Check Connection Status"}
        </Button>
      </div>
    </div>
  );

  // ── Step 2 — WhatsApp Setup ──────────────────────────────────────────────
  const WhatsAppStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-foreground">Connect WhatsApp</h2>
        <StatusBadge status={statuses.whatsapp} />
        <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm leading-relaxed">
          Link your WhatsApp by scanning a QR code. Use a dedicated business number for best results.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <FeaturePill icon={MessageCircle} label="Mass WA outreach" color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" />
        <FeaturePill icon={Zap} label="Template messages" color="bg-blue-500/10 border-blue-500/20 text-blue-400" />
        <FeaturePill icon={ShieldCheck} label="Session-based auth" color="bg-purple-500/10 border-purple-500/20 text-purple-400" />
      </div>

      <div className="p-5 rounded-2xl dark:bg-white/3 bg-black/5 border border-border/50 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">How to scan QR</p>
        <ol className="space-y-2">
          {[
            "Click 'Open WhatsApp QR' below (or go to Integrations Centre)",
            "On your phone, open WhatsApp → Settings",
            "Tap 'Linked Devices' → 'Link a Device'",
            "Point your phone camera at the QR code on screen",
            "Wait for confirmation — we'll detect the connection",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400/60 mb-1">⚠️ Important Limitations</p>
        <p className="text-xs text-rose-400/80 font-medium">WhatsApp automation carries a risk of account bans if abused. We strongly recommend a dedicated business number. If your session expires or you log out from your phone, you'll need to re-scan the QR code. Comply with WhatsApp's Terms of Service.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => { window.open("/integrations", "_blank"); setTimeout(checkWhatsApp, 10000); }}
          className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-foreground font-black gap-2 transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Open WhatsApp QR Scanner
        </Button>
        <Button
          onClick={checkWhatsApp}
          variant="outline"
          disabled={checkingWA}
          className="w-full h-11 rounded-xl border-border font-bold gap-2"
        >
          {checkingWA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {checkingWA ? "Checking..." : "Check Connection Status"}
        </Button>
      </div>
    </div>
  );

  // ── Step 3 — Instagram Setup ─────────────────────────────────────────────
  const InstagramStep = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center">
          <Instagram className="w-8 h-8 text-pink-400" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-foreground">Connect Instagram</h2>
        <StatusBadge status={statuses.instagram} />
        <p className="text-muted-foreground font-medium max-w-sm mx-auto text-sm leading-relaxed">
          Connect your Instagram account to send DMs and monitor casting-relevant profiles at scale.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <FeaturePill icon={Instagram} label="DM campaigns" color="bg-pink-500/10 border-pink-500/20 text-pink-400" />
        <FeaturePill icon={Zap} label="Profile monitoring" color="bg-rose-500/10 border-rose-500/20 text-rose-400" />
        <FeaturePill icon={ShieldCheck} label="Session auth" color="bg-purple-500/10 border-purple-500/20 text-purple-400" />
      </div>

      <div className="p-5 rounded-2xl dark:bg-white/3 bg-black/5 border border-border/50 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">How to connect</p>
        <ol className="space-y-2">
          {[
            "Go to Integrations Centre → Instagram section",
            "Enter your Instagram username and password",
            "Complete any 2FA verification if prompted",
            "CastHub will securely store your session",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-1">Privacy & Limitations</p>
        <p className="text-xs text-amber-400/80 font-medium">Your session is stored securely. Avoid excessive API calls in short timeframes to prevent action blocks. Instagram may require periodic re-authentication.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => { window.open("/integrations", "_blank"); setTimeout(checkInstagram, 10000); }}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-foreground font-black gap-2 transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Connect Instagram
        </Button>
        <Button
          onClick={checkInstagram}
          variant="outline"
          disabled={checkingIG}
          className="w-full h-11 rounded-xl border-border font-bold gap-2"
        >
          {checkingIG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {checkingIG ? "Checking..." : "Check Connection Status"}
        </Button>
      </div>
    </div>
  );

  // ── Step 4 — Welcome / Achievement ───────────────────────────────────────
  const CompletionScreen = () => {
    const connected = [statuses.google, statuses.whatsapp, statuses.instagram].filter(s => s === "connected").length;
    return (
      <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Trophy */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          {confetti && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: ["#7c3aed","#10b981","#3b82f6","#f59e0b","#ec4899"][i % 5],
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: `${600 + i * 100}ms`,
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
          )}
          <div className="relative w-32 h-32 bg-gradient-to-br from-amber-500/20 to-yellow-400/10 border border-amber-500/30 rounded-[2.5rem] flex items-center justify-center">
            <Trophy className="w-16 h-16 text-amber-400" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-amber-400 fill-current" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground">
            You're Ready!<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              Let's Cast! 🎬
            </span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
            {connected === 3
              ? "All 3 channels connected. Your casting automation dashboard is fully powered up."
              : connected > 0
              ? `${connected}/3 channel${connected > 1 ? "s" : ""} connected. You can always add more from the Integrations Centre.`
              : "Setup skipped. You can connect your channels anytime from the Integrations Centre."}
          </p>
        </div>

        {/* Connection summary */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {[
            { key: "google" as const, icon: Mail, label: "Gmail", color: "text-blue-400 border-blue-500/20 bg-blue-500/10" },
            { key: "whatsapp" as const, icon: MessageCircle, label: "WA", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
            { key: "instagram" as const, icon: Instagram, label: "Instagram", color: "text-pink-400 border-pink-500/20 bg-pink-500/10" },
          ].map(({ key, icon: Icon, label, color }) => (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                statuses[key] === "connected" ? color : "dark:bg-white/3 bg-black/5 border-border/50 opacity-40"
              )}
            >
              <Icon className={cn("w-5 h-5", statuses[key] === "connected" ? "" : "text-foreground/30")} />
              <span className="text-[10px] font-black uppercase tracking-wide text-foreground/70">{label}</span>
              {statuses[key] === "connected" && <CheckCircle2 className="w-3 h-3 text-current" />}
            </div>
          ))}
        </div>

        {/* Feature teaser */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
          {[
            { icon: Sparkles, label: "AI-powered templates", color: "text-purple-400" },
            { icon: Zap, label: "Smart automation flows", color: "text-amber-400" },
            { icon: ShieldCheck, label: "Analytics & tracking", color: "text-blue-400" },
            { icon: Star, label: "Bulk contact management", color: "text-emerald-400" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl dark:bg-white/3 bg-black/5 border border-border/50">
              <f.icon className={cn("w-4 h-4 shrink-0", f.color)} />
              <span className="text-xs font-bold text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={goToDashboard}
          className="h-16 px-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-foreground font-black text-base uppercase tracking-widest gap-3 shadow-2xl shadow-primary/30 transition-all active:scale-[0.98]"
        >
          <Zap className="w-5 h-5 fill-current" /> Enter CastHub Dashboard
        </Button>
      </div>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  const TOTAL_STEPS = 4;

  return (
    <div className="min-h-screen bg-[#060610] flex flex-col">
      {/* Top bar */}
      {step > 0 && step < 4 && (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#060610]/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-foreground fill-current" />
            </div>
            <span className="text-sm font-black tracking-tight text-foreground">CASTHUB</span>
          </div>
          <ProgressBar current={step} total={TOTAL_STEPS} />
          <button
            onClick={handleSkipAll}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            Skip All <SkipForward className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="w-full max-w-lg">
          {step === 0 && <WelcomeSplash />}
          {step === 1 && <GoogleStep />}
          {step === 2 && <WhatsAppStep />}
          {step === 3 && <InstagramStep />}
          {step === 4 && <CompletionScreen />}
        </div>
      </div>

      {/* Bottom nav */}
      {step > 0 && step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 px-6 py-5 bg-[#060610]/80 backdrop-blur-md border-t border-border/50">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="h-12 px-5 rounded-xl font-bold gap-2 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest">
              Step {step} of {TOTAL_STEPS - 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSkipStep}
                className="h-12 px-4 rounded-xl font-bold text-muted-foreground gap-1.5"
              >
                Skip <SkipForward className="w-3.5 h-3.5" />
              </Button>
              <Button
                onClick={handleNext}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-foreground font-black gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {statuses[step === 1 ? "google" : step === 2 ? "whatsapp" : "instagram"] === "connected"
                  ? "Next" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
