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
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@shared/api";
import { DataTableToolbar } from "./DataTableToolbar";
import { ContactDrawer } from "./ContactDrawer";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onTriggerAction?: (contactIds: string[]) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onBulkAction?: (action: string, contactIds: string[], payload?: any) => void;
  onAddSheet?: (sheetName: string) => void;
  onDeleteSheet?: (sheetName: string) => void;
  onUpdateContact?: (id: string, data: Partial<Contact>) => void;
  uniqueSheets?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onTriggerAction,
  onRefresh,
  isRefreshing,
  onBulkAction,
  onAddSheet,
  onDeleteSheet,
  onUpdateContact,
  uniqueSheets = [],
  activeTab,
  onTabChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  
  // Drawer state
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

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
    state: {
      rowSelection,
      columnFilters,
      sorting,
      globalFilter,
    },
    // Enable column resizing
    columnResizeMode: "onChange",
    // We want a bigger page size for Excel-like feel
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
    meta: {
      updateContact: onUpdateContact,
      uniqueSheets: uniqueSheets,
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <DataTableToolbar 
        table={table} 
        onTriggerAction={onTriggerAction} 
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onBulkAction={onBulkAction}
        onAddSheet={onAddSheet}
        onDeleteSheet={onDeleteSheet}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      
      <div className="glass-card rounded-[2.5rem] border-white/10 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <Table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}>
            <TableHeader className="bg-muted/30 border-b border-white/5 sticky top-0 z-10 backdrop-blur-3xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-0 h-16">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        className="px-6 text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] relative group border-r border-white/5 last:border-r-0"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        
                        {/* Resizer Handle */}
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize user-select-none touch-action-none bg-primary opacity-0 group-hover:opacity-100 hover:scale-x-150 transition-all z-10 ${
                            header.column.getIsResizing() ? "bg-primary opacity-100 w-1" : ""
                          }`}
                        />
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-muted/10">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const rowOriginal = row.original as unknown as Contact;
                  const rColor = rowOriginal.rowColor;
                  const colorClass = rColor === "yellow" ? "bg-yellow-500/10 border-l-4 border-l-yellow-400" :
                                   rColor === "green" ? "bg-emerald-500/10 border-l-4 border-l-emerald-400" :
                                   rColor === "red" ? "bg-rose-500/10 border-l-4 border-l-rose-400" :
                                   rColor === "blue" ? "bg-blue-500/10 border-l-4 border-l-blue-400" : "border-l-4 border-l-transparent";

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "cursor-pointer border-b border-white/[0.03] hover:bg-white/[0.03] transition-all h-20 group relative",
                        colorClass,
                        row.getIsSelected() && "bg-primary/5 border-l-primary"
                      )}
                      onClick={() => setSelectedContact(rowOriginal)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4 px-6 group-hover:translate-x-0.5 transition-transform">
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
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-8 bg-muted/20 border border-white/5 rounded-[2rem] shadow-xl">
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
