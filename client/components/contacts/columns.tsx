import { ColumnDef } from "@tanstack/react-table";
import { Contact } from "@shared/api";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Mail,
  Instagram,
  Filter,
  User as UserIcon,
  Briefcase,
  Layers,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Type,
  Pencil,
} from "lucide-react";
import { 
  EditableTextCell, 
  MultiTemplateSelect, 
  AttachmentCell, 
  PicklistCell, 
  ConditionalTextareaCell,
  SheetDropdownCell,
  PersonalizedCell,
} from "./GridCells";
import { cn } from "@/lib/utils";
import * as React from "react";

// ─── Group Header Component ────────────────────────────────────────────────────
import { AdvancedColorPicker } from "./AdvancedColorPicker";
import { Palette } from "lucide-react";

const GROUP_STORAGE_KEY = "casthub-group-settings";

function getGroupSettings(): Record<string, { title: string, color: string }> {
  try {
    return JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setGroupSetting(groupId: string, key: "title" | "color", value: string) {
  const settings = getGroupSettings();
  if (!settings[groupId]) settings[groupId] = { title: "", color: "" };
  settings[groupId][key] = value;
  localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(settings));
  // Dispatch custom event to trigger re-renders if necessary
  window.dispatchEvent(new Event("casthub-group-update"));
}

export function GroupHeader({ id, defaultTitle, defaultColor }: { id: string; defaultTitle: string; defaultColor: string }) {
  const [settings, setSettings] = React.useState(() => getGroupSettings()[id] || { title: defaultTitle, color: defaultColor });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(settings.title || defaultTitle);

  React.useEffect(() => {
    const handleUpdate = () => {
      setSettings(getGroupSettings()[id] || { title: defaultTitle, color: defaultColor });
    };
    window.addEventListener("casthub-group-update", handleUpdate);
    return () => window.removeEventListener("casthub-group-update", handleUpdate);
  }, [id, defaultTitle, defaultColor]);

  const handleSaveTitle = () => {
    if (editValue.trim()) {
      setGroupSetting(id, "title", editValue.trim());
    }
    setIsEditing(false);
  };

  const handleColorChange = (color: string) => {
    setGroupSetting(id, "color", color);
  };

  const bgColor = settings.color || defaultColor;
  const isCustomColor = bgColor.startsWith("#") || bgColor.includes("gradient");

  return (
    <div 
      className="flex items-center justify-between w-full h-full px-4 py-2 group/groupheader transition-all relative overflow-hidden rounded-t-xl"
      style={{
        backgroundColor: isCustomColor ? (bgColor.includes("gradient") ? undefined : `${bgColor}33`) : undefined,
        background: isCustomColor && bgColor.includes("gradient") ? bgColor : undefined,
      }}
    >
      {/* Background if using tailwind class */}
      {!isCustomColor && <div className={cn("absolute inset-0 opacity-50", bgColor)} />}
      
      <div className="relative z-10 flex items-center justify-center gap-2 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setIsEditing(false); }}
            className="bg-primary/20 border border-primary/50 rounded px-2 text-[11px] font-black uppercase tracking-widest w-full outline-none h-6 text-foreground"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest drop-shadow-md">
              {settings.title || defaultTitle}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(settings.title || defaultTitle); }}
              className="opacity-0 group-hover/groupheader:opacity-100 hover:!opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 opacity-0 group-hover/groupheader:opacity-100 transition-opacity flex items-center shrink-0 ml-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 rounded hover:bg-white/20 transition-colors">
              <Palette className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 border-white/10 glass-card">
            <AdvancedColorPicker 
              color={settings.color || defaultColor} 
              onChange={handleColorChange} 
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// ─── Editable Header Component with Popover Filter ───────────────────────────

const LABEL_STORAGE_KEY = "casthub-column-labels";

function getStoredLabels(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LABEL_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setStoredLabel(columnId: string, label: string) {
  const labels = getStoredLabels();
  labels[columnId] = label;
  localStorage.setItem(LABEL_STORAGE_KEY, JSON.stringify(labels));
}

function DataTableColumnHeader({ 
  column, 
  title, 
  icon: Icon,
  columnId,
  disableRename,
  isFollowupFilter,
}: { 
  column: any; 
  title: string; 
  icon?: any;
  columnId?: string;
  disableRename?: boolean;
  isFollowupFilter?: boolean;
}) {
  const storedLabels = getStoredLabels();
  const effectiveId = columnId || column.id;
  const [isEditingLabel, setIsEditingLabel] = React.useState(false);
  const [labelValue, setLabelValue] = React.useState(storedLabels[effectiveId] || title);

  const handleLabelSave = () => {
    if (labelValue.trim()) {
      setStoredLabel(effectiveId, labelValue.trim());
    }
    setIsEditingLabel(false);
  };

  const displayTitle = storedLabels[effectiveId] || title;

  if (!column.getCanFilter()) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] py-2 whitespace-nowrap group">
        {Icon && <Icon className="w-3 h-3 opacity-50" />}
        {isEditingLabel ? (
          <input
            autoFocus
            value={labelValue}
            onChange={e => setLabelValue(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={e => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') setIsEditingLabel(false); }}
            className="bg-primary/10 border border-primary/30 rounded px-1 text-[10px] font-black uppercase w-24 outline-none"
          />
        ) : (
          <>
            <span>{displayTitle}</span>
            {!disableRename && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); setLabelValue(storedLabels[effectiveId] || title); }}
                className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const isFiltered = column.getFilterValue() !== undefined && column.getFilterValue() !== "";

  return (
    <div className="flex items-center gap-1.5 group">
      {isEditingLabel ? (
        <input
          autoFocus
          value={labelValue}
          onChange={e => setLabelValue(e.target.value)}
          onBlur={handleLabelSave}
          onKeyDown={e => { 
            e.stopPropagation(); 
            if (e.key === 'Enter') handleLabelSave(); 
            if (e.key === 'Escape') setIsEditingLabel(false); 
          }}
          onClick={e => e.stopPropagation()}
          className="bg-primary/10 border border-primary/30 rounded px-1 text-[10px] font-black uppercase w-20 outline-none h-6"
        />
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-primary py-2 px-2 rounded-lg -ml-1 whitespace-nowrap",
              isFiltered ? "text-primary bg-primary/5" : "text-muted-foreground"
            )}>
              {Icon && <Icon className={cn("w-3 h-3", isFiltered ? "opacity-100" : "opacity-50")} />}
              <span>{displayTitle}</span>
              <Filter className={cn("w-2.5 h-2.5 ml-1 transition-all", isFiltered ? "opacity-100" : "opacity-0 group-hover:opacity-30")} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 glass-card p-4 rounded-[1.5rem] border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter {displayTitle}</h4>
              {isFiltered && (
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => column.setFilterValue(undefined)}
                   className="h-6 px-2 text-[9px] font-black text-rose-500 hover:bg-rose-500/10"
                >
                  CLEAR
                </Button>
              )}
            </div>
            {isFollowupFilter ? (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => column.setFilterValue("30")} className={cn("text-[10px] font-black uppercase", column.getFilterValue() === "30" && "bg-primary/20 text-primary border-primary/50")}>30 Days</Button>
                <Button variant="outline" size="sm" onClick={() => column.setFilterValue("60")} className={cn("text-[10px] font-black uppercase", column.getFilterValue() === "60" && "bg-primary/20 text-primary border-primary/50")}>60 Days</Button>
                <Button variant="outline" size="sm" onClick={() => column.setFilterValue("90")} className={cn("text-[10px] font-black uppercase", column.getFilterValue() === "90" && "bg-primary/20 text-primary border-primary/50")}>90 Days</Button>
                <Button variant="outline" size="sm" onClick={() => column.setFilterValue(undefined)} className={cn("text-[10px] font-black uppercase", !column.getFilterValue() && "bg-primary/20 text-primary border-primary/50")}>All Time</Button>
              </div>
            ) : (
              <div className="space-y-3 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground opacity-50" />
                  <Input
                    placeholder={`Search ${displayTitle}...`}
                    value={(column.getFilterValue() as string) !== "___NULL___" ? ((column.getFilterValue() as string) ?? "") : ""}
                    onChange={(event) => column.setFilterValue(event.target.value)}
                    className="h-10 pl-10 rounded-xl bg-muted/40 border-white/5 font-bold focus:ring-primary text-sm"
                    autoFocus
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                     if (column.getFilterValue() === "___NULL___") {
                       column.setFilterValue(undefined);
                     } else {
                       column.setFilterValue("___NULL___");
                     }
                  }}
                  className={cn("w-full h-8 text-[10px] font-black uppercase transition-all", column.getFilterValue() === "___NULL___" ? "bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 hover:text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground")}
                >
                  {column.getFilterValue() === "___NULL___" ? "Showing Empty/Null Only" : "Filter Empty/Null"}
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
        </Popover>
      )}
      {!isEditingLabel && !disableRename && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); setLabelValue(storedLabels[effectiveId] || title); }}
          className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-0.5 rounded hover:bg-primary/10 shrink-0"
          title="Rename column"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Column Definitions ──────────────────────────────────────────────────────

