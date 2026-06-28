import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Loader2, Eye, EyeOff, Mail, RefreshCw, ArrowRight,
  AlertCircle, Lock, User, Moon, Sun, X
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Brand Logo Components (official brand colors) ────────────────────────────
function WhatsAppBrand({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-11 h-11";
  const iconSize = size === "sm" ? 18 : 24;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`${dim} rounded-xl bg-[#25D366] flex items-center justify-center shadow-[0_4px_14px_rgba(37,211,102,0.35)] transition-transform hover:scale-105`}>
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.139.558 4.144 1.534 5.877L.054 23.298a.75.75 0 0 0 .906.91l5.444-1.475A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      </div>
      <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">WhatsApp</span>
    </div>
  );
}

function GmailBrand({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-11 h-11";
  const iconW = size === "sm" ? 20 : 26;
  const iconH = size === "sm" ? 15 : 20;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`${dim} rounded-xl bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(234,67,53,0.25)] transition-transform hover:scale-105`}>
        <svg width={iconW} height={iconH} viewBox="0 0 24 18" fill="none">
          <path d="M1.5 0h21A1.5 1.5 0 0 1 24 1.5v15A1.5 1.5 0 0 1 22.5 18H1.5A1.5 1.5 0 0 1 0 16.5V1.5A1.5 1.5 0 0 1 1.5 0z" fill="white" />
          <path d="M0 1.5L12 10.5 24 1.5" stroke="#EA4335" strokeWidth="1.5" fill="none" />
          <path d="M0 1.5v15h24V1.5" stroke="#EA4335" strokeWidth="1.5" fill="none" />
          <path d="M0 1.5L12 10.5" stroke="#EA4335" strokeWidth="1.5" />
          <path d="M24 1.5L12 10.5" stroke="#FBBC05" strokeWidth="1.5" />
        </svg>
      </div>
      <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">Gmail</span>
    </div>
  );
}

