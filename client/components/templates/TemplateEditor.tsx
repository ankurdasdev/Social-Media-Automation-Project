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
import { RichTextarea } from "@/components/ui/rich-textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Info, GripVertical, Sparkles, X as XIcon, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Template, CreateTemplateRequest, UpdateTemplateRequest } from "@shared/api";
import { useQueryClient } from "@tanstack/react-query";
import { getOrCreateUserId, cn } from "@/lib/utils";
import { DriveFilePicker } from "@/components/drive/DriveFilePicker";
import type { DriveFile } from "@shared/api";

// ─── Variable Chips — synced with column headers in the Contacts grid ─────────

const VARIABLES = [
  { label: "{{leadName}}", description: "Lead Name (column: Lead Name)" },
  { label: "{{castingName}}", description: "Casting Name (column: Casting Name)" },
  { label: "{{actingContext}}", description: "Acting Context (column: Acting Context)" },
  { label: "{{project}}", description: "Target Project (column: Project / Reference)" },
  { label: "{{age}}", description: "Age (column: Age)" },
  { label: "{{salutation}}", description: "Salutation + Name (e.g. 'Hi Ankur')" },
];

// ─── Platform-specific attachment constraints ─────────────────────────────────

const ATTACHMENT_RULES = {
  whatsapp: {
    maxMB: 64,
    supported: ["image", "video", "audio", "pdf", "document"],
    label: "Max 64 MB — Images, Video, Audio, PDF supported",
    color: "emerald",
  },
  instagram: {
    maxMB: 8,
    supported: ["image"],
    label: "Max 8 MB — Images only (JPEG, PNG, GIF)",
    color: "pink",
  },
  email: {
    maxMB: 25,
    supported: ["all"],
    label: "Max 25 MB total — All file types supported",
    color: "blue",
  },
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
  defaultCategory: "whatsapp" | "email" | "instagram";
  selectedEmailType?: "body" | "footer";
  forceAttachment?: boolean; // opened from "Attachment Template" button
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateEditor({
  open,
  onOpenChange,
  template,
  defaultCategory,
  selectedEmailType,
  forceAttachment = false,
}: TemplateEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [emailSubject, setEmailSubject] = React.useState("");
  const [isAttachment, setIsAttachment] = React.useState(false);
  const [driveFiles, setDriveFiles] = React.useState<DriveFile[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [emailTemplateType, setEmailTemplateType] = React.useState<"body" | "footer" | undefined>("body");

  // AI text helper state
  const [isAIPanelOpen, setIsAIPanelOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [isAIGenerating, setIsAIGenerating] = React.useState(false);

  // Drag-to-reorder state for attachment order list
  const [dragFileIdx, setDragFileIdx] = React.useState<number | null>(null);

  const handleFileDragStart = (idx: number) => setDragFileIdx(idx);
  const handleFileDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragFileIdx === null || dragFileIdx === idx) return;
    const next = [...driveFiles];
    const [moved] = next.splice(dragFileIdx, 1);
    next.splice(idx, 0, moved);
    setDriveFiles(next);
    setDragFileIdx(idx);
  };
  const handleFileDragEnd = () => setDragFileIdx(null);

  // AI generate/refine handler
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAIGenerating(true);
    try {
      const res = await fetch("/api/ai/improve-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, currentText: content }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setContent(data.result);
      } else {
        toast({ title: "AI Error", description: data.error || "Generation failed.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
    } finally {
      setIsAIGenerating(false);
      setAiPrompt("");
    }
  };

  // Sync state when dialog opens / template changes
  React.useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setContent(template?.content ?? "");
      setEmailSubject(template?.emailSubject ?? "");

      const shouldBeAttachment = forceAttachment || (template?.isAttachment ?? false);
      setIsAttachment(shouldBeAttachment);

      if (template) {
        setEmailTemplateType(template.emailTemplateType ?? "body");
      } else if (defaultCategory === "email" && selectedEmailType) {
        setEmailTemplateType(selectedEmailType);
      } else {
        setEmailTemplateType("body");
      }

      if (template?.driveAttachments && template.driveAttachments.length > 0) {
        setDriveFiles(template.driveAttachments);
      } else if (template?.driveFileId) {
        setDriveFiles([{
          id: template.driveFileId,
          name: template.driveFileName || "",
          mimeType: "",
          downloadUrl: ""
        }]);
      } else {
        setDriveFiles([]);
      }
    }
  }, [open, template, selectedEmailType, defaultCategory, forceAttachment]);

  // Insert variable at cursor (textarea-based platforms)
  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? content.length;
      const end = ta.selectionEnd ?? content.length;
      const next = content.slice(0, start) + variable + content.slice(end);
      setContent(next);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      // Rich-text (email) — just append
      setContent((prev) => prev + variable);
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData("text/plain", variable);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Template name is required.", variant: "destructive" });
      return;
    }
    if (isAttachment && driveFiles.length === 0) {
      toast({ title: "Error", description: "Please select at least one file from Google Drive.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const userId = getOrCreateUserId();
      const firstFile = driveFiles[0] || null;
      const basePayload = {
        name,
        content,
        isAttachment,
        emailSubject: (defaultCategory === "email" && emailTemplateType === "body") ? emailSubject : undefined,
        emailTemplateType: defaultCategory === "email" ? emailTemplateType : undefined,
        driveFileId: (isAttachment && firstFile) ? firstFile.id : undefined,
        driveFileName: (isAttachment && firstFile) ? firstFile.name : undefined,
        driveAttachments: isAttachment ? driveFiles : [],
      };

      if (template) {
        const body: UpdateTemplateRequest = { ...basePayload, userId };
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to save");
      } else {
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

  const attachRule = ATTACHMENT_RULES[defaultCategory];

  const editorTitle = isAttachment
    ? `New ${categoryLabel} Attachment Template`
    : template
    ? "Edit Template"
    : `New ${categoryLabel} Template`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] glass-card border-white/10 dark:border-white/5 p-0 overflow-hidden shadow-2xl rounded-[2rem] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-10 pb-4">
          <DialogTitle className="text-3xl font-black tracking-tight">
            {editorTitle}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
            {isAttachment
              ? "Send a file attachment directly to contacts — no message body required."
              : "Compose your outreach template with personalization variables."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-10 py-6 space-y-8 overflow-y-auto">

          {/* Template Name */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${categoryLabel} ${isAttachment ? "Attachment" : "Template"} 1`}
              className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-bold shadow-inner"
            />
          </div>

          {/* Email Template Mode Badge */}
          {defaultCategory === "email" && !isAttachment && (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted/30 border border-white/5 w-fit">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Template Mode ::</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1",
                  emailTemplateType === "footer"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                )}
              >
                {emailTemplateType === "footer" ? "Footer Template" : "Body Template"}
              </Badge>
            </div>
          )}

          {/* Email Subject */}
          {defaultCategory === "email" && emailTemplateType === "body" && !isAttachment && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Casting Call Opportunity"
                className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary font-medium shadow-inner"
              />
            </div>
          )}

          {/* Attachment Section */}
          {isAttachment ? (
            <div className="space-y-6">
              {/* Attachment Rules Warning */}
              <div className={cn(
                "flex items-start gap-3 px-5 py-4 rounded-2xl border",
                defaultCategory === "whatsapp" ? "bg-emerald-500/5 border-emerald-500/20" :
                defaultCategory === "instagram" ? "bg-pink-500/5 border-pink-500/20" :
                "bg-blue-500/5 border-blue-500/20"
              )}>
                <Info className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  defaultCategory === "whatsapp" ? "text-emerald-500" :
                  defaultCategory === "instagram" ? "text-pink-500" :
                  "text-blue-500"
                )} />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    {categoryLabel} Attachment Limits
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {attachRule.label}
                  </p>
                  {defaultCategory === "instagram" && (
                    <p className="text-[10px] text-yellow-500 font-bold mt-1">
                      ⚠ Instagram only supports image attachments. Videos and documents will fail.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground text-primary">SELECT DRIVE FILES</Label>
                <DriveFilePicker
                  userId={getOrCreateUserId()}
                  selectedFiles={driveFiles}
                  onChange={(files) => setDriveFiles(files)}
                  placeholder="Search Google Drive..."
                />
              </div>

              {driveFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Attachment Order</Label>
                  <p className="text-[10px] text-muted-foreground/60 font-bold -mt-1">Drag rows to reorder</p>
                  <div className="space-y-2.5">
                    {driveFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={() => handleFileDragStart(idx)}
                        onDragOver={(e) => handleFileDragOver(e, idx)}
                        onDragEnd={handleFileDragEnd}
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-white/5 cursor-grab active:cursor-grabbing transition-all group/dfile",
                          dragFileIdx === idx && "opacity-50 scale-95 border-primary/50 bg-primary/10"
                        )}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover/dfile:text-muted-foreground shrink-0 transition-colors" />
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                        <span className="text-sm font-bold text-foreground truncate flex-1">{file.name}</span>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-white/10 text-muted-foreground">
                          {idx === 0 ? "First" : idx === driveFiles.length - 1 ? "Last" : `#${idx + 1}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Variable Chips */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Personalization Tags</Label>
                  <span className="text-[10px] font-bold text-primary animate-pulse">DRAG &amp; DROP READY</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => insertVariable(v.label)}
                      onDragStart={(e) => handleDragStart(e, v.label)}
                      draggable
                      className="group cursor-grab active:cursor-grabbing"
                      title={v.description}
                    >
                      <Badge
                        variant="default"
                        className="font-black text-[11px] px-3 py-1.5 rounded-xl transition-all select-none tracking-tight bg-primary hover:bg-primary/90 text-black shadow-lg"
                      >
                        {v.label}
                      </Badge>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-medium">
                  These tags map to your Contacts grid columns — they will be replaced with each contact's actual data at send time.
                </p>
              </div>

              {/* Message Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Message Content</Label>
                  <button
                    type="button"
                    onClick={() => setIsAIPanelOpen((o) => !o)}
                    className={cn(
                      "flex items-center gap-2 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                      isAIPanelOpen
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                    )}
                    title="AI Text Helper — generate or refine your message"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {content.trim() ? "Refine with AI" : "Generate with AI"}
                  </button>
                </div>

                {/* AI panel */}
                {isAIPanelOpen && (
                  <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {content.trim() ? "✦ Refine — describe what to improve" : "✦ Generate — describe your message"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsAIPanelOpen(false); setAiPrompt(""); }}
                        className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAIGenerate(); } }}
                        placeholder={content.trim() ? "e.g. Make it shorter and more professional..." : "e.g. Warm outreach email for a casting director..."}
                        className="flex-1 h-10 px-4 rounded-xl bg-background/70 border border-primary/20 text-sm font-bold placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={isAIGenerating || !aiPrompt.trim()}
                        className="h-10 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                      >
                        {isAIGenerating ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> THINKING...</>
                        ) : (
                          <><Wand2 className="w-3.5 h-3.5" /> {content.trim() ? "REFINE" : "GENERATE"}</>
                        )}
                      </button>
                    </div>
                    {content.trim() && (
                      <p className="text-[9px] text-muted-foreground/60 font-bold">
                        ↳ Your current text will be refined — not replaced from scratch
                      </p>
                    )}
                  </div>
                )}

                <RichTextarea
                  value={content}
                  onChange={setContent}
                  platform={defaultCategory}
                  placeholder="Compose your outreach message here. Click or drag a tag above to personalize..."
                  className="min-h-[200px] rounded-3xl bg-muted/30 border-border/50 shadow-inner"
                  textareaRef={textareaRef}
                />
              </div>

            </>
          )}
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
            {template ? "SAVE CHANGES" : isAttachment ? "CREATE ATTACHMENT" : "CREATE TEMPLATE"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
