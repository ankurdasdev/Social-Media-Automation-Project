import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, MessageSquare, FileText, Paperclip, Send } from "lucide-react";

export type SequenceStep = "custom" | "templates" | "attachments";

interface SequenceBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sequence: SequenceStep[]) => void;
  selectedCount: number;
}

export function SequenceBuilderDialog({ open, onOpenChange, onConfirm, selectedCount }: SequenceBuilderDialogProps) {
  // Default legacy sequence
  const [sequence, setSequence] = useState<SequenceStep[]>(["custom", "templates", "attachments"]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dragIndex === dropIndex) return;

    const newSeq = [...sequence];
    const [draggedItem] = newSeq.splice(dragIndex, 1);
    newSeq.splice(dropIndex, 0, draggedItem);
    setSequence(newSeq);
  };

  const renderStep = (step: SequenceStep, index: number) => {
    let icon, label, desc;
    if (step === "custom") {
      icon = <MessageSquare className="w-5 h-5 text-blue-500" />;
      label = "Custom Message";
      desc = "The grid-level custom message typed for each contact.";
    } else if (step === "templates") {
      icon = <FileText className="w-5 h-5 text-purple-500" />;
      label = "Templates";
      desc = "Any global body/footer templates assigned.";
    } else {
      icon = <Paperclip className="w-5 h-5 text-emerald-500" />;
      label = "Attachments";
      desc = "Drive files and template-level media files.";
    }

    return (
      <div
        key={step}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 cursor-grab active:cursor-grabbing transition-all group"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100" />
        <div className="w-10 h-10 rounded-full bg-background border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <div className="text-[10px] font-black tracking-widest text-muted-foreground bg-background px-2 py-1 rounded-full border border-border/50">
          Step {index + 1}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-border/50 shadow-2xl glass-card rounded-3xl">
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
          <DialogTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" /> Outreach Sequence
          </DialogTitle>
          <DialogDescription className="text-sm font-medium leading-relaxed">
            You are about to trigger outreach for <strong className="text-foreground">{selectedCount} contact(s)</strong>. 
            Define the exact transmission order. Drag to reorder.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-3">
          {sequence.map((step, index) => renderStep(step, index))}
        </div>

        <DialogFooter className="p-6 pt-0 sm:justify-between border-t border-border/50 bg-muted/10 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button onClick={() => onConfirm(sequence)} className="rounded-xl font-black gap-2">
            <Send className="w-4 h-4" /> Trigger Outreach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
