import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  BarChart3,
  Settings,
  Table,
  LogOut,
  User,
  SlidersHorizontal,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Instagram,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateUserId, clearAuthToken, getCurrentUser } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WhatsAppStatusResponse } from "@shared/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    label: "Controller",
    href: "/controller",
    icon: Settings,
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Table,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SlidersHorizontal,
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const userId = getOrCreateUserId();
  const currentUser = getCurrentUser();

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('casthub-theme', next ? 'dark' : 'light');
  };

  // ── Global Status Polling ──────────────────────────────────────────────────
  const { data: googleStatus } = useQuery({
    queryKey: ["google-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/status?userId=${userId}`);
      return res.json() as Promise<{ connected: boolean; needsReauth: boolean }>;
    },
    refetchInterval: 60000, 
  });

  const { data: waStatus } = useQuery({
    queryKey: ["whatsapp-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/status?userId=${userId}`);
      return res.json() as Promise<WhatsAppStatusResponse>;
    },
    refetchInterval: 30000,
  });

  const { data: igStatus } = useQuery({
    queryKey: ["instagram-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/status?userId=${userId}`);
      return res.json() as Promise<{ connected: boolean; username?: string }>;
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-20" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-border/40 bg-card/30 backdrop-blur-2xl px-6 py-10 relative z-30 overflow-hidden">
        {/* Sidebar Noise/Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
        
        {/* Logo Section */}
        <div className="mb-12 relative">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-105 transition-all duration-500">
              <Zap className="w-7 h-7 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none">CAST<span className="text-primary italic">HUB</span></span>
              <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase opacity-70">Automation Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 relative">
          <p className="px-4 mb-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-inner" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div className="mt-auto pt-10 border-t border-border/30 space-y-6 relative">
             <div className="space-y-4">
                <p className="px-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Connection Status</p>
                <div className="space-y-2 px-2">
                    {/* Drive Status */}
                    <div className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all",
                        googleStatus?.connected ? "bg-blue-500/5 border-blue-500/20" : "bg-muted/10 border-border/20"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", googleStatus?.connected ? (googleStatus.needsReauth ? "bg-yellow-500 animate-pulse" : "bg-blue-500") : "bg-muted-foreground/30")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">GOOGLE DRIVE</span>
                        </div>
                        {googleStatus?.connected && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>

                    {/* WhatsApp Status */}
                    <div className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all",
                        waStatus?.isConnected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/10 border-border/20"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", waStatus?.isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30")} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">WHATSAPP</span>
                        </div>
                        {waStatus?.isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>

                    {/* Instagram Status */}
                    <div className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all",
                        igStatus?.connected ? "bg-pink-500/5 border-pink-500/20" : "bg-muted/10 border-border/20"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", igStatus?.connected ? "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" : "bg-muted-foreground/30")} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">INSTAGRAM</span>
                        </div>
                        {igStatus?.connected && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                    </div>
                </div>
             </div>

             {/* User Section */}
             <div className="flex items-center justify-between gap-3 p-3 bg-muted/20 border border-border/30 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-white/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black truncate">{currentUser?.name || "Anonymous User"}</span>
                        <span className="text-[10px] font-bold text-muted-foreground truncate uppercase tracking-[0.05em]">{currentUser?.email?.split('@')[0]}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-muted/50">
                            <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="glass-card w-48 p-2 rounded-2xl">
                         <DropdownMenuItem asChild className="rounded-xl gap-2 cursor-pointer font-bold mb-1 hover:bg-muted/50">
                            <Link to="/profile" className="flex items-center gap-2 w-full">
                                <User className="w-4 h-4" /> View Profile
                            </Link>
                         </DropdownMenuItem>
                         <DropdownMenuSeparator className="bg-border/30 mx-2" />
                         <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive hover:bg-destructive/10 rounded-xl gap-2 cursor-pointer font-bold">
                            <LogOut className="w-4 h-4" /> Logout System
                         </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header - Mobile & Desktop Actions */}
        <header className="h-20 border-b border-border/30 bg-background/30 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 z-20">
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black">CAST<span className="text-primary italic">HUB</span></span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
             <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none font-black tracking-widest text-[9px] px-3 py-1">
                SYSTEM OPERATIONAL
             </Badge>
          </div>

          <div className="flex items-center gap-4">
             {/* Dark Mode Toggle */}
             <button
                onClick={toggleTheme}
                className="w-11 h-11 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center hover:bg-muted/50 transition-all text-foreground"
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <div className="absolute dark:opacity-0 transition-opacity">
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15a5 5 0 100-10 5 5 0 000 10z" /></svg>
                  </div>
                  <div className="absolute opacity-0 dark:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                  </div>
                </div>
              </button>

              <button
                className="md:hidden w-11 h-11 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl" onClick={() => setMobileMenuOpen(false)} />
            <nav className="absolute inset-y-0 right-0 w-72 bg-card/60 backdrop-blur-3xl border-l border-border/40 p-10 flex flex-col gap-8 shadow-2xl">
                <div className="flex items-center justify-between">
                    <span className="text-xl font-black">System <span className="text-primary italic">Menu</span></span>
                    <button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-2">
                    {navItems.map((item) => (
                         <Link
                         key={item.href}
                         to={item.href}
                         onClick={() => setMobileMenuOpen(false)}
                         className={cn(
                           "flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm",
                           location.pathname === item.href ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/30"
                         )}
                       >
                         <item.icon className="w-5 h-5" /> {item.label}
                       </Link>
                    ))}
                </div>
                <div className="mt-auto border-t border-border/30 pt-8">
                     <Button onClick={handleLogout} variant="destructive" className="w-full h-14 rounded-2xl font-black gap-2">
                         <LogOut className="w-5 h-5" /> LOGOUT
                     </Button>
                </div>
            </nav>
          </div>
        )}

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-12 pb-24">
                {children}
            </div>
            
            {/* Ambient Lighting Background */}
            <div className="fixed bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-background to-transparent pointer-events-none -z-10 opacity-60" />
        </main>
      </div>
    </div>
  );
}

