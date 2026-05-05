import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Maximize2, Minimize2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@shared/api";
import { DataTableToolbar } from "./DataTableToolbar";
import { ContactDrawer } from "./ContactDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onTriggerAction?: (contactIds: string[]) => void;
  onBulkAction?: (action: string, contactIds: string[], payload?: any) => void;
  onAddSheet?: (sheetName: string) => void;
  onDeleteSheet?: (sheetName: string) => void;
  onUpdateContact?: (id: string, data: Partial<Contact>) => void;
  uniqueSheets?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAISearch?: (prompt: string) => void;
  isAISearching?: boolean;
  onClearAISearch?: () => void;
  initialFilters?: ColumnFiltersState;
  initialGlobalFilter?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onTriggerAction,
  onBulkAction,
  onAddSheet,
  onDeleteSheet,
  onUpdateContact,
  uniqueSheets = [],
  activeTab,
  onTabChange,
  onAISearch,
  isAISearching,
  onClearAISearch,
  initialFilters = [],
  initialGlobalFilter = "",
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialFilters);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState(initialGlobalFilter);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(true);
  
  // Drawer state
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

  // Column Order & Pinning
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    columns.map(c => (c as any).id || (c as any).accessorKey).filter(Boolean)
  );
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    state: {
      rowSelection,
      columnFilters,
      sorting,
      globalFilter,
      columnOrder,
    },
    // Enable column resizing
    columnResizeMode: "onChange",
    // We want a bigger page size for Excel-like feel
    initialState: {
      pagination: {
        pageSize: 25,
      },
      columnVisibility: {
        whatsappCompleted: false,
        emailCompleted: false,
        instagramCompleted: false,
      },
    },
    meta: {
      updateContact: onUpdateContact,
      uniqueSheets: uniqueSheets,
    },
  });

  // Reorder Handler (Basic drag simulation support)
  const handleDragHeader = (columnId: string, targetId: string) => {
    const newOrder = [...columnOrder];
    const oldIdx = newOrder.indexOf(columnId);
    const newIdx = newOrder.indexOf(targetId);
    if (oldIdx !== -1 && newIdx !== -1) {
      newOrder.splice(oldIdx, 1);
      newOrder.splice(newIdx, 0, columnId);
      setColumnOrder(newOrder);
    }
  };

  return (
    <div className={cn(
      "space-y-6 transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[50] bg-background p-6 lg:p-10 space-y-8 overflow-hidden flex flex-col" : "animate-in fade-in slide-in-from-bottom-2 duration-700"
    )}>
      <div className="flex items-center justify-between gap-4">
        <DataTableToolbar 
          table={table} 
          onTriggerAction={onTriggerAction} 
          onBulkAction={onBulkAction}
          onAddSheet={onAddSheet}
          onDeleteSheet={onDeleteSheet}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onAISearch={onAISearch}
          isAISearching={isAISearching}
          onClearAISearch={onClearAISearch}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          className="flex-1"
        />
      </div>
      
      <div className={cn(
        "glass-card rounded-[2.5rem] border-white/10 shadow-2xl relative flex-1 flex flex-col min-h-0 overflow-hidden",
        isFullscreen ? "rounded-none border-none bg-card/50" : ""
      )}>
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-primary/50 transition-all">
          <Table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}>
            <TableHeader className="bg-muted/30 border-b border-white/5 sticky top-0 z-30 backdrop-blur-3xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-0 h-16">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("colId", header.column.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const colId = e.dataTransfer.getData("colId");
                        if (colId !== header.column.id) handleDragHeader(colId, header.column.id);
                      }}
                      className="px-6 text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] relative group border-r border-white/5 last:border-r-0 cursor-move active:cursor-grabbing"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize user-select-none touch-action-none bg-primary opacity-0 group-hover:opacity-100 hover:scale-x-150 transition-all z-40 ${
                          header.column.getIsResizing() ? "bg-primary opacity-100 w-1" : ""
                        }`}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-muted/10">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const rowOriginal = row.original as unknown as Contact;
                  const rColor = rowOriginal.rowColor || "transparent";
                  const isCustom = rColor.startsWith("#") || rColor.includes("gradient");
                  
                  // Helper to get border color from hex or gradient
                  const getBorderColor = () => {
                    if (rColor === "yellow") return "#f59e0b";
                    if (rColor === "green") return "#10b981";
                    if (rColor === "red") return "#ef4444";
                    if (rColor === "blue") return "#3b82f6";
                    if (isCustom) return rColor.includes("gradient") ? "#8b5cf6" : rColor;
                    return "transparent";
                  };

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "cursor-pointer border-b border-white/[0.03] hover:bg-white/[0.03] transition-all h-20 group relative border-l-[6px]",
                        row.getIsSelected() && "bg-primary/20 border-l-primary shadow-inner"
                      )}
                      style={{ 
                        backgroundColor: isCustom ? `${rColor}1a` : undefined, // Add transparency if hex
                        background: rColor.includes("gradient") ? `${rColor}` : undefined,
                        borderLeftColor: getBorderColor(),
                      }}
                      onClick={() => setSelectedContact(rowOriginal)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2 px-6 group-hover:translate-x-0.5 transition-transform">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-30 group">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">No Records Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-8 bg-muted/20 border border-white/5 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
           </div>
           <div className="flex-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
             <span className="text-foreground">{table.getFilteredSelectedRowModel().rows.length}</span> selected :: <span className="text-foreground">{table.getFilteredRowModel().rows.length}</span> total contacts
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            className="h-12 px-6 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all disabled:opacity-20 active:scale-95"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            PREVIOUS
          </button>
          <div className="flex items-center gap-2 px-4 h-12 rounded-xl bg-muted/30 border border-white/5 font-black text-[10px]">
            <span className="text-primary">{table.getState().pagination.pageIndex + 1}</span>
            <span className="opacity-20">/</span>
            <span>{table.getPageCount()}</span>
          </div>
          <button
            className="h-12 px-6 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all disabled:opacity-20 active:scale-95"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            NEXT
          </button>
        </div>
      </div>

      <ContactDrawer 
        contact={selectedContact} 
        open={!!selectedContact} 
        onOpenChange={(open) => !open && setSelectedContact(null)} 
      />
    </div>
  );
}
