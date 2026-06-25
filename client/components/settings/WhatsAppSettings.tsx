import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, QrCode, LogOut, CheckCircle2, RefreshCw, MessageSquare, Zap, ShieldCheck, AlertTriangle, BookOpen, X, Smartphone, Users, BarChart3, LayoutDashboard } from "lucide-react";
import { WhatsAppStatusResponse, WhatsAppQRResponse } from "@shared/api";
import { toast } from "sonner";
import { getOrCreateUserId, cn } from "@/lib/utils";

export function WhatsAppSettings() {
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const hasSyncedRef = React.useRef(false);

  const autoSyncGroups = async (userId: string) => {
    setSyncing(true);
    setSyncDone(false);
    try {
      await fetch("/api/whatsapp/sync-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setSyncDone(true);
    } catch (err) {
      toast.error("Group sync failed. You can retry from the dashboard.");
    } finally {
      setSyncing(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const userId = getOrCreateUserId();
      const res = await fetch(`/api/whatsapp/status?userId=${userId}`);
      const data: WhatsAppStatusResponse = await res.json();
      setStatus(data);
      if (data.isConnected) {
        setQrCode(null);
        setConnecting(false);
        if (!hasSyncedRef.current) {
          hasSyncedRef.current = true;
          autoSyncGroups(userId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (connecting || (status && !status.isConnected && status.instance)) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [connecting, status]);

  const handleConnect = async () => {
    if (!mobileNumber.trim()) {
      return toast.error("Mobile number required for connection.");
    }
    setConnecting(true);
    setQrCode(null);
    try {
      const userId = getOrCreateUserId();
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobileNumber.trim(), userId })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.details || data.error || "Failed to connect WhatsApp.");
        setConnecting(false);
        return;
      }
      const qrData = data as WhatsAppQRResponse;
      if (qrData.qrcode?.base64) {
        setQrCode(qrData.qrcode.base64);
        toast.success("Connection started. Scan QR to connect.");
      } else {
        toast.error("QR code not returned. Check the server logs.");
        setConnecting(false);
      }
    } catch (err) {
      toast.error("Failed to connect WhatsApp.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const userId = getOrCreateUserId();
      await fetch(`/api/whatsapp/disconnect?userId=${userId}`, { method: "DELETE" });
      setStatus({ instance: null, isConnected: false });
      setQrCode(null);
      hasSyncedRef.current = false;
      setSyncDone(false);
      setWarningAccepted(false);
      toast.success("WhatsApp disconnected.");
    } catch (err) {
      toast.error("Failed to disconnect.");
    }
  };

  const handleRefreshQR = async () => {
    try {
      const userId = getOrCreateUserId();
      const res = await fetch(`/api/whatsapp/qr?userId=${userId}`);
      const data: WhatsAppQRResponse = await res.json();
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
      }
    } catch (err) {
      toast.error("QR refresh failed.");
    }
  };

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Loading WhatsApp Settings...</p>
      </div>
    );
  }

  const isConnected = status?.isConnected;
  const instance = status?.instance;

  // ── What You Will/Did Unlock cards ────────────────────────────────────────
  const unlockCards = [
    {
      icon: MessageSquare,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Send Personalised WhatsApp Campaigns",
      sub: "No More Repetition With Your Templates, All Messages With A Click Of One Button",
    },
    {
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "Reach Hundreds Of Contacts",
      sub: "Automated Mass WhatsApp Outreach",
    },
    {
      icon: LayoutDashboard,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: "Manage Messages From One Dashboard",
      sub: "Simple. Quick. Efficient. Effective. Increase Your Chances.",
    },
    {
      icon: BarChart3,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      title: "Track Campaign Performance",
      sub: "So You Can Decide What To Do Next",
    },
  ];

  // ── Setup Guide Steps ──────────────────────────────────────────────────────
  const setupSteps = [
    {
      icon: Smartphone,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      num: "01",
      title: "Generate QR Code",
      desc: "Enter your WhatsApp number and generate QR code.",
    },
    {
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      num: "02",
      title: "Scan Using WhatsApp",
      desc: "Open WhatsApp. Tap the menu (three dots) or settings on your phone. Select \"Linked Devices\".",
    },
    {
      icon: QrCode,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      num: "03",
      title: "Link A Device and Return To CastHub",
      desc: "Tap \"Link A Device\". Scan the QR code generated. Your WhatsApp account will be connected automatically.",
    },
  ];

  return (
    <div id="tutorial-settings-whatsapp" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-background/60">
        {/* Decorative ambient lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col lg:flex-row min-h-[600px] overflow-hidden">
          {/* ── Left Section ── */}
          <div className="p-8 md:p-12 lg:w-[45%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative">
            <div className="mb-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5 group hover:scale-110 transition-transform duration-500">
                {/* WhatsApp SVG logo */}
                <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#25D366"/>
                  <path d="M23.6 8.4A10.9 10.9 0 0 0 16 5.5C10.2 5.5 5.5 10.2 5.5 16c0 1.9.5 3.7 1.4 5.3L5.5 26.5l5.4-1.4a10.9 10.9 0 0 0 5.1 1.3c5.8 0 10.5-4.7 10.5-10.5 0-2.8-1.1-5.4-3-7.5zm-7.6 16.1a9 9 0 0 1-4.6-1.3l-.3-.2-3.2.8.9-3.1-.2-.3a9 9 0 0 1-1.4-4.9c0-5 4-9 9-9a9 9 0 0 1 6.3 2.6A9 9 0 0 1 25 16a9 9 0 0 1-9 8.5zm5-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1a7.3 7.3 0 0 1-2.1-1.3 7.8 7.8 0 0 1-1.5-1.8c-.2-.3 0-.5.1-.6l.5-.5.3-.5.1-.5-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4a3.6 3.6 0 0 0-1.1 2.6c0 1.5 1.1 3 1.3 3.2.1.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.8.6.8.2 1.5.2 2 .1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3z" fill="#fff"/>
                </svg>
              </div>
            </div>

            <div className="flex-1 space-y-8 relative">
              <div className="flex flex-col gap-3">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase leading-none">
                  CONNECT<br/>
                  <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">WHATSAPP</span>
                </h2>
                <p className="text-muted-foreground/70 text-sm font-medium leading-relaxed max-w-sm">
                  Send personalised WhatsApp campaigns at scale.
                </p>

                {isConnected && (
                  <div className="mt-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.1em]">CONNECTED</span>
                  </div>
                )}
              </div>

              {/* Unlock cards */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.25em]">
                  {isConnected ? "What You Unlocked" : "What You Will Unlock"}
                </p>
                <div className="space-y-2">
                  {unlockCards.map((card, i) => (
                    <div key={i} className={cn("flex items-start gap-3 p-3 rounded-2xl border transition-all", card.bg)}>
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", card.bg)}>
                        <card.icon className={cn("w-4 h-4", card.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide leading-tight">{card.title}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">{card.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Section ── */}
          <div className="p-8 md:p-10 flex-1 flex flex-col justify-center relative bg-muted/20 backdrop-blur-sm overflow-hidden">
            {isConnected ? (
              /* ── Connected State ── */
              <div className="space-y-6 animate-in zoom-in-95 duration-700 max-w-xl mx-auto w-full">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />

                  <div className="relative p-8 md:p-10 rounded-[3rem] bg-muted/80 border border-border/50 overflow-hidden space-y-8">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />

                    {/* Tick + title */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                        <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-foreground tracking-tighter uppercase leading-none">CONNECTED</h4>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">WhatsApp Active</p>
                      </div>
                    </div>

                    {/* Account details */}
                    <div className="space-y-3 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative z-10">
                      <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">Connected Mobile Number</p>
                      <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-center text-foreground break-all max-w-full px-2">
                        {instance?.instanceName.split('_')[1] || '916200469935'}
                      </div>
                      <div className="h-px w-12 bg-emerald-500/20 mx-auto" />
                      <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest text-center truncate max-w-full px-2">
                        ID: {instance?.instanceName || 'W_916200469935'}
                      </p>
                    </div>

                    {/* Disconnect at bottom */}
                    <div className="relative z-10">
                      <Button
                        variant="ghost"
                        onClick={handleDisconnect}
                        className="h-12 w-full rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-rose-500/50 font-black text-[10px] uppercase tracking-widest transition-all"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> DISCONNECT
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : qrCode ? (
              /* ── QR Code State ── */
              <div className="flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-black tracking-tighter">CONNECT <span className="text-emerald-500 italic">WHATSAPP</span></h3>
                  <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Follow the setup instructions to connect WhatsApp. Once connected you will be able to send and manage messages from your number.
                  </p>
                </div>

                <div className="relative group p-10 bg-white rounded-[3rem] shadow-2xl shadow-emerald-500/30 ring-[12px] ring-emerald-500/5 transition-all hover:scale-[1.02]">
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -top-4 -right-4 h-12 w-12 rounded-2xl shadow-2xl border border-white/20 bg-background/80 backdrop-blur-xl hover:bg-background transition-all"
                    onClick={handleRefreshQR}
                  >
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    WAITING FOR SCAN...
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => { setQrCode(null); setConnecting(false); }}
                    className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-500 transition-all"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Not Connected State ── */
              <div className="flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-700 max-w-md mx-auto w-full">

                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
                  <div className="relative h-24 w-24 bg-muted/40 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl">
                    <QrCode className="h-10 w-10 text-muted-foreground" />
                  </div>
                </div>

                {/* Setup Guide button (no blinker) */}
                <div className="flex items-center justify-between gap-4 flex-wrap w-full">
                  <div className="text-left">
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Connect WhatsApp</h3>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Follow the setup instructions to connect WhatsApp. Once connected you will be able to send and manage messages from your number.
                    </p>
                  </div>
                  <button
                    onClick={() => setGuideOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Setup Guide
                  </button>
                </div>

                {/* Before Connecting Warning Box */}
                <div className="w-full space-y-4 text-left p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">⚠ Before Connecting WhatsApp</h4>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium leading-relaxed space-y-1.5 pl-8">
                    <p>WhatsApp controls its own platform and policies.</p>
                    <p>If your WhatsApp session expires or you log out on your phone, you'll need to reconnect by scanning a new QR code.</p>
                    <p>CastHub cannot control WhatsApp account restrictions or policy decisions made by Meta.</p>
                  </div>
                  <div className="flex items-center gap-3 pl-8 pt-1">
                    <Checkbox
                      id="wa-understand"
                      checked={warningAccepted}
                      onCheckedChange={(c) => setWarningAccepted(!!c)}
                    />
                    <Label htmlFor="wa-understand" className="text-xs text-muted-foreground font-medium cursor-pointer">
                      I understand
                    </Label>
                  </div>
                </div>

                {/* Input + Button (shown when checkbox accepted) */}
                {warningAccepted && (
                  <div className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="relative group w-full">
                      <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-emerald-500/30 rounded-[1.5rem] blur-lg opacity-30 group-focus-within:opacity-100 transition-all duration-700" />
                      <Input
                        placeholder="Enter the WhatsApp number you want to use for outreach. E.g. 919876543210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="h-16 px-5 rounded-[1.5rem] bg-muted/60 border-border/50 focus:bg-background focus:ring-primary text-sm font-bold shadow-inner transition-all relative z-0"
                      />
                    </div>
                    <Button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] text-sm font-black tracking-widest shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98] group relative overflow-hidden"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          GENERATING QR CODE...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-5 w-5 mr-3" />
                          GENERATE QR CODE
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SETUP GUIDE DIALOG ── */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl w-[95vw] p-0 gap-0 glass-card border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground uppercase tracking-widest">Connect WhatsApp</DialogTitle>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Follow the steps to connect your WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setGuideOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-3">
            {/* Steps */}
            {setupSteps.map((step, i) => (
              <div key={i} className={cn("flex gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01]", step.bg)}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", step.bg)}>
                  <step.icon className={cn("w-4 h-4", step.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", step.color)}>Step {step.num}</span>
                  </div>
                  <p className="text-[11px] font-black text-foreground uppercase tracking-wide leading-tight">{step.title}</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1 break-words">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* Limitations box (separate, no step prefix) */}
            <div className="flex gap-4 p-4 rounded-2xl border bg-amber-500/10 border-amber-500/20 mt-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-amber-500/10 border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-foreground uppercase tracking-wide leading-tight">Limitations</p>
                <div className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1 space-y-1">
                  <p>WhatsApp controls its own platform and policies.</p>
                  <p>If your WhatsApp session expires or you log out on your phone, you'll need to reconnect by scanning a new QR code.</p>
                  <p>CastHub cannot control WhatsApp account restrictions or policy decisions made by Meta.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-background/80 backdrop-blur-xl flex items-center justify-end gap-4">
            <Button
              size="sm"
              onClick={() => setGuideOpen(false)}
              className="h-9 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest"
            >
              Connect WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
