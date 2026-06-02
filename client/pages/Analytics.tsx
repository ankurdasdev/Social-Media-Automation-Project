import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import { Mail, MessageCircle, TrendingUp, AlertCircle, Bot, Filter, Users, Instagram, Zap, CalendarDays, BrainCircuit, Play } from "lucide-react";
import { cn, getOrCreateUserId } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const navigate = useNavigate();
  const userId = getOrCreateUserId();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/stats?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const aiDiagnoseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/analytics/diagnose-failures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to fetch AI diagnosis");
      return res.json();
    }
  });

  const chartData = statsData?.daily || [];
  const cohortData = statsData?.cohorts || [];
  const funnelData = statsData?.funnel || [];

  const successPieData = [
    { name: "Successful", value: statsData?.success || 0, fill: "#22c55e", filter: "sent" },
    { name: "Failed", value: statsData?.failed || 0, fill: "#ef4444", filter: "failed" },
  ];

  // Helper to determine AI "Next Best Action"
  const getNextBestAction = () => {
    if (!statsData) return { text: "Loading...", action: "Wait", link: "/contacts" };
    const { waSent, igSent, emailSent, waFailed, igFailed, emailFailed, total } = statsData;
    
    // Find the platform with the highest success to failure ratio
    const waRatio = waSent / (waSent + waFailed || 1);
    const igRatio = igSent / (igSent + igFailed || 1);
    const emailRatio = emailSent / (emailSent + emailFailed || 1);
    
    if (total === 0) {
      return { 
        text: "Your contact list is empty. Import your first Excel sheet to get started.", 
        action: "Import Contacts", 
        link: "/contacts" 
      };
    }

    if (igRatio > Math.max(waRatio, emailRatio)) {
      return { 
        text: "Instagram has the highest success rate right now. We highly recommend triggering an Instagram automation campaign on pending leads.", 
        action: "Run Instagram Campaign", 
        link: "/contacts?platform=instagram" 
      };
    } else if (waRatio > emailRatio) {
      return { 
        text: "WhatsApp has the highest success rate right now. We highly recommend triggering a WhatsApp campaign.", 
        action: "Run WhatsApp Campaign", 
        link: "/contacts?platform=whatsapp" 
      };
    } else {
      return { 
        text: "Email currently has your best delivery rate. Launch a new email blast to your pending contacts.", 
        action: "Run Email Campaign", 
        link: "/contacts?platform=email" 
      };
    }
  };

  const nextAction = getNextBestAction();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl uppercase">
              Command <span className="text-primary italic">Center</span>
            </h1>
            <p className="text-muted-foreground font-bold tracking-widest uppercase text-[11px]">
              AI-Powered Lead Conversion & Telemetry
            </p>
          </div>
          <Button 
            onClick={() => navigate("/contacts")}
            className="h-12 px-6 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black shadow-xl"
          >
            <Filter className="w-4 h-4 mr-2" /> GO TO CONTACTS
          </Button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Uploaded", value: statsData?.total || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { label: "Successfully Reached", value: statsData?.success || 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { label: "Total Failed", value: statsData?.failed || 0, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
            { label: "Overall Conversion", value: statsData?.total > 0 ? `${((statsData.success / (statsData.success + statsData.failed || 1)) * 100).toFixed(1)}%` : "0%", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
          ].map((stat, i) => (
            <Card key={i} className={cn("glass-card overflow-hidden", stat.border)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className={cn("text-4xl font-black tracking-tighter", stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("p-4 rounded-2xl shadow-lg", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Action Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Failure Autopsy */}
          <Card className="lg:col-span-2 glass-card border-red-500/30 shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)] flex flex-col">
            <CardHeader className="p-6 border-b border-red-500/10 bg-red-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-500"><Bot className="w-5 h-5" /></div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight text-red-500">AI Failure Autopsy</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">Diagnose exactly why outreach is failing</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => aiDiagnoseMutation.mutate()} 
                  disabled={aiDiagnoseMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-6 shadow-lg shadow-red-500/20"
                >
                  {aiDiagnoseMutation.isPending ? "Diagnosing..." : "Run AI Diagnosis"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 p-4 rounded-2xl bg-muted/30 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/contacts?status=failed&platform=whatsapp")}>
                  <div className="flex items-center gap-3"><MessageCircle className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WA Failed</span></div>
                  <span className="text-lg font-black">{statsData?.waFailed || 0}</span>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-muted/30 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/contacts?status=failed&platform=email")}>
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Failed</span></div>
                  <span className="text-lg font-black">{statsData?.emailFailed || 0}</span>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-muted/30 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/contacts?status=failed&platform=instagram")}>
                  <div className="flex items-center gap-3"><Instagram className="w-4 h-4 text-pink-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">IG Failed</span></div>
                  <span className="text-lg font-black">{statsData?.igFailed || 0}</span>
                </div>
              </div>

              <div className="flex-1 bg-[#0a0a0a] rounded-2xl border border-white/10 p-5 font-mono text-sm text-emerald-400 overflow-y-auto relative min-h-[150px]">
                {!aiDiagnoseMutation.data && !aiDiagnoseMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">
                    Awaiting command...
                  </div>
                )}
                {aiDiagnoseMutation.isPending && (
                  <div className="flex items-center gap-2 text-primary">
                    <span className="w-2 h-4 bg-primary animate-pulse" /> Analyzing server logs...
                  </div>
                )}
                {aiDiagnoseMutation.data?.diagnosis && (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    <div className="text-muted-foreground text-xs mb-4">{"// AI DIAGNOSIS COMPLETE"}</div>
                    {aiDiagnoseMutation.data.diagnosis}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Next Best Action */}
          <Card className="glass-card border-primary/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)] flex flex-col">
            <CardHeader className="p-6 border-b border-primary/10 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary"><BrainCircuit className="w-5 h-5" /></div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tight text-primary">Next Best Action</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Predictive Automation Engine</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
              <p className="text-sm font-medium leading-relaxed text-foreground/80">
                {nextAction.text}
              </p>
              
              <Button 
                onClick={() => navigate(nextAction.link)}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/30 gap-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" /> {nextAction.action}
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Lead Velocity Pipeline (Funnel) & Platform Performance Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="glass-card border-white/10 shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-black tracking-tight">Lead Velocity Pipeline</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Identify drop-offs in your funnel</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="step" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "rgba(255,255,255,0.7)" }} width={140} />
                    <Tooltip 
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      itemStyle={{ fontWeight: "black" }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={40}>
                      {funnelData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#22c55e'][index % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-white/10 shadow-xl">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">30-Day Activity Heatmap</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Successful vs Failed Outreach Volume</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="totalSuccess" name="Successful" fill="#22c55e" stroke="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                    <Bar dataKey="totalFailed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={10} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Smart Cohort Comparison */}
        <Card className="glass-card border-white/10 shadow-xl">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black tracking-tight">Smart Cohort Analysis</CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-widest">A/B Testing: Compare performance across different imported sheets</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {cohortData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground font-black text-xs uppercase tracking-widest border border-dashed border-white/10 rounded-3xl">
                No cohort data available yet. Import sheets to see A/B testing.
              </div>
            ) : (
              <div className="h-[400px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="sheet" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "rgba(255,255,255,0.5)" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                    <Tooltip 
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                    />
                    <Bar dataKey="success" name="Success" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} barSize={40} />
                    <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
