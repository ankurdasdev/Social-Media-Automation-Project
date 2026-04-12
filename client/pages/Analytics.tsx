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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Mail, MessageCircle, TrendingUp } from "lucide-react";

// Sample data for daily view
const dailyData = [
  { date: "Jan 13", email: 8, whatsapp: 12 },
  { date: "Jan 14", email: 10, whatsapp: 15 },
  { date: "Jan 15", email: 6, whatsapp: 11 },
  { date: "Jan 16", email: 14, whatsapp: 18 },
  { date: "Jan 17", email: 12, whatsapp: 14 },
  { date: "Jan 18", email: 16, whatsapp: 20 },
];

// Sample data for weekly view
const weeklyData = [
  { week: "Week 1", email: 45, whatsapp: 65 },
  { week: "Week 2", email: 52, whatsapp: 72 },
  { week: "Week 3", email: 48, whatsapp: 68 },
  { week: "Week 4", email: 61, whatsapp: 85 },
];

// Sample data for monthly view
const monthlyData = [
  { month: "December", email: 180, whatsapp: 260 },
  { month: "January", email: 206, whatsapp: 305 },
];

// Success vs Failed data
const successData = [
  { name: "Successful", value: 145, fill: "#22c55e" },
  { name: "Failed", value: 28, fill: "#ef4444" },
];

export default function Analytics() {
  const [timeView, setTimeView] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );

  const getChartData = () => {
    switch (timeView) {
      case "weekly":
        return weeklyData;
      case "monthly":
        return monthlyData;
      default:
        return dailyData;
    }
  };

  const stats = [
    {
      label: "Total Reach-outs",
      value: "511",
      icon: MessageCircle,
      trend: "+12%",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Success Rate",
      value: "83.8%",
      icon: TrendingUp,
      trend: "+5.2%",
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      label: "Failed",
      value: "28",
      icon: Mail,
      trend: "-2.1%",
      color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
              Performance <span className="text-primary italic">Analytics</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg">
              Deconstruct outreach efficiency across all channels.
            </p>
          </div>
          <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl border border-border/50 shrink-0">
            {(["daily", "weekly", "monthly"] as const).map((view) => (
              <Button
                key={view}
                variant="ghost"
                size="sm"
                onClick={() => setTimeView(view)}
                className={`rounded-xl px-6 font-black text-[10px] tracking-widest uppercase transition-all ${
                  timeView === view 
                    ? "bg-background shadow-lg text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                {view}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card border-white/10 dark:border-white/5 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {stat.label}
                      </p>
                      <div className="space-y-1">
                        <p className="text-5xl font-black tracking-tighter text-foreground">
                          {stat.value}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                stat.trend.startsWith('+') 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                                {stat.trend}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                vs Last Period
                            </span>
                        </div>
                      </div>
                    </div>
                    <div className={`p-5 rounded-2xl ${stat.color} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 glass-card border-white/10 dark:border-white/5 shadow-xl">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight">Message Volume</CardTitle>
                  <CardDescription className="font-medium">
                    Number of messages sent across different platforms.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="h-[350px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                      </linearGradient>
                      <linearGradient id="barGradientSecondary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={1}/>
                        <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis 
                      dataKey={timeView === 'daily' ? 'date' : timeView === 'weekly' ? 'week' : 'month'} 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        borderWidth: '1px',
                        padding: '12px'
                      }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                      labelStyle={{ fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--primary))' }}
                    />
                    <Bar 
                        dataKey="email" 
                        fill="url(#barGradientPrimary)" 
                        radius={[6, 6, 0, 0]} 
                        barSize={16}
                        name="EMAIL SYSTEM" 
                    />
                    <Bar 
                        dataKey="whatsapp" 
                        fill="url(#barGradientSecondary)" 
                        radius={[6, 6, 0, 0]} 
                        barSize={16}
                        name="WHATSAPP STREAM" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* conversion Chart */}
          <Card className="glass-card border-white/10 dark:border-white/5 shadow-xl">
            <CardHeader className="p-8 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight">Success Rate</CardTitle>
                <CardDescription className="font-medium">Overall success rate of your outreach.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="h-[350px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={successData}
                      cx="50%"
                      cy="45%"
                      innerRadius={85}
                      outerRadius={115}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                    >
                      {successData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            style={{ filter: `drop-shadow(0 0 8px ${entry.fill}44)` }} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border px-4 py-3 rounded-2xl shadow-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                                <p className="text-xl font-black">{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom Legend */}
                <div className="flex flex-col gap-3 mt-4">
                    {successData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span className="text-xs font-black uppercase tracking-wider">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold">{item.value}</span>
                        </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <Card className="glass-card border-white/10 dark:border-white/5 shadow-2xl overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/50">
                {[
                    { label: "Email Sent", value: "206", trend: "+8.4%", color: "text-primary" },
                    { label: "WhatsApp Sent", value: "305", trend: "+17.3%", color: "text-secondary" },
                    { label: "Queue Latency", value: "42", trend: "Stable", color: "text-blue-500" },
                    { label: "Conversion Rate", value: "18.2%", trend: "+2.4%", color: "text-emerald-500" }
                ].map((item, i) => (
                    <div key={i} className="p-10 space-y-4 hover:bg-muted/30 transition-colors">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                        <div className="space-y-1">
                            <p className={`text-4xl font-black tracking-tighter ${item.color}`}>{item.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{item.trend} VS AVG</p>
                        </div>
                    </div>
                ))}
             </div>
        </Card>
      </div>
    </AppLayout>
  );
}
