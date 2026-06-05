import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/utils";
import { 
  Users, Server, Activity, AlertTriangle, CheckCircle2, XCircle, 
  RefreshCw, ShieldCheck, Download, Loader2, Edit, KeySquare,
  CreditCard, Tag, Settings2, Crown, Clock, Trash2, Plus,
  BadgePercent, Timer, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdminUser, ServerAnalytics, UserLog } from "@shared/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Coupon form state
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponMaxUses, setNewCouponMaxUses] = useState("");
  const [newCouponExpiry, setNewCouponExpiry] = useState("");

  // Settings state
  const [adminEmail, setAdminEmail] = useState("");
  const [extendDays, setExtendDays] = useState<Record<string,string>>({});

  // Pagination & Filtering State
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(50);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStatusFilter, setLogsStatusFilter] = useState("all");

  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(25);
  const [usersSearch, setUsersSearch] = useState("");

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch Analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<ServerAnalytics>({
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

  // Keep track of refresh cycle
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    refetchAnalytics();
    setCountdown(30);
    setLastRefreshed(new Date());
  };

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

  // Fetch Payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ payments: any[] }>({
    queryKey: ["adminPayments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "payments",
  });

  // Fetch Subscriptions
  const { data: subsData } = useQuery<{ subscriptions: any[] }>({
    queryKey: ["adminSubscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "payments",
  });

  // Fetch Coupons
  const { data: couponsData } = useQuery<{ coupons: any[] }>({
    queryKey: ["adminCoupons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/coupons", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "coupons",
  });

  // Fetch Settings
  const { data: settingsData } = useQuery<{ settings: Record<string,string> }>({
    queryKey: ["adminSettings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "settings",
    staleTime: 0,
  });

  useEffect(() => {
    if (settingsData?.settings?.admin_notification_email) {
      setAdminEmail(settingsData.settings.admin_notification_email);
    }
  }, [settingsData]);

  // Create Coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          code: newCouponCode,
          discountPercent: parseInt(newCouponDiscount),
          maxUses: newCouponMaxUses ? parseInt(newCouponMaxUses) : 0,
          validUntil: newCouponExpiry || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Coupon created!");
      queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
      setNewCouponCode(""); setNewCouponDiscount(""); setNewCouponMaxUses(""); setNewCouponExpiry("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Delete Coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success("Coupon deactivated"); queryClient.invalidateQueries({ queryKey: ["adminCoupons"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Revoke Trial mutation
  const revokeTrialMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/revoke-trial`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success("Trial revoked"); queryClient.invalidateQueries({ queryKey: ["adminSubscriptions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Extend Trial mutation
  const extendTrialMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (d) => { toast.success(d.message); queryClient.invalidateQueries({ queryKey: ["adminSubscriptions"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Save Settings mutation
  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { toast.success("Setting saved!"); queryClient.invalidateQueries({ queryKey: ["adminSettings"] }); },
    onError: (e: Error) => toast.error(e.message),
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

  // Filter & Paginate Users locally
  const filteredUsers = (usersData?.users || []).filter(u => 
    u.name?.toLowerCase().includes(usersSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(usersSearch.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPageSize);

  // Filter & Paginate Logs locally
  const filteredLogs = (logsData?.logs || []).filter(log => {
    const matchesSearch = log.user_email?.toLowerCase().includes(logsSearch.toLowerCase()) || log.action.toLowerCase().includes(logsSearch.toLowerCase());
    const matchesStatus = logsStatusFilter === "all" || log.status === logsStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const paginatedLogs = filteredLogs.slice((logsPage - 1) * logsPageSize, logsPage * logsPageSize);
  const logsTotalPages = Math.ceil(filteredLogs.length / logsPageSize);

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
          <TabsList className="grid grid-cols-6 w-full h-14 bg-muted/40 p-1 rounded-full mb-8">
            <TabsTrigger value="overview" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Activity className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <CreditCard className="w-4 h-4 mr-2" /> Payments
            </TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Tag className="w-4 h-4 mr-2" /> Coupons
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Server className="w-4 h-4 mr-2" /> Audit Trail
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
              <Settings2 className="w-4 h-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Business Stats */}
              <Card className="glass-card border-white/10 md:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> System Health
                  </CardTitle>
                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                    <span>Next update in {countdown}s</span>
                    <Button variant="outline" size="sm" onClick={handleManualRefresh} className="h-8 rounded-xl bg-muted/50 hover:bg-muted font-black border-white/10">
                      <RefreshCw className={`w-3.5 h-3.5 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} /> REFRESH NOW
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {analyticsLoading && !analytics ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Skeleton className="h-[120px] rounded-3xl bg-muted/40" />
                      <Skeleton className="h-[120px] rounded-3xl bg-muted/40" />
                      <Skeleton className="h-[120px] rounded-3xl bg-muted/40" />
                      <Skeleton className="h-[120px] rounded-3xl bg-muted/40" />
                    </div>
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
                        className="absolute inset-0 rounded-full border-[8px] border-primary transition-all duration-1000 ease-out"
                        style={{ clipPath: `polygon(0 100%, 100% 100%, 100% ${100 - analytics.server.memUsagePercent}%, 0 ${100 - analytics.server.memUsagePercent}%)` }}
                      />
                      <div className="text-center">
                        <span className="text-3xl font-black">{Math.round(analytics.server.memUsagePercent)}%</span>
                        <span className="block text-[10px] font-bold text-muted-foreground uppercase mt-1">RAM Used</span>
                      </div>
                    </div>
                  ) : <Skeleton className="w-40 h-40 rounded-full bg-muted/40" />}
                </CardContent>
              </Card>

              {/* Quick Actions Feed */}
              <Card className="glass-card border-white/10 md:col-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight">Recent Activity (Live)</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto max-h-[250px]">
                  {logsLoading && !logsData ? (
                    <div className="space-y-4">
                      <Skeleton className="h-14 w-full rounded-2xl bg-muted/40" />
                      <Skeleton className="h-14 w-full rounded-2xl bg-muted/40" />
                      <Skeleton className="h-14 w-full rounded-2xl bg-muted/40" />
                    </div>
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
                <div className="flex items-center gap-3 w-[300px]">
                  <Input 
                    placeholder="Search by name or email..." 
                    value={usersSearch}
                    onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                    className="h-10 rounded-xl bg-muted/50 border-white/10 font-bold"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading && !usersData ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
                    <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
                    <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 overflow-hidden bg-background/50">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4 text-center">Contacts</th>
                          <th className="px-6 py-4 text-center">Email Status</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-center">Admin Access</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {paginatedUsers.length > 0 ? paginatedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-foreground">{u.name || "N/A"}</div>
                              <div className="text-muted-foreground">{u.email}</div>
                              {(u as any).phone && <div className="text-xs text-muted-foreground/50">{(u as any).phone}</div>}
                            </td>
                            <td className="px-6 py-4 text-center font-bold">{u.total_contacts}</td>
                            <td className="px-6 py-4 text-center">
                              {(u as any).email_verified ? (
                                <Badge className="bg-emerald-500/20 text-emerald-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-500/20 text-amber-500">
                                  <Mail className="w-3 h-3 mr-1" /> Unverified
                                </Badge>
                              )}
                            </td>
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
                              {!(u as any).email_verified && (
                                <Button
                                  variant="outline" size="sm"
                                  className="rounded-full h-8 px-4 font-bold bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                                  onClick={async () => {
                                    const res = await fetch(`/api/admin/users/${u.id}/resend-verification`, {
                                      method: "POST",
                                      headers: { Authorization: `Bearer ${getAuthToken()}` },
                                    });
                                    const data = await res.json();
                                    if (res.ok) toast.success(data.message);
                                    else toast.error(data.error);
                                  }}
                                >
                                  <Mail className="w-4 h-4 mr-2" /> Resend Email
                                </Button>
                              )}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="text-center py-10 font-bold text-muted-foreground">No users found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Pagination Controls */}
                {!usersLoading && usersTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-bold text-muted-foreground">Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)} className="rounded-lg h-8">Prev</Button>
                      <span className="flex items-center px-2 text-xs font-bold">Page {usersPage} of {usersTotalPages}</span>
                      <Button variant="outline" size="sm" disabled={usersPage === usersTotalPages} onClick={() => setUsersPage(p => p + 1)} className="rounded-lg h-8">Next</Button>
                    </div>
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
                <div className="flex items-center gap-3">
                  <Input 
                    placeholder="Search logs..." 
                    value={logsSearch}
                    onChange={(e) => { setLogsSearch(e.target.value); setLogsPage(1); }}
                    className="h-10 w-[200px] rounded-xl bg-muted/50 border-white/10 font-bold"
                  />
                  <Select value={logsStatusFilter} onValueChange={(val) => { setLogsStatusFilter(val); setLogsPage(1); }}>
                    <SelectTrigger className="h-10 w-[140px] rounded-xl bg-muted/50 border-white/10 font-bold">
                      <SelectValue placeholder="Status Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={exportLogs}
                    className="h-10 rounded-xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl"
                  >
                    <Download className="w-4 h-4 mr-2" /> EXPORT CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                {logsLoading && !logsData ? (
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl bg-muted/40" />
                    <Skeleton className="h-12 w-full rounded-xl bg-muted/40" />
                    <Skeleton className="h-12 w-full rounded-xl bg-muted/40" />
                    <Skeleton className="h-12 w-full rounded-xl bg-muted/40" />
                    <Skeleton className="h-12 w-full rounded-xl bg-muted/40" />
                  </div>
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
                        {paginatedLogs.length > 0 ? paginatedLogs.map((log) => (
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
                        )) : (
                          <tr><td colSpan={5} className="text-center py-10 font-bold text-muted-foreground">No logs match your filter.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Logs Pagination Controls */}
                {!logsLoading && logsTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-bold text-muted-foreground">Showing {paginatedLogs.length} of {filteredLogs.length} logs</span>
                    <div className="flex items-center gap-4">
                      <Select value={logsPageSize.toString()} onValueChange={(val) => { setLogsPageSize(Number(val)); setLogsPage(1); }}>
                        <SelectTrigger className="h-8 w-[100px] text-xs font-bold bg-muted/30 border-white/10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                          <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={logsPage === 1} onClick={() => setLogsPage(p => p - 1)} className="rounded-lg h-8">Prev</Button>
                        <span className="flex items-center px-2 text-xs font-bold">Page {logsPage} of {logsTotalPages}</span>
                        <Button variant="outline" size="sm" disabled={logsPage === logsTotalPages} onClick={() => setLogsPage(p => p + 1)} className="rounded-lg h-8">Next</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* ── PAYMENTS TAB ────────────────────────────────────────────────── */}
          <TabsContent value="payments" className="space-y-6">
            {/* Revenue Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["total_revenue", "monthly_count", "weekly_count", "trial_count"].map((_, i) => {
                const payments = paymentsData?.payments || [];
                const subs = subsData?.subscriptions || [];
                const cards = [
                  { label: "Total Revenue", value: `₹${(payments.filter(p => p.status === "captured").reduce((s: number, p: any) => s + (p.amount || 0), 0) / 100).toFixed(0)}`, color: "emerald" },
                  { label: "Active Subs", value: subs.filter(s => s.status === "active").length, color: "blue" },
                  { label: "On Trial", value: subs.filter(s => s.status === "trialing").length, color: "purple" },
                  { label: "Expired", value: subs.filter(s => s.status === "expired").length, color: "rose" },
                ];
                const c = cards[i];
                return (
                  <div key={i} className={`p-6 rounded-3xl bg-${c.color}-500/10 border border-${c.color}-500/20 text-center`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest text-${c.color}-500 mb-2`}>{c.label}</p>
                    <p className={`text-4xl font-black text-${c.color}-500`}>{c.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Subscriptions Table */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2"><Crown className="w-5 h-5 text-pink-500" /> Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-white/5 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-center">Plan</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Expires</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(subsData?.subscriptions || []).map((s: any) => (
                        <tr key={s.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="font-bold">{s.user_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{s.user_email}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className="bg-pink-500/20 text-pink-500 border-none font-black uppercase">{s.plan_type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`border-none font-black uppercase ${
                              s.status === "active" ? "bg-emerald-500/20 text-emerald-500" :
                              s.status === "trialing" ? "bg-blue-500/20 text-blue-500" :
                              "bg-rose-500/20 text-rose-500"
                            }`}>{s.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                            {s.status === "trialing" ? (s.trial_end ? format(new Date(s.trial_end), "MMM d, yyyy") : "—") :
                             s.current_period_end ? format(new Date(s.current_period_end), "MMM d, yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                min="1" max="365"
                                placeholder="Days"
                                value={extendDays[s.user_id] || ""}
                                onChange={(e) => setExtendDays(prev => ({ ...prev, [s.user_id]: e.target.value }))}
                                className="h-8 w-20 rounded-lg text-xs bg-muted/40 border-white/10"
                              />
                              <Button size="sm" variant="outline"
                                className="h-8 rounded-lg font-bold text-[10px] bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                                onClick={() => extendTrialMutation.mutate({ userId: s.user_id, days: parseInt(extendDays[s.user_id] || "7") })}
                              ><Timer className="w-3 h-3 mr-1" /> Extend</Button>
                              {s.status === "trialing" && (
                                <Button size="sm" variant="outline"
                                  className="h-8 rounded-lg font-bold text-[10px] bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                  onClick={() => revokeTrialMutation.mutate(s.user_id)}
                                ><XCircle className="w-3 h-3 mr-1" /> Revoke</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Payments History Table */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500" /> Payment Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-white/5 overflow-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-center">Invoice</th>
                        <th className="px-4 py-3 text-center">Method</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paymentsLoading ? (
                        <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-pink-500" /></td></tr>
                      ) : (paymentsData?.payments || []).map((p: any) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 text-xs text-muted-foreground font-bold">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-sm">{p.user_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{p.user_email}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-xs">{p.invoice_number}</td>
                          <td className="px-4 py-3 text-center"><Badge className="bg-muted/50 border-none text-[10px] font-bold uppercase">{p.method || "—"}</Badge></td>
                          <td className="px-4 py-3 text-center"><Badge className={`border-none text-[10px] font-bold uppercase ${p.status === "captured" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>{p.status}</Badge></td>
                          <td className="px-4 py-3 text-right font-black">₹{((p.amount || 0) / 100).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── COUPONS TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="coupons" className="space-y-6">
            {/* Create Coupon Form */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2"><Plus className="w-5 h-5 text-purple-500" /> Create Coupon Code</CardTitle>
                <CardDescription>Create discount coupons for your users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Code <span className="text-pink-500">*</span></Label>
                    <Input placeholder="LAUNCH50" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                      className="h-12 rounded-xl bg-muted/40 border-white/10 font-black uppercase tracking-widest" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Discount % <span className="text-pink-500">*</span></Label>
                    <Input type="number" min="1" max="100" placeholder="20" value={newCouponDiscount} onChange={e => setNewCouponDiscount(e.target.value)}
                      className="h-12 rounded-xl bg-muted/40 border-white/10 font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Max Uses <span className="text-muted-foreground">(0 = unlimited)</span></Label>
                    <Input type="number" min="0" placeholder="0" value={newCouponMaxUses} onChange={e => setNewCouponMaxUses(e.target.value)}
                      className="h-12 rounded-xl bg-muted/40 border-white/10 font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Expiry Date <span className="text-muted-foreground">(optional)</span></Label>
                    <Input type="date" value={newCouponExpiry} onChange={e => setNewCouponExpiry(e.target.value)}
                      className="h-12 rounded-xl bg-muted/40 border-white/10 font-black" />
                  </div>
                </div>
                <Button
                  onClick={() => createCouponMutation.mutate()}
                  disabled={!newCouponCode || !newCouponDiscount || createCouponMutation.isPending}
                  className="mt-4 h-12 px-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:opacity-90 gap-2"
                >
                  {createCouponMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  CREATE COUPON
                </Button>
              </CardContent>
            </Card>

            {/* Coupons List */}
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2"><BadgePercent className="w-5 h-5 text-purple-500" /> All Coupons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-white/5 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs font-black uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Code</th>
                        <th className="px-4 py-3 text-center">Discount</th>
                        <th className="px-4 py-3 text-center">Used / Max</th>
                        <th className="px-4 py-3 text-center">Expires</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(couponsData?.coupons || []).length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-10 text-muted-foreground font-bold">No coupons yet. Create one above!</td></tr>
                      ) : (couponsData?.coupons || []).map((c: any) => (
                        <tr key={c.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-black font-mono text-purple-400 tracking-widest">{c.code}</td>
                          <td className="px-4 py-3 text-center"><Badge className="bg-purple-500/20 text-purple-500 border-none font-black">{c.discount_percent}% OFF</Badge></td>
                          <td className="px-4 py-3 text-center font-bold text-muted-foreground">{c.used_count} / {c.max_uses === 0 ? "∞" : c.max_uses}</td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground font-bold">{c.valid_until ? format(new Date(c.valid_until), "MMM d, yyyy") : "No Expiry"}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`border-none font-black uppercase ${c.is_active ? "bg-emerald-500/20 text-emerald-500" : "bg-muted/50 text-muted-foreground"}`}>
                              {c.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.is_active && (
                              <Button size="sm" variant="outline"
                                className="h-8 rounded-lg border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-black text-[10px]"
                                onClick={() => deleteCouponMutation.mutate(c.id)}
                              ><Trash2 className="w-3 h-3 mr-1" /> Deactivate</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SETTINGS TAB ────────────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2"><Mail className="w-5 h-5 text-blue-500" /> Notification Email</CardTitle>
                <CardDescription>Admin email that receives payment notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Admin Notification Email</Label>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="ankmuz007@gmail.com"
                      className="h-14 rounded-2xl bg-muted/40 border-white/10 font-bold"
                    />
                  </div>
                  <Button
                    onClick={() => saveSettingMutation.mutate({ key: "admin_notification_email", value: adminEmail })}
                    disabled={!adminEmail || saveSettingMutation.isPending}
                    className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 gap-2"
                  >
                    {saveSettingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    SAVE
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/60 font-bold">
                  Current: <span className="text-foreground font-black">{settingsData?.settings?.admin_notification_email || "ankmuz007@gmail.com (default)"}</span>
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-black flex items-center gap-2"><Settings2 className="w-5 h-5 text-muted-foreground" /> Razorpay Configuration</CardTitle>
                <CardDescription>Payment gateway environment variables — set these in Easypanel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-5 rounded-2xl bg-muted/20 border border-white/5 space-y-3">
                  {[
                    { label: "RAZORPAY_KEY_ID", desc: "Public key from Razorpay Dashboard → Settings → API Keys" },
                    { label: "RAZORPAY_KEY_SECRET", desc: "Secret key — never expose in frontend" },
                    { label: "RAZORPAY_WEBHOOK_SECRET", desc: "From Razorpay Dashboard → Webhooks (optional)" },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3">
                      <code className="px-2 py-1 rounded-lg bg-muted/60 text-pink-400 font-mono text-[10px] font-black shrink-0 mt-0.5">{item.label}</code>
                      <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60">Set these in your Easypanel environment variables under the app settings.</p>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
}
