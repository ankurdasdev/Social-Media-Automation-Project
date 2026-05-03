import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, LogOut, CheckCircle2, RefreshCw, MessageSquare, Zap, ShieldCheck } from "lucide-react";
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
      toast.success("WhatsApp groups synced successfully!");
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
        // Auto-sync groups exactly once when connection is first detected
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Banner - Sync Progress */}
      {isConnected && (syncing || syncDone) && (
        <div className={cn(
          "flex items-center justify-between px-6 py-3 rounded-2xl border backdrop-blur-md transition-all duration-500 animate-in slide-in-from-top",
          syncing ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
        )}>
          <div className="flex items-center gap-4">
            <div className="relative">
              {syncing ? (
                <div className="h-5 w-5 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                syncing ? "text-emerald-500" : "text-blue-500"
              )}>
                {syncing ? "WHATSAPP SYNC IN PROGRESS" : "SYNC COMPLETED"}
              </p>
              <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
              <p className="hidden md:block text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                {syncing ? "Fetching all your WhatsApp groups — this takes just a moment..." : "All groups have been successfully synchronized to your dashboard."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden glass-card border-white/10 rounded-[2.5rem] shadow-2xl bg-black/60">
        {/* Decorative ambient lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="flex flex-col lg:flex-row min-h-[600px]">
           {/* Left Section - Identity & Status */}
           <div className="p-8 md:p-12 lg:w-[45%] flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 relative">
              <div className="mb-12">
                 <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5 group hover:scale-110 transition-transform duration-500">
                    <MessageSquare className="h-8 w-8 text-emerald-500" />
                 </div>
              </div>

              <div className="flex-1 space-y-10 relative">
               <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Live Connection</span>
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
                    WHATSAPP<br/>
                    <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">CONNECTION</span>
                  </h2>

                  {isConnected && (
                    <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                       <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.1em]">SYSTEM ACTIVE</span>
                    </div>
                  )}
               </div>

               <p className="text-muted-foreground/60 text-base font-medium leading-relaxed max-w-sm pt-4">
                  Connect your WhatsApp account to enable automated messaging and lead management. Scale your outreach with our automated system.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
                  <div className="flex flex-col gap-3 group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-emerald-500" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Messaging Status</p>
                        <p className="text-xs text-muted-foreground font-bold mt-1">Ready for Dispatch</p>
                     </div>
                  </div>
                  <div className="flex flex-col gap-3 group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Security Layer</p>
                        <p className="text-xs text-muted-foreground font-bold mt-1">AES-256 Encrypted</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Section - Interaction Area */}
            <div className="p-8 md:p-12 lg:p-16 flex-1 flex flex-col justify-center relative bg-black/20 backdrop-blur-sm">
               {isConnected ? (
                 <div className="space-y-8 animate-in zoom-in-95 duration-700 max-w-2xl mx-auto w-full">
                   <div className="relative group">
                      {/* Cyber Card Background */}
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[3rem] blur-2xl opacity-30 group-hover:opacity-60 transition duration-1000" />
                      
                      <div className="relative p-8 md:p-12 rounded-[3.5rem] bg-zinc-950/80 border border-white/10 overflow-hidden">
                         {/* Status Grid Overlay */}
                         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,#fff_1px,transparent_0)] bg-[size:32px_32px]" />
                         
                         <div className="flex flex-col gap-10 relative z-10">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-2.5xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                     <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <CheckCircle2 className="h-4 w-4 text-black" strokeWidth={3} />
                                     </div>
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Protocol :: Online</p>
                                     <h4 className="text-3xl font-black text-foreground tracking-tighter">AUTHENTICATED</h4>
                                  </div>
                               </div>
                               
                               <Button
                                  variant="ghost"
                                  onClick={handleDisconnect}
                                  className="h-12 px-6 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-500 text-rose-500/60 font-black text-[10px] uppercase tracking-widest transition-all group"
                               >
                                  <LogOut className="h-4 w-4 mr-2" /> DISCONNECT
                               </Button>
                            </div>

                            <div className="space-y-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                               <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] text-center">Active Mobile Instance</p>
                               <div className="text-4xl md:text-5xl font-black tracking-[0.1em] text-center text-foreground break-all py-2">
                                  {instance?.instanceName.split('_')[1] || '916200469935'}
                               </div>
                               <div className="h-px w-12 bg-emerald-500/20 mx-auto" />
                               <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em] text-center">
                                  ID: {instance?.instanceName || 'W_916200469935'}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto w-full">
                     <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center justify-between group cursor-default">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">MESSAGE PROTOCOL</p>
                           <p className="text-xs font-black text-foreground">Multi-Session V2.0</p>
                        </div>
                        <Zap className="h-4 w-4 text-emerald-500/20 group-hover:text-emerald-500 transition-colors" />
                     </div>
                     <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex items-center justify-between group cursor-default">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">CONNECTION STATUS</p>
                           <p className="text-xs font-black text-foreground">Health State :: Optimal</p>
                        </div>
                        <ShieldCheck className="h-4 w-4 text-blue-500/20 group-hover:text-blue-500 transition-colors" />
                     </div>
                  </div>
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center justify-center space-y-10 animate-in zoom-in-95 duration-500">
                   <div className="text-center space-y-4">
                     <h3 className="text-3xl font-black tracking-tighter">WHATSAPP <span className="text-primary italic">LINK</span></h3>
                     <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                       Scan the QR code below using your WhatsApp app to connect.
                     </p>
                   </div>

                   <div className="relative group p-10 bg-white rounded-[3rem] shadow-2xl shadow-emerald-500/30 ring-[12px] ring-emerald-500/5 transition-all hover:scale-[1.02] active:scale-95 cursor-none">
                     <img
                       src={qrCode}
                       alt="WhatsApp QR Code"
                       className="w-64 h-64 grayscale group-hover:grayscale-0 transition-all duration-700"
                     />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center animate-ping">
                           <QrCode className="h-8 w-8 text-emerald-500" />
                        </div>
                     </div>
                     <Button
                       size="icon"
                       variant="secondary"
                       className="absolute -top-4 -right-4 h-12 w-12 rounded-2xl shadow-2xl border border-white/20 bg-background/80 backdrop-blur-xl hover:bg-background transition-all"
                       onClick={handleRefreshQR}
                     >
                       <RefreshCw className="h-5 w-5 text-primary" />
                     </Button>
                   </div>

                   <div className="flex flex-col items-center gap-6">
                     <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                       <Loader2 className="h-4 w-4 animate-spin" />
                       WAITING FOR ENCRYPTION KEY...
                     </div>
                     <Button variant="ghost" onClick={() => { setQrCode(null); setConnecting(false); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                       TERMINATE CONNECTION ATTEMPT
                     </Button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-12 text-center animate-in fade-in duration-700">
                  <div className="relative">
                     <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
                     <div className="relative h-28 w-28 bg-muted/40 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl group transition-all hover:rotate-12 cursor-pointer">
                       <QrCode className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-4xl font-black tracking-tighter">CONNECTION <span className="text-primary italic">OFFLINE</span></h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Connect your WhatsApp account. Enter your mobile number to generate a QR code.
                    </p>
                  </div>

                  <div className="w-full max-w-md space-y-6">
                     <div className="relative group w-full max-w-sm mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-emerald-500/30 rounded-[1.5rem] blur-lg opacity-30 group-focus-within:opacity-100 transition-all duration-700" />
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-xl opacity-30 group-focus-within:opacity-100 transition-opacity z-10">+</div>
                        <Input
                          placeholder="E.g. 919876543210"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="h-20 pl-14 rounded-[1.5rem] bg-zinc-900/60 border-white/5 focus:bg-zinc-950 focus:ring-primary text-center text-3xl font-black tracking-[0.1em] shadow-inner transition-all relative z-0"
                        />
                     </div>
                     <Button
                       onClick={handleConnect}
                       disabled={connecting}
                       className="h-20 w-full bg-foreground text-background hover:bg-foreground/90 rounded-[1.5rem] text-lg font-black tracking-widest shadow-2xl transition-all active:scale-[0.98] group relative overflow-hidden"
                     >
                       {connecting ? (
                         <>
                           <Loader2 className="h-6 w-6 mr-4 animate-spin" />
                           GENERATING QR CODE...
                         </>
                       ) : (
                         <>
                           <Zap className="h-6 w-6 mr-4 fill-background group-hover:animate-pulse" />
                           CONNECT WHATSAPP
                         </>
                       )}
                     </Button>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
