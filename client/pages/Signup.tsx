import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle, Loader2, Eye, EyeOff, CheckCircle2,
  Mail, MessageCircle, Instagram, Zap, ShieldCheck, ArrowRight, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: MessageCircle, color: "text-emerald-400", label: "WhatsApp Automation", sub: "Mass outreach in minutes" },
  { icon: Mail, color: "text-blue-400", label: "Gmail Campaigns", sub: "Personalized email outreach" },
  { icon: Instagram, color: "text-pink-400", label: "Instagram DMs", sub: "Reach talent on socials" },
  { icon: Zap, color: "text-purple-400", label: "Smart Analytics", sub: "Track every campaign" },
];

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = () => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const s = getStrength();
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-rose-500", "bg-amber-400", "bg-blue-400", "bg-emerald-400"];
  const textColors = ["", "text-rose-400", "text-amber-400", "text-blue-400", "text-emerald-400"];

  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", s >= i ? colors[s] : "bg-white/5")} />
        ))}
      </div>
      <p className={cn("text-[10px] font-bold uppercase tracking-widest", textColors[s])}>{labels[s]}</p>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", gender: "", dob: "",
    password: "", confirmPassword: "", terms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? target.checked : value }));
    if (fieldErrors[name]) setFieldErrors((p) => { const n = { ...p }; delete n[name]; return n; });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) errs.email = "Email is required";
    if (!formData.gender) errs.gender = "Please select your gender";
    if (!formData.dob) errs.dob = "Date of birth is required";

    const p = formData.password;
    if (p.length < 8) errs.password = "Minimum 8 characters";
    else if (!/[A-Z]/.test(p)) errs.password = "Must include an uppercase letter";
    else if (!/[a-z]/.test(p)) errs.password = "Must include a lowercase letter";
    else if (!/[0-9]/.test(p)) errs.password = "Must include a number";
    else if (!/[^A-Za-z0-9]/.test(p)) errs.password = "Must include a special character";

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
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          gender: formData.gender,
          dob: formData.dob,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
        return;
      }

      setSuccessEmail(formData.email.trim());
      setSuccess(true);
    } catch (err) {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#060610] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center">
              <Mail className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tighter text-white">Check Your Inbox! 📬</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              We've sent a verification email to
            </p>
            <p className="text-primary font-black text-lg">{successEmail}</p>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              Click the link in the email to verify your account and get started. The link expires in 24 hours.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/3 border border-white/5 text-left space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Didn't receive it?</p>
            <p className="text-xs text-muted-foreground">Check your spam folder, or{" "}
              <button
                onClick={async () => {
                  await fetch("/api/auth/resend-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: successEmail }),
                  });
                  alert("Verification email resent!");
                }}
                className="text-primary font-bold hover:underline"
              >
                click here to resend
              </button>
            </p>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Signup Form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060610] flex relative overflow-hidden">
      {/* Moving Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] animate-[spin_30s_linear_infinite] opacity-50 mix-blend-screen" style={{ transformOrigin: 'center center' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-blue-600/20 rounded-full blur-[120px] animate-[spin_40s_linear_infinite_reverse] opacity-50 mix-blend-screen" style={{ transformOrigin: 'center center' }} />
        <div className="absolute top-[20%] right-[30%] w-[30vw] h-[30vw] bg-emerald-500/10 rounded-full blur-[80px] animate-pulse opacity-40" />
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative z-10 flex-col justify-between p-12">

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">CASTHUB</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em]">Casting Automation Platform</p>
            <h2 className="text-4xl font-black tracking-tighter text-white leading-tight">
              Automate Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Casting Outreach
              </span>
            </h2>
            <p className="text-muted-foreground font-medium leading-relaxed max-w-xs">
              Connect with talent across WhatsApp, Gmail, and Instagram — all from one powerful dashboard.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5 backdrop-blur-sm
                           animate-in slide-in-from-left-4 fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn("w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0")}>
                  <f.icon className={cn("w-4 h-4", f.color)} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wide">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-[11px] text-muted-foreground/40 font-medium">Trusted by casting directors & production houses</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto relative z-10">
        <div className="w-full max-w-[480px] space-y-7 animate-in fade-in slide-in-from-right-4 duration-500 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-black/50">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">CASTHUB</span>
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-white">Create Account</h1>
            <p className="text-sm text-muted-foreground font-medium">Join thousands automating their casting workflow</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
              <Input
                id="name" name="name" type="text" placeholder="Jane Doe"
                value={formData.name} onChange={handleChange} autoFocus
                className={cn("h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-medium focus:border-primary focus:ring-primary transition-all", fieldErrors.name && "border-rose-500/50")}
              />
              {fieldErrors.name && <p className="text-xs text-rose-400 font-medium">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                id="email" name="email" type="email" placeholder="you@example.com"
                value={formData.email} onChange={handleChange}
                className={cn("h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-medium focus:border-primary focus:ring-primary transition-all", fieldErrors.email && "border-rose-500/50")}
              />
              {fieldErrors.email && <p className="text-xs text-rose-400 font-medium">{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Phone Number <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span>
              </Label>
              <div className="flex gap-2">
                <div className="h-12 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 shrink-0">
                  <span className="text-sm">🇮🇳</span>
                  <span className="text-xs font-black text-muted-foreground">+91</span>
                </div>
                <Input
                  id="phone" name="phone" type="tel" placeholder="9876543210"
                  value={formData.phone} onChange={handleChange}
                  className="h-12 flex-1 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-medium focus:border-primary focus:ring-primary transition-all"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 font-medium">You can also use your phone number to sign in</p>
            </div>

            {/* Gender + DOB */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Gender</Label>
                <select
                  name="gender" value={formData.gender} onChange={handleChange}
                  className={cn(
                    "flex h-12 w-full rounded-xl border bg-white/5 px-3 py-2 text-sm text-white",
                    "border-white/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all",
                    !formData.gender && "text-white/20",
                    fieldErrors.gender && "border-rose-500/50"
                  )}
                >
                  <option value="" disabled className="bg-[#111] text-white/40">Select</option>
                  <option value="male" className="bg-[#111] text-white">Male</option>
                  <option value="female" className="bg-[#111] text-white">Female</option>
                  <option value="other" className="bg-[#111] text-white">Other</option>
                </select>
                {fieldErrors.gender && <p className="text-xs text-rose-400 font-medium">{fieldErrors.gender}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Date of Birth</Label>
                <Input
                  id="dob" name="dob" type="date"
                  value={formData.dob} onChange={handleChange}
                  className={cn("h-12 rounded-xl bg-white/5 border-white/10 text-white font-medium focus:border-primary focus:ring-primary transition-all [color-scheme:dark]", fieldErrors.dob && "border-rose-500/50")}
                />
                {fieldErrors.dob && <p className="text-xs text-rose-400 font-medium">{fieldErrors.dob}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={formData.password} onChange={handleChange}
                  className={cn("h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-medium pr-11 focus:border-primary focus:ring-primary transition-all", fieldErrors.password && "border-rose-500/50")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={formData.password} />
              {fieldErrors.password && <p className="text-xs text-rose-400 font-medium">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword" name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword} onChange={handleChange}
                  className={cn("h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20 font-medium pr-11 focus:border-primary focus:ring-primary transition-all", fieldErrors.confirmPassword && "border-rose-500/50")}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {fieldErrors.confirmPassword && <p className="text-xs text-rose-400 font-medium">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="space-y-1">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
                <Checkbox
                  id="terms"
                  checked={formData.terms}
                  onCheckedChange={(c) => setFormData((p) => ({ ...p, terms: !!c }))}
                  className="mt-0.5 border-white/20"
                />
                <Label htmlFor="terms" className="text-xs font-medium cursor-pointer text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="#" className="text-primary hover:underline font-bold">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="#" className="text-primary hover:underline font-bold">Privacy Policy</Link>.
                  I understand that CastHub automates outreach and I will use it responsibly.
                </Label>
              </div>
              {fieldErrors.terms && <p className="text-xs text-rose-400 font-medium ml-1">{fieldErrors.terms}</p>}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-500/20 transition-all active:scale-[0.99] gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Create Account</>
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-black hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
