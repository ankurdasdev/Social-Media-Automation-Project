import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Mail, MessageCircle, Instagram, ArrowRight, ShieldCheck } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-10 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
            Welcome to <span className="text-primary italic">CastHub</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
            Before you start automating your casting outreach, please review the security guidelines for each platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="glass-card border-white/5 border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp Automation</CardTitle>
                  <CardDescription>Baileys Evolution API</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                <strong className="text-foreground">Warning:</strong> WhatsApp automation carries a risk of account bans if abused. We strongly recommend using a dedicated business number. Please ensure you comply with WhatsApp's Terms of Service to avoid disruptions.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5 border-l-4 border-l-pink-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Instagram className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Instagram Monitoring</CardTitle>
                  <CardDescription>Instagrapi Integration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                <strong className="text-foreground">Privacy Note:</strong> Your Instagram session data is stored securely. Avoid excessive API calls within short timeframes to prevent action blocks. Connections use browser-direct authentication for session longevity.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/5 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Email Connections</CardTitle>
                  <CardDescription>Gmail Workspace & IMAP</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                <strong className="text-foreground">Security Alert:</strong> Ensure your app passwords are kept safe. Sending mass unsolicited emails may cause your messages to be routed to Spam. Always include clear opt-out methods.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center p-6 bg-muted/20 rounded-3xl border border-white/5">
          <div className="text-center space-y-6">
            <p className="text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              I have read and understand the connection risks.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/controller")} 
              className="h-14 px-8 rounded-2xl font-black bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-xl transition-all active:scale-95"
            >
              GO TO INTEGRATIONS CENTRE
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
