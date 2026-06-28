import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getCurrentUser, setAuthToken } from "@/lib/utils";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Fingerprint,
  AlertTriangle,
  Trash2,
  Crown,
  CreditCard,
  Clock,
  ExternalLink,
  Instagram,
  MapPin,
} from "lucide-react";
import { LocationPicker } from "@/components/ui/LocationPicker";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getOrCreateUserId } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = getOrCreateUserId();
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [instagram, setInstagram] = useState("");
  const [location, setLocation] = useState<{lat: number; lng: number; address?: string}>({lat: 0, lng: 0});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("casthub_token")}`
        },
        body: JSON.stringify({ userId: user?.userId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete account");
      }
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem("casthub_token");
      localStorage.removeItem("casthub_user_id");
      toast.success("Account permanently deleted");
      setTimeout(() => {
        window.location.href = "/signup";
      }, 1000);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("casthub_token")}` }
      });
      if (!res.ok) throw new Error("Failed to load user profile");
      const data = await res.json();
      return data.user;
    }
  });

  useEffect(() => {
    if (userProfile) {
      if (userProfile.name) setName(userProfile.name);
      if (userProfile.email) setEmail(userProfile.email);
      if (userProfile.gender) setGender(userProfile.gender);
      if (userProfile.dob) setDob(userProfile.dob);
      if (userProfile.instagram) setInstagram(userProfile.instagram);
      if (userProfile.location) setLocation(userProfile.location);
    }
  }, [userProfile]);

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user?.userId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Update local storage with the new token which contains the updated name/email
      if (data.token) {
        setAuthToken(data.token);
      }
      
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated successfully");
      setPassword("");
      setConfirmPassword("");
      
      // Force a slight delay and refresh to ensure all components (header/sidebar) pick up the JWT change
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const checkStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s += 1;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s += 1;
    if (/[^A-Za-z0-9]/.test(p) && p.length >= 10) s += 1;
    return s;
  };
  const passwordStrength = checkStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (password) {
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "Password must contain at least one uppercase letter";
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one special character";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    
    profileMutation.mutate({
      name,
      email,
      gender,
      dob,
      instagram,
      location,
      ...(password ? { password } : {})
    });
  };

  // Fetch subscription status
  const { data: subStatus } = useQuery<{
    planType: string; status: string; trialEnd: string | null;
    currentPeriodEnd: string | null; daysRemaining: number;
    isActive: boolean; isTrial: boolean; isExpired: boolean;
  }>({
    queryKey: ["subscription-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/subscription?userId=${userId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Fetch payment history
  const { data: historyData } = useQuery<{ payments: any[] }>({
    queryKey: ["payment-history", userId],
    queryFn: async () => {
      const res = await fetch(`/api/payments/history?userId=${userId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black tracking-widest uppercase text-primary">
            <User className="w-3 h-3" />
            Account Details
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
            Profile
          </h1>
          <p className="text-muted-foreground text-sm font-medium max-w-lg">
            Manage your personal information and security settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card/40 border-border/50 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
                <CardContent className="pt-10 pb-8 flex flex-col items-center relative z-10">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-primary via-primary/80 to-secondary p-1 shadow-2xl shadow-primary/20 mb-6 group-hover:scale-105 transition-all duration-500">
                        <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center">
                            <User className="w-14 h-14 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-center truncate w-full">{user?.name || "Member"}</h3>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Premium Identity</p>
                    
                    <div className="mt-8 w-full space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px]">VERIFIED</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security</span>
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Card className="bg-card/40 border-border/50 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Personal Details</CardTitle>
                  <CardDescription className="text-sm font-medium">Update your name and email address.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="w-3 h-3" /> Full Name
                      </Label>
                      <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Address
                      </Label>
                      <Input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="w-3 h-3" /> Gender
                      </Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner text-left">
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border bg-background/95 rounded-2xl z-[9999]">
                          <SelectItem value="male" className="font-bold py-3">Male</SelectItem>
                          <SelectItem value="female" className="font-bold py-3">Female</SelectItem>
                          <SelectItem value="other" className="font-bold py-3">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <User className="w-3 h-3" /> Date of Birth
                      </Label>
                      <Input 
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Instagram className="w-3 h-3" /> Instagram Handle
                      </Label>
                      <Input 
                        type="text"
                        placeholder="@username"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Location
                      </Label>
                      <LocationPicker 
                        label=""
                        value={location.lat !== 0 ? location : undefined} 
                        onChange={(loc) => setLocation(loc)} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Security Credentials</CardTitle>
                  <CardDescription className="text-sm font-medium">Change your account password below. Leave blank to keep current.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Lock className="w-3 h-3" /> New Password
                      </Label>
                      <div className="relative">
                        <Input 
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                              setFieldErrors(prev => ({ ...prev, password: "" }));
                            }
                          }}
                          className={`h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner ${fieldErrors.password ? "border-destructive" : ""}`}
                        />
                      </div>
                      {/* Password strength indicator */}
                      {password.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                passwordStrength >= level
                                  ? level === 1
                                    ? "bg-red-400"
                                    : level === 2
                                    ? "bg-yellow-400"
                                    : "bg-green-500"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                          <span className="text-[10px] font-black text-muted-foreground ml-1 uppercase tracking-widest whitespace-nowrap">
                            {passwordStrength === 1 ? "Weak" : passwordStrength === 2 ? "Fair" : "Strong"}
                          </span>
                        </div>
                      )}
                      {fieldErrors.password && (
                        <p className="text-sm text-destructive font-bold">{fieldErrors.password}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Confirm Password
                      </Label>
                      <div className="relative">
                        <Input 
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) {
                              setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                            }
                          }}
                          className={`h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner pr-10 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
                        />
                        {confirmPassword && password === confirmPassword && (
                          <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-green-500" />
                        )}
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-sm text-destructive font-bold">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <div className="p-8 bg-muted/20 border-t border-border/30 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={profileMutation.isPending}
                    className="h-14 px-10 rounded-[1.5rem] font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                  >
                    {profileMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    UPDATE PROFILE
                  </Button>
                </div>
              </Card>
            </form>

            {/* Danger Zone */}
            <div className="mt-8">
              <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight text-rose-500 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-muted-foreground">
                    Irreversible actions related to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/20">
                    <p className="text-sm font-bold text-rose-500 leading-relaxed">
                      Delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="h-14 px-8 rounded-2xl font-black bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-600/10 hover:shadow-rose-600/20 transition-all active:scale-95 gap-3"
                    >
                      <Trash2 className="w-5 h-5 shrink-0" />
                      DELETE ACCOUNT
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscription & Billing Card ────────────────────────────────────── */}
      <Card className="bg-[#0a0a0a] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
          <div>
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <Crown className="w-5 h-5 text-pink-500" /> Subscription & Billing
            </CardTitle>
            <CardDescription>Your current plan and payment history</CardDescription>
          </div>
          <Button
            onClick={() => navigate("/subscription")}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 gap-2"
          >
            <CreditCard className="w-4 h-4" /> Manage Plan
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 p-8 pt-4">
          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Plan</p>
              <p className="text-xl font-black text-foreground capitalize">{subStatus?.planType || "Trial"}</p>
            </div>
            <div className={`p-6 rounded-2xl border flex flex-col justify-center items-center ${
              subStatus?.isExpired ? "bg-rose-500/10 border-rose-500/20" :
              subStatus?.isTrial ? "bg-blue-500/10 border-blue-500/20" : "bg-emerald-500/10 border-emerald-500/20"
            }`}>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
              <Badge className={`border-none font-black uppercase text-xs px-3 py-1 ${
                subStatus?.isExpired ? "bg-rose-500/20 text-rose-500" :
                subStatus?.isTrial ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500"
              }`}>
                {subStatus?.isExpired ? "Expired" : subStatus?.isTrial ? "Trial" : "Active"}
              </Badge>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Days Left</p>
              <p className={`text-2xl font-black ${(subStatus?.daysRemaining || 0) <= 2 ? "text-rose-500" : "text-foreground"}`}>
                {subStatus?.daysRemaining ?? "—"}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Expires</p>
              <p className="text-sm font-bold text-foreground">
                {subStatus?.isTrial && subStatus.trialEnd
                  ? format(new Date(subStatus.trialEnd), "MMM d, yyyy")
                  : subStatus?.currentPeriodEnd
                  ? format(new Date(subStatus.currentPeriodEnd), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Payment History */}
          {historyData?.payments && historyData.payments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="w-3 h-3" /> Recent Payments
              </h4>
              <div className="rounded-2xl border border-border/50 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-center">Invoice</th>
                      <th className="px-4 py-2 text-center">Method</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {historyData.payments.slice(0, 5).map((p: any) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground font-bold">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                        <td className="px-4 py-2 text-center font-mono">{p.invoice_number}</td>
                        <td className="px-4 py-2 text-center"><Badge className="bg-muted/50 border-none text-[9px] uppercase font-bold">{p.method || "—"}</Badge></td>
                        <td className="px-4 py-2 text-right font-black text-foreground">₹{((p.amount || 0) / 100).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {historyData.payments.length > 5 && (
                <button onClick={() => navigate("/subscription")} className="text-[10px] font-black uppercase text-pink-500 hover:text-pink-400 flex items-center gap-1 mt-1">
                  View all {historyData.payments.length} payments <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="glass-card border-rose-500/20 bg-background/95 rounded-[2.5rem] shadow-2xl p-8 max-w-md animate-in zoom-in-95 duration-300 z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-rose-500 uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              CONFIRM DELETION
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed mt-4">
              To verify and confirm, please type your email <span className="text-foreground font-black select-all">{user?.email}</span> in the field below:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-6 space-y-3">
            <Input 
              type="text" 
              placeholder={user?.email || "Type email..."} 
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="h-14 rounded-2xl bg-muted/40 font-bold border-rose-500/20 focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="h-12 rounded-xl border-border font-black text-[10px] uppercase tracking-widest">
              CANCEL
            </AlertDialogCancel>
            <Button
              disabled={deleteConfirmationText !== user?.email || deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
              className="h-12 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-rose-600/10"
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              CONFIRM DELETE
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
