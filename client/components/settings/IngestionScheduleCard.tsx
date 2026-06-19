import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Brain,
  Zap,
  Clock,
  Loader2,
  CheckCheck,
  Play,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getOrCreateUserId } from "@/lib/utils";

// ─── Duration Presets ─────────────────────────────────────────────────────────

const DURATION_PRESETS = [
  { label: "1 Hour", hours: 1 },
  { label: "3 Hours", hours: 3 },
  { label: "6 Hours", hours: 6 },
  { label: "12 Hours", hours: 12 },
  { label: "1 Day", hours: 24 },
  { label: "2 Days", hours: 48 },
  { label: "3 Days", hours: 72 },
  { label: "5 Days", hours: 120 },
  { label: "1 Week", hours: 168 },
  { label: "2 Weeks", hours: 336 },
  { label: "Custom", hours: -1 },
];

function hoursToLabel(h: number): string {
  const preset = DURATION_PRESETS.find((p) => p.hours === h);
  if (preset && preset.hours !== -1) return preset.label;
  if (h < 24) return `${h}h`;
  const days = h / 24;
  if (Number.isInteger(days)) return `${days}d`;
  return `${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IngestionScheduleCard({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [scanDurationHours, setScanDurationHours] = React.useState(24);
  const [enabled, setEnabled] = React.useState(true);
  const [runResult, setRunResult] = React.useState<any>(null);

  // Custom input state
  const [selectedPreset, setSelectedPreset] = React.useState<string>("24");
  const [customValue, setCustomValue] = React.useState("24");
  const [customUnit, setCustomUnit] = React.useState<"hours" | "days">("hours");
  const [showCustom, setShowCustom] = React.useState(false);

  // ── Load saved schedule ──
  const { data: scheduleData, isLoading: schedLoading } = useQuery({
    queryKey: ["ingestion-schedule", userId],
    queryFn: async () => {
      const res = await fetch(`/api/ingestion/schedule?userId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  // ── Load last run status ──
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
      const hours = scheduleData.scanDurationHours ?? 24;
      setScanDurationHours(hours);
      setEnabled(scheduleData.enabled !== false);

      // Sync preset selector
      const match = DURATION_PRESETS.find((p) => p.hours === hours);
      if (match && match.hours !== -1) {
        setSelectedPreset(String(hours));
        setShowCustom(false);
      } else {
        setSelectedPreset("-1");
        setShowCustom(true);
        if (hours < 24) {
          setCustomValue(String(hours));
          setCustomUnit("hours");
        } else {
          setCustomValue(String(hours / 24));
          setCustomUnit("days");
        }
      }
    }
  }, [scheduleData]);

  // ── Compute effective hours from UI state ──
  const effectiveHours = React.useMemo(() => {
    if (showCustom) {
      const val = parseFloat(customValue);
      if (isNaN(val) || val <= 0) return scanDurationHours;
      return customUnit === "days" ? Math.round(val * 24) : Math.round(val);
    }
    return parseInt(selectedPreset);
  }, [showCustom, customValue, customUnit, selectedPreset, scanDurationHours]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ingestion/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scanDurationHours: effectiveHours,
          enabled,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setScanDurationHours(effectiveHours);
      toast({
        title: "Schedule saved",
        description: `AI Radar will scan the last ${hoursToLabel(effectiveHours)} of messages`,
      });
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Manual run ──
  const [isRunningNow, setIsRunningNow] = React.useState(false);
  const runNow = async () => {
    setIsRunningNow(true);
    try {
      const res = await fetch("/api/ingestion/run-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sinceHours: effectiveHours }),
      });
      const data = await res.json();
      setRunResult(data.result);
      refetchStatus();
      toast({
        title: "Scan complete!",
        description: `Scanned last ${hoursToLabel(effectiveHours)} — found ${data.result?.castingCallsFound || 0} casting calls`,
      });
    } catch (e: any) {
      toast({ title: "Run failed", description: e.message, variant: "destructive" });
    } finally {
      setIsRunningNow(false);
    }
  };

  const lastRun = statusData?.lastRun || runResult;

  return (
    <section className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col lg:flex-row gap-10">
        {/* ── Left: Icon + Description ── */}
        <div className="flex flex-col gap-5 lg:w-72 shrink-0">
          <div className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-lg shadow-violet-500/10">
            <Brain className="h-10 w-10 text-violet-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black flex items-center gap-2">
              AI Casting Radar
              <span
                className={cn(
                  "text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider",
                  enabled
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-muted/30 text-muted-foreground"
                )}
              >
                {enabled ? "Active" : "Paused"}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Scans all connected WhatsApp &amp; Instagram groups for the
              selected time window. Uses vision AI to analyze casting flyer
              images and extract talent requirements into your contacts sheet,
              highlighted in yellow.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[11px] text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              Text messages (GPT-4 class model)
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              Image flyers (Gemini Flash Vision)
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              Keyword pre-filtering to save API calls
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-violet-400" />
              Smart deduplication — never duplicates
            </div>
          </div>
        </div>

        {/* ── Right: Controls ── */}
        <div className="flex-1 space-y-8">
          {/* Scan Duration Picker */}
          <div className="space-y-5 p-6 rounded-2xl bg-white/3 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-black uppercase tracking-wider">
                  Scan Duration
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="ingestion-toggle"
                  className="text-xs font-bold text-muted-foreground"
                >
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

            <p className="text-xs text-muted-foreground">
              How far back should the AI scan for casting posts from all
              connected groups?
            </p>

            {/* Preset grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {DURATION_PRESETS.map((preset) => {
                const isCustom = preset.hours === -1;
                const isSelected = isCustom
                  ? showCustom
                  : !showCustom && selectedPreset === String(preset.hours);
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      if (isCustom) {
                        setShowCustom(true);
                        setSelectedPreset("-1");
                      } else {
                        setShowCustom(false);
                        setSelectedPreset(String(preset.hours));
                      }
                    }}
                    className={cn(
                      "h-11 rounded-xl text-xs font-black transition-all duration-200 border",
                      isSelected
                        ? "bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/30 scale-105"
                        : "bg-background/40 border-white/8 text-muted-foreground hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom input */}
            {showCustom && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/30 border border-violet-500/20 animate-in slide-in-from-top-2 duration-200">
                <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">
                  Scan last
                </span>
                <Input
                  type="number"
                  min="1"
                  max={customUnit === "days" ? "30" : "720"}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-24 h-10 rounded-xl bg-background/50 border-white/10 font-black text-center text-lg"
                />
                <Select
                  value={customUnit}
                  onValueChange={(v) =>
                    setCustomUnit(v as "hours" | "days")
                  }
                >
                  <SelectTrigger className="w-28 h-10 rounded-xl bg-background/50 border-white/10 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
                {effectiveHours > 0 && (
                  <span className="text-xs text-violet-400 font-bold ml-1 whitespace-nowrap">
                    = {effectiveHours}h total
                  </span>
                )}
              </div>
            )}

            {/* Active summary pill */}
            {!schedLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 font-black border border-violet-500/20">
                  Currently set to scan last{" "}
                  {hoursToLabel(scanDurationHours)}
                </span>
                {effectiveHours !== scanDurationHours && (
                  <span className="opacity-60">
                    → will change to {hoursToLabel(effectiveHours)} on save
                  </span>
                )}
              </div>
            )}

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="h-11 px-6 rounded-xl font-black bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              SAVE SCHEDULE
            </Button>
          </div>

          {/* Manual Trigger + Last Run */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/3 border border-white/5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Manual Trigger
              </p>
              <p className="text-sm text-muted-foreground">
                Run the AI scanner immediately across all groups, scanning the
                last{" "}
                <span className="text-violet-400 font-bold">
                  {hoursToLabel(effectiveHours)}
                </span>
                .
              </p>
              <Button
                onClick={runNow}
                disabled={isRunningNow || statusData?.isRunning}
                variant="outline"
                className="w-full h-11 rounded-xl font-black border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-2"
              >
                {isRunningNow || statusData?.isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> SCANNING...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> RUN NOW
                  </>
                )}
              </Button>
            </div>

            {lastRun && (
              <div className="p-6 rounded-2xl bg-white/3 border border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Last Run
                </p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-violet-400">
                      {lastRun.messagesScanned || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">
                      SCANNED
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-emerald-400">
                      {lastRun.castingCallsFound || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">
                      FOUND
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-blue-400">
                      {lastRun.contactsCreated || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">
                      CREATED
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40">
                    <p className="text-2xl font-black text-amber-400">
                      {lastRun.contactsUpdated || 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-bold">
                      UPDATED
                    </p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground text-center font-mono">
                  {new Date(lastRun.runAt).toLocaleString("en-IN")} ·{" "}
                  {Math.round((lastRun.durationMs || 0) / 1000)}s
                </p>
                {lastRun.errors?.length > 0 && (
                  <details className="text-[9px] text-destructive">
                    <summary className="cursor-pointer font-bold">
                      {lastRun.errors.length} error(s)
                    </summary>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {lastRun.errors
                        .slice(0, 5)
                        .map((e: string, i: number) => (
                          <li key={i}>{e}</li>
                        ))}
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
