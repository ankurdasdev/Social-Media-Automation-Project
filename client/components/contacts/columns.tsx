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
  Bot,
  Type,
} from "lucide-react";
import { 
  EditableTextCell, 
  MultiTemplateSelect, 
  AttachmentCell, 
  PicklistCell, 
  ConditionalTextareaCell 
} from "./GridCells";
import { cn } from "@/lib/utils";

// ─── Header Component with Popover Filter ────────────────────────────────────

function DataTableColumnHeader({ column, title, icon: Icon }: { column: any; title: string; icon?: any }) {
  if (!column.getCanFilter()) {
    return (
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] py-2 whitespace-nowrap">
        {Icon && <Icon className="w-3 h-3 opacity-50" />}
        {title}
      </div>
    );
  }

  const isFiltered = column.getFilterValue() !== undefined && column.getFilterValue() !== "";

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-primary py-2 px-2 rounded-lg -ml-1 whitespace-nowrap",
            isFiltered ? "text-primary bg-primary/5" : "text-muted-foreground"
          )}>
            {Icon && <Icon className={cn("w-3 h-3", isFiltered ? "opacity-100" : "opacity-50")} />}
            {title}
            <Filter className={cn("w-2.5 h-2.5 ml-1 transition-all", isFiltered ? "opacity-100" : "opacity-0 group-hover:opacity-30")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 glass-card p-4 rounded-[1.5rem] border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter {title}</h4>
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
                placeholder={`Search ${title}...`}
                value={(column.getFilterValue() as string) ?? ""}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className="h-10 pl-10 rounded-xl bg-muted/40 border-white/5 font-bold focus:ring-primary text-sm"
                autoFocus
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
  {
    accessorKey: "automationTrigger",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Automation" icon={Bot} />,
    size: 130,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.automationTrigger}
          onCheckedChange={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { automationTrigger: !!val })}
          className="w-5 h-5 rounded-lg border-primary/30"
        />
      </div>
    ),
  },
  {
    accessorKey: "whatsappRun",
    header: ({ column }) => <DataTableColumnHeader column={column} title="WP Run" icon={MessageCircle} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Run" icon={Mail} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Insta Run" icon={Instagram} />,
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
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Global Status" />,
    size: 130,
    cell: ({ row }) => {
      const status = (row.getValue("status") as string || "pending").toLowerCase();
      return (
        <Badge variant="secondary" className={cn(
          "px-2 py-0.5 rounded-md border-none font-black text-[9px] uppercase tracking-tighter",
          status === "sent" && "bg-emerald-500/10 text-emerald-500",
          status === "pending" && "bg-orange-500/10 text-orange-500",
          status === "failed" && "bg-rose-500/10 text-rose-500",
          status === "in progress" && "bg-blue-500/10 text-blue-500"
        )}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "personalizedNameWA",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pers. Name WA" icon={Type} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pers. Name Gmail" icon={Type} />,
    size: 140,
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
    accessorKey: "notes",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Notes" />,
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Full Name" icon={UserIcon} />,
    size: 180,
    cell: ({ row, table }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <EditableTextCell 
          value={row.original.name} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { name: val })}
          className="font-black"
        />
      </div>
    ),
  },
  {
    accessorKey: "castingName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Casting Identity" icon={Briefcase} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="WA Number" icon={MessageCircle} />,
    size: 150,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Address" icon={Mail} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Insta Profile" icon={Instagram} />,
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
  {
    accessorKey: "visit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Visit Log" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Contacted" />,
    size: 160,
    cell: ({ row }) => (
      <div className="px-2 text-[10px] font-black text-muted-foreground/60 uppercase font-mono">
        {row.original.lastContactedDate || "NEVER"}
      </div>
    ),
  },
  {
    accessorKey: "followups",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Follows" />,
    size: 80,
    cell: ({ row }) => (
      <div className="px-2 text-[10px] font-black text-primary text-center">
        {row.original.followups || "0"}
      </div>
    ),
  },
  {
    accessorKey: "totalDatesContacts",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Dates History" />,
    size: 160,
    cell: ({ row }) => (
      <div className="px-2 text-[9px] font-bold text-muted-foreground/50 truncate uppercase tracking-tighter">
        {row.original.totalDatesContacts || "NO SESSIONS"}
      </div>
    ),
  },
  {
    accessorKey: "actingContext",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acting Context" icon={Layers} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Target Project" icon={Calendar} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age Group" />,
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
  {
    accessorKey: "instagramDone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Insta Done" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Editable Msg WA" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template WP" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template Gmail" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Editable Msg Gmail" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Subject" />,
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
  {
    id: "specialAttachmentWA",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attach WA" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Attach Gmail" />,
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
    accessorKey: "whatsappCompleted",
    header: ({ column }) => <DataTableColumnHeader column={column} title="WP Done" icon={CheckCircle2} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gmail Done" icon={CheckCircle2} />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Bot Intel" icon={AlertCircle} />,
    size: 200,
    cell: ({ row }) => (
      <div className="px-3 text-[10px] font-medium text-muted-foreground italic truncate">
        {row.original.automationComment || "No logs..."}
      </div>
    ),
  },
  {
    accessorKey: "sheetName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source Sheet" />,
    size: 140,
    cell: ({ row }) => (
      <div className="px-3">
         <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-widest bg-muted/40 text-muted-foreground">
            {row.original.sheetName || "EXTERNAL"}
         </Badge>
      </div>
    ),
  },
];
