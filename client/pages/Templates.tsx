import * as React from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog as RenameDialog,
  DialogContent as RenameDialogContent,
  DialogHeader as RenameDialogHeader,
  DialogTitle as RenameDialogTitle,
  DialogFooter as RenameDialogFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Mail,
  Instagram,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Paperclip,
  HardDrive,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplateCategory, TemplatesResponse } from "@shared/api";
import { TemplateEditor } from "../components/templates/TemplateEditor";
import { getOrCreateUserId, cn } from "@/lib/utils";

async function fetchTemplates(category?: string): Promise<Template[]> {
  const userId = getOrCreateUserId();
  const params = new URLSearchParams();
  params.set("userId", userId);
  if (category) params.set("category", category);
  
  const res = await fetch(`/api/templates?${params}`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  const data: TemplatesResponse = await res.json();
  return data.templates;
}

function TemplateCard({
  template,
  onEdit,
  onRename,
  onDelete,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onRename: (t: Template) => void;
  onDelete: (t: Template) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all shadow-sm hover:shadow-md group">
      <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {template.isAttachment ? (
            <Paperclip className="h-5 w-5 text-primary" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black truncate text-foreground">{template.name}</p>
          {template.isAttachment ? (
            <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">Attachment template</p>
          ) : (
            <p className="text-[13px] text-muted-foreground truncate font-medium mt-0.5">
              {(template.content || "").replace(/<[^>]+>/g, "")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {template.category === "email" && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0",
              template.emailTemplateType === "footer"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
            )}
          >
            {template.emailTemplateType === "footer" ? "Footer" : "Body"}
          </Badge>
        )}
        {template.isAttachment && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">Attachment</Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(template)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TemplateTabContent({
  category,
  templates,
  onCreateNew,
  onEdit,
  onRename,
  onDelete,
}: {
  category: TemplateCategory;
  templates: Template[];
  onCreateNew: () => void;
  onEdit: (t: Template) => void;
  onRename: (t: Template) => void;
  onDelete: (t: Template) => void;
}) {
  const categoryTemplates = templates.filter((t) => t.category === category);

  return (
    <div className="space-y-2 pt-2">
      {categoryTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No templates yet.</p>
          <p className="text-xs mt-1">Click "Create Template" above to get started.</p>
        </div>
      ) : (
        categoryTemplates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onEdit={onEdit}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

export default function Templates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<TemplateCategory>("whatsapp");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null);
  const [typeSelectOpen, setTypeSelectOpen] = React.useState(false);
  const [selectedEmailType, setSelectedEmailType] = React.useState<"body" | "footer" | undefined>(undefined);
  const [forceAttachment, setForceAttachment] = React.useState(false);

  // Rename dialog state
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState<Template | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Template | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: () => fetchTemplates(),
  });

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setForceAttachment(false);
    setSelectedEmailType(undefined);
    setTypeSelectOpen(true);
  };

  const handleSelectType = (type: "text" | "attachment" | "body" | "footer") => {
    setTypeSelectOpen(false);
    if (type === "attachment") {
      setForceAttachment(true);
      setEditorOpen(true);
    } else if (type === "body" || type === "footer") {
      setForceAttachment(false);
      setSelectedEmailType(type);
      setEditorOpen(true);
    } else {
      setForceAttachment(false);
      setSelectedEmailType(undefined);
      setEditorOpen(true);
    }
  };

  // keep old handler name alias for edit flow
  const handleSelectEmailType = (type: "body" | "footer") => handleSelectType(type);

  const handleEdit = (t: Template) => {
    setForceAttachment(false);
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleRenameOpen = (t: Template) => {
    setRenameTarget(t);
    setRenameValue(t.name);
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const userId = getOrCreateUserId();
      const res = await fetch(`/api/templates/${renameTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim(), userId }),
      });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Renamed", description: `Template renamed to "${renameValue}".` });
      setRenameOpen(false);
    } catch {
      toast({ title: "Error", description: "Could not rename template.", variant: "destructive" });
    }
  };

  const handleDeleteOpen = (t: Template) => {
    setDeleteTarget(t);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const userId = getOrCreateUserId();
      const res = await fetch(`/api/templates/${deleteTarget.id}?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Deleted", description: `"${deleteTarget.name}" was removed.` });
      setDeleteOpen(false);
    } catch {
      toast({ title: "Error", description: "Could not delete template.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">
              Template <span className="text-primary italic">Library</span>
            </h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
              Architect and manage cross-platform outreach templates.
            </p>
          </div>
          <Button onClick={handleCreateNew} className="h-12 px-6 rounded-xl font-black bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-xl transition-all active:scale-95 shrink-0">
            <Plus className="h-5 w-5" /> NEW TEMPLATE
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TemplateCategory)}
          className="flex-1 flex flex-col"
        >
            <TabsList className="bg-muted/50 border border-border/50 p-1.5 h-14 rounded-2xl w-full mb-8">
              <TabsTrigger value="whatsapp" className="flex-1 rounded-xl gap-2 font-black data-[state=active]:bg-background transition-all data-[state=active]:text-emerald-500">
                <MessageCircle className="h-4 w-4" /> WHATSAPP
                <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5 font-black bg-emerald-500/10 text-emerald-500 border-none">
                  {templates.filter((t) => t.category === "whatsapp").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1 rounded-xl gap-2 font-black data-[state=active]:bg-background transition-all data-[state=active]:text-blue-500">
                <Mail className="h-4 w-4" /> EMAIL
                <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5 font-black bg-blue-500/10 text-blue-500 border-none">
                  {templates.filter((t) => t.category === "email").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex-1 rounded-xl gap-2 font-black data-[state=active]:bg-background transition-all data-[state=active]:text-pink-500">
                <Instagram className="h-4 w-4" /> INSTAGRAM
                <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5 font-black bg-pink-500/10 text-pink-500 border-none">
                  {templates.filter((t) => t.category === "instagram").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto flex-1 pr-2 -mr-2 space-y-4">
              {(["whatsapp", "email", "instagram"] as TemplateCategory[]).map((cat) => (
                <TabsContent key={cat} value={cat} className="m-0 space-y-3">
                  <TemplateTabContent
                    category={cat}
                    templates={templates}
                    onCreateNew={handleCreateNew}
                    onEdit={handleEdit}
                    onRename={handleRenameOpen}
                    onDelete={handleDeleteOpen}
                  />
                </TabsContent>
              ))}
            </div>
        </Tabs>
      </div>

      {/* Template Editor (create / edit) */}
      <TemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        defaultCategory={activeTab}
        selectedEmailType={selectedEmailType}
        forceAttachment={forceAttachment}
      />

      {/* Template Type Selector Dialog — shown for all platforms */}
      <Dialog open={typeSelectOpen} onOpenChange={setTypeSelectOpen}>
        <DialogContent className="sm:max-w-[480px] glass-card border-border dark:border-border/50 rounded-[2rem] p-10 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black tracking-tight text-center">
              {activeTab === "whatsapp" ? "WHATSAPP" : activeTab === "email" ? "EMAIL" : "INSTAGRAM"} TEMPLATE TYPE
            </DialogTitle>
            <DialogDescription className="text-center font-medium uppercase tracking-widest text-[9px]">
              Choose the template structure to initialize
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 pt-6">
            {/* Text Template — all platforms */}
            {activeTab !== "email" && (
              <button
                onClick={() => handleSelectType("text")}
                className="h-24 rounded-2xl flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border hover:border-foreground/20 text-foreground gap-1.5 transition-all"
              >
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-black uppercase">
                  {activeTab === "whatsapp" ? "WhatsApp" : "Instagram"} Message Template
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                  Plain text with personalization tags
                </span>
              </button>
            )}

            {/* Email body / footer */}
            {activeTab === "email" && (
              <>
                <button
                  onClick={() => handleSelectType("body")}
                  className="h-24 rounded-2xl flex flex-col items-center justify-center p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 gap-1.5 transition-all"
                >
                  <Mail className="h-6 w-6" />
                  <span className="text-sm font-black uppercase">Email Body Template</span>
                  <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">Contains Subject &amp; Main Content</span>
                </button>
                <button
                  onClick={() => handleSelectType("footer")}
                  className="h-24 rounded-2xl flex flex-col items-center justify-center p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 gap-1.5 transition-all"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm font-black uppercase">Email Footer Template</span>
                  <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">Appended to the bottom of drafts</span>
                </button>
              </>
            )}

            {/* Attachment — all platforms */}
            <button
              onClick={() => handleSelectType("attachment")}
              className={`h-24 rounded-2xl flex flex-col items-center justify-center p-4 border gap-1.5 transition-all ${
                activeTab === "whatsapp"
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : activeTab === "instagram"
                  ? "bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-400"
                  : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400"
              }`}
            >
              <Paperclip className="h-6 w-6" />
              <span className="text-sm font-black uppercase">Attachment Template</span>
              <span className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                {activeTab === "whatsapp" ? "Image, Video, Audio, PDF (max 64MB)" :
                 activeTab === "instagram" ? "Images only (max 8MB)" :
                 "Any file type (max 25MB total)"}
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <RenameDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <RenameDialogContent className="sm:max-w-[420px] glass-card border-border dark:border-border/50 rounded-[2rem] p-10 shadow-2xl">
          <RenameDialogHeader>
            <RenameDialogTitle className="text-2xl font-black tracking-tight">Modify Label</RenameDialogTitle>
          </RenameDialogHeader>
          <div className="py-6 space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Template Name</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
              placeholder="Template name..."
              className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
            />
          </div>
          <RenameDialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setRenameOpen(false)} className="h-14 rounded-xl font-bold bg-muted/50">CANCEL</Button>
            <Button onClick={handleRenameSave} className="h-14 rounded-xl font-black bg-primary text-primary-foreground shadow-lg px-8">SAVE CHANGES</Button>
          </RenameDialogFooter>
        </RenameDialogContent>
      </RenameDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-card border-border dark:border-border/50 rounded-[2rem] p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-2 mx-auto">
               <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight text-center">Delete Template?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium leading-relaxed">
              Are you sure you want to permanently delete "{deleteTarget?.name}"? Outreach tracking using this template will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3 justify-center">
            <AlertDialogCancel className="h-14 rounded-xl font-bold bg-muted/50 border-none">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-14 rounded-xl font-black bg-destructive text-foreground hover:bg-destructive/90 shadow-xl shadow-destructive/20 px-8"
            >
              CONFIRM TERMINATION
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

