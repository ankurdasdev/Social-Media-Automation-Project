import { useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, setAuthToken } from "@/lib/utils";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    profileMutation.mutate({
      name,
      email,
      ...(password ? { password } : {})
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
            Account <span className="text-primary italic">Profile</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-lg">
            Manage your personal information and security settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-white/10 overflow-hidden relative group">
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

            <Card className="glass-card border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-primary" />
                        SYSTEM INFO
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">User ID</p>
                        <p className="text-xs font-mono bg-muted/50 p-2 rounded-lg truncate">{user?.userId}</p>
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Card className="glass-card border-white/10 overflow-hidden">
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
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10 overflow-hidden">
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
                      <Input 
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Confirm Password
                      </Label>
                      <Input 
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                      />
                    </div>
                  </div>
                </CardContent>
                <div className="p-8 bg-muted/20 border-t border-border/30 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={profileMutation.isPending}
                    className="h-14 px-10 rounded-2xl font-black bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all active:scale-95 gap-3"
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
