import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Instagram,
  Plus,
  Trash2,
  Pencil,
  Search,
  ExternalLink,
  Hash,
  Users,
  Radio,
  Loader2,
  LayoutTemplate,
  CheckCircle2,
  RefreshCw,
  Brain,
} from "lucide-react";
import { cn, getOrCreateUserId } from "@/lib/utils";
import type {
  SourceGroup,
  Platform,
  SourceType,
  GroupsResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
} from "@shared/api";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { AIProfilingDialog } from "@/components/ai-profiling/AIProfilingDialog";

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function fetchGroups(platform?: Platform): Promise<SourceGroup[]> {
  const userId = getOrCreateUserId();
  const params = new URLSearchParams();
  params.set("userId", userId);
  if (platform) params.set("platform", platform);
  const res = await fetch(`/api/groups?${params}`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  const data: GroupsResponse = await res.json();
  return data.groups;
}

async function createGroup(body: CreateGroupRequest): Promise<SourceGroup> {
  const userId = getOrCreateUserId();
  const res = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create group");
  return data.group;
}

async function updateGroup(
  id: string,
  body: UpdateGroupRequest
): Promise<SourceGroup> {
  const userId = getOrCreateUserId();
  const res = await fetch(`/api/groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, userId }),
  });
  if (!res.ok) throw new Error("Failed to update group");
  const data = await res.json();
  return data.group;
}

async function deleteGroup(id: string): Promise<void> {
  const userId = getOrCreateUserId();
  const res = await fetch(`/api/groups/${id}?userId=${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete group");
}

// ─── Type Icon Helper ────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: SourceType }) {
  switch (type) {
    case "group":
      return <Users className="w-3.5 h-3.5" />;
    case "account":
      return <Instagram className="w-3.5 h-3.5" />;
    case "hashtag":
      return <Hash className="w-3.5 h-3.5" />;
    case "channel":
      return <Instagram className="w-3.5 h-3.5" />;
  }
}

function typeLabel(type: SourceType, platform?: Platform): string {
  if (platform === "whatsapp" && type === "group") return "WhatsApp Group";
  if (platform === "whatsapp" && type === "channel") return "WhatsApp Channel";
  if (platform === "instagram" && type === "group") return "Instagram Group";
  if (platform === "instagram" && type === "account") return "Instagram Account";
  if (platform === "instagram" && type === "hashtag") return "Instagram Hashtag";
  
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Source Type Options Per Platform ─────────────────────────────────────────

const whatsappTypes: SourceType[] = ["group", "channel"];
const instagramTypes: SourceType[] = ["account", "hashtag", "group"];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Controller() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Platform>("whatsapp");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isAIProfilingOpen, setIsAIProfilingOpen] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SourceGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SourceGroup | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState<Platform>("whatsapp");
  const [formType, setFormType] = useState<SourceType>("group");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // ─── Queries ─────────────────────────────────────────────────────────────

  const {
    data: groups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: () => fetchGroups(),
  });

  // ─── Mutations ───────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Success",
        description: `✅ Source "${data.name}" added successfully!`,
      });
      closeDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Failed to add source",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateGroupRequest }) =>
      updateGroup(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Source Deleted",
        description: "The source has been removed successfully.",
      });
      setDeleteTarget(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateGroup(id, { enabled, userId: getOrCreateUserId() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  // ─── Filtered Groups ────────────────────────────────────────────────────

  const filteredGroups = useMemo(() => {
    let result = groups.filter((g) => g.platform === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [groups, activeTab, searchQuery]);

  // ─── Sync Mutations ────────────────────────────────────────────────────────
  
  const syncGroupsMutation = useMutation({
    mutationFn: async () => {
      const userId = getOrCreateUserId();
      const res = await fetch(`/api/whatsapp/sync-groups`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync groups");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Groups Synced",
        description: `✅ Synced ${data.count} WhatsApp groups successfully!`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Sync Failed",
        description: `❌ ${err.message}`,
        variant: "destructive",
      });
    },
  });

  const syncInstagramMutation = useMutation({
    mutationFn: async () => {
      const userId = getOrCreateUserId();
      const res = await fetch(`/api/instagram/sync-threads?userId=${userId}`, { 
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync threads");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Threads Synced",
        description: `✅ Synced ${data.count} Instagram threads successfully!`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Sync Failed",
        description: `❌ ${err.message}`,
        variant: "destructive",
      });
    },
  });

  // ─── Dialog Helpers ──────────────────────────────────────────────────────

  function openAddDialog() {
    setEditingGroup(null);
    setFormName("");
    setFormPlatform(activeTab);
    setFormType(activeTab === "whatsapp" ? "group" : "account");
    setFormUrl("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function openEditDialog(group: SourceGroup) {
    setEditingGroup(group);
    setFormName(group.name);
    setFormPlatform(group.platform);
    setFormType(group.type);
    setFormUrl(group.url || "");
    setFormDescription(group.description || "");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingGroup(null);
  }

  function handleSubmit() {
    if (!formName.trim()) return;

    if (editingGroup) {
      updateMutation.mutate({
        id: editingGroup.id,
        body: {
          userId: getOrCreateUserId(),
          name: formName,
          type: formType,
          url: formUrl,
          description: formDescription,
        },
      });
    } else {
      createMutation.mutate({
        userId: getOrCreateUserId(),
        name: formName,
        platform: formPlatform,
        type: formType,
        url: formUrl,
        description: formDescription,
      });
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const typeOptions = activeTab === "whatsapp" ? whatsappTypes : instagramTypes;

  const whatsappCount = groups.filter((g) => g.platform === "whatsapp").length;
  const instagramCount = groups.filter(
    (g) => g.platform === "instagram"
  ).length;

  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
              Source <span className="text-primary italic">Manager</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-lg">
              Manage your message sources from WhatsApp and Instagram.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {activeTab === "whatsapp" && (
              <Button
                variant="outline"
                onClick={() => syncGroupsMutation.mutate()}
                disabled={syncGroupsMutation.isPending}
                className="h-12 px-6 rounded-xl font-bold bg-emerald-500/5 border-emerald-500/20 text-emerald-600 gap-2 hover:bg-emerald-500/10 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", syncGroupsMutation.isPending && "animate-spin")} />
                Sync Groups
              </Button>
            )}
            {activeTab === "instagram" && (
              <Button
                variant="outline"
                onClick={() => syncInstagramMutation.mutate()}
                disabled={syncInstagramMutation.isPending}
                className="h-12 px-6 rounded-xl font-bold bg-pink-500/5 border-pink-500/20 text-pink-600 gap-2 hover:bg-pink-500/10 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", syncInstagramMutation.isPending && "animate-spin")} />
                Sync Threads
              </Button>
            )}
            <Button 
                variant="outline" 
                onClick={() => setIsTemplateManagerOpen(true)} 
                className="h-12 px-6 rounded-xl font-bold bg-background/50 border-border/50 gap-2 hover:bg-muted transition-all"
            >
              <LayoutTemplate className="w-4 h-4 text-primary" />
              Manage Templates
            </Button>
            <Button 
                variant="outline" 
                onClick={() => setIsAIProfilingOpen(true)} 
                className="h-12 px-6 rounded-xl font-bold bg-purple-500/5 border-purple-500/20 text-purple-600 gap-2 hover:bg-purple-500/10 transition-all shadow-sm"
            >
              <Brain className="w-4 h-4" />
              AI Profiling
            </Button>
            <Button 
                onClick={openAddDialog} 
                className="h-12 px-6 rounded-xl font-black bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              ADD NEW SOURCE
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as Platform);
            setSearchQuery("");
          }}
          className="space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <TabsList className="bg-muted/50 border border-border/50 p-1.5 h-14 rounded-2xl w-full md:w-auto min-w-[320px]">
              <TabsTrigger value="whatsapp" className="flex-1 rounded-xl gap-2 font-black data-[state=active]:bg-background transition-all">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                WHATSAPP
                <Badge variant="secondary" className="ml-1 bg-emerald-500/10 text-emerald-500 border-none font-black">
                  {whatsappCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex-1 rounded-xl gap-2 font-black data-[state=active]:bg-background transition-all">
                <Instagram className="w-4 h-4 text-pink-500" />
                INSTAGRAM
                <Badge variant="secondary" className="ml-1 bg-pink-500/10 text-pink-500 border-none font-black">
                  {instagramCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full md:max-w-xs group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-12 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary focus:bg-background shadow-inner transition-all font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
              <TabsContent value="whatsapp" className="m-0 focus-visible:outline-none">
                <div className="space-y-8">
                  <PlatformInfo platform="whatsapp" />
                  <GroupList
                    groups={filteredGroups}
                    isLoading={isLoading}
                    error={error}
                    searchQuery={searchQuery}
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onToggle={(id, enabled) =>
                      toggleMutation.mutate({ id, enabled })
                    }
                    platform="whatsapp"
                  />
                </div>
              </TabsContent>

              <TabsContent value="instagram" className="m-0 focus-visible:outline-none">
                <div className="space-y-8">
                  <PlatformInfo platform="instagram" />
                  <GroupList
                    groups={filteredGroups}
                    isLoading={isLoading}
                    error={error}
                    searchQuery={searchQuery}
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onToggle={(id, enabled) =>
                      toggleMutation.mutate({ id, enabled })
                    }
                    platform="instagram"
                  />
                </div>
              </TabsContent>
          </div>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[540px] glass-card border-white/10 dark:border-white/5 p-0 overflow-hidden shadow-2xl rounded-[2rem]">
            <DialogHeader className="p-10 pb-4">
              <DialogTitle className="text-3xl font-black tracking-tight">
                {editingGroup ? "Edit Source" : "Add New Source"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                {editingGroup
                  ? "Update settings for this source."
                  : `Add a new ${activeTab} source.`}
              </DialogDescription>
            </DialogHeader>

            <div className="px-10 py-6 space-y-8">
              {/* Platform & Type */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="source-platform" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Source Type <span className="text-primary">*</span>
                  </Label>
                  <Select 
                    value={formPlatform} 
                    onValueChange={(val: Platform) => {
                      setFormPlatform(val);
                      // Update default type when platform changes
                      setFormType(val === "whatsapp" ? "group" : "account");
                    }}
                    disabled={!!editingGroup} // Optional: restrict platform change on edit
                  >
                    <SelectTrigger id="source-platform" className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold shadow-inner uppercase tracking-wider">
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-2xl border-white/10">
                      <SelectItem value="whatsapp" className="font-bold py-3">WHATSAPP</SelectItem>
                      <SelectItem value="instagram" className="font-bold py-3">INSTAGRAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="source-type" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Sub-Type <span className="text-primary">*</span>
                  </Label>
                  <Select value={formType} onValueChange={(val: SourceType) => setFormType(val)}>
                    <SelectTrigger id="source-type" className="h-14 rounded-2xl bg-muted/30 border-border/50 font-bold shadow-inner">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="glass-card rounded-2xl border-white/10">
                      {(formPlatform === "whatsapp" ? whatsappTypes : instagramTypes).map(t => (
                        <SelectItem key={t} value={t} className="font-bold py-3">
                          {typeLabel(t, formPlatform)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-3">
                <Label htmlFor="source-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Source Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="source-name"
                  placeholder={
                    formPlatform === "whatsapp"
                      ? "e.g. Casting Master-list"
                      : "e.g. @casting_director_pro"
                  }
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                />
              </div>



              {/* URL */}
              <div className="space-y-3">
                <Label htmlFor="source-url" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Endpoint URL (Optional)
                </Label>
                <Input
                  id="source-url"
                  placeholder="https://..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="source-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="source-desc"
                  placeholder="Add some notes about this source..."
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-medium shadow-inner p-5 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="p-10 pt-4 bg-muted/20">
              <Button variant="ghost" onClick={closeDialog} className="h-14 flex-1 rounded-2xl font-bold bg-muted/50">
                DISCARD
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || isSubmitting}
                className="h-14 flex-[2] rounded-2xl font-black bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mr-3" />
                )}
                {editingGroup ? "SAVE CHANGES" : "ADD SOURCE"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent className="glass-card border-white/10 dark:border-white/5 rounded-[2rem] p-10 shadow-2xl">
            <AlertDialogHeader className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-2 mx-auto">
                 <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <AlertDialogTitle className="text-3xl font-black tracking-tight text-center">Delete Source?</AlertDialogTitle>
              <AlertDialogDescription className="text-center font-medium leading-relaxed">
                You are about to permanently delete the source <strong>{deleteTarget?.name}</strong>. Syncing from this source will stop immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 flex gap-4 justify-center sm:justify-center">
              <AlertDialogCancel className="h-14 px-8 rounded-2xl font-bold bg-muted/50 border-none">CANCEL</AlertDialogCancel>
              <AlertDialogAction
                className="h-14 px-8 rounded-2xl font-black bg-destructive text-white hover:bg-destructive/90 shadow-xl shadow-destructive/20 active:scale-95 transition-all"
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                }}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5 mr-3" />
                )}
                CONFIRM DELETION
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <TemplateManager open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen} />
        <AIProfilingDialog open={isAIProfilingOpen} onOpenChange={setIsAIProfilingOpen} />
      </div>
    </AppLayout>
  );
}

