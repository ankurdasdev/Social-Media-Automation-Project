import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, SlidersHorizontal, LayoutTemplate, BarChart3, User, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    title: "Add Your First Contact",
    description: "Import or manually create casting contacts",
    icon: Table,
    href: "/contacts",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Connect WhatsApp",
    description: "Pair your WhatsApp via QR code",
    icon: SlidersHorizontal,
    href: "/integrations",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  {
    title: "Create a Template",
    description: "Build reusable outreach messages",
    icon: LayoutTemplate,
    href: "/templates",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    gradient: "from-purple-500/20 to-violet-500/20",
  },
  {
    title: "View Analytics",
    description: "Track outreach performance & failures",
    icon: BarChart3,
    href: "/analytics",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    title: "Update Profile",
    description: "Manage your account settings",
    icon: User,
    href: "/profile",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    title: "Manage Subscription",
    description: "Upgrade or apply coupon codes",
    icon: Crown,
    href: "/subscription",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-black tracking-tight text-foreground">Quick Actions</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          Jump to common tasks
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => navigate(action.href)}
              className={cn(
                "glass-card border p-5 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden",
                action.border
              )}
            >
              {/* Gradient background hover effect */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", action.gradient)} />
              
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl shrink-0 shadow-lg", action.bg)}>
                    <Icon className={cn("w-5 h-5", action.color)} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-black tracking-tight text-foreground">{action.title}</p>
                    <p className="text-[11px] text-muted-foreground font-medium leading-snug">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className={cn("w-4 h-4 shrink-0 mt-1 text-muted-foreground/30 group-hover:translate-x-1 transition-transform", `group-hover:${action.color}`)} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
