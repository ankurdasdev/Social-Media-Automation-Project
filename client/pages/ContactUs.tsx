import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Send, CheckCircle2, User, Loader2, Sun, Moon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Animated Background ──────────────────────────────────────────────────────
function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden dark:bg-[#060608] bg-amber-50/40">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay dark:mix-blend-normal"
        style={{ backgroundImage: "linear-gradient(rgba(245,197,24,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
      {/* Floating Orbs */}
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * 60}px, ${mousePos.y * 60}px)` }}>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[140px] animate-float-1" />
      </div>
      <div className="absolute inset-0 transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * -80}px, ${mousePos.y * -80}px)` }}>
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[160px] animate-float-2" />
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
    <button onClick={toggleTheme} className="w-10 h-10 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-border/50 flex items-center justify-center text-foreground/60 hover:text-foreground hover:dark:bg-white/10 bg-black/10 transition-all backdrop-blur-md">
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

// ── Glassmorphic input ───────────────────────────────────────────────────────
function GlassInput({
  id, name, type = "text", placeholder, value, onChange, required, autoFocus, icon: Icon, error, label
}: {
  id: string; name: string; type?: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
  autoFocus?: boolean; icon?: any; error?: string; label?: string;
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
        focused ? "border-primary/60 bg-primary/8 shadow-[0_0_0_3px_rgba(245,197,24,0.12)]" : "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-black/10 dark:hover:bg-white/[0.07]",
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
          required={required}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-13 bg-transparent text-sm font-bold text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-0 px-4 rounded-2xl"
        />
      </div>
      {error && <p className="text-[11px] text-rose-400 font-bold pl-1">{error}</p>}
    </div>
  );
}

function GlassTextarea({
  id, name, placeholder, value, onChange, required, label
}: {
  id: string; name: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; required?: boolean;
  label?: string;
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
        "relative flex rounded-2xl border transition-all duration-300 backdrop-blur-xl",
        focused ? "border-primary/60 bg-primary/8 shadow-[0_0_0_3px_rgba(245,197,24,0.12)]" : "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-black/10 dark:hover:bg-white/[0.07]"
      )}>
        <textarea
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full min-h-[120px] bg-transparent text-sm font-bold text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-0 p-4 rounded-2xl resize-none"
        />
      </div>
    </div>
  );
}


export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/help/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error("Error submitting contact form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col relative">
      <AnimatedBackground />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b dark:border-white/5 border-border/50 dark:bg-[#060608]/80 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <span className="text-lg font-black tracking-tight">CAST<span className="text-primary italic">HUB</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Back to Login
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col md:flex-row gap-16 md:items-center">
        
        {/* Left Column - Text */}
        <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Get in Touch</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.1]">
            How can we<br/>help you?
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-sm">
            Have a question about our automation tools? Want to report a bug? Just send us a message and our team will get back to you shortly.
          </p>
          
          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-border/50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/60">Email Support</p>
                <p className="text-foreground">support@casthub.in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          <div className="dark:bg-[#0a0a0a]/80 bg-background/80 backdrop-blur-2xl border dark:border-white/5 border-border/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            {isSuccess ? (
              <div className="absolute inset-0 dark:bg-[#0a0a0a] bg-background flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500 z-10">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Message Sent!</h3>
                <p className="text-muted-foreground font-medium">
                  Thanks for reaching out. We've received your message and will respond as soon as possible.
                </p>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest"
                >
                  Send Another
                </Button>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <GlassInput 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                label="Full Name"
                icon={User}
                required
              />

              <GlassInput 
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                label="Email Address"
                icon={Mail}
                required
              />

              <GlassInput 
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                label="Subject"
                icon={Type}
                required
              />

              <GlassTextarea 
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message here..."
                label="Message"
                required
              />

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 mt-2 uppercase tracking-widest text-sm"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-md mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground/40 font-medium">© {new Date().getFullYear()} CastHub. All rights reserved.</p>
          <div className="flex gap-6 text-[11px] font-bold text-muted-foreground/60">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
