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
import { X, Plus, Search, FileText, Sparkles, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DriveFilePicker } from "../drive/DriveFilePicker";
import { getOrCreateUserId } from "@/lib/utils";
import type { Contact, DriveFile } from "@shared/api";
import { useQuery } from "@tanstack/react-query";

// ─── Inline Text Cell ────────────────────────────────────────────────────────
export function EditableTextCell({ 
  value, 
  onUpdate,
  placeholder = "—",
  readOnly = false
}: { 
  value: string, 
  onUpdate?: (val: string) => void,
  placeholder?: string,
  readOnly?: boolean
}) {
  const [localValue, setLocalValue] = React.useState(value || "");

  React.useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  if (readOnly) {
    return (
      <div className="h-8 w-full flex items-center px-2 text-sm font-medium text-muted-foreground/70 truncate">
        {value || placeholder}
      </div>
    );
  }

  return (
    <Input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value && onUpdate) onUpdate(localValue);
      }}
      placeholder={placeholder}
      className="h-8 w-full bg-transparent border-transparent hover:border-border/50 focus:bg-background focus:ring-1 focus:ring-primary px-2 text-sm transition-all"
    />
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
  const [customValue, setCustomValue] = React.useState(value || "");

  const defaults = ["Hi", "Hey", "Dear Sir", "Dear Mam"];
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="h-8 w-full text-left px-2 rounded-md hover:bg-muted/50 transition-all font-black text-[10px] uppercase tracking-tighter truncate text-primary/80">
          {value || "HI"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 glass-card border-white/10 p-2 shadow-2xl rounded-xl" align="start">
        <div className="space-y-1">
          {defaults.map(opt => (
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
          <div className="h-px bg-white/5 my-1" />
          <div className="px-2 pb-1">
            <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Custom</span>
          </div>
          <div className="flex gap-1 px-1">
            <Input 
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Type..."
              className="h-8 text-xs font-bold rounded-lg bg-white/5 border-white/10 focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onUpdate(customValue);
                  setIsOpen(false);
                }
              }}
            />
            <Button 
              size="icon" 
              className="h-8 w-8 shrink-0 rounded-lg bg-primary hover:bg-primary/90"
              onClick={() => {
                onUpdate(customValue);
                setIsOpen(false);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Conditional Textarea Cell (Checkbox -> Textarea) ────────────────────────
export function ConditionalTextareaCell({
  checked,
  onCheckedChange,
  value,
  onValueChange,
  placeholder = "Enter custom message..."
}: {
  checked: boolean,
  onCheckedChange: (val: boolean) => void,
  value: string,
  onValueChange: (val: string) => void,
  placeholder?: string
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isAIMode, setIsAIMode] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() && !value.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/improve-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: aiPrompt, 
          currentText: value 
        }),
      });
      const data = await res.json();
      if (data.result) {
        onValueChange(data.result);
        setIsAIMode(false);
        setAiPrompt("");
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-3 w-full group" onClick={(e) => e.stopPropagation()}>
      <Checkbox 
        checked={checked} 
        onCheckedChange={(val) => onCheckedChange(!!val)}
        className="shrink-0 border-primary/30"
      />
      
      {checked ? (
        <Popover open={isEditing} onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) {
            setIsAIMode(false);
            setAiPrompt("");
          }
        }}>
           <PopoverTrigger asChild>
              <button className="flex-1 h-8 px-2 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-bold text-left truncate text-primary hover:bg-primary/10 transition-all">
                {value || "EDIT MESSAGE"}
              </button>
           </PopoverTrigger>
           <PopoverContent className="w-80 glass-card p-4 rounded-2xl border-white/10 shadow-2xl" align="start">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {isAIMode ? "AI Message Generator" : "Edit Custom Message"}
                    </h4>
                 </div>

                 {isAIMode ? (
                   <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <textarea 
                        className="w-full h-24 rounded-xl bg-primary/5 border border-primary/10 p-3 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Enter prompt (e.g. Write a friendly outreach message for a casting call)..."
                        autoFocus
                      />
                      <Button 
                        className="w-full h-10 rounded-xl font-black text-[10px] bg-primary hover:bg-primary/90 gap-2"
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !aiPrompt.trim()}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5" />
                        )}
                        {isGenerating ? "GENERATING..." : "GENERATE MESSAGE"}
                      </Button>
                   </div>
                 ) : (
                   <textarea 
                     className="w-full h-32 rounded-xl bg-muted/40 p-3 text-sm font-medium focus:ring-1 focus:ring-primary outline-none resize-none scrollbar-hide"
                     value={value}
                     onChange={(e) => onValueChange(e.target.value)}
                     placeholder={placeholder}
                     autoFocus
                   />
                 )}

                 <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAIMode(!isAIMode)}
                      className={cn(
                        "h-10 w-10 rounded-xl transition-all",
                        isAIMode ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                      title={isAIMode ? "Switch to Manual Edit" : "Use AI to Generate/Improve"}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => setIsEditing(false)} className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-95">DONE</Button>
                 </div>
              </div>
           </PopoverContent>
        </Popover>
      ) : (
        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest px-1">DISABLED</span>
      )}
    </div>
  );
}

