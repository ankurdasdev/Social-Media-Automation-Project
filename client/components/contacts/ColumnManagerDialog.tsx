import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GripVertical, Plus, Trash2, Settings2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_GROUPS = [
  { id: "group-contact-details", title: "Contact Details", color: "#1e293b", columns: ["name", "castingName", "whatsapp", "email", "instaHandle", "notes", "sheetName"] },
  { id: "group-automation-run", title: "Automation Run", color: "#f59e0b", columns: ["whatsappRun", "emailRun", "instagramRun"] },
  { id: "group-whatsapp", title: "WhatsApp Protocol", color: "#10b981", columns: ["personalizedNameWA", "salutationWA", "templateSelectionWP", "hasCustomMessageWA", "editableMessageWP", "specialAttachmentWA"] },
  { id: "group-gmail", title: "Gmail Protocol", color: "#3b82f6", columns: ["personalizedNameGmail", "salutationEmail", "templateSelectionGmail", "editableGmailSubject", "hasCustomMessageEmail", "editableMessageGmail", "specialAttachmentGmail"] },
  { id: "group-instagram", title: "Instagram Protocol", color: "#ec4899", columns: ["personalizedNameIG", "salutationIG", "templateSelectionIG", "hasCustomMessageIG", "editableMessageIG", "specialAttachmentIG"] },
  { id: "group-tracking", title: "Tracking", color: "#6366f1", columns: ["lastContactedDate", "followups", "automationComment", "visit"] }
];

export const ALL_COLUMNS = [
  { id: "name", label: "Lead Name" },
  { id: "castingName", label: "Casting Name" },
  { id: "whatsapp", label: "WA Number" },
  { id: "email", label: "Gmail Address" },
  { id: "instaHandle", label: "Instagram Profile" },
  { id: "notes", label: "Notes" },
  { id: "sheetName", label: "Source Sheet" },
  { id: "whatsappRun", label: "WP Run" },
  { id: "emailRun", label: "Gmail Run" },
  { id: "instagramRun", label: "Insta Run" },
  { id: "personalizedNameWA", label: "WA Display Name" },
  { id: "salutationWA", label: "WA Salutation" },
  { id: "templateSelectionWP", label: "WA Template" },
  { id: "hasCustomMessageWA", label: "WA Custom Msg" },
  { id: "editableMessageWP", label: "WA Override Msg" },
  { id: "specialAttachmentWA", label: "WA Attachment" },
  { id: "personalizedNameGmail", label: "Gmail Display Name" },
  { id: "salutationEmail", label: "Gmail Salutation" },
  { id: "templateSelectionGmail", label: "Gmail Template" },
  { id: "editableGmailSubject", label: "Gmail Subject" },
  { id: "hasCustomMessageEmail", label: "Gmail Custom Msg" },
  { id: "editableMessageGmail", label: "Gmail Override Msg" },
  { id: "specialAttachmentGmail", label: "Gmail Attachment" },
  { id: "personalizedNameIG", label: "IG Display Name" },
  { id: "salutationIG", label: "IG Salutation" },
  { id: "templateSelectionIG", label: "IG Template" },
  { id: "hasCustomMessageIG", label: "IG Custom Msg" },
  { id: "editableMessageIG", label: "IG Override Msg" },
  { id: "specialAttachmentIG", label: "IG Attachment" },
  { id: "lastContactedDate", label: "Last Contacted" },
  { id: "followups", label: "Follow-ups" },
  { id: "automationComment", label: "Automation Status" },
  { id: "visit", label: "Visit Log" }
];

interface ColumnManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ColumnManagerDialog({ isOpen, onOpenChange, onSaved }: ColumnManagerDialogProps) {
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [draggedGroupIdx, setDraggedGroupIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem("casthub-column-groups");
        if (saved) {
          setGroups(JSON.parse(saved));
        } else {
          setGroups(DEFAULT_GROUPS);
        }
      } catch (e) {
        setGroups(DEFAULT_GROUPS);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("casthub-column-groups", JSON.stringify(groups));
    window.dispatchEvent(new Event("casthub-groups-changed"));
    onSaved();
    onOpenChange(false);
  };

  const addGroup = () => {
    setGroups([...groups, { id: `group-${Date.now()}`, title: "New Group", color: "#475569", columns: [] }]);
  };

  const removeGroup = (idx: number) => {
    const newGroups = [...groups];
    newGroups.splice(idx, 1);
    setGroups(newGroups);
  };

  const updateGroup = (idx: number, key: string, value: any) => {
    const newGroups = [...groups];
    (newGroups[idx] as any)[key] = value;
    setGroups(newGroups);
  };

  const toggleColumnInGroup = (groupIdx: number, colId: string) => {
    const newGroups = [...groups];
    const colList = newGroups[groupIdx].columns;
    if (colList.includes(colId)) {
      newGroups[groupIdx].columns = colList.filter(id => id !== colId);
    } else {
      // remove from other groups first
      newGroups.forEach(g => {
        g.columns = g.columns.filter(id => id !== colId);
      });
      newGroups[groupIdx].columns.push(colId);
    }
    setGroups(newGroups);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] glass-card border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl flex flex-col">
        <DialogHeader className="p-8 pb-4 bg-muted/30 shrink-0">
          <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            COLUMN GROUPS
          </DialogTitle>
          <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
            Create, reorder, and assign columns to groups.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {groups.map((group, idx) => (
              <div 
                key={group.id} 
                className="p-4 rounded-2xl border border-white/10 bg-muted/20 space-y-4"
                draggable
                onDragStart={() => setDraggedGroupIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedGroupIdx !== null && draggedGroupIdx !== idx) {
                    const newGroups = [...groups];
                    const [dragged] = newGroups.splice(draggedGroupIdx, 1);
                    newGroups.splice(idx, 0, dragged);
                    setGroups(newGroups);
                  }
                  setDraggedGroupIdx(null);
                }}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100" />
                  <Input 
                    value={group.title} 
                    onChange={e => updateGroup(idx, "title", e.target.value)} 
                    className="h-10 bg-background/50 border-white/10 font-black uppercase text-sm"
                  />
                  <div className="relative group/color w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                    <input 
                      type="color" 
                      value={group.color?.length === 7 ? group.color : "#475569"} 
                      onChange={e => updateGroup(idx, "color", e.target.value)}
                      className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
                    />
                    <Palette className="w-4 h-4 text-white pointer-events-none drop-shadow-md z-10 mix-blend-difference" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeGroup(idx)} className="text-destructive hover:bg-destructive/10 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="pl-7">
                  <div className="flex flex-wrap gap-2">
                    {ALL_COLUMNS.map(col => {
                      const isActive = group.columns.includes(col.id);
                      return (
                        <div 
                          key={col.id}
                          onClick={() => toggleColumnInGroup(idx, col.id)}
                          className={cn(
                            "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest cursor-pointer border transition-all",
                            isActive ? "bg-primary/20 border-primary text-primary" : "bg-background border-white/5 text-muted-foreground hover:bg-white/5"
                          )}
                        >
                          {col.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button onClick={addGroup} variant="outline" className="w-full mt-6 h-12 border-dashed border-white/20 bg-transparent hover:bg-white/5">
            <Plus className="w-4 h-4 mr-2" /> ADD GROUP
          </Button>
        </ScrollArea>

        <DialogFooter className="p-6 bg-muted/30 border-t border-white/5 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>CANCEL</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-black tracking-widest">
            SAVE & APPLY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
