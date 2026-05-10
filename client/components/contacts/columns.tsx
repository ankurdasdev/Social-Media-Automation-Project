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
} from "./GridCells";
import { cn } from "@/lib/utils";
import * as React from "react";

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
}: { 
  column: any; 
  title: string; 
  icon?: any;
  columnId?: string;
  disableRename?: boolean;
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground opacity-50" />
              <Input
                placeholder={`Search ${displayTitle}...`}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-10 pl-10 rounded-xl bg-muted/40 border-white/5 font-bold focus:ring-primary text-sm"
                autoFocus
              />
            </div>
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
          className="border-white/20 data-[state=checked]:bg-primary"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-white/20 data-[state=checked]:bg-primary"
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
  // ── Run Flags ───────────────────────────────────────────────────────────────
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Insta Run" icon={Instagram} columnId="instagramRun" />,
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

  // ── Combined Outreach Status ────────────────────────────────────────────────
  {
    id: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" columnId="status" disableRename={true} />,
    accessorFn: (row) => {
      const wa = (row.whatsappCompleted || "").toLowerCase();
      const em = (row.emailCompleted || "").toLowerCase();
      const ig = (row.instagramCompleted || "").toLowerCase();
      const statuses = [wa, em, ig];
      if (statuses.some(s => s === "yes" || s === "sent")) return "SENT";
      if (statuses.some(s => s === "failed" || s === "error")) return "FAILED";
      if (statuses.some(s => s === "in progress")) return "BUSY";
      return "PENDING";
    },
    size: 200,
    cell: ({ row }) => {
      const contact = row.original;
      
      const getStatusColor = (val: string | undefined) => {
        const s = (val || "").toLowerCase();
        if (s === "yes" || s === "sent") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        if (s === "failed" || s === "error") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        if (s === "in progress") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        return "bg-slate-500/10 text-slate-400 border-slate-500/10";
      };

      const getStatusLabel = (val: string | undefined) => {
        const s = (val || "").toLowerCase();
        if (s === "yes" || s === "sent") return "SENT";
        if (s === "failed" || s === "error") return "FAILED";
        if (s === "in progress") return "BUSY";
        return "PENDING";
      };

      return (
        <div className="flex flex-col gap-1.5 py-1">
          {/* WhatsApp Status */}
          <div className="flex items-center gap-2 group/st">
            <MessageCircle className="w-3 h-3 text-emerald-500/50 group-hover/st:text-emerald-500 transition-colors" />
            <Badge variant="outline" className={cn(
              "px-1.5 py-0 rounded-md font-black text-[8px] uppercase tracking-tighter border",
              getStatusColor(contact.whatsappCompleted)
            )}>
              {getStatusLabel(contact.whatsappCompleted)}
            </Badge>
          </div>
          
          {/* Gmail Status */}
          <div className="flex items-center gap-2 group/st">
            <Mail className="w-3 h-3 text-blue-500/50 group-hover/st:text-blue-500 transition-colors" />
            <Badge variant="outline" className={cn(
              "px-1.5 py-0 rounded-md font-black text-[8px] uppercase tracking-tighter border",
              getStatusColor(contact.emailCompleted)
            )}>
              {getStatusLabel(contact.emailCompleted)}
            </Badge>
          </div>

          {/* Instagram Status */}
          <div className="flex items-center gap-2 group/st">
            <Instagram className="w-3 h-3 text-pink-500/50 group-hover/st:text-pink-500 transition-colors" />
            <Badge variant="outline" className={cn(
              "px-1.5 py-0 rounded-md font-black text-[8px] uppercase tracking-tighter border",
              getStatusColor(contact.instagramCompleted)
            )}>
              {getStatusLabel(contact.instagramCompleted)}
            </Badge>
          </div>
        </div>
      );
    },
  },
  // ── Personalized Names ───────────────────────────────────────────────────────
  {
    accessorKey: "personalizedNameWA",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pers. Name WA" icon={Type} columnId="personalizedNameWA" />,
    size: 140,
    cell: ({ row, table }) => (
       <div onClick={(e) => e.stopPropagation()}>
          <PicklistCell 
            value={row.original.personalizedNameWA}
            onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { personalizedNameWA: val })}
          />
       </div>
    ),
  },
  {
    accessorKey: "personalizedNameGmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pers. Name Gmail" icon={Type} columnId="personalizedNameGmail" />,
    size: 145,
    cell: ({ row, table }) => (
       <div onClick={(e) => e.stopPropagation()}>
          <PicklistCell 
            value={row.original.personalizedNameGmail}
            onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { personalizedNameGmail: val })}
          />
       </div>
    ),
  },
  {
    accessorKey: "personalizedNameIG",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pers. Name IG" icon={Type} columnId="personalizedNameIG" />,
    size: 140,
    cell: ({ row, table }) => (
       <div onClick={(e) => e.stopPropagation()}>
          <PicklistCell 
            value={row.original.personalizedNameIG || "N"}
            onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { personalizedNameIG: val })}
          />
       </div>
    ),
  },
  // ── Notes ────────────────────────────────────────────────────────────────────
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
  // ── Contact Info ─────────────────────────────────────────────────────────────
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Full Name" icon={UserIcon} columnId="name" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Casting Identity" icon={Briefcase} columnId="castingName" />,
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
        />
      </div>
    ),
  },
  {
    accessorKey: "instaHandle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Insta Profile" icon={Instagram} columnId="instaHandle" />,
    size: 150,
    cell: ({ row, table }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <EditableTextCell 
          value={row.original.instaHandle} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { instaHandle: val })}
          placeholder="@handle"
        />
      </div>
    ),
  },
  // ── Tracking (Read-Only) ─────────────────────────────────────────────────────
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Follow-ups" columnId="followups" />,
    size: 90,
    cell: ({ row }) => (
      <div className="px-2 text-[10px] font-black text-primary text-center">
        {row.original.followups || "0"}
      </div>
    ),
  },
  {
    accessorKey: "totalDatesContacts",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dates History" columnId="totalDatesContacts" />,
    size: 180,
    cell: ({ row }) => (
      <div className="px-2 text-[9px] font-bold text-muted-foreground/50 truncate uppercase tracking-tighter">
        {row.original.totalDatesContacts || "NO SESSIONS"}
      </div>
    ),
  },
  // ── Context ──────────────────────────────────────────────────────────────────
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Target Project" icon={Calendar} columnId="project" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age Group" columnId="age" />,
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
  // ── Outreach Controls ────────────────────────────────────────────────────────
  {
    accessorKey: "instagramDone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Insta Done" columnId="instagramDone" />,
    size: 110,
    cell: ({ row }) => (
      <div className="px-2">
        <Badge variant="outline" className={cn(
          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0",
          row.original.instagramDone === "Yes" ? "border-pink-500 text-pink-500" : "opacity-30"
        )}>
          {row.original.instagramDone || "NO"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "hasCustomMessageWA",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Editable Msg WA" columnId="hasCustomMessageWA" />,
    size: 220,
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
    accessorKey: "templateSelectionWP",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template WP" columnId="templateSelectionWP" />,
    size: 200,
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
    accessorKey: "templateSelectionGmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template Gmail" columnId="templateSelectionGmail" />,
    size: 200,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Editable Msg Gmail" columnId="hasCustomMessageEmail" />,
    size: 220,
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
    accessorKey: "editableGmailSubject",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Subject" columnId="editableGmailSubject" />,
    size: 200,
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
  // ── Instagram Editable Message ─────────────────────────────────────────────
  {
    accessorKey: "hasCustomMessageIG",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Editable Msg IG" columnId="hasCustomMessageIG" />,
    size: 220,
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
    accessorKey: "templateSelectionIG",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template IG" columnId="templateSelectionIG" />,
    size: 200,
    cell: ({ row, table }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <MultiTemplateSelect 
          selectedIds={row.original.templateSelectionIG || []} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { templateSelectionIG: val })}
        />
      </div>
    ),
  },
  // ── Attachments ──────────────────────────────────────────────────────────────
  {
    id: "specialAttachmentWA",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attach WA" columnId="specialAttachmentWA" />,
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
  {
    id: "specialAttachmentGmail",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attach Gmail" columnId="specialAttachmentGmail" />,
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
  {
    id: "specialAttachmentIG",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attach IG" columnId="specialAttachmentIG" />,
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
  // ── Completion Status ────────────────────────────────────────────────────────
  {
    accessorKey: "whatsappCompleted",
    header: ({ column }) => <DataTableColumnHeader column={column} title="WP Done" icon={CheckCircle2} columnId="whatsappCompleted" />,
    size: 110,
    cell: ({ row }) => (
      <div className="px-2">
        <Badge variant="outline" className={cn(
          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0",
          row.original.whatsappCompleted === "Yes" ? "border-emerald-500 text-emerald-500" : "opacity-30"
        )}>
          {row.original.whatsappCompleted || "NO"}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "emailCompleted",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Done" icon={CheckCircle2} columnId="emailCompleted" />,
    size: 110,
    cell: ({ row }) => (
      <div className="px-2">
        <Badge variant="outline" className={cn(
          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0",
          row.original.emailCompleted === "Yes" ? "border-blue-500 text-blue-500" : "opacity-30"
        )}>
          {row.original.emailCompleted || "NO"}
        </Badge>
      </div>
    ),
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
  // ── Sheet Assignment ─────────────────────────────────────────────────────────
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
];
