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
        <DialogContent className="sm:max-w-[680px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-lg">Manage Templates</DialogTitle>
                <DialogDescription>
                  Create and manage your WhatsApp, Email, and Instagram outreach templates.
                </DialogDescription>
              </div>
              <Button size="sm" onClick={handleCreateNew} className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" /> Create Template
              </Button>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TemplateCategory)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid grid-cols-3 h-9 shrink-0">
              <TabsTrigger value="whatsapp" className="text-xs gap-1.5 data-[state=active]:text-green-700">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">
                  {templates.filter((t) => t.category === "whatsapp").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs gap-1.5 data-[state=active]:text-blue-700">
                <Mail className="h-3.5 w-3.5" /> Email
                <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">
                  {templates.filter((t) => t.category === "email").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="text-xs gap-1.5 data-[state=active]:text-pink-700">
                <Instagram className="h-3.5 w-3.5" /> Instagram
                <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">
                  {templates.filter((t) => t.category === "instagram").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto flex-1 pt-2">
              {(["whatsapp", "email", "instagram"] as TemplateCategory[]).map((cat) => (
                <TabsContent key={cat} value={cat} className="m-0">
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
        <RenameDialogContent className="sm:max-w-[380px]">
          <RenameDialogHeader>
            <RenameDialogTitle>Rename Template</RenameDialogTitle>
          </RenameDialogHeader>
          <div className="py-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">New Name</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSave()}
              placeholder="Template name..."
            />
          </div>
          <RenameDialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSave}>Save</Button>
          </RenameDialogFooter>
        </RenameDialogContent>
      </RenameDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
