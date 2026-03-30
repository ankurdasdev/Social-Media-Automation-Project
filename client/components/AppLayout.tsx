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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateUserId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WhatsAppStatusResponse } from "@shared/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const userId = getOrCreateUserId();

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
      const res = await fetch("/api/whatsapp/status");
      return res.json() as Promise<WhatsAppStatusResponse>;
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-foreground">CastHub</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Global Status Badges */}
              <div className="hidden sm:flex items-center gap-2 mr-2">
                {/* Google Status */}
                {googleStatus?.connected ? (
                  googleStatus.needsReauth ? (
                    <Badge variant="outline" className="h-6 border-yellow-500/50 text-yellow-500 bg-yellow-500/5 gap-1 px-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">Drive</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-6 border-blue-500/50 text-blue-500 bg-blue-500/5 gap-1 px-2">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase">Drive</span>
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="h-6 border-zinc-800 text-zinc-500 bg-zinc-900 gap-1 px-2">
                    <XCircle className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase">Drive</span>
                  </Badge>
                )}

                {/* WhatsApp Status */}
                {waStatus?.isConnected ? (
                  <Badge variant="outline" className="h-6 border-emerald-500/50 text-emerald-500 bg-emerald-500/5 gap-1 px-2">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase">WA</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-6 border-zinc-800 text-zinc-500 bg-zinc-900 gap-1 px-2">
                    <XCircle className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase">WA</span>
                  </Badge>
                )}
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