// ─── Platform Info Card ──────────────────────────────────────────────────────

function PlatformInfo({ platform }: { platform: Platform }) {
  if (platform === "whatsapp") {
    return (
      <Card className="mb-6 border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40 shrink-0">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">
                WhatsApp Monitoring via Baileys Evolution API
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add your WhatsApp group names or invite links below. The
                Evolution API (powered by Baileys) connects to these groups via
                QR code authentication and pushes incoming messages via webhooks
                for casting call syncing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-pink-200 dark:border-pink-900/40 bg-pink-50/50 dark:bg-pink-950/20">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/40 shrink-0">
            <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm text-foreground">
              Instagram Monitoring via instagrapi
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add Instagram accounts, hashtags, or group chats to monitor. The
              instagrapi library connects using session-based auth to scrape
              posts, stories, and DMs for relevant casting call data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Group List ──────────────────────────────────────────────────────────────

interface GroupListProps {
  groups: SourceGroup[];
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;
  onEdit: (group: SourceGroup) => void;
  onDelete: (group: SourceGroup) => void;
  onToggle: (id: string, enabled: boolean) => void;
  platform: Platform;
}

function GroupList({
  groups,
  isLoading,
  error,
  searchQuery,
  onEdit,
  onDelete,
  onToggle,
  platform,
}: GroupListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading sources...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive font-medium">Failed to load sources</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message}
        </p>
      </div>
    );
  }

  if (groups.length === 0) {
    const isSearching = searchQuery.trim().length > 0;
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          {platform === "whatsapp" ? (
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
          ) : (
            <Instagram className="w-12 h-12 text-muted-foreground/40 mb-4" />
          )}
          <p className="font-medium text-foreground">
            {isSearching ? "No results found" : "No sources added yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs text-center">
            {isSearching
              ? `No ${platform === "whatsapp" ? "WhatsApp" : "Instagram"} sources match "${searchQuery}".`
              : `Click "Add Source" to start monitoring ${platform === "whatsapp" ? "WhatsApp groups" : "Instagram accounts"}.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div
          key={group.id}
          className={`flex items-center justify-between p-4 rounded-lg border border-border bg-card transition-all duration-200 ${
            group.enabled
              ? "hover:bg-muted/50 hover:shadow-sm"
              : "opacity-60 bg-muted/30"
          }`}
        >
          {/* Left: Info */}
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`font-medium truncate ${group.enabled ? "text-foreground" : "text-muted-foreground"}`}
              >
                {group.name}
              </p>
              <Badge
                variant="outline"
                className="gap-1 text-xs shrink-0 font-normal"
              >
                <TypeIcon type={group.type} />
                {typeLabel(group.type, group.platform)}
              </Badge>
            </div>

            {group.description && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {group.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-muted-foreground">
                Added {new Date(group.createdAt).toLocaleDateString()}
              </span>
              {group.url && (
                <a
                  href={group.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Link
                </a>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={group.enabled}
              onCheckedChange={(checked) => onToggle(group.id, checked)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(group)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(group)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
