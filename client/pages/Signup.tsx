import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AlertCircle, Loader2, Eye, EyeOff, CheckCircle2,
  Mail, MessageCircle, Instagram, Zap, ArrowRight, ShieldCheck, User, Phone, Lock, Calendar, Users, Moon, Sun, FileText, Shield
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { TermsContent } from "./TermsOfService";
import { PrivacyContent } from "./PrivacyPolicy";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/ui/LocationPicker";

// ── Reuse same animated background ──────────────────────────────────────────
function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position (-0.5 to 0.5)
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden dark:bg-[#03020a] bg-slate-50">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />  
      {/* Orbs with mouse tracking wrappers */}
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * 60}px, ${mousePos.y * 60}px)` }}>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[140px] animate-float-1" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * -80}px, ${mousePos.y * -80}px)` }}>
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[160px] animate-float-2" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * 120}px, ${mousePos.y * 120}px)` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px] animate-float-3" />
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

// ── Glass input ──────────────────────────────────────────────────────────────
function GlassInput({
  id, name, type = "text", placeholder, value, onChange, required, autoFocus,
  icon: Icon, rightEl, error, label, hint, disabled
}: {
  id: string; name: string; type?: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
  autoFocus?: boolean; icon?: any; rightEl?: React.ReactNode;
  error?: string; label?: string; hint?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">{label}</label>}
      <div className={cn(
        "relative flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl",
        focused ? "border-purple-500/60 bg-purple-500/10 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]" : "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
        error && "border-rose-500/50 bg-rose-500/10",
        disabled && "opacity-50"
      )}>
        {Icon && (
          <div className="pl-4 pr-2 shrink-0">
            <Icon className={cn("w-4 h-4 transition-colors", focused ? "text-purple-400" : "text-foreground/25")} />
          </div>
        )}
        <input
          id={id} name={name} type={type} placeholder={placeholder} value={value}
          onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          required={required} autoFocus={autoFocus} disabled={disabled}
          className={cn(
            "flex-1 h-13 py-3.5 bg-transparent text-foreground placeholder:text-foreground/20 text-[15px] font-medium outline-none",
            Icon ? "pl-1" : "pl-4", rightEl ? "pr-2" : "pr-4"
          )}
        />
        {rightEl && <div className="pr-3 shrink-0">{rightEl}</div>}
      </div>
      {hint && !error && <p className="text-[10px] text-foreground/25 font-medium pl-1">{hint}</p>}
      {error && <p className="text-[11px] text-rose-400 font-bold pl-1">{error}</p>}
    </div>
  );
}

// ── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const s = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const configs = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-rose-500" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-blue-400" },
    { label: "Strong", color: "bg-emerald-400" },
  ];
  const textColors = ["", "text-rose-400", "text-amber-400", "text-blue-400", "text-emerald-400"];
  if (!password) return null;
  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", s >= i ? configs[s].color : "dark:bg-white/5 bg-black/5")} />
        ))}
      </div>
      <p className={cn("text-[10px] font-black uppercase tracking-widest pl-0.5", textColors[s])}>{configs[s].label}</p>
    </div>
  );
}

