import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Settings2, 
  ShieldCheck, 
  BellRing, 
  Palette, 
  Globe, 
  Clock, 
  Smartphone, 
  Mail, 
  Moon, 
  Sun 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  
  // Dummy states for UI demonstration
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('casthub-theme', dark ? 'dark' : 'light');
  };

  const saveSettings = () => {
    toast.success("Settings saved successfully!");
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings2 },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "notifications", label: "Notifications", icon: BellRing },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black tracking-widest uppercase text-primary">
            <Settings2 className="w-3 h-3" />
            Preferences
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm font-medium max-w-lg">
            Manage your app preferences, notifications, and security settings.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-black">Regional Settings</CardTitle>
                    <CardDescription>Configure your language and timezone preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Language
                      </Label>
                      <Select defaultValue="en">
                        <SelectTrigger className="w-full md:w-[300px] h-12 rounded-xl bg-muted/30 border-border/50 font-bold">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent className="glass-card rounded-xl">
                          <SelectItem value="en" className="font-bold">English (US)</SelectItem>
                          <SelectItem value="es" className="font-bold">Español</SelectItem>
                          <SelectItem value="fr" className="font-bold">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Timezone
                      </Label>
                      <Select defaultValue="utc">
                        <SelectTrigger className="w-full md:w-[300px] h-12 rounded-xl bg-muted/30 border-border/50 font-bold">
                          <SelectValue placeholder="Select Timezone" />
                        </SelectTrigger>
                        <SelectContent className="glass-card rounded-xl">
                          <SelectItem value="utc" className="font-bold">UTC (Coordinated Universal Time)</SelectItem>
                          <SelectItem value="est" className="font-bold">EST (Eastern Standard Time)</SelectItem>
                          <SelectItem value="pst" className="font-bold">PST (Pacific Standard Time)</SelectItem>
                          <SelectItem value="ist" className="font-bold">IST (Indian Standard Time)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-black">Security Preferences</CardTitle>
                    <CardDescription>Keep your account secure with advanced protections.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="space-y-1 pr-6">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-primary" /> Two-Factor Authentication (2FA)
                        </Label>
                        <p className="text-xs font-medium text-muted-foreground">Add an extra layer of security to your account by requiring more than just a password to sign in.</p>
                      </div>
                      <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-black">Notification Settings</CardTitle>
                    <CardDescription>Choose how you want to be notified about activity.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="space-y-1 pr-6">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" /> Email Notifications
                        </Label>
                        <p className="text-xs font-medium text-muted-foreground">Receive daily summaries, critical alerts, and marketing emails.</p>
                      </div>
                      <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div className="space-y-1 pr-6">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <BellRing className="w-4 h-4 text-primary" /> Push Notifications
                        </Label>
                        <p className="text-xs font-medium text-muted-foreground">Receive real-time push alerts on your connected devices.</p>
                      </div>
                      <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-black">Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <button 
                        onClick={() => toggleTheme(false)}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                          !isDark ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <Sun className={`w-8 h-8 ${!isDark ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-bold text-sm">Light Mode</span>
                      </button>
                      <button 
                        onClick={() => toggleTheme(true)}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                          isDark ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <Moon className={`w-8 h-8 ${isDark ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-bold text-sm">Dark Mode</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <Button onClick={saveSettings} className="h-12 px-8 rounded-xl font-black shadow-xl shadow-primary/20">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
