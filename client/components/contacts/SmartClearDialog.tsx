import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eraser, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartClearDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (fieldsToClear: string[]) => void;
  selectedCount: number;
}

const CLEARABLE_FIELDS = [
  { id: "whatsappRun", label: "WhatsApp Run" },
  { id: "emailRun", label: "Gmail Run" },
  { id: "instagramRun", label: "Instagram Run" },
  { id: "actingContext", label: "Acting Context" },
  { id: "project", label: "Project Details" },
  { id: "age", label: "Age Range" },
  { id: "salutation", label: "Salutation" },
];

export function SmartClearDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  selectedCount,
}: SmartClearDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    CLEARABLE_FIELDS.map((f) => f.id)
  );

  const toggleField = (id: string) => {
    setSelectedFields((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedFields);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] glass-card border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-muted/30">
          <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Eraser className="w-5 h-5 text-amber-500" />
            </div>
            SMART CLEAR
          </DialogTitle>
          <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
            Clear specific dynamic data for {selectedCount} selected row(s) while keeping core contact details intact.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-background/50">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-500/80 leading-relaxed">
              Selected fields will be completely cleared (set to empty/false) for all {selectedCount} rows. This action cannot be undone.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fields to Clear</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-[9px] font-black uppercase text-primary hover:bg-primary/10"
                onClick={() => setSelectedFields(selectedFields.length === CLEARABLE_FIELDS.length ? [] : CLEARABLE_FIELDS.map(f => f.id))}
              >
                {selectedFields.length === CLEARABLE_FIELDS.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {CLEARABLE_FIELDS.map((field) => {
                const isSelected = selectedFields.includes(field.id);
                return (
                  <div
                    key={field.id}
                    onClick={() => toggleField(field.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isSelected ? "bg-amber-500/10 border-amber-500/30 text-foreground" : "bg-muted/20 border-white/5 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <Checkbox 
                      checked={isSelected}
                      className={cn(isSelected && "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500")}
                    />
                    <span className="text-xs font-bold truncate">{field.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t border-white/5 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5"
          >
            CANCEL
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={selectedFields.length === 0}
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 transition-all"
          >
            CLEAR DATA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
