import { Link } from "react-router-dom";
import { Mail, MessageCircle, Instagram, Zap, ArrowRight, ShieldCheck, ChevronRight, Sun, Moon, BarChart3 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Animated3DBackground from "@/components/Animated3DBackground";

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
            How CastHub Works
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
      <div className="relative">
        <Animated3DBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-6 pt-32 pb-20 text-center relative z-10"
        >
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
            Learn How CastHub Works
          </Link>
        </div>
        </motion.div>
      </div>

      {/* Feature Channels */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-8"
        >
          Powering outreach across
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Mail, name: "Gmail", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", desc: "Send personalized emails at scale." },
            { icon: MessageCircle, name: "WhatsApp", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Automate direct WhatsApp messaging." },
            { icon: Instagram, name: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20", desc: "Manage bulk Instagram DMs easily." }
          ].map((channel, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              key={idx} 
              className="p-6 rounded-3xl dark:bg-[#0a0a0a]/50 bg-black/5 border dark:border-white/5 border-black/5 backdrop-blur-sm flex flex-col items-center text-center group hover:bg-black/10 dark:hover:bg-[#0a0a0a] dark:hover:border-white/10 hover:border-black/10 transition-all"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", channel.bg)}>
                <channel.icon className={cn("w-7 h-7", channel.color)} />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">{channel.name}</h3>
              <p className="text-sm text-muted-foreground font-medium">{channel.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Value Proposition Bento Grid */}
      <div className="max-w-6xl mx-auto px-6 py-32 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Why Choose CastHub?</h2>
          <p className="text-muted-foreground font-medium max-w-xl mx-auto">Engineered for performance, designed for humans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Item 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-10 group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10 group-hover:bg-primary/30 transition-colors" />
            <h3 className="text-3xl font-black tracking-tight mb-4">Intelligent Personalization</h3>
            <p className="text-lg text-muted-foreground font-medium max-w-lg mb-8">
              Don't just blast messages. Use dynamic variables like <code className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{"{first_name}"}</code> and <code className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{"{company}"}</code> to ensure every single outreach feels uniquely handcrafted.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-xl px-4 py-2 font-mono text-sm shadow-sm">
                Hey {"{first_name}"}, loved your work at {"{company}"}!
              </div>
            </div>
          </motion.div>

          {/* Bento Item 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-bl from-blue-500/10 to-transparent border border-blue-500/20 p-10 group flex flex-col justify-between"
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px] -z-10 group-hover:bg-blue-500/30 transition-colors" />
            <div>
              <ShieldCheck className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-2xl font-black tracking-tight mb-3">Bypass Spam Filters</h3>
            </div>
            <p className="text-muted-foreground font-medium">
              We utilize residential IP routing and official APIs to ensure your accounts stay perfectly safe and messages land in the inbox.
            </p>
          </motion.div>

          {/* Bento Item 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-tr from-emerald-500/10 to-transparent border border-emerald-500/20 p-10 group flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px] -z-10 group-hover:bg-emerald-500/30 transition-colors" />
            <div>
              <BarChart3 className="w-12 h-12 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-black tracking-tight mb-3">Unified Analytics</h3>
            </div>
            <p className="text-muted-foreground font-medium">
              Track open rates, replies, and delivery status across all 3 channels simultaneously from a single, gorgeous dashboard.
            </p>
          </motion.div>

          {/* Bento Item 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 p-10 flex flex-col md:flex-row items-center gap-10"
          >
             <div className="flex-1">
               <h3 className="text-3xl font-black tracking-tight mb-4">Scale Without Limits</h3>
               <p className="text-lg text-muted-foreground font-medium">
                 Whether you are reaching out to 10 casting directors or 10,000 influencers, our robust infrastructure handles the heavy lifting while you sleep.
               </p>
             </div>
             <div className="flex-1 w-full flex justify-center">
               <div className="relative w-48 h-48 rounded-full border-[8px] border-primary/20 flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-[8px] border-primary border-t-transparent animate-spin" />
                 <div className="text-4xl font-black">∞</div>
               </div>
             </div>
          </motion.div>
        </div>
      </div>

      {/* Social Proof / Metrics */}
      <div className="border-y border-border/50 bg-background/50 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-primary/20 pattern-bg-transparent pattern-size-4 opacity-50" />
        <div className="max-w-6xl mx-auto px-6 py-20 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { value: "30+", label: "Hours Saved / Wk" },
            { value: "99%", label: "Delivery Rate" },
            { value: "10x", label: "Faster Outreach" },
            { value: "24/7", label: "Automated Casting" },
          ].map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, type: "spring" }}
            >
              <div className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50 mb-2">
                {metric.value}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8"
      >
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Ready to scale your casting?</h2>
        <p className="text-xl text-muted-foreground font-medium">Join professionals who save 30+ hours a week.</p>
        <Link to={hasToken ? "/dashboard" : "/signup"} className="inline-flex items-center justify-center gap-2 h-16 px-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]">
          {hasToken ? "Open Dashboard" : "Create Free Account"}
        </Link>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center opacity-50">
            <img src="/casthub-logo.png" alt="CastHub" className="w-6 h-6 grayscale" draggable={false} />
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
