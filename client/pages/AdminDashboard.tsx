import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";
import { 
  Users, Server, Activity, AlertTriangle, CheckCircle2, XCircle, 
  RefreshCw, ShieldCheck, Download, Loader2, Edit, KeySquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdminUser, ServerAnalytics, UserLog } from "@shared/api";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<ServerAnalytics>({
    queryKey: ["adminAnalytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  // Fetch Users
  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  // Fetch Logs
  const { data: logsData, isLoading: logsLoading } = useQuery<{ logs: UserLog[] }>({
    queryKey: ["adminLogs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs?days=30", {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  // Toggle User Status
  const toggleUserMutation = useMutation({
    mutationFn: async ({ id, is_active, is_admin }: { id: string; is_active?: boolean; is_admin?: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}` 
        },
        body: JSON.stringify({ is_active, is_admin }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User updated successfully");
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Reset Password
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (!res.ok) throw new Error("Failed to send reset link");
      return res.json();
    },
    onSuccess: (data) => toast.success(data.message || "Reset link sent!"),
    onError: (err: any) => toast.error(err.message)
  });

  const exportLogs = () => {
    if (!logsData?.logs) return;
    const csvRows = [
      ["Date", "User Email", "Action", "Status", "Details"].join(",")
    ];
    
    logsData.logs.forEach(log => {
      const date = new Date(log.created_at).toISOString();
      const email = log.user_email || "System/Unknown";
      const action = log.action;
      const status = log.status;
      const details = JSON.stringify(log.details || {}).replace(/"/g, '""'); // escape quotes for CSV
      csvRows.push([date, email, action, status, `"${details}"`].join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-primary" />
              System <span className="text-primary italic">Admin</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg">
              Manage users, track server health, and view system-wide audit trails.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md h-14 bg-muted/40 p-1 rounded-full mb-8">
            <TabsTrigger value="overview" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Activity className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Server className="w-4 h-4 mr-2" /> Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Business Stats */}
              <Card className="glass-card border-white/10 md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : analytics ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-6 rounded-3xl bg-muted/30 border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Users</span>
                        <span className="text-4xl font-black text-foreground">{analytics.business.totalUsers}</span>
                      </div>
                      <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Active Users</span>
                        <span className="text-4xl font-black text-emerald-500">{analytics.business.activeUsers}</span>
                      </div>
                      <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">24h Errors</span>
                        <span className="text-4xl font-black text-rose-500">{analytics.business.todayErrors}</span>
                      </div>
                      <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Server CPU</span>
                        <span className="text-4xl font-black text-blue-500">{analytics.server.cpuUsagePercent}%</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Memory Usage Gauge */}
              <Card className="glass-card border-white/10 md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  {analytics ? (
                    <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-[8px] border-muted">
                      <div 
                        className="absolute inset-0 rounded-full border-[8px] border-primary"
                        style={{ clipPath: `polygon(0 100%, 100% 100%, 100% ${100 - analytics.server.memUsagePercent}%, 0 ${100 - analytics.server.memUsagePercent}%)` }}
                      />
                      <div className="text-center">
                        <span className="text-3xl font-black">{Math.round(analytics.server.memUsagePercent)}%</span>
                        <span className="block text-[10px] font-bold text-muted-foreground uppercase mt-1">RAM Used</span>
                      </div>
                    </div>
                  ) : <Loader2 className="animate-spin text-muted-foreground w-8 h-8" />}
                </CardContent>
              </Card>

              {/* Quick Actions Feed */}
              <Card className="glass-card border-white/10 md:col-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">Recent Activity (Live)</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto max-h-[250px]">
                  {logsLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                  ) : logsData?.logs ? (
                    <div className="space-y-4">
                      {logsData.logs.slice(0, 10).map((log, i) => (
                        <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-colors">
                          <div className={`mt-1 p-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            {log.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{log.action}</p>
                            <p className="text-xs text-muted-foreground">{log.user_email || "System"} • {format(new Date(log.created_at), 'MMM d, HH:mm')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* ── USERS TAB ──────────────────────────────────────────────────────── */}
          <TabsContent value="users">
            <Card className="glass-card border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> User Management
                  </CardTitle>
                  <CardDescription>Activate, deactivate, or manage admin rights.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="rounded-2xl border border-white/5 overflow-hidden bg-background/50">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4 text-center">Contacts</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">Admin Access</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {usersData?.users.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-foreground">{u.name || "N/A"}</div>
                              <div className="text-muted-foreground">{u.email}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold">{u.total_contacts}</td>
                            <td className="px-6 py-4 text-center">
                              <Badge className={u.is_active ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}>
                                {u.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <Switch 
                                  checked={u.is_admin} 
                                  onCheckedChange={(checked) => toggleUserMutation.mutate({ id: u.id, is_admin: checked })}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" size="sm" 
                                className="rounded-full h-8 px-4 font-bold bg-transparent border-white/10 hover:bg-muted"
                                onClick={() => toggleUserMutation.mutate({ id: u.id, is_active: !u.is_active })}
                              >
                                {u.is_active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button 
                                variant="outline" size="sm" 
                                className="rounded-full h-8 px-4 font-bold bg-transparent border-white/10 hover:bg-muted"
                                onClick={() => resetPasswordMutation.mutate(u.id)}
                              >
                                <KeySquare className="w-4 h-4 mr-2" /> Reset Pwd
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── AUDIT LOGS TAB ────────────────────────────────────────────────── */}
          <TabsContent value="logs">
            <Card className="glass-card border-white/10 flex flex-col h-[70vh]">
              <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" /> 30-Day Audit Trail
                  </CardTitle>
                  <CardDescription>System-wide logs for troubleshooting and auditing.</CardDescription>
                </div>
                <Button 
                  onClick={exportLogs}
                  className="rounded-full font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl"
                >
                  <Download className="w-4 h-4 mr-2" /> EXPORT CSV
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                {logsLoading ? (
                  <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="flex-1 overflow-auto rounded-2xl border border-white/5 bg-background/50 relative">
                    <table className="w-full text-sm text-left">
                      <thead className="sticky top-0 bg-background/95 backdrop-blur z-10 text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-white/10 shadow-sm">
                        <tr>
                          <th className="px-6 py-4">Timestamp</th>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {logsData?.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs font-bold">
                              {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {log.user_email || "System"}
                            </td>
                            <td className="px-6 py-4 font-bold text-foreground">
                              {log.action}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`border-none ${log.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                {log.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-[300px] max-h-16 overflow-y-auto font-mono text-[10px] text-muted-foreground whitespace-pre-wrap bg-black/20 p-2 rounded-lg">
                                {log.details ? JSON.stringify(log.details, null, 2) : "-"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  );
}
