import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, Zap, Clock, Loader2, CheckCheck, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function IngestionScheduleCard({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [schedHour, setSchedHour] = React.useState("02");
  const [schedMin, setSchedMin] = React.useState("00");
  const [enabled, setEnabled] = React.useState(true);
  const [runResult, setRunResult] = React.useState<any>(null);

  // Load saved schedule
  const { data: scheduleData, isLoading: schedLoading } = useQuery({
    queryKey: ["ingestion-schedule", userId],
    queryFn: async () => {
      const res = await fetch(`/api/ingestion/schedule?userId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  // Load last run status
  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ["ingestion-status"],
    queryFn: async () => {
      const res = await fetch("/api/ingestion/status");
      return res.json();
    },
    refetchInterval: 5000,
  });

  React.useEffect(() => {
    if (scheduleData) {
      const [h, m] = (scheduleData.scheduleTime || "02:00").split(":");
      setSchedHour(h.padStart(2, "0"));
      setSchedMin(m.padStart(2, "0"));
      setEnabled(scheduleData.enabled !== false);
    }
  }, [scheduleData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ingestion/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, scheduleTime: `${schedHour}:${schedMin}`, enabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => toast({ title: "Schedule saved", description: `AI Radar will run daily at ${schedHour}:${schedMin}` }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [isRunningNow, setIsRunningNow] = React.useState(false);
  const runNow = async () => {
    setIsRunningNow(true);
    try {
      const res = await fetch("/api/ingestion/run-now", { method: "POST" });
      const data = await res.json();
      setRunResult(data.result);
      refetchStatus();
      toast({ title: "Scan complete!", description: `Found ${data.result?.castingCallsFound || 0} casting calls` });
    } catch (e: any) {
      toast({ title: "Run failed", description: e.message, variant: "destructive" });
    } finally {
      setIsRunningNow(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins = ["00", "15", "30", "45"];
  const lastRun = statusData?.lastRun || runResult;

  return (
    <section className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -z-10" />
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left: Icon + Description */}
        <div className="flex flex-col gap-5 lg:w-72 shrink-0">
          <div className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-lg shadow-violet-500/10">
            <Brain className="h-10 w-10 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black flex items-center gap-2">
              AI Casting Radar
              <span className={cn("text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider",
                enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/30 text-muted-foreground"
              )}>
                {enabled ? "Active" : "Paused"}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Scans all connected WhatsApp & Instagram groups daily. Uses vision AI to analyze casting flyer images and extract talent requirements into your contacts sheet, highlighted in yellow.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[11px] text-muted-foreground font-medium">
            <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-violet-400" /> Text messages (GPT-4 class model)</div>
            <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-violet-400" /> Image flyers (Gemini Flash Vision)</div>
            <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-violet-400" /> Keyword pre-filtering to save API calls</div>
            <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-violet-400" /> Smart deduplication — never duplicates</div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 space-y-8">
          {/* Schedule Picker */}
          <div className="space-y-4 p-6 rounded-2xl bg-white/3 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-black uppercase tracking-wider">Daily Run Time</span>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="ingestion-toggle" className="text-xs font-bold text-muted-foreground">
                  {enabled ? "Enabled" : "Disabled"}
                </Label>
                <Switch
                  id="ingestion-toggle"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                  className="data-[state=checked]:bg-violet-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={schedHour} onValueChange={setSchedHour}>
                <SelectTrigger className="w-28 h-12 rounded-xl bg-background/50 border-white/10 font-black text-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {hours.map(h => <SelectItem key={h} value={h} className="font-mono">{h}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-3xl font-black text-muted-foreground">:</span>
              <Select value={schedMin} onValueChange={setSchedMin}>
                <SelectTrigger className="w-28 h-12 rounded-xl bg-background/50 border-white/10 font-black text-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mins.map(m => <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground font-bold ml-2">24h format (IST)</span>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="h-11 px-6 rounded-xl font-black bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCheck className="h-4 w-4 mr-2" />}
              SAVE SCHEDULE
            </Button>
          </div>

          {/* Manual Trigger + Last Run */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/3 border border-white/5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manual Trigger</p>
              <p className="text-sm text-muted-foreground">Run the AI scanner immediately across all groups.</p>
              <Button
                onClick={runNow}
                disabled={isRunningNow || statusData?.isRunning}
                variant="outline"
                className="w-full h-11 rounded-xl font-black border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-2"
              >
                {isRunningNow || statusData?.isRunning
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> SCANNING...</>
                  : <><Play className="h-4 w-4" /> RUN NOW</>}
              </Button>
            </div>

            {lastRun && (
              <div className="p-6 rounded-2xl bg-white/3 border border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Run</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-violet-400">{lastRun.messagesScanned || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">SCANNED</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-emerald-400">{lastRun.castingCallsFound || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">FOUND</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-blue-400">{lastRun.contactsCreated || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">CREATED</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-amber-400">{lastRun.contactsUpdated || 0}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">UPDATED</p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground text-center font-mono">
                  {new Date(lastRun.runAt).toLocaleString("en-IN")} · {Math.round((lastRun.durationMs || 0) / 1000)}s
                </p>
                {lastRun.errors?.length > 0 && (
                  <details className="text-[9px] text-destructive">
                    <summary className="cursor-pointer font-bold">{lastRun.errors.length} error(s)</summary>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {lastRun.errors.slice(0, 5).map((e: string, i: number) => <li key={i}>{e}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
