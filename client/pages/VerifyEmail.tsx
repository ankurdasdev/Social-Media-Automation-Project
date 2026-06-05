import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { setAuthToken } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found in the link.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok) {
          setAuthToken(data.token);
          setStatus("success");
          // Redirect to setup wizard after 2.5s
          setTimeout(() => navigate("/setup", { replace: true }), 2500);
        } else {
          if (data.error?.includes("expired")) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setErrorMsg(data.error || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to resend email.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060610] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">

        {/* Loading */}
        {status === "loading" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center">
                <Loader2 className="w-9 h-9 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tighter text-foreground">Verifying your email...</h1>
              <p className="text-muted-foreground font-medium">Just a moment, we're confirming your account.</p>
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Email Verified</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground">You're all set! 🎉</h1>
              <p className="text-muted-foreground font-medium">
                Your email has been verified. Taking you to setup your workspace...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Redirecting to guided setup...
            </div>
          </div>
        )}

        {/* Expired */}
        {status === "expired" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center">
                <Mail className="w-9 h-9 text-amber-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tighter text-foreground">Link Expired</h1>
              <p className="text-muted-foreground font-medium">{errorMsg}</p>
            </div>

            {resendSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-400">Email sent!</p>
                  <p className="text-xs text-muted-foreground">Check your inbox for the new verification link.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                <p className="text-sm text-muted-foreground">Enter your email to get a new verification link:</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="h-11 flex-1 rounded-xl dark:border-border/50 bg-black/5 border-border text-foreground placeholder:text-foreground/20"
                  />
                  <Button
                    type="submit"
                    disabled={resendLoading}
                    className="h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 font-black gap-2"
                  >
                    {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center">
                <XCircle className="w-9 h-9 text-rose-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tighter text-foreground">Verification Failed</h1>
              <p className="text-muted-foreground font-medium">{errorMsg}</p>
            </div>
            <Link to="/login">
              <Button className="h-12 px-8 rounded-xl bg-foreground text-background font-black gap-2">
                Back to Login <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
