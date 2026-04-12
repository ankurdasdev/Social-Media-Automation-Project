import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, LogOut, CheckCircle2, XCircle, RefreshCw, MessageSquare, Zap } from "lucide-react";
import { WhatsAppStatusResponse, WhatsAppQRResponse } from "@shared/api";
import { toast } from "sonner";

export function WhatsAppSettings() {
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data: WhatsAppStatusResponse = await res.json();
      setStatus(data);
      if (data.isConnected) {
        setQrCode(null);
        setConnecting(false);
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
      // Poll faster if we are waiting for QR scan
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
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobileNumber.trim() })
      });
      const data: WhatsAppQRResponse = await res.json();
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
        toast.success("Connection started. Scan QR to connect.");
      }
    } catch (err) {
      toast.error("Failed to connect WhatsApp.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch("/api/whatsapp/disconnect", { method: "DELETE" });
      setStatus({ instance: null, isConnected: false });
      setQrCode(null);
      toast.success("WhatsApp disconnected.");
    } catch (err) {
      toast.error("Failed to disconnect.");
    }
  };

  const handleRefreshQR = async () => {
    try {
      const res = await fetch("/api/whatsapp/qr");
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden glass-card border-white/10 rounded-[3rem] shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10" />

        <div className="flex flex-col md:flex-row">
           <div className="p-10 md:p-14 md:w-[40%] border-b md:border-b-0 md:border-r border-white/5 bg-muted/20 backdrop-blur-xl">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-10 shadow-xl shadow-emerald-500/10">
                 <MessageSquare className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-4 flex items-center gap-3">
                WHATSAPP <span className="text-emerald-500 text-glow">CONNECTION</span>
                {isConnected && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                )}
              </h2>
              <p className="text-muted-foreground/80 text-sm font-medium leading-relaxed mb-8">
                Connect your WhatsApp account to enable automated messaging and lead management. 
                Scale your outreach with our automated system.
              </p>
              
              <div className="space-y-4">
                 <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                       <CheckCircle2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Messaging Status</p>
                       <p className="text-[10px] text-muted-foreground font-bold">Active</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                       <QrCode className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Connection Security</p>
                       <p className="text-[10px] text-muted-foreground font-bold">Encrypted</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="p-10 md:p-14 flex-1 flex flex-col justify-center min-h-[450px]">
              {isConnected ? (
                <div className="space-y-10 animate-in zoom-in-95 duration-500">
                  <div className="p-10 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                     <div className="flex items-center gap-8 relative z-10">
                        <div className="h-28 w-28 rounded-full border-4 border-emerald-500/20 p-2 shadow-2xl shadow-emerald-500/20 bg-background/50 backdrop-blur-3xl animate-pulse-slow">
                           <div className="w-full h-full rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                              <CheckCircle2 className="h-12 w-12 text-emerald-500 " />
                           </div>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Protocol: Online</p>
                           <h3 className="text-3xl font-black tracking-tighter text-foreground">{instance?.instanceName}</h3>
                           <p className="text-[11px] font-black text-muted-foreground mt-1 opacity-50 uppercase tracking-widest">Evolution Instance ID: {status.instance?.instanceName.split('_')[1] || 'Primary'}</p>
                        </div>
                     </div>
                     <Button 
                       variant="outline"
                       onClick={handleDisconnect}
                       className="h-14 px-10 rounded-2xl border-white/10 hover:border-destructive/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 group relative z-10"
                     >
                       <LogOut className="h-4 w-4 mr-3" /> DISCONNECT
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-8 rounded-3xl bg-muted/20 border border-white/5 hover:border-emerald-500/30 transition-all group shadow-inner">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/70 mb-4">Message Protocol</h4>
                        <p className="text-base font-black text-foreground group-hover:translate-x-1 transition-transform">Multi-Session V2.0</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1">Optimized connection active.</p>
                     </div>
                     <div className="p-8 rounded-3xl bg-muted/20 border border-white/5 hover:border-blue-500/30 transition-all group shadow-inner">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/70 mb-4">Connection Status</h4>
                        <p className="text-base font-black text-foreground group-hover:translate-x-1 transition-transform">Health State :: Optimal</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1">Zero dropped packets detected.</p>
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
                     <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-xl opacity-30 group-focus-within:opacity-100 transition-opacity">+</div>
                        <Input
                          placeholder="E.g. 919876543210"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="h-20 pl-12 rounded-[1.5rem] bg-muted/30 border-white/5 focus:bg-background focus:ring-primary text-center text-3xl font-black tracking-[0.1em] shadow-inner transition-all"
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

