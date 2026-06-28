import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageSquare, Send, CheckCircle2, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactUs() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/help/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error("Error submitting contact form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#060610] bg-background text-foreground flex flex-col">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-amber-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 dark:bg-[#060610]/80 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(245,168,0,0.4)]"
            draggable={false}
          />
          <span className="text-lg font-black tracking-tight">CAST<span className="text-primary italic">HUB</span></span>
        </Link>
        <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          Back to Login
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col md:flex-row gap-16 md:items-center">
        
        {/* Left Column - Text */}
        <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Get in Touch</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.1]">
            How can we<br/>help you?
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-sm">
            Have a question about our automation tools? Want to report a bug? Just send us a message and our team will get back to you shortly.
          </p>
          
          <div className="pt-8 space-y-6">
            <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground/60">Email Support</p>
                <p className="text-foreground">support@casthub.in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          <div className="glass-card bg-[#0a0a0a]/80 border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            {isSuccess ? (
              <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500 z-10">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Message Sent!</h3>
                <p className="text-muted-foreground font-medium">
                  Thanks for reaching out. We've received your message and will respond as soon as possible.
                </p>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  className="mt-4 h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest"
                >
                  Send Another
                </Button>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="w-3 h-3" /> Full Name
                </Label>
                <Input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe" 
                  required
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </Label>
                <Input 
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com" 
                  required
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</Label>
                <Input 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?" 
                  required
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</Label>
                <Textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..." 
                  required
                  className="min-h-[120px] resize-none rounded-xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner p-4"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-2 mt-4"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
              </Button>
            </form>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-md mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground/40 font-medium">© {new Date().getFullYear()} CastHub. All rights reserved.</p>
          <div className="flex gap-6 text-[11px] font-bold text-muted-foreground/60">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
