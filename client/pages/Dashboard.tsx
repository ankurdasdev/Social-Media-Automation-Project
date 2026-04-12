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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const recentContacts = [
    {
      name: "Rahul Sharma",
      project: "Web Series - Male Lead",
      date: "2 hours ago",
    },
    {
      name: "Priya Desai",
      project: "Film - Supporting Role",
      date: "5 hours ago",
    },
    {
      name: "Amit Kumar",
      project: "Ad Campaign - Brand Ambassador",
      date: "1 day ago",
    },
  ];

  const stats = [
    {
      label: "TOTAL CONTACTS",
      value: "2,481",
      icon: Users,
      color: "bg-blue-500/10 text-blue-500",
      trend: "+12.5%",
    },
    {
      label: "SYSTEM STATUS",
      value: "ONLINE",
      icon: Zap,
      color: "bg-emerald-500/10 text-emerald-500",
      trend: "STABLE",
    },
    {
      label: "OUTREACH RATE",
      value: "14.2%",
      icon: TrendingUp,
      color: "bg-purple-500/10 text-purple-500",
      trend: "+4.1%",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-16 pb-24 animate-in fade-in duration-1000">
        {/* Welcome Section / Hero Cluster */}
        <section className="relative group p-10 md:p-16 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-card/20 backdrop-blur-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent dark:from-primary/10" />
          
          <div className="relative flex flex-col lg:flex-row items-center gap-16 z-10">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(139,92,246,1)]" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Casting Automation System :: Operational</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.9] text-glow">
                AUTOMATE YOUR <br />
                <span className="italic text-primary">CASTING</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">OUTREACH</span>
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
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-[1.5rem] bg-background/30 backdrop-blur-md border border-white/10 hover:bg-muted/50 text-sm font-black transition-all hover:-translate-y-1 active:scale-95">
                    VIEW CONTACTS
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Element */}
            <div className="hidden xl:block relative w-[380px] h-[380px]">
               <div className="absolute inset-0 bg-primary/20 rounded-[4rem] rotate-12 blur-3xl opacity-30 animate-pulse" />
               <div className="glass-card relative w-full h-full rounded-[4rem] flex items-center justify-center border-white/20 shadow-[-20px_-20px_60px_-15px_rgba(139,92,246,0.3)]">
                  <div className="text-center space-y-4">
                     <p className="text-8xl font-black tracking-tighter text-glow translate-y-2">84%</p>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Outreach Success</p>
                     <div className="flex justify-center gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-primary' : 'bg-muted/40'} animate-pulse`} style={{ animationDelay: `${i * 100}ms` }} />)}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card border-white/10 dark:border-white/5 hover:border-primary/40 transition-all duration-500 group overflow-hidden rounded-[2.5rem]">
                <CardContent className="p-10 relative">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <Icon className="w-20 h-20" />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-3">
                        <p className="text-5xl font-black tracking-tighter">
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
           <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3 px-2">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Quick Navigation</h2>
              </div>
              <div className="space-y-4">
                  {[
                    { label: "Controller", desc: "Manage your message sources", icon: Settings, link: "/controller", color: "text-primary", bg: "bg-primary/5" },
                    { label: "Contacts", desc: "Manage your contact list", icon: Table, link: "/contacts", color: "text-blue-500", bg: "bg-blue-500/5" },
                    { label: "Analytics", desc: "View your performance stats", icon: BarChart3, link: "/analytics", color: "text-orange-500", bg: "bg-orange-500/5" },
                  ].map((nav, i) => (
                    <Link key={i} to={nav.link} className="block group">
                      <div className="p-6 glass-card rounded-3xl border-white/5 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-5 shadow-lg">
                        <div className={cn("p-4 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500", nav.bg, nav.color)}>
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
           <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                    <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Recent Contacts</h2>
                </div>
                <Link to="/contacts" className="text-[10px] font-black text-primary hover:underline tracking-widest uppercase">VIEW ALL</Link>
              </div>
              <Card className="glass-card border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div className="divide-y divide-white/[0.03]">
                    {recentContacts.map((contact, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-7 hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-muted to-muted/50 border border-white/5 flex items-center justify-center font-black text-xl text-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
                              {contact.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-black text-lg tracking-tight">{contact.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{contact.project}</span>
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500/70 uppercase">AUTO-SYNCED</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="px-4 py-1.5 rounded-xl border border-white/10 bg-muted/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                            {contact.date}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
           </div>
        </div>

        {/* Workflow Section */}
        <section className="space-y-10 pt-10">
           <div className="text-center space-y-3">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Integrated Pipeline</p>
              <h2 className="text-4xl font-black tracking-tighter">OUR WORKFLOW</h2>
              <p className="text-muted-foreground font-medium max-w-xl mx-auto">CastHub operates on a simple cycle designed for maximum outreach efficiency.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "01", title: "CONFIGURE", desc: "Add your contacts and organize them into sheets for better management.", icon: SlidersHorizontal, color: "from-primary to-purple-600" },
                { step: "02", title: "SYNC", desc: "Sync your contacts and monitor their status in real-time.", icon: TrendingUp, color: "from-secondary to-blue-600" },
                { step: "03", title: "REACH OUT", desc: "Send automated messages to your contacts via WhatsApp or Instagram.", icon: Zap, color: "from-accent to-orange-600" },
              ].map((item, i) => (
                <div key={i} className="glass-card h-[320px] p-10 rounded-[3rem] relative overflow-hidden group flex flex-col justify-between border-white/5 hover:border-primary/30 transition-all duration-700">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 -z-10 group-hover:scale-[2] transition-all duration-1000 blur-2xl`} />
                   
                   <div className="flex items-start justify-between">
                        <div className="w-16 h-16 rounded-[1.5rem] border border-white/10 glass-card flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500">
                            <item.icon className="w-8 h-8 text-foreground" />
                        </div>
                        <p className="text-6xl font-black opacity-[0.03] tracking-tighter group-hover:scale-125 transition-transform duration-700">{item.step}</p>
                   </div>
                   
                   <div className="space-y-4">
                      <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
                      <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </AppLayout>
  );
}

