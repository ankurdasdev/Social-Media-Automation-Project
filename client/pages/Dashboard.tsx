import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Table,
  BarChart3,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  SlidersHorizontal,
  LayoutDashboard,
  RefreshCw,
  Mail,
  MessageCircle,
  Instagram,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, getOrCreateUserId } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = getOrCreateUserId();

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/stats?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const recentContacts = statsData?.recent || [];
  
  const healthScore = statsData?.health?.score ?? 0;
  const healthTrend = statsData?.health?.trend ?? 0;
  const liveFeed = statsData?.liveFeed || [];
  const hasGamificationData = statsData?.total > 0 || liveFeed.length > 0;

  const getActionIcon = (action: string) => {
    const l = (action || "").toLowerCase();
    if (l.includes("email")) return { icon: Mail, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (l.includes("whatsapp")) return { icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (l.includes("instagram")) return { icon: Instagram, color: "text-pink-500", bg: "bg-pink-500/10" };
    return { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" };
  };


  const stats = [
    {
      label: "TOTAL CONTACTS",
      value: statsData?.total?.toLocaleString() || "0",
      icon: Users,
      color: "bg-blue-500/10 text-blue-500",
      trend: "LIVE",
      onClick: () => navigate("/contacts")
    },
    {
      label: "OUTREACH RATE",
      value: statsData?.total > 0 ? `${((statsData.success / statsData.total) * 100).toFixed(1)}%` : "0%",
      icon: TrendingUp,
      color: "bg-purple-500/10 text-purple-500",
      trend: "SUCCESS",
      onClick: () => navigate("/analytics")
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-16 pb-24 animate-in fade-in duration-1000">
        {/* Welcome Section / Hero Cluster */}
        <section id="tutorial-dashboard-welcome" className="relative group p-10 md:p-16 rounded-[3rem] overflow-hidden border border-border shadow-2xl bg-card/20 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent dark:from-primary/10" />
          
          <div className="relative flex flex-col lg:flex-row items-center gap-16 z-10">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground tracking-tighter leading-[1.1] text-glow break-words sm:break-normal max-w-full">
                AUTOMATE YOUR<br className="hidden sm:block" /> CASTING <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">OUTREACH</span>
              </h1>

              <p className="text-lg text-muted-foreground/80 max-w-2xl leading-relaxed font-medium">
                CastHub helps you manage cross-platform contacts to identify, track, and convert casting opportunities with ease. 
                Get started with your outreach below.
              </p>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                <Link to="/controller">
                  <Button size="lg" className="h-16 px-10 rounded-[1.5rem] bg-foreground text-background hover:bg-foreground/90 gap-4 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95">
                    <Zap className="w-5 h-5 fill-background" />
                    GO TO CONTROLLER
                  </Button>
                </Link>
                <Link to="/contacts">
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-[1.5rem] bg-background/30 backdrop-blur-md border border-border hover:bg-muted/50 text-sm font-black transition-all hover:-translate-y-1 active:scale-95">
                    VIEW CONTACTS
                  </Button>
                </Link>
              </div>
            </div>

            {/* Gamification Health Score & Live Feed */}
            <div className="hidden xl:flex flex-col gap-4 relative w-[400px]">
               <div className="absolute inset-0 bg-primary/20 rounded-[3rem] rotate-6 blur-3xl opacity-30 animate-pulse" />
               
               {/* Setup Checklist Overlay (When no data yet) */}
               {!hasGamificationData && !isStatsLoading && (
                 <div className="absolute inset-0 z-20 backdrop-blur-xl bg-background/70 rounded-[3rem] flex flex-col p-8 border border-border/50 overflow-hidden shadow-2xl">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
                    
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-1">Get Started</h3>
                    <p className="text-xs text-muted-foreground mb-6 font-medium">Complete these steps to unlock your dashboard metrics.</p>
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3 group cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Create Account</p>
                          <p className="text-[10px] text-muted-foreground font-medium">You're already here.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 group cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                          <span className="text-[10px] font-black text-muted-foreground group-hover:text-primary">2</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Connect a Source</p>
                          <p className="text-[10px] text-muted-foreground font-medium">Link WhatsApp or Instagram.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 group cursor-pointer">
                        <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                          <span className="text-[10px] font-black text-muted-foreground group-hover:text-primary">3</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Import Contacts</p>
                          <p className="text-[10px] text-muted-foreground font-medium">Add people to your database.</p>
                        </div>
                      </div>
                    </div>
                    
                    <Link to="/integrations">
                      <Button className="w-full mt-4 h-10 bg-foreground text-background hover:bg-foreground/90 font-black text-xs uppercase tracking-widest shadow-xl">
                        Connect Source Now <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                 </div>
               )}

               {/* Health Score Box */}
               <div className={cn("glass-card relative w-full rounded-[2.5rem] p-6 border-border shadow-2xl flex items-center gap-6 group transition-all duration-500", hasGamificationData ? "hover:border-emerald-500/30" : "opacity-30")}>
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (healthScore / 100))} className={cn(healthScore > 50 ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]", "transition-all duration-1000 ease-out")} />
                    </svg>
                    <span className="text-3xl font-black text-foreground group-hover:scale-110 transition-transform">{healthScore}</span>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Outreach Health</h3>
                    <p className="text-sm font-medium text-foreground/80 leading-tight">
                      {healthScore === 0 ? "No outreach attempted yet." : `Your campaigns are performing optimally. Success rate trend is `}
                      {healthScore > 0 && <span className={healthTrend >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                        {healthTrend > 0 ? "+" : ""}{healthTrend}%
                      </span>}
                    </p>
                  </div>
               </div>

               {/* Live Activity Feed */}
               <div className={cn("glass-card relative w-full rounded-[2.5rem] p-6 border-border shadow-2xl space-y-4 overflow-hidden h-[200px]", !hasGamificationData && "opacity-30")}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Feed</h3>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", hasGamificationData ? "animate-ping bg-emerald-400" : "bg-muted-foreground")}></span>
                        <span className={cn("relative inline-flex rounded-full h-2 w-2", hasGamificationData ? "bg-emerald-500" : "bg-muted-foreground")}></span>
                      </span>
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest", hasGamificationData ? "text-emerald-500" : "text-muted-foreground")}>
                        {hasGamificationData ? "Active" : "Idle"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 relative">
                    {/* Fading top/bottom mask for scrolling effect */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-card/80 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-card/80 to-transparent z-10" />
                    
                    <div className={cn("space-y-3 hover:[animation-play-state:paused]", liveFeed.length > 3 && "animate-[scroll_10s_linear_infinite]")}>
                      {liveFeed.map((activity: any, i: number) => {
                        const style = getActionIcon(activity.action);
                        const Icon = style.icon;
                        return (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors cursor-default">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
                              <Icon className={`w-4 h-4 ${style.color}`} />
                            </div>
                            <p className="text-xs font-bold text-foreground/80 truncate" title={activity.action}>{activity.action}</p>
                            <span className="text-[9px] text-muted-foreground ml-auto font-medium shrink-0">
                              {activity.date ? new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                          </div>
                        );
                      })}
                      {liveFeed.length === 0 && hasGamificationData && (
                        <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Global Statistics Grid */}
        <div id="tutorial-dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                onClick={stat.onClick}
                className={cn(
                  "glass-card border-border dark:border-border/50 hover:border-primary/40 transition-all duration-500 group overflow-hidden rounded-[2.5rem]",
                  stat.onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <CardContent className="p-10 relative">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Icon className="w-20 h-20" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <p className="text-5xl font-black tracking-tighter whitespace-nowrap">
                            {stat.value}
                        </p>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] px-2 py-0.5 rounded-lg">
                            {stat.trend}
                        </Badge>
                      </div>
                    </div>
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:rotate-12", stat.color)}>
                      <Icon className="w-8 h-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contacts & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Navigation */}
           <div id="tutorial-dashboard-nav" className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3 px-2">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Quick Navigation</h2>
              </div>
              <div className="space-y-4">
                  {[
                    { label: "Connect Your Channels", desc: "Connect WhatsApp, Gmail and Instagram", icon: Settings, link: "/integrations", color: "text-primary", bg: "bg-primary/5" },
                    { label: "Manage Your Templates", desc: "Create and edit message templates", icon: Table, link: "/templates", color: "text-blue-500", bg: "bg-blue-500/5" },
                    { label: "View Contacts", desc: "Manage your contact list", icon: Users, link: "/contacts", color: "text-emerald-500", bg: "bg-emerald-500/5" },
                    { label: "Set Up AI Auto Sourcing", desc: "AI-powered contact sourcing", icon: BarChart3, link: "/controller", color: "text-orange-500", bg: "bg-orange-500/5" },
                  ].map((nav, i) => (
                    <Link key={i} to={nav.link} className="block group">
                       <div className="p-6 glass-card rounded-3xl border-border/50 hover:border-border hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-5 shadow-lg">
                        <div className={cn("p-4 rounded-2xl border border-border group-hover:scale-110 transition-transform duration-500", nav.bg, nav.color)}>
                          <nav.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-base tracking-tight">{nav.label}</p>
                          <p className="text-xs font-medium text-muted-foreground/60">{nav.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
           </div>

           {/* Live Extraction Stream */}
           <div id="tutorial-dashboard-contacts" className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                    <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Recent Contacts</h2>
                </div>
                <Link to="/contacts" className="text-[10px] font-black text-primary hover:underline tracking-widest uppercase">VIEW ALL</Link>
              </div>
              <Card className="glass-card border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                    {recentContacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
                          <Users className="w-7 h-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground/40">No contacts yet</p>
                        <Link to="/contacts" className="text-xs text-primary font-bold hover:underline">Add your first contact →</Link>
                      </div>
                    ) : (
                      recentContacts.map((contact: any, index: number) => {
                        // Parse date string into human-readable date + time
                        const dateObj = contact.date ? new Date(contact.date) : null;
                        const dateStr = dateObj && !isNaN(dateObj.getTime())
                          ? dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                          : (typeof contact.date === "string" ? contact.date.split("T")[0] : "—");
                        const timeStr = dateObj && !isNaN(dateObj.getTime())
                          ? dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "";
                        const channel = contact.channel || "";

                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-6 hover:dark:bg-white/[0.02] hover:bg-black/5 transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-muted to-muted/50 border border-border/50 flex items-center justify-center font-black text-lg text-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {contact.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-base tracking-tight">{contact.name}</p>
                                {channel && (
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">{channel}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-0.5">
                              <p className="text-[10px] font-black text-foreground/70">{dateStr}</p>
                              {timeStr && <p className="text-[9px] font-medium text-muted-foreground/40">{timeStr}</p>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
           </div>
        </div>

        {/* How CastHub Works */}
        <section className="space-y-10 pt-10">
           <Link to="/how-it-works" className="group flex flex-col items-center justify-center text-center space-y-3 cursor-pointer outline-none">
              <div className="inline-flex items-center gap-4">
                <h2 className="text-4xl font-black tracking-tighter group-hover:text-primary transition-colors duration-300">How CastHub Works</h2>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:translate-x-2 transition-all duration-300 shadow-sm group-hover:shadow-primary/30">
                   <ArrowRight className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium max-w-xl mx-auto group-hover:text-foreground/80 transition-colors">
                Three simple steps to automate your outreach at scale. <span className="text-primary font-bold hidden sm:inline">Click to read the full guide.</span>
              </p>
           </Link>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "01", title: "CONFIGURE", desc: "Add your contacts and organize them into sheets for better management.", icon: SlidersHorizontal, color: "from-primary to-purple-600", cta: "Go to Controller", href: "/controller" },
                { step: "02", title: "SYNC", desc: "Sync your contacts and monitor their status in real-time.", icon: TrendingUp, color: "from-secondary to-blue-600", cta: "View Contacts", href: "/contacts" },
                { step: "03", title: "REACH OUT", desc: "Send automated messages to your contacts via WhatsApp, Gmail or Instagram.", icon: Zap, color: "from-accent to-orange-600", cta: "Start Outreach", href: "/controller" },
              ].map((item, i) => (
                <div key={i} className="glass-card h-[340px] p-10 rounded-[3rem] relative overflow-hidden group flex flex-col justify-between border-border/50 hover:border-primary/30 transition-all duration-700">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 -z-10 group-hover:scale-[2] transition-all duration-1000 blur-2xl`} />
                   
                   <div className="flex items-start justify-between">
                        <div className="w-16 h-16 rounded-[1.5rem] border border-border glass-card flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <item.icon className="w-8 h-8 text-foreground" />
                        </div>
                        <p className="text-6xl font-black opacity-[0.03] tracking-tighter group-hover:scale-125 transition-transform duration-700">{item.step}</p>
                   </div>
                   
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
                      <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">{item.desc}</p>
                      <Link to={item.href}>
                        <Button size="sm" className="h-9 px-5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black text-[10px] uppercase tracking-widest transition-all gap-2 mt-2">
                          {item.cta} <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </AppLayout>
  );
}

