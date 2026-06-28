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
  CheckCircle2,
  XCircle,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Instagram,
  Crown,
  HelpCircle,
  Circle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateUserId, clearAuthToken, getCurrentUser, getAuthToken } from "@/lib/utils";
import { WhatsAppStatusResponse } from "@shared/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LayoutTemplate } from "lucide-react";
import SubscriptionBanner from "./SubscriptionBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Nav items — Contacts moved above Source Manager per client request
const navItems = [
  {
    label: "Integrations Centre",
    href: "/integrations",
    icon: SlidersHorizontal,
  },
  {
    label: "Template Library",
    href: "/templates",
    icon: LayoutTemplate,
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: Table,
  },
  {
    label: "Source Manager",
    href: "/controller",
    icon: Settings,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Subscription",
    href: "/subscription",
    icon: Crown,
  },
  {
    label: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];

// ── CastHub Logo Component ─────────────────────────────────────────────────────
function CastHubLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const imgSize = size === "sm" ? 36 : size === "lg" ? 56 : 44;
  const textSize = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div className="flex items-center gap-3 group">
      <img
        src="/casthub-logo.png"
        alt="CastHub"
        width={imgSize}
        height={imgSize}
        style={{ width: imgSize, height: imgSize }}
        className="object-contain shrink-0 drop-shadow-[0_0_10px_rgba(245,168,0,0.4)] transition-transform duration-300 group-hover:scale-105"
        draggable={false}
      />
      <span className={cn(textSize, "font-black tracking-tighter leading-none")}>
        CAST<span className="text-primary">HUB</span>
      </span>
    </div>
  );
}