// ─── Multi-Template Ordered Select ───────────────────────────────────────────
export function MultiTemplateSelect({
  selectedIds,
  onUpdate
}: {
  selectedIds: string | string[],
  onUpdate: (ids: string[]) => void
}) {
  const userId = getOrCreateUserId();
  const currentIds = Array.isArray(selectedIds) ? selectedIds : (selectedIds ? [selectedIds] : []);
  
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
    if (currentIds.includes(id)) {
      onUpdate(currentIds.filter(i => i !== id));
    } else {
      onUpdate([...currentIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 min-w-[120px] p-1 rounded-md border border-transparent hover:border-border/50 transition-all group">
      {currentIds.map((id, idx) => {
        const t = templates.find((tmp: any) => tmp.id === id);
        return (
          <Badge key={id} variant="secondary" className="h-5 px-1 gap-1 text-[9px] font-black bg-primary/10 text-primary border-none">
            {idx + 1}. {t?.name || "..."}
            <X className="w-2 h-2 cursor-pointer" onClick={() => handleToggle(id)} />
          </Badge>
        );
      })}
      <Select onValueChange={handleToggle}>
        <SelectTrigger className="h-5 w-5 p-0 border-none bg-transparent hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-3 h-3" />
        </SelectTrigger>
        <SelectContent>
            {templates.filter((t: any) => !currentIds.includes(t.id)).map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
            {templates.length === 0 && <div className="p-2 text-[10px] text-muted-foreground">No templates</div>}
        </SelectContent>
      </Select>
      {currentIds.length === 0 && <span className="text-[10px] text-muted-foreground/50 px-1 py-0.5">Pick order...</span>}
    </div>
  );
}

// ─── Unified Attachment Cell ─────────────────────────────────────────────────
export function AttachmentCell({
  attachments,
  onUpdate
}: {
  attachments: DriveFile[],
  onUpdate: (files: DriveFile[]) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap gap-1 items-center min-w-[100px] group">
       {(attachments || []).map((file, idx) => (
         <Badge key={file.id} variant="outline" className="h-6 px-2 gap-2 border-border/50 bg-muted/30 text-[10px] font-bold">
           <FileText className="w-3 h-3 text-blue-500" />
           <span className="max-w-[60px] truncate">{file.name}</span>
           <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onUpdate(attachments.filter((_, i) => i !== idx))} />
         </Badge>
       ))}
       
       <button 
         onClick={() => setIsOpen(true)}
         className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100"
       >
         <Search className="w-3.5 h-3.5" />
       </button>

       <Dialog open={isOpen} onOpenChange={setIsOpen}>
         <DialogContent className="glass-card border-white/10 rounded-[2rem] p-8 max-w-md">
           <DialogHeader>
             <DialogTitle className="text-xl font-black uppercase tracking-tighter">Unified Attachments</DialogTitle>
           </DialogHeader>
           <div className="py-4">
              <DriveFilePicker
                userId={getOrCreateUserId()}
                selectedFiles={attachments}
                onChange={(files) => {
                  onUpdate(files);
                }}
                placeholder="Search drive for resume, photos..."
                inline={true}
              />
           </div>
           <DialogFooter>
             <Button onClick={() => setIsOpen(false)} className="rounded-xl font-black">DONE</Button>
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
