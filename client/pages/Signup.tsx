import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AlertCircle, Loader2, Eye, EyeOff, CheckCircle2,
  Mail, ArrowRight, ShieldCheck, User, Phone, Lock, Calendar, Users, Moon, Sun, FileText, Shield
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { TermsContent } from "./TermsOfService";
import { PrivacyContent } from "./PrivacyPolicy";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/ui/LocationPicker";

// ── Brand Logo Components (official brand colors) ────────────────────────────
function WhatsAppBrand() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shadow-[0_4px_14px_rgba(37,211,102,0.35)] transition-transform hover:scale-105">
        <svg width={24} height={24} viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.139.558 4.144 1.534 5.877L.054 23.298a.75.75 0 0 0 .906.91l5.444-1.475A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      </div>
      <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">WhatsApp</span>
    </div>
  );
}

function GmailBrand() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(234,67,53,0.25)] transition-transform hover:scale-105">
        <svg width={26} height={20} viewBox="0 0 24 18" fill="none">
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

function InstagramBrand() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(188,24,136,0.3)] transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)" }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="white" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" />
          <circle cx="18" cy="6" r="1.3" fill="white" />
        </svg>
      </div>
      <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">Instagram</span>
    </div>
  );
}

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
    <div className="fixed inset-0 -z-10 overflow-hidden dark:bg-[#0d0b08] bg-amber-50/30">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(245,197,24,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />  
      {/* Orbs with mouse tracking wrappers */}
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


const BENEFITS = [
  "Save hours of manual outreach",
  "Keep contacts organized",
  "Send personalized messages at scale",
  "Manage campaigns from one dashboard",
  "Avoid messy spreadsheets",
  "Track outreach performance",
  "Reach more people in less time",
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
  const [step, setStep] = useState<1 | 2>(1);
  
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", dialCode: "+91", gender: "", dob: "",
    password: "", confirmPassword: "", terms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? target.checked : value }));
    if (fieldErrors?.[name]) setFieldErrors(p => { const n = { ...p }; delete n![name]; return n; });
    if (error) setError("");
  };

  // Step 1 validation — Name, Email, Password
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    if (formData.email.includes("+")) errs.email = "Email aliases with '+' are not allowed";
    const p = formData.password;
    if (p.length < 8) errs.password = "Minimum 8 characters";
    else if (!/[A-Z]/.test(p)) errs.password = "Needs an uppercase letter";
    else if (!/[a-z]/.test(p)) errs.password = "Needs a lowercase letter";
    else if (!/[0-9]/.test(p)) errs.password = "Needs a number";
    else if (!/[^A-Za-z0-9]/.test(p)) errs.password = "Needs a special character";
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.gender) errs.gender = "Please select your gender";
    if (!formData.dob) errs.dob = "Date of birth is required";
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
            <p className="text-primary font-black text-lg">{successEmail}</p>
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
              }} className="text-primary font-bold hover:text-primary/80 transition-colors">
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
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-11 h-11 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-foreground">CAST<span className="text-primary">HUB</span></span>
            <span className="text-[8px] font-semibold text-muted-foreground/50 tracking-wide leading-tight">Automate Your Outreach. Grow Your Opportunities.</span>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-[-0.03em] text-foreground leading-[1.08]">
              Create Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-amber-600">
                CastHub Account
              </span>
            </h1>
            <p className="text-foreground/60 font-semibold text-base">
              Automate Your Outreach. Grow Your Opportunities.
            </p>
            <p className="text-foreground/40 font-medium leading-relaxed text-[13.5px] max-w-[330px]">
              Join casting professionals automating WhatsApp, Gmail &amp; Instagram outreach from one dashboard.
            </p>
          </div>

          {/* Brand logos row — only show on step 1 (WhatsApp, Gmail, Instagram in order always) */}
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.25em]">Outreach Channels</p>
              <div className="flex items-center gap-5">
                <WhatsAppBrand />
                <GmailBrand />
                <InstagramBrand />
              </div>
            </div>
          )}

          {/* Benefits checklist — show on step 2 */}
          {step === 2 && (
          <div className="space-y-2">
            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.25em]">Benefits</p>
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                </div>
                <p className="text-xs text-foreground/60 font-medium">{b}</p>
              </div>
            ))}
            <p className="text-[10px] text-primary/70 font-bold mt-3 pl-7">7 day free trial. Cancel anytime before that.</p>
          </div>
          )}

          {/* Trust */}
          <div className="flex items-center gap-3 p-4 rounded-2xl dark:bg-white/[0.03] bg-black/[0.03] border border-white/[0.06]">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-foreground/40 font-medium leading-relaxed">
              Your data is protected with AES-256 encryption and stored securely in our EU-compliant infrastructure.
            </p>
          </div>
        </div>

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
        "flex-1 flex flex-col items-center justify-center p-6 lg:py-14 lg:px-14 transition-all duration-1000",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_0_10px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <span className="text-xl font-black tracking-tight text-foreground">CAST<span className="text-primary">HUB</span></span>
        </div>

        <div className="w-full max-w-[460px] space-y-7 my-auto">
          {/* Header with step indicator */}
          <div className="space-y-1.5">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-1.5 flex-1 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted/40")} />
              <div className={cn("h-1.5 flex-1 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted/40")} />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-foreground">Create Your CastHub Account</h2>
            <p className="text-foreground/40 font-medium text-[15px]">
              {step === 1 ? "Step 1 of 2 — Your details" : "Step 2 of 2 — Complete your profile"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={step === 1 ? handleStep1Continue : handleSubmit} className="space-y-4">
            {/* ── STEP 1: Name, Email, Password ── */}
            {step === 1 && (
              <>
                {/* Name */}
                <GlassInput
                  id="name" name="name" type="text" autoFocus
                  placeholder="Jane Doe" label="Full Name"
                  value={formData.name} onChange={handleChange}
                  icon={User} error={fieldErrors?.name}
                />

                {/* Email */}
                <GlassInput
                  id="email" name="email" type="email"
                  placeholder="you@example.com" label="Email Address"
                  value={formData.email} onChange={handleChange}
                  icon={Mail} error={fieldErrors?.email}
                />

                {/* Password */}
                <div>
                  <GlassInput
                    id="password" name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters" label="Password"
                    value={formData.password} onChange={handleChange}
                    icon={Lock} error={fieldErrors?.password}
                    hint="Min. 8 chars, uppercase, lowercase, number, special character"
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
                  icon={Lock} error={fieldErrors?.confirmPassword}
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

                {/* Continue button */}
                <button type="submit"
                  className="w-full h-14 mt-2 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-primary/25 active:scale-[0.98]">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* ── STEP 2: Phone, Gender, DOB, Terms ── */}
            {step === 2 && (
              <>
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

                {/* Gender + DOB */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">Gender</label>
                    <div className={cn(
                      "flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl",
                      "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
                      fieldErrors?.gender && "border-rose-500/50"
                    )}>
                      <Users className="w-4 h-4 text-foreground/25 ml-4 mr-2 shrink-0" />
                      <Select value={formData.gender} onValueChange={(val) => {
                        setFormData(p => ({ ...p, gender: val }));
                        if (fieldErrors?.gender) setFieldErrors(p => { const n = { ...p }; delete n!.gender; return n; });
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
                    {fieldErrors?.gender && <p className="text-[11px] text-rose-400 font-bold pl-1">{fieldErrors.gender}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">Date of Birth</label>
                    <div className={cn(
                      "flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl",
                      "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
                      fieldErrors?.dob && "border-rose-500/50"
                    )}>
                      <Calendar className="w-4 h-4 text-foreground/25 ml-4 mr-2 shrink-0" />
                      <input name="dob" type="date" value={formData.dob} onChange={handleChange}
                        className="flex-1 h-13 py-3.5 pr-4 bg-transparent text-foreground text-[15px] font-medium outline-none [color-scheme:dark]" />
                    </div>
                    {fieldErrors?.dob && <p className="text-[11px] text-rose-400 font-bold pl-1">{fieldErrors.dob}</p>}
                  </div>
                </div>

                {/* Terms */}
                <div className={cn(
                  "flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer",
                  formData.terms
                    ? "bg-primary/8 border-primary/25"
                    : "dark:bg-white/[0.03] bg-black/[0.03] dark:border-white/[0.07] border-border/50",
                  fieldErrors?.terms && "border-rose-500/40"
                )} onClick={() => setFormData(p => ({ ...p, terms: !p.terms }))}>
                  <div className={cn(
                    "w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                    formData.terms ? "border-primary bg-primary" : "border-white/20 bg-transparent"
                  )}>
                    {formData.terms && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <p className="text-xs text-foreground/40 font-medium leading-relaxed select-none">
                    I agree to the{" "}
                    <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-primary hover:text-primary/80 font-bold" onClick={e => { e.stopPropagation(); setTermsScrolled(false); }}>Terms of Service</button>
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
                        <button type="button" className="text-primary hover:text-primary/80 font-bold" onClick={e => { e.stopPropagation(); setPrivacyScrolled(false); }}>Privacy Policy</button>
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
                {fieldErrors?.terms && <p className="text-[11px] text-rose-400 font-bold pl-1">{fieldErrors.terms}</p>}

                {/* Back + Submit */}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="h-14 px-6 rounded-2xl border border-white/[0.08] hover:border-primary/30 text-foreground/60 hover:text-foreground font-bold text-sm transition-all">
                    ← Back
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-primary/25 active:scale-[0.98]">
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                      : <><ShieldCheck className="w-4 h-4" /> Create My Account <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Sign in */}
          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] font-black text-foreground/20 uppercase tracking-widest">Already a member?</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <Link to="/login"
            className="w-full h-13 rounded-2xl border border-white/[0.08] hover:border-primary/40 hover:bg-primary/5 text-foreground/60 hover:text-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group">
            Sign In Instead
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </Link>
          <p className="text-center text-[10px] text-foreground/20 font-medium">
            Need help?{" "}
            <a href="mailto:support@casthub.in" className="text-primary/60 hover:text-primary transition-colors font-bold">support@casthub.in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