// ── Status Pill Component (clickable link to integrations) ────────────────────────
function ConnectionStatusPill({
  label,
  connectedLabel,
  disconnectedLabel,
  isConnected,
  loading = false,
  href = "/integrations",
}: {
  label: string;
  connectedLabel: string;
  disconnectedLabel: string;
  isConnected: boolean | undefined;
  loading?: boolean;
  href?: string;
}) {
  if (loading || isConnected === undefined) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/10 border-border/20 opacity-50">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/20 animate-pulse" />
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground/40">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 cursor-pointer group",
        isConnected
          ? "bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/15 dark:bg-emerald-500/8"
          : "bg-muted/10 border-border/20 hover:bg-muted/20"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0 transition-all duration-300",
          isConnected
            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            : "bg-muted-foreground/25"
        )} />
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-widest truncate transition-colors duration-300",
          isConnected ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground/50"
        )}>
          {isConnected ? connectedLabel : disconnectedLabel}
        </span>
      </div>
      {isConnected && (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
      )}
    </Link>
  );
}

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
  const { data: googleStatus, isLoading: googleLoading } = useQuery({
    queryKey: ["google-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/status?userId=${userId}`);
      return res.json() as Promise<{ connected: boolean; needsReauth: boolean }>;
    },
    refetchInterval: 60000,
  });

  const { data: waStatus, isLoading: waLoading } = useQuery({
    queryKey: ["whatsapp-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/status?userId=${userId}`);
      return res.json() as Promise<WhatsAppStatusResponse>;
    },
    refetchInterval: 30000,
  });

  const { data: igStatus, isLoading: igLoading } = useQuery({
    queryKey: ["instagram-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/status?userId=${userId}`);
      return res.json() as Promise<{ isConnected: boolean; username?: string }>;
    },
    refetchInterval: 30000,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfileAdminLayout"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = "/login";
  };

  const googleConnected = !!googleStatus?.connected && !googleStatus?.needsReauth;
  const waConnected = !!waStatus?.isConnected;
  const igConnected = !!igStatus?.isConnected;

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] opacity-20" />
      </div>

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-border/40 bg-card/30 backdrop-blur-2xl px-5 py-8 relative z-30 overflow-y-auto overflow-x-hidden">
        {/* Sidebar Texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] bg-[size:24px_24px]" />

        <div className="flex flex-col min-h-full w-full relative z-10">

          {/* ── Logo — clicks go to dashboard ── */}
          <div className="mb-10">
            <Link to="/dashboard">
              <CastHubLogo size="md" />
            </Link>
          </div>

          {/* ── Navigation (no label) ── */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              const targetId = item.label === "Contacts" ? "tutorial-contacts-nav" :
                               item.label === "Controller" ? "tutorial-controller-nav" : undefined;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  id={targetId}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 -z-10" />
                  )}
                  <Icon className={cn(
                    "w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-primary-foreground" : ""
                  )} style={{ width: '18px', height: '18px' }} />
                  <span className="text-sm tracking-tight">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/80 shadow-sm" />
                  )}
                </Link>
              );
            })}

            {userProfile?.is_admin && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group relative mt-3",
                  location.pathname === "/admin"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-bold"
                    : "text-primary/70 hover:text-primary hover:bg-primary/10 border border-primary/20 font-medium"
                )}
              >
                <ShieldCheck className="w-4.5 h-4.5 shrink-0" style={{ width: '18px', height: '18px' }} />
                <span className="text-sm tracking-tight">System Admin</span>
              </Link>
            )}
          </nav>

          {/* ── Connection Status ── */}
          <div className="mt-auto pt-6 border-t border-border/30 space-y-5">
            <div className="space-y-2">
              <p className="px-1 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.25em] mb-3">
                Connection Status
              </p>
              <ConnectionStatusPill
                label="Google"
                connectedLabel="Google Connected"
                disconnectedLabel="Google Not Connected"
                isConnected={googleConnected}
                loading={googleLoading}
                href="/integrations?defaultTab=google"
              />
              <ConnectionStatusPill
                label="WhatsApp"
                connectedLabel="WhatsApp Connected"
                disconnectedLabel="WhatsApp Not Connected"
                isConnected={waConnected}
                loading={waLoading}
                href="/integrations?defaultTab=whatsapp"
              />
              <ConnectionStatusPill
                label="Instagram"
                connectedLabel="Instagram Connected"
                disconnectedLabel="Instagram Not Connected"
                isConnected={igConnected}
                loading={igLoading}
                href="/integrations?defaultTab=instagram"
              />
            </div>

            {/* ── User Section ── */}
            <div className="flex items-center justify-between gap-3 p-3 bg-muted/20 border border-border/30 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/30 to-amber-500/20 border border-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate">{currentUser?.name || "Anonymous User"}</span>
                  <span className="text-[9px] font-medium text-muted-foreground truncate uppercase tracking-wide">{currentUser?.email?.split('@')[0]}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-muted/50 shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
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
        </div>
      </aside>

      {/* ── MAIN CONTAINER ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* ── Top Header ── */}
        <header className="h-16 border-b border-border/30 bg-background/40 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8 z-20 shrink-0">
          {/* Mobile: show logo */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/dashboard">
              <CastHubLogo size="sm" />
            </Link>
          </div>

          {/* Empty spacer for desktop layout balance */}
          <div className="hidden md:block flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center hover:bg-muted/50 transition-all text-foreground hover:border-primary/30"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <div className="absolute dark:opacity-0 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15a5 5 0 100-10 5 5 0 000 10z" /></svg>
                </div>
                <div className="absolute opacity-0 dark:opacity-100 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                </div>
              </div>
            </button>

            <button
              className="md:hidden w-10 h-10 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center hover:bg-muted/50 transition-all"
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
            <nav className="absolute inset-y-0 right-0 w-72 bg-card/70 backdrop-blur-3xl border-l border-border/40 p-8 flex flex-col gap-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <CastHubLogo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-sm",
                      location.pathname === item.href
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 shrink-0" style={{ width: '18px', height: '18px' }} />
                    {item.label}
                  </Link>
                ))}
                {userProfile?.is_admin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-semibold text-sm",
                      location.pathname === "/admin"
                        ? "bg-primary text-primary-foreground"
                        : "text-primary hover:bg-primary/10"
                    )}
                  >
                    <ShieldCheck className="w-4.5 h-4.5 shrink-0" style={{ width: '18px', height: '18px' }} /> System Admin
                  </Link>
                )}
              </div>
              <div className="mt-auto border-t border-border/30 pt-6">
                <Button onClick={handleLogout} variant="destructive" className="w-full h-12 rounded-xl font-bold gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </div>
            </nav>
          </div>
        )}

        {/* Subscription Banner */}
        <SubscriptionBanner />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10 space-y-8 lg:space-y-12 pb-24">
            {children}
          </div>

          {/* Legal Footer */}
          <footer className="border-t border-border/20 bg-background/20 backdrop-blur-sm px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-medium text-muted-foreground/30 tracking-widest uppercase">
              © {new Date().getFullYear()} CastHub — Casting Automation Platform
            </p>
            <div className="flex items-center gap-4">
              <Link to="/terms" className="text-[10px] font-medium text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">
                Terms
              </Link>
              <span className="text-muted-foreground/20 text-[10px]">·</span>
              <Link to="/privacy" className="text-[10px] font-medium text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">
                Privacy
              </Link>
              <span className="text-muted-foreground/20 text-[10px]">·</span>
              <Link to="/help" className="text-[10px] font-medium text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">
                Contact
              </Link>
            </div>
          </footer>

          {/* Ambient Lighting */}
          <div className="fixed bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-background to-transparent pointer-events-none -z-10 opacity-60" />
        </main>
      </div>
    </div>
  );
}
