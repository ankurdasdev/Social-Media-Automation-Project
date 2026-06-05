import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Loader2, Eye, EyeOff, Mail, RefreshCw, ArrowRight,
  Zap, ShieldCheck, MessageCircle, Instagram, KeyRound, AlertCircle, Lock, User
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Floating orb background ─────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#03020a]">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
      {/* Orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[140px] animate-pulse" style={{ animationDuration: "5s" }} />
      <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[160px] animate-pulse" style={{ animationDuration: "7s", animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
    </div>
  );
}

// ── Stat pill ───────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
      <span className="text-xl font-black text-white">{value}</span>
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

// ── Glassmorphic input ───────────────────────────────────────────────────────
function GlassInput({
  id, name, type = "text", placeholder, value, onChange, required, autoFocus, icon: Icon, rightEl, error, label, hint,
}: {
  id: string; name: string; type?: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
  autoFocus?: boolean; icon?: any; rightEl?: React.ReactNode; error?: string; label?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40 block">
          {label}
        </label>
      )}
      <div className={cn(
        "relative flex items-center rounded-2xl border transition-all duration-300",
        focused ? "border-purple-500/60 bg-purple-500/5 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]" : "border-white/[0.08] bg-white/[0.04]",
        error && "border-rose-500/50 bg-rose-500/5"
      )}>
        {Icon && (
          <div className="pl-4 pr-2 shrink-0">
            <Icon className={cn("w-4 h-4 transition-colors", focused ? "text-purple-400" : "text-white/25")} />
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoFocus={autoFocus}
          className={cn(
            "flex-1 h-13 py-3.5 bg-transparent text-white placeholder:text-white/20 text-[15px] font-medium outline-none",
            Icon ? "pl-1" : "pl-4",
            rightEl ? "pr-2" : "pr-4"
          )}
        />
        {rightEl && <div className="pr-3 shrink-0">{rightEl}</div>}
      </div>
      {hint && !error && <p className="text-[10px] text-white/25 font-medium pl-1">{hint}</p>}
      {error && <p className="text-[11px] text-rose-400 font-bold pl-1">{error}</p>}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNeedsVerification(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) { setNeedsVerification(true); setVerificationEmail(data.email || formData.email); }
        setError(data.error || "Login failed. Please try again.");
        return;
      }
      setAuthToken(data.token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      setResendSent(true);
    } finally { setResendLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setIsForgotOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to request reset");
    } finally { setIsResetLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <AnimatedBackground />

      {/* ── Left Brand Panel ─── */}
      <div className={cn(
        "hidden lg:flex lg:w-[48%] sticky top-0 h-screen flex-col justify-between p-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap className="w-5.5 h-5.5 text-white fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">CAST<span className="text-purple-400 italic">HUB</span></span>
        </div>

        {/* Hero */}
        <div className="space-y-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black text-purple-300 uppercase tracking-[0.25em]">Casting Automation Platform</span>
            </div>
            <h1 className="text-5xl font-black tracking-[-0.03em] text-white leading-[1.08]">
              Reach talent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">
                at scale.
              </span>
            </h1>
            <p className="text-white/50 font-medium leading-relaxed text-[15px] max-w-[340px]">
              The all-in-one dashboard for casting directors to automate WhatsApp, Gmail & Instagram outreach.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <StatPill value="10K+" label="Contacts" />
            <StatPill value="3" label="Channels" />
            <StatPill value="99%" label="Delivery" />
          </div>

          {/* Feature rows */}
          <div className="space-y-3">
            {[
              { icon: MessageCircle, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15", label: "WhatsApp Bulk Outreach", desc: "Reach hundreds in minutes" },
              { icon: Mail, color: "text-blue-400 bg-blue-500/10 border-blue-500/15", label: "Gmail Campaigns", desc: "Personalised email at scale" },
              { icon: Instagram, color: "text-pink-400 bg-pink-500/10 border-pink-500/15", label: "Instagram DMs", desc: "Connect with talent on social" },
            ].map((f, i) => (
              <div key={i} className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-500",
                f.color,
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              )} style={{ transitionDelay: `${300 + i * 80}ms` }}>
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wide">{f.label}</p>
                  <p className="text-[11px] text-white/40 font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/20 font-medium">
          © {new Date().getFullYear()} CastHub — All rights reserved · <Link to="/terms" className="hover:text-white/40 transition-colors">Terms</Link> · <Link to="/privacy" className="hover:text-white/40 transition-colors">Privacy</Link>
        </p>
      </div>

      {/* ── Right Form Panel ─── */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center p-6 lg:p-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">CAST<span className="text-purple-400 italic">HUB</span></span>
        </div>

        <div className="w-full max-w-[440px] space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-white">Welcome back</h2>
            <p className="text-white/40 font-medium text-[15px]">Sign in to your dashboard</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-300 font-medium">{error}</p>
              </div>
              {needsVerification && (
                <div className="pl-6">
                  {resendSent ? (
                    <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> Verification email sent! Check your inbox.
                    </p>
                  ) : (
                    <button type="button" onClick={handleResendVerification} disabled={resendLoading}
                      className="text-xs text-purple-400 font-bold hover:text-purple-300 flex items-center gap-1.5 transition-colors">
                      {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Resend verification email
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              id="email" name="email" type="text" autoFocus
              placeholder="Email or phone number"
              value={formData.email} onChange={handleChange}
              label="Email or Phone" icon={User}
            />
            <div className="space-y-1">
              <GlassInput
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={formData.password} onChange={handleChange}
                label="Password" icon={Lock}
                rightEl={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="text-white/25 hover:text-white/60 transition-colors p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <div className="flex justify-end pt-1">
                <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
                      Forgot password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0e0b1f] border border-white/10 rounded-3xl shadow-2xl max-w-[400px]">
                    <form onSubmit={handleResetPassword}>
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <KeyRound className="w-4.5 h-4.5 text-purple-400" />
                          </div>
                          Reset Password
                        </DialogTitle>
                        <p className="text-sm text-white/40 font-medium pt-1">
                          Enter your email and we'll send you a reset link.
                        </p>
                      </DialogHeader>
                      <div className="py-4">
                        <GlassInput
                          id="reset-email" name="reset-email" type="email"
                          placeholder="you@example.com" label="Email Address"
                          value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                          icon={Mail}
                        />
                      </div>
                      <DialogFooter>
                        <button type="submit" disabled={isResetLoading}
                          className="w-full h-13 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]">
                          {isResetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                        </button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* CTA */}
            <button type="submit" disabled={isLoading}
              className="w-full h-14 mt-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-purple-500/25 active:scale-[0.98]">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">New here?</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Sign up CTA */}
          <Link to="/signup"
            className="w-full h-13 rounded-2xl border border-white/[0.08] hover:border-purple-500/40 hover:bg-purple-500/5 text-white/60 hover:text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group">
            Create Free Account
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </Link>

          {/* Legal */}
          <p className="text-center text-[10px] text-white/20 font-medium">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-purple-400/60 hover:text-purple-400 transition-colors font-bold">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-purple-400/60 hover:text-purple-400 transition-colors font-bold">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