function InstagramBrand({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-11 h-11";
  const iconSize = size === "sm" ? 18 : 24;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${dim} rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(188,24,136,0.3)] transition-transform hover:scale-105`}
        style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="white" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
          <circle cx="18" cy="6" r="1.3" fill="white" />
        </svg>
      </div>
      <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">Instagram</span>
    </div>
  );
}

// ── Floating orb background ─────────────────────────────────────────────────
function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden dark:bg-[#0d0b08] bg-amber-50/30">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(245,197,24,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * 60}px, ${mousePos.y * 60}px)` }}>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[140px] animate-float-1" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * -80}px, ${mousePos.y * -80}px)` }}>
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[160px] animate-float-2" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * 120}px, ${mousePos.y * 120}px)` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-600/8 blur-[120px] animate-float-3" />
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('casthub-theme', next ? 'dark' : 'light');
  };
  return (
    <button onClick={toggleTheme} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-border/50 flex items-center justify-center text-foreground/60 hover:text-foreground hover:dark:bg-white/10 bg-black/10 transition-all backdrop-blur-md">
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
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
        <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">
          {label}
        </label>
      )}
      <div className={cn(
        "relative flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl",
        focused ? "border-primary/60 bg-primary/8 shadow-[0_0_0_3px_rgba(245,197,24,0.12)]" : "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
        error && "border-rose-500/50 bg-rose-500/10"
      )}>
        {Icon && (
          <div className="pl-4 pr-2 shrink-0">
            <Icon className={cn("w-4 h-4 transition-colors", focused ? "text-primary" : "text-foreground/25")} />
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
            "flex-1 h-13 py-3.5 bg-transparent text-foreground placeholder:text-foreground/20 text-[15px] font-medium outline-none",
            Icon ? "pl-1" : "pl-4",
            rightEl ? "pr-2" : "pr-4"
          )}
        />
        {rightEl && <div className="pr-3 shrink-0">{rightEl}</div>}
      </div>
      {hint && !error && <p className="text-[10px] text-foreground/25 font-medium pl-1">{hint}</p>}
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
  const [mounted, setMounted] = useState(false);
  const [showActorPopup, setShowActorPopup] = useState(false);

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

  return (
    <div className="min-h-screen flex">
      <ThemeToggle />
      <AnimatedBackground />

      {/* ── Left Brand Panel ─── */}
      <div className={cn(
        "hidden lg:flex lg:w-[50%] sticky top-0 h-screen overflow-y-auto scrollbar-none flex-col justify-between p-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3.5">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-11 h-11 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-foreground">CAST<span className="text-primary">HUB</span></span>
            <span className="text-[8px] font-semibold text-muted-foreground/50 tracking-wide leading-tight">Casting Automation Platform</span>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-8">
          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-[-0.03em] text-foreground leading-[1.08]">
              Reach decision-makers,<br />
              <span className="italic">and more,</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-amber-600">
                at scale.
              </span>
            </h1>
            <p className="text-foreground/60 font-semibold text-base">
              Automate Your Outreach. Grow Your Opportunities.
            </p>
          </div>

          {/* Description */}
          <p className="text-foreground/45 font-medium leading-relaxed text-[14px] max-w-[380px]">
            Create campaigns, upload contacts, personalise messages, and automate outreach across WhatsApp, Gmail, and Instagram — all from one dashboard.
          </p>

          {/* Brand logos row — WhatsApp, Gmail, Instagram (in that order always) */}
          <div className="flex items-center gap-6">
            <WhatsAppBrand />
            <GmailBrand />
            <InstagramBrand />
          </div>

          {/* Audience */}
          <p className="text-foreground/45 font-medium leading-relaxed text-[13.5px] max-w-[380px]">
            Built for{" "}
            <button
              onClick={() => setShowActorPopup(true)}
              className="text-primary font-bold hover:text-primary/80 transition-colors underline underline-offset-2 decoration-primary/40"
            >
              actors
            </button>
            , freelancers, recruiters, sales teams, creators, and professionals who need to reach more people in less time.
          </p>

          {/* Emoji row */}
          <div className="flex items-center gap-3 text-2xl">
            {["🎬", "🎥", "📋", "⚡", "🎭"].map((emoji, i) => (
              <span
                key={i}
                className="cursor-default select-none transition-transform hover:scale-125 duration-200"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {emoji}
              </span>
            ))}
          </div>

          {/* Learn How CastHub Works */}
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/50 font-bold text-sm transition-all duration-200 group"
          >
            Learn How CastHub Works
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-foreground/20 font-medium">
          © {new Date().getFullYear()} CastHub ·{" "}
          <a href="https://docs.google.com/document/d/1Hv3uKqVd4DzS0RKDxIDDlzFuyHO4h_KcbgqLFhb5G6s/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/40 transition-colors">Terms</a>
          {" "}·{" "}
          <a href="https://docs.google.com/document/d/1NG8TGUZPZBS8HR6GI_e_cDH1glw8b9bgyu9fz575VJY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/40 transition-colors">Privacy</a>
          {" "}·{" "}
          <a href="mailto:support@casthub.in" className="hover:text-foreground/40 transition-colors">support@casthub.in</a>
        </p>
      </div>

      {/* ── Right Form Panel ─── */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center p-6 lg:p-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_0_10px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <span className="text-xl font-black tracking-tight text-foreground">CAST<span className="text-primary">HUB</span></span>
        </div>

        <div className="w-full max-w-[440px] space-y-8">
          {/* Header — clean, no "Welcome back" */}
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight text-foreground">Sign In</h2>
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
            <GlassInput
              id="password" name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={formData.password} onChange={handleChange}
              label="Password" icon={Lock}
              rightEl={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-foreground/25 hover:text-foreground/60 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* CTA */}
            <button type="submit" disabled={isLoading}
              className="w-full h-14 mt-2 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-primary/25 active:scale-[0.98]">
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
            <span className="text-[11px] font-black text-foreground/20 uppercase tracking-widest">New here?</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Sign up CTA — removed "Free" */}
          <Link to="/signup"
            className="w-full h-13 rounded-2xl border border-white/[0.08] hover:border-primary/40 hover:bg-primary/5 text-foreground/60 hover:text-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group">
            Create Account
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </Link>

          {/* Legal + Support */}
          <p className="text-center text-[10px] text-foreground/20 font-medium">
            By continuing, you agree to our{" "}
            <a href="https://docs.google.com/document/d/1Hv3uKqVd4DzS0RKDxIDDlzFuyHO4h_KcbgqLFhb5G6s/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors font-bold">Terms of Service</a>
            {" "}and{" "}
            <a href="https://docs.google.com/document/d/1NG8TGUZPZBS8HR6GI_e_cDH1glw8b9bgyu9fz575VJY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary transition-colors font-bold">Privacy Policy</a>
          </p>
          <p className="text-center text-[10px] text-foreground/20 font-medium">
            Need help?{" "}
            <a href="mailto:support@casthub.in" className="text-primary/60 hover:text-primary transition-colors font-bold">support@casthub.in</a>
          </p>
        </div>
      </div>

      {/* ── Actor Popup Dialog ── */}
      <Dialog open={showActorPopup} onOpenChange={setShowActorPopup}>
        <DialogContent className="dark:bg-[#0e0c0a] bg-background border dark:border-white/10 border-border/50 rounded-3xl shadow-2xl max-w-[420px]">
          <button
            onClick={() => setShowActorPopup(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <DialogHeader className="pt-2">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🎬</span>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                Built by an Actor, for Actors.
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 pb-2">
            <p className="text-foreground/60 font-medium leading-relaxed text-sm">
              Get instant access to{" "}
              <span className="text-primary font-black">1,000+ verified casting contacts</span>{" "}
              with the Premium Plan and start sharing your profile with casting directors, production houses, and talent professionals.
            </p>
            <div className="p-3.5 rounded-xl bg-primary/8 border border-primary/20">
              <p className="text-[11px] font-bold text-primary/80 uppercase tracking-wider">
                📅 Contact database last updated: June 2026
              </p>
            </div>
            <Link
              to="/signup"
              onClick={() => setShowActorPopup(false)}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
