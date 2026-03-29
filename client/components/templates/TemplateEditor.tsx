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
import type { Template, CreateTemplateRequest, UpdateTemplateRequest } from "@shared/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const VARIABLES = [
  { label: "{{name}}", description: "Talent name" },
  { label: "{{castingName}}", description: "Casting role" },
  { label: "{{actingContext}}", description: "Acting context" },
  { label: "{{project}}", description: "Project name" },
  { label: "{{age}}", description: "Age range" },
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
  const [isAttachment, setIsAttachment] = React.useState(false);
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [attachmentDetailText, setAttachmentDetailText] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state when dialog opens / template changes
  React.useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setContent(template?.content ?? "");
      setIsAttachment(template?.isAttachment ?? false);
      setAttachmentUrl(template?.attachmentUrl ?? "");
      setAttachmentDetailText(template?.attachmentDetailText ?? "");
    }
  }, [open, template]);

  // Insert variable at cursor position in textarea
  const insertVariable = (variable: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    const newContent = content.slice(0, start) + variable + content.slice(end);
    setContent(newContent);
    // Restore focus and move cursor after inserted variable
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Template name is required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (template) {
        // Edit mode
        const body: UpdateTemplateRequest = { name, content, isAttachment, attachmentUrl, attachmentDetailText };
        const res = await fetch(`/api/templates/${template.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to save");
      } else {
        // Create mode
        const body: CreateTemplateRequest = {
          name,
          category: defaultCategory,
          content,
          isAttachment,
          attachmentUrl,
          attachmentDetailText,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : `Create ${categoryLabel} Template`}
          </DialogTitle>
          <DialogDescription>
            Use the variable chips below to insert dynamic placeholders into your message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Template Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. WA Intro Pitch"
              className="h-9"
            />
          </div>

          {/* Variable Chips */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dynamic Variables</Label>
            <p className="text-[11px] text-muted-foreground">Click a variable to insert it at your cursor position in the message below.</p>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => insertVariable(v.label)}
                  disabled={isAttachment}
                  className="group"
                  title={v.description}
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer font-mono text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors disabled:opacity-40"
                    style={{ opacity: isAttachment ? 0.4 : 1, cursor: isAttachment ? "not-allowed" : "pointer" }}
                  >
                    {v.label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message Body</Label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAttachment}
              placeholder={
                isAttachment
                  ? "Not applicable — this template sends an attachment."
                  : "Type your message here. Click variable chips above to insert dynamic fields..."
              }
              className="min-h-[140px] resize-y font-mono text-sm"
            />
            {!isAttachment && (
              <p className="text-[11px] text-muted-foreground">
                Variables will be replaced with actual values when the message is sent.
              </p>
            )}
          </div>

          {/* Attachment Toggle */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="is-attachment"
                checked={isAttachment}
                onCheckedChange={(c) => setIsAttachment(!!c)}
                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <div>
                <label htmlFor="is-attachment" className="text-sm font-medium leading-none cursor-pointer">
                  This template is an attachment
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  When checked, the template will send a file attachment instead of a text message.
                </p>
              </div>
            </div>

            {isAttachment && (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Attachment URL / File Path</Label>
                  <div className="flex gap-2">
                    <Input
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="https://... or /path/to/file.pdf"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" className="h-8 px-2 shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Attachment Detail Text</Label>
                  <Textarea
                    value={attachmentDetailText}
                    onChange={(e) => setAttachmentDetailText(e.target.value)}
                    placeholder="Caption or detail text to send along with the attachment..."
                    className="min-h-[80px] resize-y text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {template ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
