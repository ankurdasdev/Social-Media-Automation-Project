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
import { cn, getOrCreateUserId } from "@/lib/utils";

// Time-series views are now handled by statsData.daily

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const navigate = useNavigate();
  const userId = getOrCreateUserId();

  const { data: statsData } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/stats?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    }
  });

  const [timeView, setTimeView] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );

  // Use real data from backend
  const chartData = statsData?.daily || [];

  // Success vs Failed data
  const successPieData = [
    { name: "Successful", value: statsData?.success || 0, fill: "#22c55e", filter: "sent" },
    { name: "Failed", value: statsData?.failed || 0, fill: "#ef4444", filter: "failed" },
  ];

  const stats = [
    {
      label: "Total Reach-outs",
      value: (statsData?.success + statsData?.failed)?.toString() || "0",
      icon: MessageCircle,
      trend: "LIVE",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      onClick: () => navigate("/contacts")
    },
    {
      label: "Success Rate",
      value: statsData?.total > 0 ? `${((statsData.success / (statsData.success + statsData.failed || 1)) * 100).toFixed(1)}%` : "0%",
      icon: TrendingUp,
      trend: "SUCCESS",
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      onClick: () => navigate("/contacts?status=sent")
    },
    {
      label: "Failed",
      value: statsData?.failed?.toString() || "0",
      icon: Mail,
      trend: "ERROR",
      color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      onClick: () => navigate("/contacts?status=failed")
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
              <Card 
                key={index} 
                onClick={stat.onClick}
                className={cn(
                  "glass-card border-white/10 dark:border-white/5 overflow-hidden group hover:shadow-2xl transition-all duration-500 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                  stat.onClick ? "cursor-pointer" : ""
                )}
              >
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
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fontWeight: "900",
                        fill: "rgba(255,255,255,0.3)",
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fontWeight: "900",
                        fill: "rgba(255,255,255,0.3)",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      }}
                      itemStyle={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    />
                    <Bar
                      dataKey="whatsapp"
                      fill="#22c55e"
                      radius={[6, 6, 0, 0]}
                      barSize={30}
                      name="WhatsApp"
                    />
                    <Bar
                      dataKey="email"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      barSize={30}
                      name="Email"
                    />
                    <Bar
                      dataKey="instagram"
                      fill="#ec4899"
                      radius={[6, 6, 0, 0]}
                      barSize={30}
                      name="Instagram"
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
                      data={successPieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={85}
                      outerRadius={115}
                      paddingAngle={10}
                      dataKey="value"
                      stroke="none"
                      onClick={(data) => {
                        if (data && data.filter) {
                          navigate(`/contacts?status=${data.filter}`);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {successPieData.map((entry, index) => (
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
                    {successPieData.map((item, i) => (
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
                    { label: "Email Sent", value: statsData?.emailSent || "0", trend: "LIVE", color: "text-primary", filter: "email" },
                    { label: "WhatsApp Sent", value: statsData?.waSent || "0", trend: "LIVE", color: "text-secondary", filter: "whatsapp" },
                    { label: "Instagram Sent", value: statsData?.igSent || "0", trend: "LIVE", color: "text-blue-500", filter: "instagram" },
                    { label: "Conversion Rate", value: statsData?.total > 0 ? `${((statsData.success / (statsData.success + statsData.failed || 1)) * 100).toFixed(1)}%` : "0%", trend: "SUCCESS", color: "text-emerald-500", filter: "sent" }
                ].map((item, i) => (
                    <div 
                        key={i} 
                        onClick={() => {
                          if (item.filter === "sent") navigate("/contacts?status=sent");
                          else navigate(`/contacts?platform=${item.filter}`);
                        }}
                        className="p-10 space-y-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{item.label}</p>
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
