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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your casting call reach-outs and success metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        {stat.trend} this month
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reach-outs Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reach-outs Over Time</CardTitle>
                  <CardDescription>
                    Email vs WhatsApp outreach performance
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={timeView === "daily" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeView("daily")}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={timeView === "weekly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeView("weekly")}
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={timeView === "monthly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeView("monthly")}
                  >
                    Monthly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="email" fill="var(--primary)" name="Email" />
                  <Bar dataKey="whatsapp" fill="var(--secondary)" name="WhatsApp" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success vs Failed Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Success vs Failed</CardTitle>
              <CardDescription>Overall reach-out status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={successData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {successData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Performance Metrics</CardTitle>
            <CardDescription>
              Comprehensive breakdown of reach-out performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Email Sent</p>
                <p className="text-2xl font-bold text-foreground mt-2">206</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ↑ 8.4% increase
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">WhatsApp Sent</p>
                <p className="text-2xl font-bold text-foreground mt-2">305</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ↑ 17.3% increase
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground mt-2">42</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  → No change
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-foreground mt-2">18.2%</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ↑ 2.4% increase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