const FEATURES = [
  { icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "WhatsApp Automation", desc: "Mass outreach in minutes" },
  { icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", label: "Template Builder", desc: "Craft winning messages" },
  { icon: ShieldCheck, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Anti-Ban Protection", desc: "Safe sending intervals" },
];

const COUNTRY_CODES = [
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "CA", dial: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "SG", dial: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "FR", dial: "+33", flag: "🇫🇷", name: "France" },
  { code: "DE", dial: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "IT", dial: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "ES", dial: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "MX", dial: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "JP", dial: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "CN", dial: "+86", flag: "🇨🇳", name: "China" },
  { code: "ID", dial: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "MY", dial: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "PH", dial: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "TH", dial: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "VN", dial: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "PK", dial: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "BD", dial: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "EG", dial: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "TR", dial: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "RU", dial: "+7", flag: "🇷🇺", name: "Russia" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", dialCode: "+91", gender: "", dob: "",
    password: "", confirmPassword: "", terms: false,
    instagram: "", location: { lat: 0, lng: 0, address: "" },
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? target.checked : value }));
    if (fieldErrors[name]) setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    if (formData.email.includes("+")) errs.email = "Email aliases with '+' are not allowed";
    if (!formData.gender) errs.gender = "Please select your gender";
    if (!formData.dob) errs.dob = "Date of birth is required";
    const p = formData.password;
    if (p.length < 8) errs.password = "Minimum 8 characters";
    else if (!/[A-Z]/.test(p)) errs.password = "Needs an uppercase letter";
    else if (!/[a-z]/.test(p)) errs.password = "Needs a lowercase letter";
    else if (!/[0-9]/.test(p)) errs.password = "Needs a number";
    else if (!/[^A-Za-z0-9]/.test(p)) errs.password = "Needs a special character";
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!formData.terms) errs.terms = "Please accept the terms to continue";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(), email: formData.email.trim(),
          phone: formData.phone.trim() ? `${formData.dialCode}${formData.phone.trim()}` : undefined,
          gender: formData.gender, dob: formData.dob, password: formData.password,
          instagram: formData.instagram.trim(), location: formData.location.lat !== 0 ? formData.location : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create account. Please try again."); return; }
      setSuccessEmail(formData.email.trim());
      setSuccess(true);
    } catch { setError("Network error — please check your connection and try again."); }
    finally { setIsLoading(false); }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <AnimatedBackground />
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center">
              <Mail className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Account Created</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Check Your Inbox! 📬</h1>
            <p className="text-foreground/50 font-medium leading-relaxed">We've sent a verification email to</p>
            <p className="text-purple-400 font-black text-lg">{successEmail}</p>
            <p className="text-foreground/40 font-medium text-sm leading-relaxed max-w-sm mx-auto">
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>
          </div>
          <div className="p-5 rounded-2xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.07] border-border/50 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/25 mb-2">Didn't receive it?</p>
            <p className="text-xs text-foreground/40">Check your spam folder, or{" "}
              <button onClick={async () => {
                await fetch("/api/auth/resend-verification", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: successEmail }),
                });
                alert("Verification email resent!");
              }} className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
                click here to resend
              </button>
            </p>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground/70 transition-colors font-bold">
            Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <ThemeToggle />
      <AnimatedBackground />

      {/* ── Left Brand Panel ─── */}
      <div className={cn(
        "hidden lg:flex lg:w-[44%] sticky top-0 h-screen overflow-y-auto scrollbar-none flex-col justify-between p-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap className="w-5.5 h-5.5 text-foreground fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">CAST<span className="text-purple-400 italic">HUB</span></span>
        </div>

        {/* Hero */}
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black text-purple-300 uppercase tracking-[0.25em]">Join the Platform</span>
            </div>
            <h1 className="text-5xl font-black tracking-[-0.03em] text-foreground leading-[1.08]">
              Automate your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400">
                casting outreach.
              </span>
            </h1>
            <p className="text-foreground/50 font-medium leading-relaxed text-[15px] max-w-[340px]">
              Connect with talent across WhatsApp, Gmail, and Instagram — all from one powerful casting dashboard.
            </p>
          </div>

          {/* Feature rows */}
          <div className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <div key={i} className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-500 cursor-default hover:scale-[1.01]",
                f.bg,
                mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              )} style={{ transitionDelay: `${400 + i * 80}ms` }}>
                <div className="w-9 h-9 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0">
                  <f.icon className={cn("w-4 h-4", f.color)} />
                </div>
                <div>
                  <p className="text-xs font-black text-foreground uppercase tracking-wide">{f.label}</p>
                  <p className="text-[11px] text-foreground/40 font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div className="flex items-center gap-3 p-4 rounded-2xl dark:bg-white/[0.03] bg-black/[0.03] border border-white/[0.06]">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
            <p className="text-xs text-foreground/40 font-medium leading-relaxed">
              Your data is protected with AES-256 encryption and stored securely in our EU-compliant infrastructure.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-foreground/20 font-medium">
          © {new Date().getFullYear()} CastHub ·{" "}
          <Link to="/terms" className="hover:text-foreground/40 transition-colors">Terms</Link>
          {" "}·{" "}
          <Link to="/privacy" className="hover:text-foreground/40 transition-colors">Privacy</Link>
        </p>
      </div>

      {/* ── Right Form Panel ─── */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center p-6 lg:py-14 lg:px-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-foreground fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">CAST<span className="text-purple-400 italic">HUB</span></span>
        </div>

        <div className="w-full max-w-[460px] space-y-7 my-auto">
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-4xl font-black tracking-tight text-foreground">Create account</h2>
            <p className="text-foreground/40 font-medium text-[15px]">Start your casting automation journey</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <GlassInput
              id="name" name="name" type="text" autoFocus
              placeholder="Jane Doe" label="Full Name"
              value={formData.name} onChange={handleChange}
              icon={User} error={fieldErrors.name}
            />

            {/* Email */}
            <GlassInput
              id="email" name="email" type="email"
              placeholder="you@example.com" label="Email Address"
              value={formData.email} onChange={handleChange}
              icon={Mail} error={fieldErrors.email}
            />

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">
                Phone Number <span className="text-foreground/20 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <div className="flex gap-2.5">
                <div className="h-13 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center shrink-0 w-[110px]">
                  <Select value={formData.dialCode} onValueChange={(val) => setFormData(p => ({ ...p, dialCode: val }))}>
                    <SelectTrigger className="h-full w-full border-0 focus:ring-0 px-3 bg-transparent hover:bg-white/[0.02] transition-colors rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{COUNTRY_CODES.find(c => c.dial === formData.dialCode)?.flag || "🌐"}</span>
                        <span className="text-xs font-black text-foreground/70">{formData.dialCode}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#0e0b1f] bg-background max-h-[300px]">
                      {COUNTRY_CODES.map(country => (
                        <SelectItem key={country.code} value={country.dial} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span className="text-xs font-medium">{country.name} ({country.dial})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <GlassInput
                    id="phone" name="phone" type="tel"
                    placeholder="9876543210"
                    value={formData.phone} onChange={handleChange}
                    icon={Phone}
                    hint="You can also use your phone number to sign in"
                  />
                </div>
              </div>
            </div>

            {/* Instagram Handle & Location */}
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                id="instagram" name="instagram" type="text"
                placeholder="@username" label="Instagram Handle"
                value={formData.instagram} onChange={handleChange}
                icon={Instagram} error={fieldErrors.instagram}
              />
              <LocationPicker 
                value={formData.location.lat !== 0 ? formData.location : undefined} 
                onChange={(loc) => setFormData(p => ({ ...p, location: { lat: loc.lat, lng: loc.lng, address: loc.address || "" } }))} 
                error={fieldErrors.location}
              />
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">Gender</label>
                <div className={cn(
                  "flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl",
                  "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
                  fieldErrors.gender && "border-rose-500/50"
                )}>
                  <Users className="w-4 h-4 text-foreground/25 ml-4 mr-2 shrink-0" />
                  <Select value={formData.gender} onValueChange={(val) => {
                    setFormData(p => ({ ...p, gender: val }));
                    if (fieldErrors.gender) setFieldErrors(p => { const n = { ...p }; delete n.gender; return n; });
                    if (error) setError("");
                  }}>
                    <SelectTrigger className={cn(
                      "flex-1 h-13 py-3.5 pr-4 pl-0 bg-transparent text-[15px] font-medium outline-none border-none shadow-none focus:ring-0 ring-0 focus:ring-offset-0",
                      !formData.gender ? "text-foreground/20" : "text-foreground"
                    )}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-[#0e0b1f] bg-background border dark:border-white/10 border-border/50 rounded-xl overflow-hidden shadow-2xl">
                      <SelectItem value="male" className="text-foreground focus:bg-foreground/10 cursor-pointer">Male</SelectItem>
                      <SelectItem value="female" className="text-foreground focus:bg-foreground/10 cursor-pointer">Female</SelectItem>
                      <SelectItem value="other" className="text-foreground focus:bg-foreground/10 cursor-pointer">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fieldErrors.gender && <p className="text-[11px] text-rose-400 font-bold pl-1">{fieldErrors.gender}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">Date of Birth</label>
                <div className={cn(
                  "flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl",
                  "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
                  fieldErrors.dob && "border-rose-500/50"
                )}>
                  <Calendar className="w-4 h-4 text-foreground/25 ml-4 mr-2 shrink-0" />
                  <input name="dob" type="date" value={formData.dob} onChange={handleChange}
                    className="flex-1 h-13 py-3.5 pr-4 bg-transparent text-foreground text-[15px] font-medium outline-none [color-scheme:dark]" />
                </div>
                {fieldErrors.dob && <p className="text-[11px] text-rose-400 font-bold pl-1">{fieldErrors.dob}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <GlassInput
                id="password" name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters" label="Password"
                value={formData.password} onChange={handleChange}
                icon={Lock} error={fieldErrors.password}
                rightEl={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="text-foreground/25 hover:text-foreground/60 transition-colors p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <PasswordStrength password={formData.password} />
            </div>

            {/* Confirm Password */}
            <GlassInput
              id="confirmPassword" name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat password" label="Confirm Password"
              value={formData.confirmPassword} onChange={handleChange}
              icon={Lock} error={fieldErrors.confirmPassword}
              rightEl={
                <div className="flex items-center gap-1">
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="text-foreground/25 hover:text-foreground/60 transition-colors p-1">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              }
            />

            {/* Terms */}
            <div className={cn(
              "flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer",
              formData.terms
                ? "bg-purple-500/8 border-purple-500/25"
                : "dark:bg-white/[0.03] bg-black/[0.03] dark:border-white/[0.07] border-border/50",
              fieldErrors.terms && "border-rose-500/40"
            )} onClick={() => setFormData(p => ({ ...p, terms: !p.terms }))}>
              <div className={cn(
                "w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                formData.terms ? "border-purple-500 bg-purple-500" : "border-white/20 bg-transparent"
              )}>
                {formData.terms && <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />}
              </div>
              <p className="text-xs text-foreground/40 font-medium leading-relaxed select-none">
                I agree to the{" "}
                <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-purple-400 hover:text-purple-300 font-bold" onClick={e => { e.stopPropagation(); setTermsScrolled(false); }}>Terms of Service</button>
                  </DialogTrigger>
                  <DialogContent hideCloseButton className="dark:bg-[#0e0b1f] bg-background border dark:border-white/10 border-border/50 rounded-3xl shadow-2xl max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 border-b dark:border-white/10 border-border/50 shrink-0">
                      <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <FileText className="w-4.5 h-4.5 text-primary" />
                        </div>
                        Terms of Service
                      </DialogTitle>
                    </DialogHeader>
                    <div 
                      className="flex-1 overflow-y-auto p-6"
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        if (Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50) {
                          setTermsScrolled(true);
                        }
                    }}
                    >
                      <TermsContent />
                    </div>
                    <div className="p-6 border-t dark:border-white/10 border-border/50 bg-muted/20 shrink-0 flex justify-end">
                      <Button 
                        type="button" 
                        disabled={!termsScrolled}
                        className="h-12 px-8 rounded-xl font-black tracking-widest uppercase transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(p => ({ ...p, terms: true }));
                          setIsTermsOpen(false);
                        }}
                      >
                        {termsScrolled ? "I Agree" : "Scroll to bottom to agree"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {" "}and{" "}
                <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-purple-400 hover:text-purple-300 font-bold" onClick={e => { e.stopPropagation(); setPrivacyScrolled(false); }}>Privacy Policy</button>
                  </DialogTrigger>
                  <DialogContent hideCloseButton className="dark:bg-[#0e0b1f] bg-background border dark:border-white/10 border-border/50 rounded-3xl shadow-2xl max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 border-b dark:border-white/10 border-border/50 shrink-0">
                      <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Shield className="w-4.5 h-4.5 text-blue-400" />
                        </div>
                        Privacy Policy
                      </DialogTitle>
                    </DialogHeader>
                    <div 
                      className="flex-1 overflow-y-auto p-6"
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        if (Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50) {
                          setPrivacyScrolled(true);
                        }
                      }}
                    >
                      <PrivacyContent />
                    </div>
                    <div className="p-6 border-t dark:border-white/10 border-border/50 bg-muted/20 shrink-0 flex justify-end">
                      <Button 
                        type="button" 
                        disabled={!privacyScrolled}
                        className="h-12 px-8 rounded-xl font-black tracking-widest uppercase transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(p => ({ ...p, terms: true }));
                          setIsPrivacyOpen(false);
                        }}
                      >
                        {privacyScrolled ? "I Agree" : "Scroll to bottom to agree"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>.
                I understand that CastHub automates outreach and I will use it responsibly.
              </p>
            </div>
            {fieldErrors.terms && <p className="text-[11px] text-rose-400 font-bold pl-1">{fieldErrors.terms}</p>}

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-purple-500/25 active:scale-[0.98]">
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                : <><ShieldCheck className="w-4 h-4" /> Create My Account <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          {/* Sign in */}
          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] font-black text-foreground/20 uppercase tracking-widest">Already a member?</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <Link to="/login"
            className="w-full h-13 rounded-2xl border border-white/[0.08] hover:border-purple-500/40 hover:bg-purple-500/5 text-foreground/60 hover:text-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group">
            Sign In Instead
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
