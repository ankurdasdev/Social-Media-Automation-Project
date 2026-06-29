import * as React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Search, FileText, Sparkles, Wand2, Loader2, ExternalLink, GripVertical, ZoomIn, HardDrive, Paperclip, Pencil, Maximize2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichTextarea } from "@/components/ui/rich-textarea";
import { DriveFilePicker, validateFile, FilePreviewModal } from "../drive/DriveFilePicker";
import { getOrCreateUserId, resolveTokens } from "@/lib/utils";
import type { Contact, DriveFile } from "@shared/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Inline Text Cell ────────────────────────────────────────────────────────
export function EditableTextCell({ 
  value, 
  onUpdate,
  placeholder = "—",
  readOnly = false,
  type
}: { 
  value: string, 
  onUpdate?: (val: string) => void,
  placeholder?: string,
  readOnly?: boolean,
  type?: "whatsapp" | "gmail" | "instagram"
}) {
  const [localValue, setLocalValue] = React.useState(value || "");

  React.useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const [isExpanded, setIsExpanded] = React.useState(false);

  if (readOnly) {
    return (
      <div 
        className="h-8 w-full flex items-center px-2 text-sm font-medium text-muted-foreground/70 truncate"
        title={value}
      >
        {value || placeholder}
      </div>
    );
  }

  return (
    <div className="relative flex items-center w-full group h-8">
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value && onUpdate) onUpdate(localValue);
        }}
        placeholder={placeholder}
        title={value}
        className={cn(
          "h-full w-full bg-transparent border-transparent hover:border-border/50 focus:bg-background focus:ring-1 focus:ring-primary pl-2 text-sm transition-all",
          (localValue && type) || localValue.length > 20 ? "pr-14" : "pr-6"
        )}
      />
      <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {localValue.length > 20 && !type && (
          <Popover open={isExpanded} onOpenChange={setIsExpanded}>
            <PopoverTrigger asChild>
              <button 
                className="text-muted-foreground/60 hover:text-primary transition-all p-1 rounded hover:bg-muted/60 z-10"
                title="Expand text"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 glass-card p-3 rounded-xl shadow-2xl z-[150]" align="start">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Edit Text</span>
                   <button onClick={() => setIsExpanded(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                 </div>
                 <textarea
                   autoFocus
                   value={localValue}
                   onChange={(e) => setLocalValue(e.target.value)}
                   onBlur={() => {
                     if (localValue !== value && onUpdate) onUpdate(localValue);
                   }}
                   className="w-full min-h-[120px] bg-background/50 border border-border/50 rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none resize-y"
                   placeholder={placeholder}
                 />
               </div>
            </PopoverContent>
          </Popover>
        )}
        {localValue && type && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              let url = "";
              if (type === "whatsapp") {
                const cleanNumber = localValue.replace(/[^0-9]/g, "");
                url = `https://wa.me/${cleanNumber}`;
              } else if (type === "gmail") {
                url = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(localValue)}`;
              } else if (type === "instagram") {
                const cleanHandle = localValue.replace(/^@/, "").trim();
                url = `https://ig.me/m/${cleanHandle}`;
              }
              if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
              }
            }}
            className="text-muted-foreground/60 hover:text-primary transition-all p-1 rounded hover:bg-muted/60 z-10"
            title={`Launch in ${type === "whatsapp" ? "WhatsApp" : type === "gmail" ? "Gmail" : "Instagram"}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Salutation / Picklist Cell (Hi, Hey, Dear Sir, Dear Mam) ────────────────
export function PicklistCell({
  value,
  onUpdate
}: {
  value: string,
  onUpdate: (val: string) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();

  const { data: serverSalutations = [] } = useQuery({
    queryKey: ["salutations", userId],
    queryFn: async () => {
      const res = await fetch(`/api/salutations?userId=${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.salutations || [];
    }
  });

  const addSalutationMutation = useMutation({
    mutationFn: async (text: string) => {
      await fetch("/api/salutations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salutations", userId] });
    }
  });

  const defaults = ["Hi", "Hey", "Dear Sir", "Dear Mam"];
  // Combine defaults with server ones, ensuring uniqueness
  const options = Array.from(new Set([...defaults, ...serverSalutations]));
  
  const handleAddCustom = () => {
    if (!customValue.trim()) return;
    const val = customValue.trim();
    addSalutationMutation.mutate(val);
    onUpdate(val);
    setCustomValue("");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="h-8 w-full text-left px-2 rounded-md hover:bg-muted/50 transition-all font-black text-[10px] uppercase tracking-tighter truncate text-primary/80">
          {value || "HI"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 glass-card border-border p-2 shadow-2xl rounded-xl max-h-80 overflow-y-auto" align="start">
        <div className="space-y-1">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                onUpdate(opt);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-primary/10",
                value === opt ? "bg-primary/20 text-primary" : "text-muted-foreground"
              )}
            >
              {opt}
            </button>
          ))}
          <div className="h-px dark:bg-white/5 bg-black/5 my-1" />
          <div className="px-2 pb-1">
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Custom</span>
          </div>
          <div className="flex gap-1 px-1">
            <Input 
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Type..."
              className="h-8 text-xs font-bold rounded-lg dark:bg-white/5 bg-black/5 border-border focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom();
              }}
            />
            <Button 
              size="icon" 
              className="h-8 w-8 shrink-0 rounded-lg bg-primary hover:bg-primary/90"
              onClick={handleAddCustom}
              disabled={addSalutationMutation.isPending}
            >
              {addSalutationMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Personalized Cell (N/C/NA) ────────────────────────────────────────────────
export function PersonalizedCell({ 
  value, 
  onUpdate 
}: { 
  value?: string; 
  onUpdate: (val: string) => void;
}) {
  const options = [
    { value: "N", label: "N" },
    { value: "C", label: "C" },
    { value: "NA", label: "NA" }
  ];
  
  const currentVal = value || "NA";

  return (
    <Select value={currentVal} onValueChange={onUpdate}>
      <SelectTrigger className="h-8 w-full border-none shadow-none text-[10px] font-black uppercase tracking-widest text-primary/80 hover:bg-muted/50 rounded-md px-2 focus:ring-0 truncate">
        <SelectValue placeholder="NA" />
      </SelectTrigger>
      <SelectContent className="glass-card border-border rounded-xl">
        {options.map((opt) => (
          <SelectItem 
            key={opt.value} 
            value={opt.value}
            className="text-[10px] font-bold cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


// ─── Conditional Textarea Cell (Checkbox -> Textarea) ────────────────────────
export function ConditionalTextareaCell({
  checked,
  onCheckedChange,
  value,
  onValueChange,
  placeholder = "Enter custom message...",
  platform,
  contact
}: {
  checked: boolean,
  onCheckedChange: (val: boolean) => void,
  value: string,
  onValueChange: (val: string) => void,
  placeholder?: string,
  platform?: "whatsapp" | "email" | "instagram",
  contact?: any
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isAIMode, setIsAIMode] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [localText, setLocalText] = React.useState(value || "");

  React.useEffect(() => {
    if (!isEditing) setLocalText(value || "");
  }, [value, isEditing]);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() && !localText.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/improve-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: aiPrompt, 
          currentText: localText 
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setLocalText(data.result);
        onValueChange(data.result);
        setIsAIMode(false);
        setAiPrompt("");
      } else {
        alert(data.error || "Failed to generate message. Please check AI configuration.");
      }
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      alert("AI Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinishEditing = () => {
    if (localText !== value) {
      onValueChange(localText);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 w-full group" onClick={(e) => e.stopPropagation()}>
      <Checkbox 
        checked={checked} 
        onCheckedChange={(val) => onCheckedChange(!!val)}
        className="shrink-0 border-primary/30"
      />
      
      {checked ? (
        <>
          <button 
            onClick={() => setIsEditing(true)}
            className="flex-1 min-h-[32px] py-1.5 px-3 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-bold text-left whitespace-normal line-clamp-3 leading-tight text-primary hover:bg-primary/10 transition-all"
          >
            {value ? resolveTokens(value, contact) : "EDIT MESSAGE"}
          </button>
          
          <Dialog open={isEditing} onOpenChange={(open) => {
            if (!open) handleFinishEditing();
            else setIsEditing(true);
            
            if (!open) {
              setIsAIMode(false);
              setAiPrompt("");
            }
          }}>
            <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
               <DialogHeader>
                  <DialogTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center justify-between">
                    {isAIMode ? "AI Message Generator" : "Edit Custom Message"}
                  </DialogTitle>
               </DialogHeader>
  
               <div className="space-y-4 py-2">
                 {isAIMode ? (
                   <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <textarea 
                        className="w-full h-32 rounded-xl bg-primary/5 border border-primary/10 p-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-y"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Enter prompt (e.g. Write a friendly outreach message for a casting call)..."
                        autoFocus
                      />
                      <Button 
                        className="w-full h-12 rounded-xl font-black text-xs bg-primary hover:bg-primary/90 gap-2"
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !aiPrompt.trim()}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        {isGenerating ? "GENERATING..." : "GENERATE MESSAGE"}
                      </Button>
                   </div>
                 ) : (
                   <div className="relative">
                     <p className="text-[10px] text-muted-foreground font-bold absolute -top-5 right-1">Drag bottom right to resize</p>
                     <RichTextarea 
                       className="w-full min-h-[250px] max-h-[600px] rounded-2xl bg-muted/40 border border-border p-4 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-y scrollbar-hide shadow-inner"
                       value={localText}
                       onChange={(val) => setLocalText(val)}
                       placeholder={placeholder}
                       platform={platform}
                     />
                   </div>
                 )}
               </div>

               {/* Real-Time Token Evaluation / Live Preview */}
               {!isAIMode && (
                 <div className="mt-2 mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                     <Eye className="w-3.5 h-3.5" />
                     Live Preview (Tokens Evaluated)
                   </p>
                   {platform === "email" ? (
                     <div 
                       className="text-sm text-foreground"
                       dangerouslySetInnerHTML={{ __html: resolveTokens(localText, contact) || '<span class="text-muted-foreground italic">Message preview will appear here...</span>' }}
                     />
                   ) : (
                     <div className="text-sm text-foreground whitespace-pre-wrap">
                       {resolveTokens(localText, contact) || <span className="text-muted-foreground italic">Message preview will appear here...</span>}
                     </div>
                   )}
                 </div>
               )}

               <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border/50 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAIMode(!isAIMode)}
                    className={cn(
                      "h-12 px-6 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2",
                      isAIMode ? "bg-primary text-foreground shadow-lg shadow-primary/20" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    title={isAIMode ? "Switch to Manual Edit" : "Use AI to Generate/Improve"}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isAIMode ? "Manual Edit" : "AI Helper"}
                  </Button>
                  <Button onClick={handleFinishEditing} className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-95">
                    SAVE & CLOSE
                  </Button>
               </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest px-1">DISABLED</span>
      )}
    </div>
  );
}

// ─── Multi-Template Ordered Select ───────────────────────────────────────────
export function MultiTemplateSelect({
  selectedIds,
  onUpdate,
  category
}: {
  selectedIds: string | string[],
  onUpdate: (ids: string[]) => void,
  category?: "whatsapp" | "email" | "instagram"
}) {
  const userId = getOrCreateUserId();
  const currentIds = Array.isArray(selectedIds) ? selectedIds : (selectedIds ? [selectedIds] : []);
  
  // Optimistic UI state
  const [localIds, setLocalIds] = React.useState<string[]>(currentIds);

  React.useEffect(() => {
    setLocalIds(currentIds);
  }, [JSON.stringify(currentIds)]);
  
  const moveItem = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      const newIds = [...localIds];
      [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
      setLocalIds(newIds);
      onUpdate(newIds);
    } else if (direction === 'right' && index < localIds.length - 1) {
      const newIds = [...localIds];
      [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
      setLocalIds(newIds);
      onUpdate(newIds);
    }
  };

  const { data: templates = [] } = useQuery({
    queryKey: ["templates", userId],
    queryFn: async () => {
      const res = await fetch(`/api/templates?userId=${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.templates;
    }
  });

  const handleToggle = (id: string) => {
    let newIds;
    if (localIds.includes(id)) {
      newIds = localIds.filter(i => i !== id);
    } else {
      newIds = [...localIds, id];
    }
    setLocalIds(newIds);
    onUpdate(newIds);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[120px] max-h-[68px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 p-1 rounded-md border border-transparent hover:border-border/50 transition-all group">
      {localIds.map((id, idx) => {
        const t = templates.find((tmp: any) => tmp.id === id);
        return (
          <Badge key={id} variant="secondary" className="h-5 px-1 flex shrink-0 items-center gap-1 text-[9px] font-black bg-primary/10 text-primary border-none group/badge whitespace-nowrap">
            <button
              onClick={(e) => { e.stopPropagation(); moveItem(idx, 'left'); }}
              disabled={idx === 0}
              className="opacity-0 group-hover/badge:opacity-100 disabled:!opacity-30 hover:text-foreground transition-opacity"
            >
              ←
            </button>
            {idx + 1}. {t?.name || "..."}
            <button
              onClick={(e) => { e.stopPropagation(); moveItem(idx, 'right'); }}
              disabled={idx === localIds.length - 1}
              className="opacity-0 group-hover/badge:opacity-100 disabled:!opacity-30 hover:text-foreground transition-opacity"
            >
              →
            </button>
            <X className="w-2 h-2 cursor-pointer hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleToggle(id); }} />
          </Badge>
        );
      })}
      <Select onValueChange={handleToggle}>
        <SelectTrigger className="h-5 w-5 p-0 border-none bg-transparent hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-3 h-3" />
        </SelectTrigger>
        <SelectContent>
            {templates
              .filter((t: any) => (!category || t.category === category) && !localIds.includes(t.id))
              .map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
            {templates.filter((t: any) => (!category || t.category === category) && !localIds.includes(t.id)).length === 0 && (
              <div className="p-2 text-[10px] text-muted-foreground">No available templates</div>
            )}
        </SelectContent>
      </Select>
      {localIds.length === 0 && <span className="text-[10px] text-muted-foreground/50 px-1 py-0.5">Pick order...</span>}
    </div>
  );
}

// ─── Unified Attachment Cell ─────────────────────────────────────────────────

function getMimeEmoji(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("video")) return "🎬";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📑";
  if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
  return "📁";
}

export function AttachmentCell({
  attachments,
  onUpdate,
  platform
}: {
  attachments: DriveFile[],
  onUpdate: (files: DriveFile[]) => void,
  platform?: "whatsapp" | "email" | "instagram"
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [lightboxFile, setLightboxFile] = React.useState<DriveFile | null>(null);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const userId = getOrCreateUserId();

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: driveData, isLoading } = useQuery<{ files: DriveFile[]; folderName?: string }>({
    queryKey: ["drive-files", userId, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ userId, q: debouncedSearch });
      const res = await fetch(`/api/drive/files?${params}`);
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    enabled: isOpen && !!userId,
    staleTime: 0,
  });

  const toggleFile = (file: DriveFile) => {
    const exists = (attachments || []).some((f) => f.id === file.id);
    if (exists) {
      onUpdate((attachments || []).filter((f) => f.id !== file.id));
    } else {
      onUpdate([...(attachments || []), file]);
    }
  };

  // Drag-to-reorder handlers
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...(attachments || [])];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onUpdate(next);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const files = attachments || [];

  return (
    <div className="flex gap-1 items-center min-w-[100px] group overflow-x-auto scrollbar-hide snap-x">
      {/* Lightbox */}
      {lightboxFile && (
        <FilePreviewModal
          file={lightboxFile}
          onClose={() => setLightboxFile(null)}
        />
      )}

      {/* Compact chips */}
      {files.map((file, idx) => {
        const validation = validateFile(file, platform);
        const isInvalidFormat = !validation.valid;
        return (
        <div
          key={file.id}
          className={cn(
            "flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-xl border text-[10px] font-bold group/chip max-w-[120px] snap-center shrink-0",
            isInvalidFormat 
              ? "bg-red-500/10 border-red-500/50 text-red-500" 
              : "bg-muted/30 border-border/50 text-foreground"
          )}
          title={isInvalidFormat ? validation.reason : undefined}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxFile(file); }}
            className="relative w-4 h-4 shrink-0 flex items-center justify-center cursor-pointer"
            title="Preview"
          >
            {isImage(file.mimeType) && file.thumbnailLink ? (
              <img src={file.thumbnailLink} alt="" className="w-4 h-4 rounded object-cover" />
            ) : (
              <FileText className={cn("w-3 h-3 shrink-0", isInvalidFormat ? "text-red-500" : "text-blue-500")} />
            )}
          </button>
          <span className="truncate max-w-[60px]">{file.customName || file.name}</span>

          <X
            className="w-3 h-3 ml-0.5 cursor-pointer hover:text-destructive shrink-0"
            onClick={(e) => { e.stopPropagation(); onUpdate(files.filter((_, i) => i !== idx)); }}
          />
        </div>
      )})}

      {/* Open dialog button */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100"
      >
        <HardDrive className="w-3.5 h-3.5" />
      </button>

      {/* Redesigned dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="glass-card border-border rounded-[2rem] p-0 max-w-4xl w-[95vw] h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          aria-describedby="drive-attachments-description"
        >
          <DialogHeader className="px-8 pt-8 pb-4 border-b border-border/50 flex-shrink-0">
            <DialogTitle className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <HardDrive className="h-6 w-6 text-primary" />
              DRIVE ATTACHMENTS
            </DialogTitle>
            <div id="drive-attachments-description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Search, select, and reorder files from Google Drive
            </div>
          </DialogHeader>

          <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left: Search & Results */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col border-r border-border/50">
              {/* Search */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
                <Search className="h-4 w-4 text-primary shrink-0" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Google Drive..."
                  className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground/50"
                  autoFocus
                />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>

              {/* File list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {(driveData?.files || []).map((file) => {
                  const isSelected = files.some((f) => f.id === file.id);
                  const isImg = isImage(file.mimeType);
                  const validation = validateFile(file, platform);
                  const isInvalidFormat = !validation.valid;
                  return (
                    <div
                      key={file.id}
                      onClick={() => !isInvalidFormat && toggleFile(file)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all group/item",
                        isSelected
                          ? "bg-primary text-foreground shadow-lg shadow-primary/20 scale-[1.01]"
                          : isInvalidFormat
                            ? "bg-red-500/5 opacity-60 cursor-not-allowed"
                            : "hover:bg-muted/60 hover:translate-x-1"
                      )}
                      title={isInvalidFormat ? validation.reason : undefined}
                    >
                      <div className="shrink-0 w-9 h-9 relative">
                        {isImg && file.thumbnailLink ? (
                          <div className="relative w-9 h-9">
                            <img src={file.thumbnailLink} alt={file.name} className="w-9 h-9 rounded-lg object-cover border border-border" />
                            {!isInvalidFormat && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLightboxFile(file); }}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity"
                              >
                                <ZoomIn className="w-3 h-3 text-foreground" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-2xl block text-center leading-9">{getMimeEmoji(file.mimeType)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-black truncate", isSelected ? "text-foreground" : isInvalidFormat ? "text-red-500" : "")}>{file.name}</p>
                        <p className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-foreground/60" : isInvalidFormat ? "text-red-400" : "text-muted-foreground/50")}>
                          {isInvalidFormat ? "UNSUPPORTED FORMAT" : file.mimeType.split("/").pop()}
                        </p>
                      </div>
                      {isSelected && <div className="shrink-0 w-6 h-6 rounded-md dark:bg-white/[0.02] bg-black/50 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-foreground" /></div>}
                      {isInvalidFormat && <div className="shrink-0 w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-red-500" /></div>}
                    </div>
                  );
                })}
                {!isLoading && (driveData?.files || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 opacity-30">
                    <Search className="w-8 h-8" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No files found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected & Order */}
            {files.length > 0 && (
              <div className="w-full md:w-72 flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-border/50 bg-black/20">
                <div className="px-5 py-4 border-b border-border/50">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">ATTACHMENT ORDER</p>
                  <p className="text-[9px] text-muted-foreground font-bold mt-0.5">Drag to reorder</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 cursor-grab active:cursor-grabbing transition-all group/order",
                        dragIdx === idx && "opacity-50 scale-95 border-primary/50 bg-primary/10"
                      )}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/order:text-muted-foreground shrink-0" />
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-primary">{idx + 1}</span>
                      </div>
                      {isImage(file.mimeType) && file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                      ) : (
                        <span className="text-xs shrink-0">{getMimeEmoji(file.mimeType)}</span>
                      )}
                      <span className="text-[10px] font-bold truncate flex-1">{file.customName || file.name}</span>
                      
                      {/* PREVIEW BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxFile(file); }}
                        className="opacity-0 group-hover/order:opacity-100 text-muted-foreground hover:text-primary transition-all p-0.5 rounded shrink-0"
                        title="Preview"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* EDIT BUTTON (PENCIL) */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="opacity-0 group-hover/order:opacity-100 text-muted-foreground hover:text-foreground transition-all p-0.5 rounded shrink-0" title="Edit details" onClick={(e) => e.stopPropagation()}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 rounded-xl z-[400] glass-card" align="end" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Custom File Name</p>
                              <Input 
                                className="h-7 text-xs bg-background" 
                                defaultValue={file.customName || file.name}
                                onBlur={(e) => {
                                  const newFiles = [...files];
                                  newFiles[idx] = { ...file, customName: e.target.value };
                                  onUpdate(newFiles);
                                }}
                              />
                            </div>
                            {(platform === "whatsapp" || platform === "email") && (
                              <div className="space-y-1 mt-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  {platform === "email" ? "Email Subject Override" : "WhatsApp Caption"}
                                </p>
                                <textarea 
                                  className="w-full min-h-[60px] text-xs p-2 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary outline-none"
                                  placeholder={platform === "email" ? "Set email subject when sending this file..." : "Add a caption..."}
                                  defaultValue={file.caption || ""}
                                  onBlur={(e) => {
                                    const newFiles = [...files];
                                    newFiles[idx] = { ...file, caption: e.target.value };
                                    onUpdate(newFiles);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <button
                        onClick={() => onUpdate(files.filter((_, i) => i !== idx))}
                        className="opacity-0 group-hover/order:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5 rounded shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-8 py-5 border-t border-border/50 flex-shrink-0">
            <Button
              onClick={() => setIsOpen(false)}
              className="h-12 px-8 rounded-xl bg-primary font-black text-[10px] uppercase tracking-widest text-foreground shadow-lg shadow-primary/20"
            >
              DONE — {files.length} FILE{files.length !== 1 ? "S" : ""} LINKED
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sheet Dropdown Cell ──────────────────────────────────────────────────────
export function SheetDropdownCell({
  value,
  onUpdate,
  sheets = []
}: {
  value: string,
  onUpdate: (val: string) => void,
  sheets?: string[]
}) {
  return (
    <div onClick={(e) => { e.stopPropagation(); }} className="w-full">
      <Select value={value || "EXTERNAL"} onValueChange={(val) => onUpdate(val === "EXTERNAL" ? "" : val)}>
        <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 transition-all font-black text-xs truncate w-full flex justify-between focus:ring-0 focus:ring-offset-0 px-2" onClick={(e) => e.stopPropagation()}>
          <SelectValue placeholder="EXTERNAL" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EXTERNAL" className="text-xs font-bold text-muted-foreground hover:bg-muted focus:bg-muted">EXTERNAL</SelectItem>
          {sheets.length > 0 ? (
            sheets.map(sheet => (
              <SelectItem key={sheet} value={sheet} className="text-xs font-black">{sheet}</SelectItem>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground italic">No sheets found</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Tags Cell ─────────────────────────────────────────────────────────────

export const TAG_COLORS = [
  { name: "Blue", value: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
  { name: "Emerald", value: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
  { name: "Amber", value: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  { name: "Rose", value: "bg-rose-500/20 text-rose-500 border-rose-500/30" },
  { name: "Purple", value: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  { name: "Cyan", value: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30" },
];

export function TagsCell({ tags = [], onUpdate }: { tags?: string[], onUpdate: (tags: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [newTagText, setNewTagText] = React.useState("");
  const [newTagColor, setNewTagColor] = React.useState(TAG_COLORS[0].value);

  const parsedTags = React.useMemo(() => {
    return (tags || []).map(t => {
      try { return JSON.parse(t); } catch { return { text: t, color: TAG_COLORS[0].value }; }
    });
  }, [tags]);

  const handleAdd = () => {
    if (!newTagText.trim()) return;
    const newTag = JSON.stringify({ text: newTagText.trim(), color: newTagColor });
    onUpdate([...(tags || []), newTag]);
    setNewTagText("");
    setOpen(false);
  };

  const handleRemove = (idx: number) => {
    const next = [...(tags || [])];
    next.splice(idx, 1);
    onUpdate(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 min-h-[32px] w-full" onClick={(e) => e.stopPropagation()}>
      {parsedTags.map((t, i) => (
        <Badge key={i} variant="outline" className={cn("font-bold text-[9px] px-1.5 py-0 gap-1 flex items-center border", t.color)}>
          {t.text}
          <X className="w-2.5 h-2.5 cursor-pointer opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemove(i); }} />
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-primary/20 opacity-50 hover:opacity-100 shrink-0">
            <Plus className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3 glass-card border-white/10 shadow-2xl rounded-2xl" onClick={e => e.stopPropagation()} side="bottom" align="start">
          <div className="space-y-3">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Add Tag</h4>
            <Input 
              autoFocus 
              value={newTagText} 
              onChange={e => setNewTagText(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Tag name..." 
              className="h-8 text-xs bg-black/20"
            />
            <div className="flex gap-1.5 flex-wrap">
              {TAG_COLORS.map(c => (
                <div 
                  key={c.name}
                  onClick={() => setNewTagColor(c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full cursor-pointer border-2 transition-all",
                    c.value.split(' ')[0], 
                    newTagColor === c.value ? "border-white scale-110" : "border-transparent hover:scale-105"
                  )}
                  title={c.name}
                />
              ))}
            </div>
            <Button onClick={handleAdd} className="w-full h-8 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white" disabled={!newTagText.trim()}>Add</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
