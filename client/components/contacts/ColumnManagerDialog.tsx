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
import { GripVertical, Plus, Trash2, Settings2, Palette, ChevronDown, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const DEFAULT_GROUPS = [
  { id: "group-contact-details", title: "Contact Details", color: "#1e293b", columns: ["name", "castingName", "whatsapp", "email", "instaHandle", "notes", "sheetName"] },
  { id: "group-automation-run", title: "Automation Run", color: "#f59e0b", columns: ["whatsappRun", "emailRun", "instagramRun", "actingContext", "project", "age"] },
  { id: "group-whatsapp-protocol", title: "WhatsApp Protocol", color: "#10b981", columns: ["salutationWA", "personalizedNameWA", "templateSelectionWP", "hasCustomMessageWA", "specialAttachmentWA"] },
  { id: "group-gmail-protocol", title: "Gmail Protocol", color: "#3b82f6", columns: ["salutationEmail", "personalizedNameGmail", "editableGmailSubject", "templateSelectionGmail", "hasCustomMessageEmail", "specialAttachmentGmail"] },
  { id: "group-instagram-protocol", title: "Instagram Protocol", color: "#ec4899", columns: ["salutationIG", "personalizedNameIG", "templateSelectionIG", "hasCustomMessageIG", "specialAttachmentIG"] },
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
  { id: "actingContext", label: "Acting Context" },
  { id: "project", label: "Project Details" },
  { id: "age", label: "Age Range" },
  { id: "salutationWA", label: "WA Salutation" },
  { id: "personalizedNameWA", label: "WA Display Name" },
  { id: "templateSelectionWP", label: "WA Template" },
  { id: "hasCustomMessageWA", label: "WA Custom Msg" },
  { id: "specialAttachmentWA", label: "WA Attachment" },
  { id: "salutationEmail", label: "Gmail Salutation" },
  { id: "personalizedNameGmail", label: "Gmail Display Name" },
  { id: "editableGmailSubject", label: "Gmail Subject" },
  { id: "templateSelectionGmail", label: "Gmail Template" },
  { id: "hasCustomMessageEmail", label: "Gmail Custom Msg" },
  { id: "specialAttachmentGmail", label: "Gmail Attachment" },
  { id: "salutationIG", label: "IG Salutation" },
  { id: "personalizedNameIG", label: "IG Display Name" },
  { id: "templateSelectionIG", label: "IG Template" },
  { id: "hasCustomMessageIG", label: "IG Custom Msg" },
  { id: "specialAttachmentIG", label: "IG Attachment" },
];

interface ColumnManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function SortableColumnBadge({ id, colDef }: { id: string, colDef: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-primary flex items-center gap-1",
        isDragging ? "bg-primary text-white shadow-lg" : "bg-primary/20 text-primary"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/20 rounded">
        <GripHorizontal className="w-3 h-3" />
      </div>
      {colDef.label}
    </div>
  );
}

function SortableGroup({
  group,
  idx,
  updateGroup,
  removeGroup,
  toggleColumnInGroup,
  getAllAssignedColumns,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 rounded-2xl border bg-muted/20 space-y-4",
        isDragging ? "border-primary shadow-2xl bg-muted/50" : "border-white/10"
      )}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 p-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          value={group.title}
          onChange={(e) => updateGroup(idx, "title", e.target.value)}
          className="h-10 bg-background/50 border-white/10 font-black uppercase text-sm"
        />
        <div className="relative group/color w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
          <input
            type="color"
            value={group.color?.length === 7 ? group.color : "#475569"}
            onChange={(e) => updateGroup(idx, "color", e.target.value)}
            className="absolute inset-[-10px] w-20 h-20 cursor-pointer"
          />
          <Palette className="w-4 h-4 text-white pointer-events-none drop-shadow-md z-10 mix-blend-difference" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => removeGroup(idx)} className="text-destructive hover:bg-destructive/10 shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="pl-7">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-10 bg-background/50 border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
              Select Columns ({group.columns.length})
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 glass-card border-white/10" align="start">
            <div className="h-64 overflow-y-auto">
              <div className="p-2 space-y-1">
                {[...ALL_COLUMNS].sort((a, b) => {
                  const aSelected = group.columns.includes(a.id);
                  const bSelected = group.columns.includes(b.id);
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;

                  const disabledOptions = getAllAssignedColumns(idx);
                  const aDisabled = !aSelected && disabledOptions.includes(a.id);
                  const bDisabled = !bSelected && disabledOptions.includes(b.id);
                  if (aDisabled && !bDisabled) return 1;
                  if (!aDisabled && bDisabled) return -1;

                  return 0;
                }).map((col) => {
                  const isSelected = group.columns.includes(col.id);
                  const disabledOptions = getAllAssignedColumns(idx);
                  const isDisabled = !isSelected && disabledOptions.includes(col.id);
                  return (
                    <div
                      key={col.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors",
                        isDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5",
                        isSelected ? "bg-primary/20 text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => {
                        if (!isDisabled) toggleColumnInGroup(idx, col.id);
                      }}
                    >
                      <Checkbox checked={isSelected} disabled={isDisabled} className="pointer-events-none" />
                      <span>{col.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {group.columns.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <SortableContext items={group.columns.map((c: string) => `col-${group.id}-${c}`)} strategy={horizontalListSortingStrategy}>
              {group.columns.map((colId: string) => {
                const colDef = ALL_COLUMNS.find((c) => c.id === colId);
                if (!colDef) return null;
                return <SortableColumnBadge key={`col-${group.id}-${colId}`} id={`col-${group.id}-${colId}`} colDef={colDef} />;
              })}
            </SortableContext>
          </div>
        )}
      </div>
    </div>
  );
}

export function ColumnManagerDialog({ isOpen, onOpenChange, onSaved }: ColumnManagerDialogProps) {
  const [groups, setGroups] = useState(DEFAULT_GROUPS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem("casthub-column-groups");
        let initialGroups = saved ? JSON.parse(saved) : DEFAULT_GROUPS;

        const groupSettings = JSON.parse(localStorage.getItem("casthub-group-settings") || "{}");
        initialGroups = initialGroups.map((g: any) => ({
          ...g,
          title: groupSettings[g.id]?.title || g.title,
          color: groupSettings[g.id]?.color || g.color,
        }));

        setGroups(initialGroups);
      } catch (e) {
        setGroups(DEFAULT_GROUPS);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("casthub-column-groups", JSON.stringify(groups));

    try {
      const settings = JSON.parse(localStorage.getItem("casthub-group-settings") || "{}");
      groups.forEach((g: any) => {
        settings[g.id] = { title: g.title, color: g.color };
      });
      localStorage.setItem("casthub-group-settings", JSON.stringify(settings));
      window.dispatchEvent(new Event("casthub-group-update"));
      window.dispatchEvent(new Event("casthub-groups-changed"));
    } catch (e) {}

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
      newGroups[groupIdx].columns = colList.filter((id: string) => id !== colId);
    } else {
      newGroups.forEach((g) => {
        g.columns = g.columns.filter((id: string) => id !== colId);
      });
      newGroups[groupIdx].columns.push(colId);
    }
    setGroups(newGroups);
  };

  const getAllAssignedColumns = (excludeGroupIdx: number) => {
    const assigned = new Set<string>();
    groups.forEach((g, idx) => {
      if (idx !== excludeGroupIdx) {
        g.columns.forEach((c: string) => assigned.add(c));
      }
    });
    return Array.from(assigned);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const activeStr = String(active.id);
      const overStr = String(over.id);

      // Handle reordering groups
      if (activeStr.startsWith("group-") && overStr.startsWith("group-")) {
        setGroups((items) => {
          const oldIndex = items.findIndex((g) => g.id === active.id);
          const newIndex = items.findIndex((g) => g.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
        return;
      }

      // Handle reordering columns inside a group
      if (activeStr.startsWith("col-") && overStr.startsWith("col-")) {
        const activeParts = activeStr.split("-");
        const overParts = overStr.split("-");
        // format: col-{groupId_part1}-{groupId_part2...}-{colId}
        const activeColId = activeParts.pop()!;
        const activeGroupId = activeParts.slice(1).join("-");
        
        const overColId = overParts.pop()!;
        const overGroupId = overParts.slice(1).join("-");

        // We only allow reordering within the same group
        if (activeGroupId === overGroupId) {
          setGroups((items) => {
            const groupIdx = items.findIndex((g) => g.id === activeGroupId);
            if (groupIdx === -1) return items;

            const newGroups = [...items];
            const groupColumns = [...newGroups[groupIdx].columns];
            
            const oldIndex = groupColumns.indexOf(activeColId);
            const newIndex = groupColumns.indexOf(overColId);
            
            newGroups[groupIdx].columns = arrayMove(groupColumns, oldIndex, newIndex);
            return newGroups;
          });
        }
      }
    }
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {groups.map((group, idx) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    idx={idx}
                    updateGroup={updateGroup}
                    removeGroup={removeGroup}
                    toggleColumnInGroup={toggleColumnInGroup}
                    getAllAssignedColumns={getAllAssignedColumns}
                  />
                ))}
              </div>
            </SortableContext>

            <Button
              onClick={addGroup}
              variant="outline"
              className="w-full mt-6 h-12 border-dashed border-white/20 bg-transparent hover:bg-white/5"
            >
              <Plus className="w-4 h-4 mr-2" /> ADD GROUP
            </Button>
          </div>
        </DndContext>

        <DialogFooter className="p-6 bg-muted/30 border-t border-white/5 shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            CANCEL
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-black tracking-widest">
            SAVE & APPLY
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
