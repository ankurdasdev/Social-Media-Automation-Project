import { ColumnDef } from "@tanstack/react-table";
import { Contact } from "@shared/api";
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
} from "lucide-react";

export const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
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
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
    minSize: 40,
  },
  {
    id: "talent",
    accessorFn: (row) => `${row.name} ${row.castingName}`,
    header: "Name & Casting",
    size: 200,
    minSize: 150,
    cell: ({ row }) => {
      const isAutoIngested = row.original.rowColor === "yellow";
      const sourceBadge = row.original.source === "auto-whatsapp" ? "WA" : 
                         row.original.source === "auto-instagram" ? "IG" : null;

      return (
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate max-w-[150px]">{row.original.name || "Unknown"}</span>
            {sourceBadge && (
               <Badge variant="outline" className={`text-[10px] h-4 px-1 ${sourceBadge === "WA" ? 'border-green-500 text-green-600' : 'border-pink-500 text-pink-600'}`}>
                 {sourceBadge}
               </Badge>
            )}
            {isAutoIngested && <span className="w-2 h-2 rounded-full bg-yellow-400" title="New auto-ingested lead" />}
          </div>
          {row.original.castingName && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[150px] leading-tight">
              {row.original.castingName}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "whatsapp",
    header: "Whatsapp Number",
    size: 140,
    minSize: 100,
    cell: ({ row }) => (
      <span className="text-sm truncate block">{row.getValue("whatsapp") || "—"}</span>
    ),
  },
  {
    accessorKey: "instaHandle",
    header: "Instagram",
    size: 140,
    minSize: 100,
    cell: ({ row }) => (
      <span className="text-sm truncate block">{row.getValue("instaHandle") || "—"}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 180,
    minSize: 100,
    cell: ({ row }) => (
      <span className="text-sm truncate block">{row.getValue("email") || "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 110,
    minSize: 90,
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
            <SelectTrigger className="h-7 w-[90px] px-2 text-xs border-transparent hover:border-slate-200">
              <Badge variant="secondary" className={`
                ${status === "sent" ? "bg-green-100 text-green-800" : ""}
                ${status === "pending" ? "bg-slate-100 text-slate-800" : ""}
                ${status === "failed" ? "bg-red-100 text-red-800" : ""}
              `}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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
    minSize: 100,
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
            <SelectTrigger className="h-7 w-full text-xs font-mono bg-transparent border-transparent hover:border-slate-200 truncate">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSheets.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    },
  },
  {
    accessorKey: "whatsappRun",
    header: "WA Run",
    size: 80,
    minSize: 60,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.whatsappRun}
          onCheckedChange={(val) => {
            (table.options.meta as any)?.updateContact?.(row.original.id, { whatsappRun: !!val });
          }}
        />
      </div>
    ),
  },
  {
    accessorKey: "instagramRun",
    header: "IG Run",
    size: 80,
    minSize: 60,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.instagramRun}
          onCheckedChange={(val) => {
            (table.options.meta as any)?.updateContact?.(row.original.id, { instagramRun: !!val });
          }}
        />
      </div>
    ),
  },
  {
    accessorKey: "emailRun",
    header: "Mail Run",
    size: 80,
    minSize: 60,
    cell: ({ row, table }) => (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={!!row.original.emailRun}
          onCheckedChange={(val) => {
            (table.options.meta as any)?.updateContact?.(row.original.id, { emailRun: !!val });
          }}
        />
      </div>
    ),
  },
  {
    id: "contactDetails",
    header: "Contact Links",
    size: 120,
    minSize: 100,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {c.whatsapp && c.whatsapp !== "-" && c.whatsapp.trim() !== "" ? (
            <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-green-600 transition-colors" title={`WhatsApp: ${c.whatsapp}`}>
              <MessageCircle className="h-4 w-4" />
            </a>
          ) : <MessageCircle className="h-4 w-4 opacity-20" />}
          
          {c.email && c.email !== "-" && c.email.trim() !== "" ? (
            <a href={`mailto:${c.email}`} className="text-muted-foreground hover:text-blue-600 transition-colors" title={`Email: ${c.email}`}>
              <Mail className="h-4 w-4" />
            </a>
          ) : <Mail className="h-4 w-4 opacity-20" />}
          
          {c.instaHandle && c.instaHandle !== "-" && c.instaHandle.trim() !== "" ? (
            <a href={`https://instagram.com/${c.instaHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-pink-600 transition-colors" title={`Instagram: ${c.instaHandle}`}>
              <Instagram className="h-4 w-4" />
            </a>
          ) : <Instagram className="h-4 w-4 opacity-20" />}

          {c.visit && c.visit !== "-" && c.visit.trim() !== "No" && c.visit.trim() !== "Pending" ? (
            <a href={c.visit.startsWith('http') ? c.visit : `https://${c.visit}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title={`Portfolio/Visit: ${c.visit}`}>
              <LinkIcon className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "trackingFlags",
    header: "Tracking",
    size: 160,
    minSize: 120,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
          <span>Followups: <b>{c.followups || "0"}</b></span>
          {c.lastContactedDate && (
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3 opacity-70" />
              <span>Last Contacted: <b>{c.lastContactedDate}</b></span>
            </div>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "automationComment",
    header: "Automation Comment",
    size: 200,
    minSize: 150,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate block max-w-[180px]">
        {row.getValue("automationComment") || "—"}
      </span>
    ),
  },
];
