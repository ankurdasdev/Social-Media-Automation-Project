import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAuthToken } from "@/lib/utils";
import { AlertCircle, Loader2, KeyRound, Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNeedsVerification(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setVerificationEmail(data.email || formData.email);
        }
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      setAuthToken(data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Network error — please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setIsForgotOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to request reset");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
          <div className="flex flex-col gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {needsVerification && (
              <div className="pl-6 space-y-1">
                {resendSent ? (
                  <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Verification email sent! Check your inbox.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Resend verification email
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email or Phone Number</Label>
          <Input
            id="email"
            name="email"
            type="text"
            placeholder="you@example.com or 9876543210"
            value={formData.email}
            onChange={handleChange}
            required
            autoFocus
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
              <DialogTrigger asChild>
                <button type="button" className="text-xs font-semibold text-primary hover:underline transition-all">
                  Forgot password?
                </button>
              </DialogTrigger>
              <DialogContent className="glass-card sm:max-w-[425px]">
                <form onSubmit={handleResetPassword}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-primary" />
                        Reset Password
                    </DialogTitle>
                    <DialogDescription className="font-medium pt-2">
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6">
                    <Label htmlFor="reset-email" className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">
                      Email Address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold"
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                        type="submit" 
                        disabled={isResetLoading}
                        className="w-full h-12 rounded-xl font-black gap-2"
                    >
                      {isResetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SEND RESET LINK"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            className="h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-base font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
