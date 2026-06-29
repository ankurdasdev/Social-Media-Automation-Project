import { useState } from "react";
import { type Contact, type ContactsResponse } from "@shared/api";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Mail, MessageCircle, TrendingUp, AlertCircle, Bot, Filter, Users, Instagram, Zap, CalendarDays, BrainCircuit, Play, Maximize2, Crown, ChevronDown, Lock } from "lucide-react";
import { cn, getOrCreateUserId, getCurrentUser } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactDrawer } from "@/components/contacts/ContactDrawer";

export default function Analytics() {
  const navigate = useNavigate();
  const userId = getOrCreateUserId();

  const { data: contactsData } = useQuery({
    queryKey: ["contacts", userId],
    queryFn: async (): Promise<Contact[]> => {
      const res = await fetch(`/api/contacts?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data: ContactsResponse = await res.json();
      return data.contacts;
    },
  });

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

  const currentUser = getCurrentUser();
  const userName = currentUser?.name?.split(' ')[0] || "there";

  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: `Hello ${userName}! I'm your Data Analyst AI. I have full access to your contacts and system logs. How can I help you today?` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  const chatMutation = useMutation({
    mutationFn: async (messages: {role: string, content: string}[]) => {
      const res = await fetch(`/api/analytics/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, messages }),
      });
      if (!res.ok) throw new Error("Failed to send chat");
      return res.json();
    },
    onSuccess: (data) => {
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    }
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMessages = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    chatMutation.mutate(newMessages);
  };

  const renderChatInterface = (expanded: boolean) => (
    <div className={cn("flex flex-col min-h-0", expanded ? "h-[70vh] flex-1" : "h-[400px] w-full")}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50 space-y-2">
            <Bot className="w-8 h-8 mx-auto" />
            <p className="text-xs">Ask me anything about your analytics, conversion rates, or failures.</p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl p-3 text-sm break-words overflow-hidden",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted text-foreground rounded-tl-sm"
              )}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-sm font-black uppercase tracking-widest text-primary mt-3 mb-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-foreground/80 leading-snug" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                      code: ({node, ...props}) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-primary text-xs break-all whitespace-pre-wrap" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))
        )}
        {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm p-3 text-sm flex gap-1 items-center h-10">
                <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce delay-75" />
                <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce delay-150" />
              </div>
            </div>
        )}
      </div>
      <form onSubmit={handleSendChat} className="p-3 border-t border-border/50 dark:bg-black/20 bg-muted/50 flex gap-2 shrink-0">
        <input 
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about your data..."
          className="flex-1 bg-background border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
          disabled={chatMutation.isPending}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!chatInput.trim() || chatMutation.isPending}
          className="rounded-xl shrink-0 bg-primary hover:bg-primary/90 text-white"
        >
          <Play className="w-4 h-4 fill-current" />
        </Button>
      </form>
    </div>
  );

  const renderDashboard = (platform: 'all' | 'whatsapp' | 'email' | 'instagram') => {
    // compute specific KPIs based on platform
    let tTotal = statsData?.total || 0;
    let tSuccess = statsData?.success || 0;
    let tFailed = statsData?.failed || 0;
    
    let fData = funnelData;
    let heatData = chartData;
    let coData = cohortData;

    let sKey = "totalSuccess";
    let fKey = "totalFailed";
    let coSKey = "success";
    let coFKey = "failed";

    if (platform === 'whatsapp') {
      tSuccess = statsData?.waSent || 0;
      tFailed = statsData?.waFailed || 0;
      tTotal = tSuccess + tFailed; 
      fData = [
        { step: "Attempted", value: tTotal },
        { step: "Successfully Reached", value: tSuccess }
      ];
      sKey = "whatsapp";
      fKey = "waFailed";
      coSKey = "waSuccess";
      coFKey = "waFailed";
    } else if (platform === 'email') {
      tSuccess = statsData?.emailSent || 0;
      tFailed = statsData?.emailFailed || 0;
      tTotal = tSuccess + tFailed;
      fData = [
        { step: "Attempted", value: tTotal },
        { step: "Successfully Reached", value: tSuccess }
      ];
      sKey = "email";
      fKey = "emailFailed";
      coSKey = "emailSuccess";
      coFKey = "emailFailed";
    } else if (platform === 'instagram') {
      tSuccess = statsData?.igSent || 0;
      tFailed = statsData?.igFailed || 0;
      tTotal = tSuccess + tFailed;
      fData = [
        { step: "Attempted", value: tTotal },
        { step: "Successfully Reached", value: tSuccess }
      ];
      sKey = "instagram";
      fKey = "igFailed";
      coSKey = "igSuccess";
      coFKey = "igFailed";
    }

    const conversionRate = tTotal > 0 ? ((tSuccess / (tSuccess + tFailed || 1)) * 100).toFixed(1) + "%" : "0%";

    const recentFails = (statsData?.recentFailures || []).filter((f: any) => {
      if (platform === 'all') return true;
      if (platform === 'whatsapp') return f.whatsapp === 'Failed';
      if (platform === 'email') return f.email === 'Failed';
      if (platform === 'instagram') return f.instagram === 'Failed';
      return false;
    }).slice(0, 10);

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: platform === 'all' ? "Total Uploaded" : "Total Attempted", value: platform === 'all' ? statsData?.total || 0 : tTotal, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", onClick: () => navigate(platform === 'all' ? '/contacts' : `/contacts?platform=${platform}`) },
            { label: "Successfully Reached", value: tSuccess, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", onClick: () => navigate(`/contacts?status=sent${platform !== 'all' ? `&platform=${platform}` : ''}`) },
            { label: "Total Failed", value: tFailed, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", onClick: () => navigate(`/contacts?status=failed${platform !== 'all' ? `&platform=${platform}` : ''}`) },
            { label: "Conversion Rate", value: conversionRate, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
          ].map((stat, i) => (
            <Card key={i} className={cn("glass-card overflow-hidden", stat.border, stat.onClick && "cursor-pointer hover:bg-white/5 transition-colors")} onClick={stat.onClick}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-4xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
                  </div>
                  <div className={cn("p-4 rounded-2xl shadow-lg", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {platform === 'all' && (
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
                  <div className="flex-1 p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/contacts?status=failed&platform=whatsapp")}>
                    <div className="flex items-center gap-3"><MessageCircle className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WA Failed</span></div>
                    <span className="text-lg font-black">{statsData?.waFailed || 0}</span>
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/contacts?status=failed&platform=email")}>
                    <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-blue-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Failed</span></div>
                    <span className="text-lg font-black">{statsData?.emailFailed || 0}</span>
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/contacts?status=failed&platform=instagram")}>
                    <div className="flex items-center gap-3"><Instagram className="w-4 h-4 text-pink-500" /><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">IG Failed</span></div>
                    <span className="text-lg font-black">{statsData?.igFailed || 0}</span>
                  </div>
                </div>

                <div className="flex-1 dark:bg-[#0a0a0a] bg-slate-900 rounded-2xl border border-border p-5 font-mono text-sm text-emerald-400 overflow-y-auto relative min-h-[150px]">
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

            {/* AI Data Analyst Chatbot */}
            <Card className="glass-card border-primary/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)] flex flex-col relative overflow-hidden">
              <CardHeader className="p-6 border-b border-primary/10 bg-primary/5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/20 text-primary"><BrainCircuit className="w-5 h-5" /></div>
                    <div>
                      <CardTitle className="text-lg font-black tracking-tight text-primary">AI Data Analyst</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Chat directly with your analytics</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/20 text-primary"
                    onClick={() => setIsChatExpanded(true)}
                    title="Expand Chat"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {renderChatInterface(false)}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-border shadow-xl">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-black tracking-tight">Lead Velocity Pipeline</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Identify drop-offs in your funnel</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="step" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "rgba(255,255,255,0.7)" }} width={140} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ fontWeight: "black" }} />
                    <Bar 
                      dataKey="value" 
                      fill="#8b5cf6" 
                      radius={[0, 8, 8, 0]} 
                      barSize={40}
                      onClick={(data) => {
                        if (data.step === "Attempted") navigate(platform === 'all' ? '/contacts' : `/contacts?platform=${platform}`);
                        if (data.step === "Successfully Reached") navigate(`/contacts?status=sent${platform !== 'all' ? `&platform=${platform}` : ''}`);
                      }}
                      cursor="pointer"
                    >
                      {fData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#22c55e'][index % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border shadow-xl">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">30-Day Activity Heatmap</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Successful vs Failed Outreach</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={heatData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} itemStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                    <Area type="monotone" dataKey={sKey} name="Successful" fill="#22c55e" stroke="#22c55e" fillOpacity={0.2} strokeWidth={2} activeDot={{ onClick: () => navigate(`/contacts?status=sent${platform !== 'all' ? `&platform=${platform}` : ''}`), cursor: 'pointer' }} />
                    <Bar dataKey={fKey} name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={10} onClick={() => navigate(`/contacts?status=failed${platform !== 'all' ? `&platform=${platform}` : ''}`)} cursor="pointer" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-card border-border shadow-xl flex flex-col">
            <CardHeader className="p-6 border-b border-border/50">
              <CardTitle className="text-xl font-black tracking-tight">Smart Cohort Analysis</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">A/B Testing across sheets</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
              {coData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-black text-xs uppercase tracking-widest border border-dashed border-border rounded-3xl min-h-[200px]">
                  No cohort data available yet.
                </div>
              ) : (
                <div className="h-[300px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="sheet" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "rgba(255,255,255,0.5)" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }} />
                      <Bar dataKey={coSKey} name="Success" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} barSize={40} onClick={() => navigate(`/contacts?status=sent${platform !== 'all' ? `&platform=${platform}` : ''}`)} cursor="pointer" />
                      <Bar dataKey={coFKey} name="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} onClick={() => navigate(`/contacts?status=failed${platform !== 'all' ? `&platform=${platform}` : ''}`)} cursor="pointer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border shadow-xl flex flex-col">
            <CardHeader className="p-6 border-b border-border/50 dark:bg-black/20 bg-muted/50">
              <CardTitle className="text-lg font-black tracking-tight">Recent Failures</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Click to view diagnostics</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto min-h-[300px] max-h-[350px]">
              {recentFails.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-emerald-500 uppercase tracking-widest mt-10">No recent failures!</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentFails.map((r: any) => (
                    <div 
                      key={r.id} 
                      onClick={() => setSelectedContactId(r.id)}
                      className="p-4 flex items-center justify-between hover:dark:bg-white/5 bg-black/5 cursor-pointer transition-colors"
                    >
                      <div className="space-y-1 overflow-hidden pr-2">
                        <p className="text-sm font-bold truncate">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{r.project}</p>
                      </div>
                      <div className="flex gap-2">
                        {r.whatsapp === 'Failed' && <MessageCircle className="w-4 h-4 text-emerald-500 opacity-50" />}
                        {r.email === 'Failed' && <Mail className="w-4 h-4 text-blue-500 opacity-50" />}
                        {r.instagram === 'Failed' && <Instagram className="w-4 h-4 text-pink-500 opacity-50" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8 pb-20 mt-6 px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="h-10 w-48 bg-muted rounded-xl animate-pulse" />
              <div className="h-4 w-72 bg-muted/60 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-14 w-full md:w-[600px] bg-muted/40 rounded-2xl animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 glass-card rounded-2xl animate-pulse bg-white/5" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] glass-card rounded-3xl animate-pulse bg-white/5" />
            <div className="h-[400px] glass-card rounded-3xl animate-pulse bg-white/5" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
              Analytics
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Track your outreach performance across all channels.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/contacts")}
            className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20"
          >
            <Filter className="w-4 h-4 mr-2" /> GO TO CONTACTS
          </Button>
        </div>

        {/* Dashboard Tabs Area */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50 border border-border/50 p-1.5 h-14 rounded-2xl w-full md:w-auto overflow-x-auto justify-start">
              <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide">Overview</TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide"><Mail className="w-3.5 h-3.5" /> Email</TabsTrigger>
              <TabsTrigger value="instagram" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide"><Instagram className="w-3.5 h-3.5" /> Instagram</TabsTrigger>
            </TabsList>
            
            <div className="relative group shrink-0">
              <Button variant="outline" className="h-14 px-6 rounded-2xl border-amber-500/20 bg-amber-500/5 text-amber-500 font-black tracking-widest uppercase hover:bg-amber-500/10 gap-2 transition-all duration-300 hover:scale-105 active:scale-95 hover:-translate-y-1">
                <Crown className="w-4 h-4" /> Pro Filters
                <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
              </Button>
              <div className="absolute top-full right-0 mt-2 w-72 p-2 bg-card border border-border/50 rounded-[1.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-300 z-50 origin-top-right">
                <div className="p-4 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-black text-sm text-foreground uppercase tracking-widest">Unlock Pro Analytics</h4>
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                      Get access to Engagement Time filters, A/B Testing cohorts, and advanced demographic breakdowns.
                    </p>
                  </div>
                  <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95" onClick={() => navigate("/subscription")}>
                    UPGRADE TO PRO
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="all" className="mt-0 outline-none">
            {renderDashboard('all')}
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-0 outline-none">
            {renderDashboard('whatsapp')}
          </TabsContent>
          <TabsContent value="email" className="mt-0 outline-none">
            {renderDashboard('email')}
          </TabsContent>
          <TabsContent value="instagram" className="mt-0 outline-none">
            {renderDashboard('instagram')}
          </TabsContent>
        </Tabs>

        <Dialog open={isChatExpanded} onOpenChange={setIsChatExpanded}>
          <DialogContent className="max-w-4xl w-[95vw] h-[85vh] glass-card border-primary/30 p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 border-b border-primary/10 bg-primary/5 flex-shrink-0">
              <DialogTitle className="text-lg font-black tracking-tight text-primary flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary"><BrainCircuit className="w-5 h-5" /></div>
                AI Data Analyst
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex flex-col min-h-0 bg-background/50">
              {renderChatInterface(true)}
            </div>
          </DialogContent>
        </Dialog>

        <ContactDrawer 
          contact={contactsData?.find((c: Contact) => c.id === selectedContactId) || null}
          open={!!selectedContactId}
          onOpenChange={(open) => !open && setSelectedContactId(null)}
        />
      </div>
    </AppLayout>
  );
}
