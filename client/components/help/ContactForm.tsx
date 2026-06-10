import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUser } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Send, Loader2, CheckCircle2, Star, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { HELP_CATEGORIES } from "@shared/api";
import type { HelpCategory } from "@shared/api";

export default function ContactForm() {
  const user = getCurrentUser();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState<HelpCategory | "">("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/help/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Your enquiry has been submitted! We'll get back to you soon.");
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !category || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (message.trim().length < 20) {
      toast.error("Please provide more detail in your message (at least 20 characters)");
      return;
    }
    submitMutation.mutate();
  };

  const handleFeedback = async (stars: number) => {
    setFeedbackRating(stars);
    try {
      await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars, context: "contact_form" }),
      });
    } catch { /* silent */ }
  };

  const handleReset = () => {
    setMessage("");
    setCategory("");
    setSubmitted(false);
    setFeedbackRating(0);
  };

  if (submitted) {
    return (
      <Card className="glass-card border-emerald-500/20 overflow-hidden">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-emerald-500">Enquiry Submitted!</h3>
            <p className="text-sm text-muted-foreground font-medium max-w-md">
              We've received your enquiry and sent it to our team. You'll hear back within 24 hours at <span className="font-bold text-foreground">{email}</span>.
            </p>
          </div>

          {/* Feedback rating */}
          <div className="space-y-3 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              How was your experience?
            </p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleFeedback(star)}
                  className="p-1.5 hover:scale-125 transition-transform"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      star <= feedbackRating
                        ? "text-amber-500 fill-amber-500"
                        : "text-amber-500/20 hover:text-amber-500/60"
                    )}
                  />
                </button>
              ))}
            </div>
            {feedbackRating > 0 && (
              <p className="text-xs font-bold text-emerald-500 animate-in fade-in duration-300">
                Thank you for your feedback! ⭐
              </p>
            )}
          </div>

          <Button
            onClick={handleReset}
            variant="outline"
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest mt-4"
          >
            Submit Another Enquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border overflow-hidden">
      <CardHeader className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10">
            <MessageSquareText className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-xl font-black tracking-tight">Contact Support</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              We'll respond within 24 hours
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as HelpCategory)}>
              <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold shadow-inner text-left">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="glass-card border-border bg-background/95 rounded-2xl z-[9999]">
                {HELP_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="font-bold py-3">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Message</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail (min 20 characters)..."
              rows={5}
              className="w-full rounded-2xl bg-muted/30 border border-border/50 font-bold shadow-inner px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none text-foreground placeholder:text-muted-foreground/50"
            />
            <div className="flex justify-between items-center">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                message.length >= 20 ? "text-emerald-500" : "text-muted-foreground/40"
              )}>
                {message.length}/20 min characters
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={submitMutation.isPending || !name.trim() || !email.trim() || !category || message.trim().length < 20}
              className="h-14 px-8 rounded-2xl font-black bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all active:scale-95 gap-3 text-sm"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SUBMITTING...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  SUBMIT ENQUIRY
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
