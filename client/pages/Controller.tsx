import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type {
  SourceGroup,
  Platform,
  SourceType,
  GroupsResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
} from "@shared/api";
import { TemplateManager } from "@/components/templates/TemplateManager";

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function fetchGroups(platform?: Platform): Promise<SourceGroup[]> {
  const params = new URLSearchParams();
  if (platform) params.set("platform", platform);
  const res = await fetch(`/api/groups?${params}`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  const data: GroupsResponse = await res.json();
  return data.groups;
}

async function createGroup(body: CreateGroupRequest): Promise<SourceGroup> {
  const res = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create group");
  const data = await res.json();
  return data.group;
}

async function updateGroup(
  id: string,
  body: UpdateGroupRequest
): Promise<SourceGroup> {
  const res = await fetch(`/api/groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update group");
  const data = await res.json();
  return data.group;
}

async function deleteGroup(id: string): Promise<void> {
  const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
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
      return <Radio className="w-3.5 h-3.5" />;
  }
}

function typeLabel(type: SourceType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Source Type Options Per Platform ─────────────────────────────────────────

const whatsappTypes: SourceType[] = ["group", "channel"];
const instagramTypes: SourceType[] = ["account", "hashtag", "group"];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Controller() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Platform>("whatsapp");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SourceGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SourceGroup | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      closeDialog();
    },
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
      setDeleteTarget(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateGroup(id, { enabled }),
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

  // ─── Dialog Helpers ──────────────────────────────────────────────────────

  function openAddDialog() {
    setEditingGroup(null);
    setFormName("");
    setFormType(activeTab === "whatsapp" ? "group" : "account");
    setFormUrl("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function openEditDialog(group: SourceGroup) {
    setEditingGroup(group);
    setFormName(group.name);
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
          name: formName,
          type: formType,
          url: formUrl,
          description: formDescription,
        },
      });
    } else {
      createMutation.mutate({
        name: formName,
        platform: activeTab,
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

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Controller Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your WhatsApp and Instagram source groups for casting call
              monitoring.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => setIsTemplateManagerOpen(true)} className="gap-2">
              <LayoutTemplate className="w-4 h-4" />
              Manage Templates
            </Button>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Source
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
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="whatsapp" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
                <Badge variant="secondary" className="ml-1 text-xs">
                  {whatsappCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
                <Badge variant="secondary" className="ml-1 text-xs">
                  {instagramCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* WhatsApp Tab Content */}
          <TabsContent value="whatsapp" className="mt-6">
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
          </TabsContent>

          {/* Instagram Tab Content */}
          <TabsContent value="instagram" className="mt-6">
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
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Source" : "Add New Source"}
              </DialogTitle>
              <DialogDescription>
                {editingGroup
                  ? "Update the details for this source."
                  : `Add a new ${activeTab === "whatsapp" ? "WhatsApp" : "Instagram"} source to monitor.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="source-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="source-name"
                  placeholder={
                    activeTab === "whatsapp"
                      ? "e.g. Casting Calls - Mumbai"
                      : "e.g. @casting_calls_india"
                  }
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="source-type">Type</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => setFormType(v as SourceType)}
                >
                  <SelectTrigger id="source-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="source-url">
                  URL / Link{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="source-url"
                  placeholder={
                    activeTab === "whatsapp"
                      ? "e.g. https://chat.whatsapp.com/invite..."
                      : "e.g. https://instagram.com/username"
                  }
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="source-desc">
                  Description{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="source-desc"
                  placeholder="Brief note about this source..."
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingGroup ? "Save Changes" : "Add Source"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Source</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove{" "}
                <strong>{deleteTarget?.name}</strong>? This action cannot be
                undone and the group will stop being monitored.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                }}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Template Manager */}
      <TemplateManager open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen} />
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
                for AI-powered casting call extraction.
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
                {typeLabel(group.type)}
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
