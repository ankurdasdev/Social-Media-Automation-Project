import * as React from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  Mail,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  LogOut,
  Instagram,
  MessageSquare,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { getOrCreateUserId } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import InstagramSettings from "@/components/settings/InstagramSettings";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();

  // ── Google Status ──────────────────────────────────────────────────────────
  const { data: googleStatus, isLoading: googleLoading, refetch: refetchGoogle } = useQuery({
    queryKey: ["google-status", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/google/status?userId=${userId}`);
      return res.json() as Promise<{
        connected: boolean;
        needsReauth: boolean;
        userEmail?: string;
        userName?: string;
        driveFolderId?: string;
        driveFolderName?: string;
      }>;
    },
  });

  // ── Drive folders (when connected) ────────────────────────────────────────
  const { data: foldersData } = useQuery({
    queryKey: ["drive-folders", userId],
    queryFn: async () => {
      const res = await fetch(`/api/drive/folders?userId=${userId}`);
      return res.json() as Promise<{ folders: { id: string; name: string }[] }>;
    },
    enabled: !!googleStatus?.connected && !googleStatus?.needsReauth,
  });

  const handleConnectGoogle = () => {
    window.location.href = `/api/auth/google?userId=${userId}`;
  };

  const handleDisconnectGoogle = async () => {
    await fetch(`/api/auth/google?userId=${userId}`, { method: "DELETE" });
    await refetchGoogle();
    toast({ title: "Disconnected", description: "Google account disconnected." });
  };

  const handleSetFolder = async (folderId: string) => {
    const folder = foldersData?.folders.find((f) => f.id === folderId);
    await fetch("/api/auth/google/folder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, folderId, folderName: folder?.name }),
    });
    await refetchGoogle();
    toast({ title: "Folder Set", description: `Drive folder "${folder?.name}" saved.` });
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      refetchGoogle();
      toast({ title: "Google Connected!", description: "Your account has been linked successfully." });
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Globe className="h-8 w-8 text-indigo-500" />
            Integrations & Settings
          </h1>
          <p className="text-zinc-400 text-base">
            Manage your connected platforms and automation preferences.
          </p>
        </div>

        <Tabs defaultValue="google" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-12">
            <TabsTrigger value="google" className="data-[state=active]:bg-zinc-800 gap-2 h-10 px-6">
              <Mail className="h-4 w-4 text-blue-400" />
              Google & Drive
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-zinc-800 gap-2 h-10 px-6">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="instagram" className="data-[state=active]:bg-zinc-800 gap-2 h-10 px-6">
              <Instagram className="h-4 w-4 text-pink-400" />
              Instagram
            </TabsTrigger>
          </TabsList>

          {/* ── Google Tab ────────────────────────────────────────────────── */}
          <TabsContent value="google" className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-400" />
                  Google Workspace
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Connect Google Drive for attachments and Gmail for automated email outreach.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {googleLoading ? (
                  <div className="flex items-center gap-3 text-zinc-400 py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verifying connection...</span>
                  </div>
                ) : googleStatus?.connected ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <CheckCircle2 className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{googleStatus.userName}</p>
                          <p className="text-xs text-zinc-500">{googleStatus.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {googleStatus.needsReauth && (
                          <Button size="sm" onClick={handleConnectGoogle} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <RefreshCw className="h-4 w-4" /> Re-auth
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDisconnectGoogle}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 gap-2"
                        >
                          <LogOut className="h-4 w-4" /> Disconnect
                        </Button>
                      </div>
                    </div>

                    {!googleStatus.needsReauth && (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1">
                            <HardDrive className="h-3.5 w-3.5 mr-1.5" /> Drive Active
                          </Badge>
                          <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1">
                            <Mail className="h-3.5 w-3.5 mr-1.5" /> Gmail Active
                          </Badge>
                        </div>

                        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <FolderOpen className="h-4 w-4" /> Drive Attachments Folder
                          </div>
                          <p className="text-sm text-zinc-400">
                            Select the default folder to browse when picking attachments for your leads.
                          </p>
                          <Select
                            value={googleStatus.driveFolderId ?? ""}
                            onValueChange={handleSetFolder}
                          >
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300">
                              <SelectValue placeholder="Choose a folder..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                              {foldersData?.folders.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  📁 {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {googleStatus.driveFolderName && (
                            <p className="text-sm text-emerald-500 flex items-center gap-2 font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              Selected: {googleStatus.driveFolderName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 space-y-4">
                    <div className="h-16 w-16 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800">
                      <Mail className="h-8 w-8 text-zinc-500" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-white">Not Connected</h3>
                      <p className="text-sm text-zinc-500 max-w-sm">
                        Grant permission to access your Google Drive and Gmail to automate your outreach workflow.
                      </p>
                    </div>
                    <Button onClick={handleConnectGoogle} className="bg-white text-black hover:bg-zinc-200 px-8 py-6 rounded-xl text-base font-bold shadow-lg shadow-white/5 transition-transform active:scale-95">
                      Connect Google Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── WhatsApp Tab ──────────────────────────────────────────────── */}
          <TabsContent value="whatsapp" className="space-y-6">
            <WhatsAppSettings />
          </TabsContent>

          {/* ── Instagram Tab ─────────────────────────────────────────────── */}
          <TabsContent value="instagram" className="space-y-6">
            <InstagramSettings />
          </TabsContent>
        </Tabs>

        <Separator className="bg-zinc-800" />

        {/* ── Security / Info ───────────────────────────────────────────── */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
          <ShieldCheck className="h-6 w-6 text-indigo-400 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Secure Isolation Active</p>
            <p className="text-xs text-zinc-500">
              Your credentials and tokens are encrypted and isolated to User ID: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-400">{userId}</code>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
