import { ColumnDef } from "@tanstack/react-table";
import { Contact, DriveFile } from "@shared/api";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Mail,
  Instagram,
  Link as LinkIcon,
  Clock,
  User as UserIcon,
  Briefcase,
  Layers,
  Calendar,
} from "lucide-react";
import { EditableTextCell, MultiTemplateSelect, AttachmentCell } from "./GridCells";

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
          className="border-white/20"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-white/20"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "name",
    header: "Contact Name",
    size: 180,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2 group" onClick={(e) => e.stopPropagation()}>
        <UserIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <EditableTextCell 
          value={row.original.name} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { name: val })}
          placeholder="Contact Name"
        />
      </div>
    ),
  },
  {
    accessorKey: "castingName",
    header: "Casting/Role",
    size: 180,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <EditableTextCell 
          value={row.original.castingName} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { castingName: val })}
          placeholder="Casting Detail"
        />
      </div>
    ),
  },
  {
    accessorKey: "whatsapp",
    header: "WA Number",
    size: 150,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <EditableTextCell 
          value={row.original.whatsapp} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { whatsapp: val })}
          placeholder="+91..."
        />
      </div>
    ),
  },
  {
    accessorKey: "instaHandle",
    header: "Instagram",
    size: 150,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
        <EditableTextCell 
          value={row.original.instaHandle} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { instaHandle: val })}
          placeholder="@username"
        />
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email Address",
    size: 200,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <EditableTextCell 
          value={row.original.email} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { email: val })}
          placeholder="Email"
        />
      </div>
    ),
  },
  {
    header: "WA Templates",
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
    header: "IG Templates",
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
  {
    header: "Mail Templates",
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
    id: "attachments",
    header: "Unified Attachments",
    size: 200,
    cell: ({ row, table }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <AttachmentCell 
          attachments={row.original.unified_attachments || []} 
          onUpdate={(files) => (table.options.meta as any)?.updateContact?.(row.original.id, { unified_attachments: files })}
        />
      </div>
    ),
  },
  {
    accessorKey: "actingContext",
    header: "Context / Profile",
    size: 150,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <EditableTextCell 
          value={row.original.actingContext} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { actingContext: val })}
          placeholder="Context"
        />
      </div>
    ),
  },
  {
    accessorKey: "project",
    header: "Project",
    size: 150,
    cell: ({ row, table }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <EditableTextCell 
          value={row.original.project} 
          onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { project: val })}
          placeholder="Project"
        />
      </div>
    ),
  },
  {
    accessorKey: "age",
    header: "Age Bracket",
    size: 120,
    cell: ({ row, table }) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <EditableTextCell 
            value={row.original.age} 
            onUpdate={(val) => (table.options.meta as any)?.updateContact?.(row.original.id, { age: val })}
            placeholder="Age"
          />
        </div>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ row, table }) => {
      const status = row.getValue("status") as string || "pending";
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Select 
            value={status} 
            onValueChange={(val) => {
              (table.options.meta as any)?.updateContact?.(row.original.id, { status: val });
            }}
          >
            <SelectTrigger className="h-8 border-none hover:bg-muted/50 focus:bg-background transition-all font-bold text-xs">
              <Badge variant="secondary" className={`
                px-2 py-0.5 rounded-lg border-none
                ${status === "sent" ? "bg-emerald-500/10 text-emerald-500" : ""}
                ${status === "pending" ? "bg-orange-500/10 text-orange-500" : ""}
                ${status === "failed" ? "bg-rose-500/10 text-rose-500" : ""}
              `}>
                {status.toUpperCase()}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">PENDING</SelectItem>
              <SelectItem value="sent">SENT</SelectItem>
              <SelectItem value="failed">FAILED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    },
  },
  {
    accessorKey: "sheetName",
    header: "Sheet",
    size: 140,
    cell: ({ row, table }) => {
      const sheet = row.getValue("sheetName") as string || "";
      const uniqueSheets = (table.options.meta as any)?.uniqueSheets || [];
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Select 
            value={sheet} 
            onValueChange={(val) => {
              (table.options.meta as any)?.updateContact?.(row.original.id, { sheetName: val });
            }}
          >
            <SelectTrigger className="h-8 w-full border-none hover:bg-muted/50 focus:bg-background transition-all font-mono text-[11px] uppercase tracking-wider">
              <SelectValue placeholder="UNASSIGNED" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSheets.map((s: string) => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    },
  },
  {
    accessorKey: "whatsappRun",
    header: "RUN WA",
    size: 80,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.whatsappRun}
          onCheckedChange={(val) => {
            (table.options.meta as any)?.updateContact?.(row.original.id, { whatsappRun: !!val });
          }}
          className="border-emerald-500/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
      </div>
    ),
  },
  {
    accessorKey: "instagramRun",
    header: "RUN IG",
    size: 80,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.instagramRun}
          onCheckedChange={(val) => {
            (table.options.meta as any)?.updateContact?.(row.original.id, { instagramRun: !!val });
          }}
          className="border-pink-500/30 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
        />
      </div>
    ),
  },
  {
    accessorKey: "emailRun",
    header: "RUN MAIL",
    size: 80,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.emailRun}
          onCheckedChange={(val) => {
            (table.options.meta as any)?.updateContact?.(row.original.id, { emailRun: !!val });
          }}
          className="border-blue-500/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
        />
      </div>
    ),
  },
];