export const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center w-full">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="h-4 w-4 border-2 border-slate-400 dark:border-slate-400 bg-white dark:bg-slate-800 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="h-4 w-4 border-2 border-slate-400 dark:border-slate-400 bg-white dark:bg-slate-800 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: "index",
    header: "#",
    size: 50,
    cell: ({ row }) => (
      <div className="text-[10px] font-black text-muted-foreground/30 text-center font-mono">
        {row.index + 1}
      </div>
    ),
  },

  // ── Hidden columns for filtering ──────────────────────────────────────────
  {
    accessorKey: "whatsappCompleted",
    header: "WA Status Hidden",
    enableHiding: true,
  },
  {
    accessorKey: "emailCompleted",
    header: "Email Status Hidden",
    enableHiding: true,
  },
  {
    accessorKey: "instagramCompleted",
    header: "IG Status Hidden",
    enableHiding: true,
  },

    {
    id: "group-contact-details",
    header: () => <GroupHeader id="group-contact-details" defaultTitle="Contact Details" defaultColor="#1e293b" />,
    columns: [
    // ── 1. Contact Details ────────────────────────────────────────────────────────
      {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Lead Name" icon={UserIcon} columnId="name" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.name} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { name: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "castingName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Casting Name" icon={Briefcase} columnId="castingName" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.castingName} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { castingName: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "whatsapp",
        header: ({ column }) => <DataTableColumnHeader column={column} title="WA Number" icon={MessageCircle} columnId="whatsapp" />,
        size: 160,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.whatsapp} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { whatsapp: val })}
              placeholder="+91..."
              type="whatsapp"
            />
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Address" icon={Mail} columnId="email" />,
        size: 220,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.email} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { email: val })}
              placeholder="id@host.com"
              type="gmail"
            />
          </div>
        ),
      },
      {
        accessorKey: "instaHandle",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Instagram Profile" icon={Instagram} columnId="instaHandle" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.instaHandle} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { instaHandle: val })}
              placeholder="@handle"
              type="instagram"
            />
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Notes" columnId="notes" />,
        size: 250,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.notes} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { notes: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "sheetName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source Sheet" columnId="sheetName" />,
        size: 160,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <SheetDropdownCell
              value={row.original.sheetName || ""}
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { sheetName: val })}
              sheets={(table.options.meta as any)?.uniqueSheets || []}
            />
          </div>
        ),
      },
    
      
    ]
  },
  {
    id: "group-automation-run",
    header: () => <GroupHeader id="group-automation-run" defaultTitle="Automation Run" defaultColor="#f59e0b" />,
    columns: [
    // ── 2. Automation Run ────────────────────────────────────────────────────────
      {
        accessorKey: "whatsappRun",
        header: ({ column }) => <DataTableColumnHeader column={column} title="WP Run" icon={MessageCircle} columnId="whatsappRun" />,
        size: 110,
        cell: ({ row, table }) => (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={!!row.original.whatsappRun}
              onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { whatsappRun: !!val })}
              className="w-5 h-5 rounded-lg border-emerald-500/30"
            />
          </div>
        ),
      },
      {
        accessorKey: "emailRun",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Run" icon={Mail} columnId="emailRun" />,
        size: 110,
        cell: ({ row, table }) => (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={!!row.original.emailRun}
              onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { emailRun: !!val })}
              className="w-5 h-5 rounded-lg border-blue-500/30"
            />
          </div>
        ),
      },
      {
        accessorKey: "instagramRun",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Instagram Run" icon={Instagram} columnId="instagramRun" />,
        size: 110,
        cell: ({ row, table }) => (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={!!row.original.instagramRun}
              onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { instagramRun: !!val })}
              className="w-5 h-5 rounded-lg border-pink-500/30"
            />
          </div>
        ),
      },
      {
        accessorKey: "actingContext",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Acting Context" icon={Layers} columnId="actingContext" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.actingContext} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { actingContext: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "project",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Project Details" icon={Calendar} columnId="project" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.project} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { project: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "age",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Age Range" columnId="age" />,
        size: 100,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.age} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { age: val })}
            />
          </div>
        ),
      },
    
      
    ]
  },
  {
    id: "group-whatsapp-protocol",
    header: () => <GroupHeader id="group-whatsapp-protocol" defaultTitle="WhatsApp Protocol" defaultColor="#10b981" />,
    columns: [
    // ── 3. WhatsApp ─────────────────────────────────────────────────────────────
      {
        accessorKey: "salutationWA",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Salutation for WP" icon={Type} columnId="salutationWA" />,
        size: 220,
        cell: ({ row, table }) => (
           <div onClick={(e) => e.stopPropagation()}>
              <PicklistCell 
                value={row.original.salutationWA}
                onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { salutationWA: val })}
              />
           </div>
        ),
      },
      {
        accessorKey: "personalizedNameWA",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Personalized WP" icon={Type} columnId="personalizedNameWA" />,
        size: 220,
        cell: ({ row, table }) => (
           <div onClick={(e) => e.stopPropagation()}>
              <PersonalizedCell 
                value={row.original.personalizedNameWA}
                onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { personalizedNameWA: val })}
              />
           </div>
        ),
      },
      {
        accessorKey: "templateSelectionWP",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template WP" columnId="templateSelectionWP" />,
        size: 260,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <MultiTemplateSelect 
              selectedIds={row.original.templateSelectionWP || []} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { templateSelectionWP: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "hasCustomMessageWA",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Editable MSG WP" columnId="hasCustomMessageWA" />,
        size: 260,
        cell: ({ row, table }) => (
          <div className="px-2" onClick={(e) => e.stopPropagation()}>
            <ConditionalTextareaCell 
              checked={!!row.original.hasCustomMessageWA}
              onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { hasCustomMessageWA: val })}
              value={row.original.editableMessageWP}
              onValueChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { editableMessageWP: val })}
              placeholder="Override WP Template..."
            />
          </div>
        ),
      },
      {
        id: "specialAttachmentWA",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Attachment for WP" columnId="specialAttachmentWA" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <AttachmentCell 
              attachments={row.original.drive_attachments_wa || []} 
              onUpdate={(files) => (table.options.meta as any)?.updateContact?.(row.original.id, { drive_attachments_wa: files })}
            />
          </div>
        ),
      },
    
      
    ]
  },
  {
    id: "group-gmail-protocol",
    header: () => <GroupHeader id="group-gmail-protocol" defaultTitle="Gmail Protocol" defaultColor="#3b82f6" />,
    columns: [
    // ── 4. Gmail ────────────────────────────────────────────────────────────────
      {
        accessorKey: "salutationEmail",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Salutation for Mail" icon={Type} columnId="salutationEmail" />,
        size: 220,
        cell: ({ row, table }) => (
           <div onClick={(e) => e.stopPropagation()}>
              <PicklistCell 
                value={row.original.salutationEmail}
                onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { salutationEmail: val })}
              />
           </div>
        ),
      },
      {
        accessorKey: "personalizedNameGmail",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Personalized Gmail" icon={Type} columnId="personalizedNameGmail" />,
        size: 220,
        cell: ({ row, table }) => (
           <div onClick={(e) => e.stopPropagation()}>
              <PersonalizedCell 
                value={row.original.personalizedNameGmail}
                onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { personalizedNameGmail: val })}
              />
           </div>
        ),
      },
      {
        accessorKey: "editableGmailSubject",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Subject" columnId="editableGmailSubject" />,
        size: 260,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.editableGmailSubject} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { editableGmailSubject: val })}
              placeholder="Override Subject..."
            />
          </div>
        ),
      },
      {
        accessorKey: "templateSelectionGmail",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template Gmail" columnId="templateSelectionGmail" />,
        size: 260,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <MultiTemplateSelect 
              selectedIds={row.original.templateSelectionGmail || []} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { templateSelectionGmail: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "hasCustomMessageEmail",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Editable MSG Gmail" columnId="hasCustomMessageEmail" />,
        size: 260,
        cell: ({ row, table }) => (
          <div className="px-2" onClick={(e) => e.stopPropagation()}>
            <ConditionalTextareaCell 
              checked={!!row.original.hasCustomMessageEmail}
              onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { hasCustomMessageEmail: val })}
              value={row.original.editableMessageGmail}
              onValueChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { editableMessageGmail: val })}
              placeholder="Override Email Body..."
            />
          </div>
        ),
      },
      {
        id: "specialAttachmentGmail",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Attachment for Gmail" columnId="specialAttachmentGmail" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <AttachmentCell 
              attachments={row.original.drive_attachments_email || []} 
              onUpdate={(files) => (table.options.meta as any)?.updateContact?.(row.original.id, { drive_attachments_email: files })}
            />
          </div>
        ),
      },
    
      
    ]
  },
  {
    id: "group-instagram-protocol",
    header: () => <GroupHeader id="group-instagram-protocol" defaultTitle="Instagram Protocol" defaultColor="#ec4899" />,
    columns: [
    // ── 5. Instagram ────────────────────────────────────────────────────────────
      {
        accessorKey: "salutationIG",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Salutation for IG" icon={Type} columnId="salutationIG" />,
        size: 220,
        cell: ({ row, table }) => (
           <div onClick={(e) => e.stopPropagation()}>
              <PicklistCell 
                value={row.original.salutationIG}
                onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { salutationIG: val })}
              />
           </div>
        ),
      },
      {
        accessorKey: "personalizedNameIG",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Personalized IG" icon={Type} columnId="personalizedNameIG" />,
        size: 220,
        cell: ({ row, table }) => (
           <div onClick={(e) => e.stopPropagation()}>
              <PersonalizedCell 
                value={row.original.personalizedNameIG}
                onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { personalizedNameIG: val })}
              />
           </div>
        ),
      },
      {
        accessorKey: "templateSelectionIG",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Template IG" columnId="templateSelectionIG" />,
        size: 260,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <MultiTemplateSelect 
              selectedIds={row.original.templateSelectionIG || []} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { templateSelectionIG: val })}
            />
          </div>
        ),
      },
      {
        accessorKey: "hasCustomMessageIG",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Editable MSG Insta" columnId="hasCustomMessageIG" />,
        size: 260,
        cell: ({ row, table }) => (
          <div className="px-2" onClick={(e) => e.stopPropagation()}>
            <ConditionalTextareaCell 
              checked={!!row.original.hasCustomMessageIG}
              onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { hasCustomMessageIG: val })}
              value={row.original.editableMessageIG}
              onValueChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { editableMessageIG: val })}
              placeholder="Override IG Message..."
            />
          </div>
        ),
      },
      {
        id: "specialAttachmentIG",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Attachment for IG" columnId="specialAttachmentIG" />,
        size: 180,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <AttachmentCell 
              attachments={row.original.drive_attachments_ig || []} 
              onUpdate={(files) => (table.options.meta as any)?.updateContact?.(row.original.id, { drive_attachments_ig: files })}
            />
          </div>
        ),
      },
    
      
    ]
  },
  {
    id: "group-tracking",
    header: () => <GroupHeader id="group-tracking" defaultTitle="Tracking" defaultColor="#6366f1" />,
    columns: [
    // ── 6. Tracking ─────────────────────────────────────────────────────────────
      {
        accessorKey: "lastContactedDate",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Contacted" columnId="lastContactedDate" />,
        size: 160,
        cell: ({ row }) => (
          <div className="px-2 text-[10px] font-black text-muted-foreground/60 uppercase font-mono">
            {row.original.lastContactedDate || "NEVER"}
          </div>
        ),
      },
      {
        accessorKey: "followups",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Follow-ups" columnId="followups" isFollowupFilter={true} />,
        filterFn: () => true,
        size: 110,
        cell: ({ row, column }) => {
          const dates = row.original.contacted_dates || [];
          const filterDays = parseInt((column.getFilterValue() as string) || "0", 10);
          
          let applicableDates = dates;
          if (filterDays > 0) {
            const cutoff = new Date(Date.now() - filterDays * 24 * 60 * 60 * 1000);
            applicableDates = dates.filter(d => new Date(d) >= cutoff);
          }
          
          const uniqueDays = new Set(applicableDates.map(d => {
            try { return new Date(d).toISOString().split('T')[0]; } 
            catch { return d; }
          })).size;
          
          let count = 0;
          if (filterDays === 0) {
            count = uniqueDays > 0 ? uniqueDays - 1 : 0;
          } else {
            count = uniqueDays;
          }
    
          if (filterDays === 0 && !dates.length && row.original.followups) {
            count = parseInt(row.original.followups, 10);
          }
          return (
            <div className="px-2 text-[10px] font-black text-primary text-center">
              {count}
            </div>
          );
        },
      },
      {
        accessorKey: "automationComment",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Automation status" icon={AlertCircle} columnId="automationComment" />,
        size: 200,
        cell: ({ row }) => (
          <div className="px-3 text-[10px] font-medium text-muted-foreground italic truncate">
            {row.original.automationComment || "No logs..."}
          </div>
        ),
      },
      {
        accessorKey: "visit",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Visit Log" columnId="visit" />,
        size: 120,
        cell: ({ row, table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EditableTextCell 
              value={row.original.visit} 
              onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { visit: val })}
            />
          </div>
        ),
      },
    
    ]
  },
];
