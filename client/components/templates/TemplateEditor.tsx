import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Template, CreateTemplateRequest, UpdateTemplateRequest } from "@shared/api";
import { useQueryClient } from "@tanstack/react-query";
import { getOrCreateUserId } from "@/lib/utils";
import { DriveFilePicker } from "@/components/drive/DriveFilePicker";
import type { DriveFile } from "@shared/api";

const VARIABLES = [
  { label: "{{name}}", description: "Talent name" },
  { label: "{{castingName}}", description: "Casting role" },
  { label: "{{actingContext}}", description: "Acting context" },
  { label: "{{project}}", description: "Project name" },
  { label: "{{age}}", description: "Age range" },
  { label: "{{salutation}}", description: "Salutation (Hi / Hey / Dear Sir/Mam)" },
];

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null; // if provided → edit mode
  defaultCategory: "whatsapp" | "email" | "instagram";
}

export function TemplateEditor({
  open,
  onOpenChange,
  template,
  defaultCategory,
}: TemplateEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [emailSubject, setEmailSubject] = React.useState("");
  const [isAttachment, setIsAttachment] = React.useState(false);
  const [driveFile, setDriveFile] = React.useState<DriveFile | null>(null);
  const [driveFileName, setDriveFileName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state when dialog opens / template changes
  React.useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setContent(template?.content ?? "");
      setEmailSubject(template?.emailSubject ?? "");
      setIsAttachment(template?.isAttachment ?? false);
      if (template?.driveFileId) {
        setDriveFile({
          id: template.driveFileId,
          name: template.driveFileName || "",
          mimeType: "",
          downloadUrl: ""
        });
        setDriveFileName(template.driveFileName ?? "");
      } else {
        setDriveFile(null);
        setDriveFileName("");
      }
    }
  }, [open, template]);

  // Insert variable at cursor position in textarea
  const insertVariable = (variable: string, atIndex?: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = atIndex !== undefined ? atIndex : (ta.selectionStart ?? content.length);
    const end = atIndex !== undefined ? atIndex : (ta.selectionEnd ?? content.length);
    const newContent = content.slice(0, start) + variable + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData("text/plain", variable);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const variable = e.dataTransfer.getData("text/plain");
    if (!variable) return;
    const ta = textareaRef.current;
    if (!ta) return;
    // Get caret position from drop coordinates
    ta.focus();
    const dropPos = (ta as any).selectionStart ?? content.length;
    insertVariable(variable, dropPos);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Template name is required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const userId = getOrCreateUserId();
      const basePayload = {
        name,
        content,
        isAttachment,
        emailSubject: defaultCategory === "email" ? emailSubject : undefined,
        driveFileId: isAttachment ? driveFile?.id : undefined,
        driveFileName: isAttachment ? driveFileName : undefined,
      };

      if (template) {
        // Edit mode
        const body: UpdateTemplateRequest = { ...basePayload, userId };
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to save");
      } else {
        // Create mode
        const body: CreateTemplateRequest = {
          userId,
          category: defaultCategory,
          ...basePayload
        };
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create");
      }
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: template ? "Template Updated" : "Template Created", description: `"${name}" has been saved.` });
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Could not save template.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryLabel =
    defaultCategory === "whatsapp" ? "WhatsApp" : defaultCategory === "email" ? "Email" : "Instagram";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] glass-card border-white/10 dark:border-white/5 p-0 overflow-hidden shadow-2xl rounded-[2rem] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-10 pb-4">
          <DialogTitle className="text-3xl font-black tracking-tight">
            {template ? "Edit Template" : `New ${categoryLabel} Template`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
             Configure protocol parameters for automated outreach sequences.
          </DialogDescription>
        </DialogHeader>

        <div className="px-10 py-6 space-y-8 overflow-y-auto">
          {/* Template Name */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${categoryLabel} Template 1`}
              className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
            />
          </div>

          {/* Variable Chips */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dynamic Injection Tokens</Label>
                <span className="text-[10px] font-bold text-primary animate-pulse">DRAG & DROP READY</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {VARIABLES.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => insertVariable(v.label)}
                  onDragStart={(e) => handleDragStart(e, v.label)}
                  draggable
                  disabled={isAttachment}
                  className="group cursor-grab active:cursor-grabbing"
                  title={`${v.description} — click or drag into message`}
                >
                  <Badge
                    variant="default"
                    className="font-black text-[11px] px-3 py-1.5 rounded-xl transition-all select-none tracking-tight"
                    style={{ opacity: isAttachment ? 0.3 : 1, cursor: isAttachment ? "not-allowed" : "grab" }}
                  >
                    {v.label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {defaultCategory === "email" && (
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Casting Call Opportunity"
                className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-medium shadow-inner"
              />
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Protocol Body</Label>
            <div className="relative group">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={handleDrop}
                  disabled={isAttachment}
                  placeholder={
                    isAttachment
                      ? "PROTOCOL RESTRICTED: Sending attachment stream."
                      : "Compose your outreach message here. Use labels for dynamic personalization..."
                  }
                  className="min-h-[200px] rounded-3xl bg-muted/30 border-border/50 focus:ring-primary font-medium p-8 shadow-inner resize-none leading-relaxed transition-all"
                />
                {!isAttachment && (
                  <div className="absolute bottom-4 right-6 text-[10px] font-black text-muted-foreground/50 tracking-widest uppercase pointer-events-none">
                    {content.length} CHARACTERS
                  </div>
                )}
            </div>
          </div>

          {/* Attachment Toggle */}
          <div className="glass-card bg-muted/20 border-border/40 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label htmlFor="is-attachment" className="text-sm font-black tracking-tight leading-none cursor-pointer">
                  ATTACHMENT STREAM
                </label>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Transmit binary data instead of text-based protocol.
                </p>
              </div>
              <Checkbox
                id="is-attachment"
                checked={isAttachment}
                onCheckedChange={(c) => setIsAttachment(!!c)}
                className="w-6 h-6 rounded-lg data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>

            {isAttachment && (
              <div className="space-y-6 pt-6 border-t border-border/50 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground text-primary">SELECT DRIVE FILE</Label>
                  <DriveFilePicker
                    userId={getOrCreateUserId()}
                    selectedFiles={driveFile ? [driveFile] : []}
                    onChange={(files) => {
                      const file = files[0] || null;
                      setDriveFile(file);
                      if (file) setDriveFileName(file.name);
                    }}
                    placeholder="Search Google Drive..."
                  />
                </div>
                {driveFile && (
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground text-primary">ATTACHMENT NAME</Label>
                    <Input
                      value={driveFileName}
                      onChange={(e) => setDriveFileName(e.target.value)}
                      placeholder="Display name for this file"
                      className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-10 pt-4 bg-muted/20">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-14 flex-1 rounded-2xl font-bold bg-muted/50">
            DISCARD
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-14 flex-[2] rounded-2xl font-black bg-foreground text-background hover:bg-foreground/90 shadow-xl transition-all active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3 animate-pulse" />
            )}
            {template ? "SAVE CHANGES" : "CREATE TEMPLATE"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

