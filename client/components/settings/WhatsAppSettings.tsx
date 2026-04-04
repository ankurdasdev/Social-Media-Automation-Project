import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, LogOut, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { WhatsAppStatusResponse, WhatsAppQRResponse } from "@shared/api";
import { toast } from "sonner";

export function WhatsAppSettings() {
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null);
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
    setConnecting(true);
    setQrCode(null);
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      const data: WhatsAppQRResponse = await res.json();
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
        toast.success("QR Code generated. Please scan with WhatsApp.");
      }
    } catch (err) {
      toast.error("Failed to start WhatsApp connection");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp?")) return;
    try {
      await fetch("/api/whatsapp/disconnect", { method: "DELETE" });
      setStatus({ instance: null, isConnected: false });
      setQrCode(null);
      toast.success("WhatsApp disconnected");
    } catch (err) {
      toast.error("Failed to disconnect WhatsApp");
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
      toast.error("Failed to refresh QR code");
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = status?.isConnected;
  const instance = status?.instance;

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                WhatsApp Connection
                {isConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-zinc-500 border-zinc-800 px-2 py-0">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Connect your WhatsApp account to enable automated messaging and lead ingestion.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConnected && !qrCode && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 space-y-4">
              <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800">
                <QrCode className="h-8 w-8 text-zinc-400" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium text-white">No WhatsApp Connected</h3>
                <p className="text-sm text-zinc-500 max-w-[300px]">
                  Click the button below to generate a QR code and link your WhatsApp instance.
                </p>
              </div>
              <Button 
                onClick={handleConnect} 
                disabled={connecting}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Connect WhatsApp"
                )}
              </Button>
            </div>
          )}

          {qrCode && !isConnected && (
            <div className="flex flex-col items-center justify-center p-8 border border-zinc-800 rounded-xl bg-zinc-950 space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
                <p className="text-sm text-zinc-400">
                  Open WhatsApp on your phone &gt; Menu or Settings &gt; Linked Devices &gt; Link a Device
                </p>
              </div>
              
              <div className="relative group p-4 bg-white rounded-xl shadow-2xl shadow-emerald-500/10">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 transition-opacity duration-300"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRefreshQR}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for scan...
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setQrCode(null); setConnecting(false); }} className="text-zinc-500 hover:text-white">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 font-medium">Instance Name</span>
                  <span className="text-sm text-white font-mono">{instance?.instanceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500 font-medium">Status</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Active</Badge>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Instance
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <h4 className="text-sm font-semibold text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected Successfully
                </h4>
                <p className="text-xs text-emerald-500/70 leading-relaxed">
                  Your WhatsApp account is now linked. You can start sending automated messages and ingest leads directly from groups.
                </p>
                <div className="pt-1">
                   <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Evolution API v2.x</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
