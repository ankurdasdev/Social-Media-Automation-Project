import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplateCategory, TemplatesResponse } from "@shared/api";
import { TemplateEditor } from "./TemplateEditor";

interface TemplateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function fetchTemplates(category?: string): Promise<Template[]> {
  const params = category ? `?category=${category}` : "";
  const res = await fetch(`/api/templates${params}`);
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
    <div className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
          {template.isAttachment ? (
            <Paperclip className="h-4 w-4 text-slate-500" />
          ) : (
            <FileText className="h-4 w-4 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{template.name}</p>
          {template.isAttachment ? (
            <p className="text-[11px] text-muted-foreground">Attachment template</p>
          ) : (
            <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">{template.content}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {template.isAttachment && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1">Attachment</Badge>
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

export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<TemplateCategory>("whatsapp");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null);

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
    enabled: open,
  });

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleEdit = (t: Template) => {
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
      const res = await fetch(`/api/templates/${renameTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
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
      const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Deleted", description: `"${deleteTarget.name}" was removed.` });
      setDeleteOpen(false);
    } catch {
      toast({ title: "Error", description: "Could not delete template.", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] glass-card border-white/10 dark:border-white/5 p-0 overflow-hidden shadow-2xl rounded-[2rem] max-h-[90vh] flex flex-col">
          <DialogHeader className="p-10 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black tracking-tighter">Blueprint <span className="text-primary italic">Library</span></DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
                  Architect and manage cross-platform outreach templates.
                </DialogDescription>
              </div>
              <Button onClick={handleCreateNew} className="h-12 px-6 rounded-xl font-black bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-xl transition-all active:scale-95 shrink-0">
                <Plus className="h-5 w-5" /> NEW BLUEPRINT
              </Button>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TemplateCategory)}
            className="flex-1 flex flex-col overflow-hidden px-10 pb-10"
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
        </DialogContent>
      </Dialog>

      {/* Template Editor (create / edit) */}
      <TemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        defaultCategory={activeTab}
      />

      {/* Rename Dialog */}
      <RenameDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <RenameDialogContent className="sm:max-w-[420px] glass-card border-white/10 dark:border-white/5 rounded-[2rem] p-10 shadow-2xl">
          <RenameDialogHeader>
            <RenameDialogTitle className="text-2xl font-black tracking-tight">Modify Label</RenameDialogTitle>
          </RenameDialogHeader>
          <div className="py-6 space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Blueprint Identifier</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
              placeholder="Blueprint name..."
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
        <AlertDialogContent className="glass-card border-white/10 dark:border-white/5 rounded-[2rem] p-10 shadow-2xl">
          <AlertDialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-2 mx-auto">
               <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tight text-center">Terminate Blueprint?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-medium leading-relaxed">
              Are you sure you want to permanently delete "{deleteTarget?.name}"? Intelligence streams using this model will be disrupted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3 justify-center">
            <AlertDialogCancel className="h-14 rounded-xl font-bold bg-muted/50 border-none">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-14 rounded-xl font-black bg-destructive text-white hover:bg-destructive/90 shadow-xl shadow-destructive/20 px-8"
            >
              CONFIRM TERMINATION
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

