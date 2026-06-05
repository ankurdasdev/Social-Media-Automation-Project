/**
 * SubscriptionBanner — Persistent trial/expiry alerts shown across all pages
 */
import { useQuery } from "@tanstack/react-query";
import { getOrCreateUserId } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Crown, Clock, AlertTriangle, Zap, X } from "lucide-react";
import { useState } from "react";

interface SubscriptionStatus {
  planType: string;
  status: string;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
}

export default function SubscriptionBanner() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Get real authenticated user
  const { data: user } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("casthub_auth_token")}` }
      });
      if (!res.ok) throw new Error("Not authorized");
      const data = await res.json();
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: status } = useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/payments/subscription?userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (!status || dismissed) return null;

  // Don't show banner for active paid users with more than 5 days remaining
  if (status.isActive && !status.isTrial && status.daysRemaining > 5) return null;

  // Trial active — show days remaining
  if (status.isTrial && status.isActive && status.daysRemaining > 2) {
    return (
      <div className="relative flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 text-sm animate-in slide-in-from-top duration-500">
        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="font-bold text-blue-400/80 text-xs">
          <span className="font-black text-blue-400">{status.daysRemaining} days</span> left in your free trial
        </span>
        <button
          onClick={() => navigate("/subscription")}
          className="ml-2 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/30 transition-all"
        >
          Upgrade
        </button>
        <button onClick={() => setDismissed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/5 transition-colors">
          <X className="w-3 h-3 text-muted-foreground/50" />
        </button>
      </div>
    );
  }

  // Trial or subscription almost expired (≤ 2 days)
  if (status.isActive && status.daysRemaining <= 2 && status.daysRemaining > 0) {
    return (
      <div className="relative flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 text-sm animate-in slide-in-from-top duration-500">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="font-bold text-amber-400/80 text-xs">
          ⚠️ {status.isTrial ? "Trial" : "Subscription"} expires in <span className="font-black text-amber-400">{status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"}</span>!
        </span>
        <button
          onClick={() => navigate("/subscription")}
          className="ml-2 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all"
        >
          {status.isTrial ? "Subscribe Now" : "Renew Now"}
        </button>
      </div>
    );
  }

  // Expired
  if (status.isExpired) {
    return (
      <div className="relative flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-b border-rose-500/30 text-sm animate-in slide-in-from-top duration-500">
        <Crown className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="font-bold text-rose-400/80 text-xs">
          Your {status.isTrial ? "trial" : "subscription"} has <span className="font-black text-rose-400">expired</span>. Subscribe to continue using CastHub.
        </span>
        <button
          onClick={() => navigate("/subscription")}
          className="ml-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:opacity-90 transition-all"
        >
          <Zap className="w-3 h-3 inline mr-1" /> Subscribe
        </button>
      </div>
    );
  }

  return null;
}
