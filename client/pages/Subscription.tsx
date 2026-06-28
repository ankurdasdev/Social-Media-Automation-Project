/**
 * Subscription Page — Pricing Plans, Coupon, Razorpay Checkout
 */
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateUserId, getCurrentUser } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Zap,
  Shield,
  CheckCircle2,
  Loader2,
  Tag,
  X,
  Sparkles,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Clock,
  Star,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

const PLANS = [
  {
    id: "weekly" as const,
    name: "Weekly",
    price: 199,
    priceLabel: "₹199",
    period: "/week",
    features: [
      "Full Contact Management",
      "WhatsApp + Instagram + Email Automation",
      "AI-Powered Casting Parsing",
      "Template Builder",
      "Analytics Dashboard",
    ],
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/20",
    icon: Zap,
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: 499,
    priceLabel: "₹499",
    period: "/month",
    popular: true,
    features: [
      "Everything in Weekly",
      "Priority Support",
      "Advanced AI Features",
      "Unlimited Templates",
      "Export & Analytics",
      "Save 40% vs Weekly",
    ],
    color: "amber",
    gradient: "from-amber-500 via-orange-500 to-orange-500",
    shadow: "shadow-amber-500/20",
    icon: Crown,
  },
];

export default function Subscription() {
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();
  const user = getCurrentUser();

  const [selectedPlan, setSelectedPlan] = useState<"weekly" | "monthly">("monthly");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch subscription status
  const { data: subStatus, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/subscription?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Fetch payment history
  const { data: historyData } = useQuery({
    queryKey: ["payment-history", userId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/history?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Apply coupon
  const couponMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payments/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, planType: selectedPlan }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setCouponApplied({
        code: couponCode.toUpperCase(),
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
      });
      toast.success(data.message);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
  };

  // Load Razorpay script
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle payment
  const handlePay = async () => {
    setIsProcessing(true);

    try {
      // 1. Load Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please check your internet connection.");
        setIsProcessing(false);
        return;
      }

      // 2. Create order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planType: selectedPlan,
          couponCode: couponApplied?.code || undefined,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error);
      }

      const orderData = await orderRes.json();

      // 3. Open Razorpay Checkout
      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CastHub",
        description: `${orderData.planLabel} Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#ec4899",
          backdrop_color: "rgba(0,0,0,0.8)",
        },
        modal: {
          confirm_close: true,
          ondismiss: () => setIsProcessing(false),
        },
        handler: async (response: any) => {
          // 4. Verify payment
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                planType: selectedPlan,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                method: response.razorpay_payment_method || "unknown",
                couponCode: couponApplied?.code,
                discountAmount: couponApplied?.discountAmount || 0,
              }),
            });

            if (!verifyRes.ok) throw new Error("Verification failed");

            const result = await verifyRes.json();
            toast.success("🎉 Payment successful! Your subscription is now active.");
            queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
            queryClient.invalidateQueries({ queryKey: ["payment-history"] });
            setCouponApplied(null);
            setCouponCode("");
          } catch (err) {
            toast.error("Payment captured but verification failed. Please contact support.");
          }
          setIsProcessing(false);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`);
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
      setIsProcessing(false);
    }
  };

  const plan = PLANS.find((p) => p.id === selectedPlan)!;
  const originalAmount = plan.price * 100; // paisa
  const finalAmount = couponApplied ? couponApplied.finalAmount : originalAmount;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
              {subStatus?.isTrial ? `${subStatus.daysRemaining} Days Left in Trial` : subStatus?.isActive ? "Active Subscription" : "Choose Your Plan"}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">
            CastHub <span className="text-primary">Pro</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-lg mx-auto text-lg">
            Supercharge your casting outreach with automation, AI, and multi-platform messaging.
          </p>
        </div>

        {/* Active Subscription Banner */}
        {subStatus?.isActive && !subStatus.isTrial && (
          <div className="flex items-center gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 animate-in slide-in-from-top">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-lg font-black text-emerald-400 uppercase tracking-widest">Active Subscription</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your <span className="font-bold text-foreground">{subStatus.planType}</span> plan is active until{" "}
                <span className="font-bold text-foreground">{subStatus.currentPeriodEnd ? format(new Date(subStatus.currentPeriodEnd), "MMMM d, yyyy") : "—"}</span>
                {subStatus.daysRemaining <= 5 && (
                  <span className="text-amber-400 font-bold"> ({subStatus.daysRemaining} days remaining)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((p) => {
            const isSelected = selectedPlan === p.id;
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                onClick={() => { setSelectedPlan(p.id); setCouponApplied(null); }}
                className={`relative cursor-pointer rounded-[2rem] p-px transition-all duration-500 hover:scale-[1.02] ${
                  isSelected
                    ? `bg-gradient-to-br ${p.gradient} shadow-2xl ${p.shadow}`
                    : "bg-border/30 hover:bg-border/50"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-foreground font-black text-[10px] uppercase tracking-widest px-4 py-1 border-none shadow-lg shadow-amber-500/20">
                      <Star className="w-3 h-3 mr-1" /> Most Popular
                    </Badge>
                  </div>
                )}
                <div className={`h-full rounded-[calc(2rem-1px)] p-8 ${isSelected ? "bg-background/95" : "bg-background/80"}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-lg ${p.shadow}`}>
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{p.name}</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subscription</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl font-black text-foreground">{p.priceLabel}</span>
                    <span className="text-muted-foreground font-bold">{p.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? `text-${p.color}-500` : "text-muted-foreground/50"}`} />
                        <span className="text-sm font-bold text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={`h-14 rounded-2xl flex items-center justify-center font-black text-sm uppercase tracking-widest transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${p.gradient} text-foreground shadow-xl ${p.shadow}`
                      : "bg-muted/40 text-muted-foreground border border-border/50"
                  }`}>
                    {isSelected ? "✓ Selected" : "Select Plan"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart / Checkout Section */}
        <div className="max-w-xl mx-auto space-y-6">
          {/* Coupon Code */}
          <div className="glass-card border-border rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Apply Coupon</h3>
            </div>

            {couponApplied ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-black text-emerald-400 uppercase">{couponApplied.code}</p>
                    <p className="text-xs text-muted-foreground">{couponApplied.discountPercent}% off applied</p>
                  </div>
                </div>
                <button onClick={removeCoupon} className="p-2 rounded-xl hover:bg-muted/50 bg-muted/20 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code..."
                  className="h-12 flex-1 rounded-xl bg-muted/40 border-border/50 font-black uppercase tracking-wider"
                />
                <Button
                  onClick={() => couponMutation.mutate()}
                  disabled={!couponCode.trim() || couponMutation.isPending}
                  className="h-12 px-6 rounded-xl bg-orange-500 text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-orange-600"
                >
                  {couponMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="glass-card border-border rounded-[2rem] p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" /> Order Summary
            </h3>

            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground">CastHub Pro — {plan.name}</span>
                <span className="text-sm font-bold text-foreground">₹{plan.price}</span>
              </div>
              {couponApplied && (
                <div className="flex items-center justify-between text-emerald-500">
                  <span className="text-sm font-bold">Coupon ({couponApplied.code})</span>
                  <span className="text-sm font-bold">-₹{(couponApplied.discountAmount / 100).toFixed(0)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-lg font-black text-foreground">Total</span>
                <span className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  ₹{(finalAmount / 100).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="flex items-center justify-center gap-6 py-3 opacity-40">
              <div className="flex flex-col items-center gap-1">
                <Smartphone className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wider">UPI</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Cards</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wider">NetBanking</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wider">Wallets</span>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              disabled={isProcessing}
              className="h-16 w-full rounded-[1.5rem] font-black text-foreground text-lg shadow-2xl transition-all active:scale-[0.98] bg-gradient-to-r from-amber-500 via-orange-500 to-orange-500 hover:opacity-90 shadow-amber-500/20 gap-3"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><Shield className="w-5 h-5" /> PAY ₹{(finalAmount / 100).toFixed(0)} <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>

            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest text-center">
              Secured by Razorpay · 256-bit SSL Encryption
            </p>
          </div>
        </div>

        {/* Payment History */}
        {historyData?.payments && historyData.payments.length > 0 && (
          <div className="max-w-3xl mx-auto glass-card border-border rounded-[2rem] p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Payment History
            </h3>
            <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/50">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-center">Method</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historyData.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs font-bold">
                        {format(new Date(p.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{p.invoice_number}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className="bg-muted/50 text-foreground border-none font-bold text-[10px] uppercase">{p.method || "—"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={p.status === "captured" ? "bg-emerald-500/20 text-emerald-500 border-none" : "bg-rose-500/20 text-rose-500 border-none"}>
                          {p.status?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-foreground">₹{(p.amount / 100).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
