import { Link } from "react-router-dom";
import { Mail, MessageCircle, Instagram, Zap, ArrowRight, ShieldCheck, ChevronRight, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden dark:bg-[#0d0b08] bg-amber-50/30">
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(245,197,24,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-amber-600/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
    </div>
  );
}

export default function LandingPage() {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("casthub_auth_token");

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      <AnimatedBackground />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 dark:bg-[#0d0b08]/80 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <span className="text-lg font-black tracking-tight">CAST<span className="text-primary italic">HUB</span></span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/how-it-works" className="hidden md:flex text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link to="/contact" className="hidden md:flex text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            Contact Us
          </Link>
          
          <button 
            onClick={() => {
              const isDark = document.documentElement.classList.contains('dark');
              const next = !isDark;
              document.documentElement.classList.toggle('dark', next);
              localStorage.setItem('casthub-theme', next ? 'dark' : 'light');
            }}
            className="w-8 h-8 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-border/50 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>
          
          {hasToken ? (
            <Link to="/dashboard" className="text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link to="/signup" className="text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-20 text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Multi-Channel Automation</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1.1] mb-6">
          Automate Your Outreach.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-amber-600">
            Grow Your Opportunities.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
          The ultimate casting automation platform. Manage your contacts and launch personalized campaigns across Gmail, WhatsApp, and Instagram from one unified dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={hasToken ? "/dashboard" : "/signup"} className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
            {hasToken ? "Go To Dashboard" : "Start For Free"} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/how-it-works" className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-10 rounded-2xl border border-white/10 hover:bg-white/5 font-bold text-sm transition-all active:scale-[0.98]">
            Learn How It Works
          </Link>
        </div>
      </div>

      {/* Feature Channels */}
      <div className="max-w-4xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
        <p className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-8">Powering outreach across</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Mail, name: "Gmail", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", desc: "Send personalized emails at scale." },
            { icon: MessageCircle, name: "WhatsApp", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Automate direct WhatsApp messaging." },
            { icon: Instagram, name: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20", desc: "Manage bulk Instagram DMs easily." }
          ].map((channel, idx) => (
            <div key={idx} className="p-6 rounded-3xl dark:bg-[#0a0a0a]/50 bg-black/5 border dark:border-white/5 border-black/5 backdrop-blur-sm flex flex-col items-center text-center group hover:bg-black/10 dark:hover:bg-[#0a0a0a] dark:hover:border-white/10 hover:border-black/10 transition-all">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", channel.bg)}>
                <channel.icon className={cn("w-7 h-7", channel.color)} />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">{channel.name}</h3>
              <p className="text-sm text-muted-foreground font-medium">{channel.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works Section */}
      <div id="how-it-works" className="max-w-5xl mx-auto px-6 py-32 space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">How CastHub Works</h2>
          <p className="text-muted-foreground font-medium max-w-xl mx-auto">Three simple steps to put your casting outreach on autopilot.</p>
        </div>

        <div className="grid gap-12 md:gap-24">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xl">1</div>
              <h3 className="text-3xl font-black tracking-tight">Connect Your Channels</h3>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                Securely link your Gmail, WhatsApp, and Instagram accounts directly within our integrations center. We handle the session management so you can focus on outreach.
              </p>
              <ul className="space-y-3">
                {["OAuth 2.0 Security", "QR Code session sync", "Official API support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative aspect-video rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-pulse"><Mail className="w-8 h-8 text-blue-400" /></div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse" style={{animationDelay: '0.2s'}}><MessageCircle className="w-8 h-8 text-emerald-400" /></div>
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center animate-pulse" style={{animationDelay: '0.4s'}}><Instagram className="w-8 h-8 text-pink-400" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xl">2</div>
              <h3 className="text-3xl font-black tracking-tight">Build Dynamic Templates</h3>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                Create reusable templates for emails and messages. Use smart variables like <code className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{"{name}"}</code> and <code className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{"{role}"}</code> to personalize every single message at scale.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                Try building a template <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative aspect-video rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl p-6 flex flex-col justify-center space-y-4">
                <div className="h-6 w-1/3 bg-white/5 rounded-lg" />
                <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
                <div className="h-4 w-5/6 bg-white/5 rounded-lg" />
                <div className="h-4 w-2/3 bg-white/5 rounded-lg" />
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-20 bg-primary/20 rounded-md" />
                  <div className="h-6 w-24 bg-primary/20 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xl">3</div>
              <h3 className="text-3xl font-black tracking-tight">Launch & Track</h3>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                Import your contacts, select your channels, and hit launch. CastHub's engine will queue and deliver your messages while you track success rates and responses in real-time.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative aspect-video rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-black">84%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Ready to scale your casting?</h2>
        <p className="text-xl text-muted-foreground font-medium">Join professionals who save 30+ hours a week.</p>
        <Link to={hasToken ? "/dashboard" : "/signup"} className="inline-flex items-center justify-center gap-2 h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]">
          {hasToken ? "Open Dashboard" : "Create Free Account"}
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 opacity-50">
            <img src="/casthub-logo.png" alt="CastHub" className="w-6 h-6 grayscale" draggable={false} />
            <span className="text-sm font-black tracking-tight">CAST<span className="italic">HUB</span></span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-bold text-muted-foreground/60">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
          </div>
          <p className="text-xs text-muted-foreground/40 font-medium">© {new Date().getFullYear()} CastHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
