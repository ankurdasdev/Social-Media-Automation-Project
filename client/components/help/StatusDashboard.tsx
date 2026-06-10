import { useQuery } from "@tanstack/react-query";
import { getOrCreateUserId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, MessageSquare, Instagram, HardDrive } from "lucide-react";

export default function StatusDashboard() {
  const userId = getOrCreateUserId();
  const navigate = useNavigate();

  const { data: waStatus, isLoading: waLoading } = useQuery({
    queryKey: ["whatsapp-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/status?userId=${userId}`);
      return res.json() as Promise<{ isConnected: boolean }>;
    },
    staleTime: 30000,
  });

  const { data: igStatus, isLoading: igLoading } = useQuery({
    queryKey: ["instagram-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/instagram/status?userId=${userId}`);
      return res.json() as Promise<{ isConnected: boolean; username?: string }>;
    },
    staleTime: 30000,
  });

  const { data: googleStatus, isLoading: googleLoading } = useQuery({
    queryKey: ["google-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/status?userId=${userId}`);
      return res.json() as Promise<{ connected: boolean; needsReauth: boolean }>;
    },
    staleTime: 60000,
  });

  const statuses = [
    {
      name: "WhatsApp",
      icon: MessageSquare,
      connected: waStatus?.isConnected ?? false,
      loading: waLoading,
      color: "emerald",
      description: waStatus?.isConnected ? "Connected & ready to send" : "Scan QR code to connect",
    },
    {
      name: "Instagram",
      icon: Instagram,
      connected: igStatus?.isConnected ?? false,
      loading: igLoading,
      color: "pink",
      description: igStatus?.isConnected
        ? `Connected as @${igStatus.username || "user"}`
        : "Login to connect your account",
    },
    {
      name: "Google Drive",
      icon: HardDrive,
      connected: googleStatus?.connected ?? false,
      loading: googleLoading,
      color: "blue",
      description: googleStatus?.connected
        ? googleStatus.needsReauth
          ? "Re-authentication required"
          : "Connected & authorized"
        : "Connect for file attachments",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-black tracking-tight text-foreground">Platform Status</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          Check your integrations before contacting support
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statuses.map((status) => {
          const Icon = status.icon;
          const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
            emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-500", dot: "bg-emerald-500" },
            pink: { bg: "bg-pink-500/5", border: "border-pink-500/20", text: "text-pink-500", dot: "bg-pink-500" },
            blue: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-500", dot: "bg-blue-500" },
          };
          const colors = colorMap[status.color];

          return (
            <div
              key={status.name}
              className={cn(
                "glass-card p-5 rounded-2xl border transition-all",
                status.connected ? `${colors.bg} ${colors.border}` : "border-border/50"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", status.connected ? colors.text : "text-muted-foreground/50")} />
                  <span className="text-sm font-black uppercase tracking-widest">{status.name}</span>
                </div>
                {status.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : status.connected ? (
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", colors.dot)} />
                    <CheckCircle2 className={cn("w-4 h-4", colors.text)} />
                  </div>
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground/30" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-3">{status.description}</p>
              {!status.connected && !status.loading && (
                <button
                  onClick={() => navigate("/integrations")}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors",
                    colors.text, `hover:opacity-80`
                  )}
                >
                  Fix Now <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
