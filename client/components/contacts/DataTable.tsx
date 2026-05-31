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
import { createPortal } from "react-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Maximize2, Minimize2, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@shared/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableToolbar } from "./DataTableToolbar";
import { ContactDrawer } from "./ContactDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdvancedColorPicker } from "./AdvancedColorPicker";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

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
  onAddContact?: () => void;
  initialFilters?: ColumnFiltersState;
  initialGlobalFilter?: string;
  isExternalTransitioning?: boolean;
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
  onAddContact,
  initialFilters = [],
  initialGlobalFilter = "",
  isExternalTransitioning = false,
}: DataTableProps<TData, TValue>) {
  const [isTransitioning, startTransition] = React.useTransition();
  const isRendering = isTransitioning || isExternalTransitioning;
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => {
    const filters = [...initialFilters];
    try {
      const savedFollowups = localStorage.getItem("casthub-followup-filter");
      if (savedFollowups) {
        if (savedFollowups !== "0" && !filters.find(f => f.id === "followups")) {
          filters.push({ id: "followups", value: savedFollowups });
        }
      } else {
        // Default to 30 days if nothing is saved
        if (!filters.find(f => f.id === "followups")) {
          filters.push({ id: "followups", value: "30" });
        }
      }
    } catch {}
    return filters;
  });

  React.useEffect(() => {
    const followupFilter = columnFilters.find(f => f.id === "followups");
    if (followupFilter) {
      localStorage.setItem("casthub-followup-filter", followupFilter.value as string);
    } else {
      localStorage.setItem("casthub-followup-filter", "0");
    }
  }, [columnFilters]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState(initialGlobalFilter);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [showFilters, setShowFilters] = React.useState(true);
  
  // Drawer state
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

  // Drag-to-fill state
  const [dragFillStart, setDragFillStart] = React.useState<{ rowIdx: number, colId: string, value: any } | null>(null);
  const [dragFillHoverRowIdx, setDragFillHoverRowIdx] = React.useState<number | null>(null);

  // Column Order & Pinning
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    columns.map(c => (c as any).id || (c as any).accessorKey).filter(Boolean)
  );
  
  const defaultColumn = React.useMemo<Partial<ColumnDef<TData, TValue>>>(() => ({
    filterFn: (row: any, columnId: string, filterValue: any) => {
      const value = row.getValue(columnId);
      if (filterValue === "___NULL___") {
        return value === null || value === undefined || String(value).trim() === "";
      }
      const rowValue = String(value ?? "").toLowerCase();
      const searchValue = String(filterValue ?? "").toLowerCase();
      return rowValue.includes(searchValue);
    }
  }), []);

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
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
    enableRowSelection: true,
    getRowId: (row: any) => row.id,
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

  // Reorder Handler (restricted to within groups)
  const handleDragHeader = (columnId: string, targetId: string) => {
    const col1 = table.getColumn(columnId);
    const col2 = table.getColumn(targetId);
    
    // Check if they belong to the same group
    if (!col1 || !col2 || col1.parent?.id !== col2.parent?.id) {
      return;
    }

    const newOrder = [...columnOrder];
    const oldIdx = newOrder.indexOf(columnId);
    const newIdx = newOrder.indexOf(targetId);
    if (oldIdx !== -1 && newIdx !== -1) {
      newOrder.splice(oldIdx, 1);
      newOrder.splice(newIdx, 0, columnId);
      setColumnOrder(newOrder);
    }
  };

  const content = (
    <div className={cn(
      "transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[40] bg-background p-6 lg:p-10 space-y-8 overflow-hidden flex flex-col" : "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700"
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
          onAddContact={onAddContact}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          className="flex-1"
        />
      </div>
      
      <div id="tutorial-grid" className={cn(
        "glass-card rounded-[2.5rem] border-white/10 shadow-2xl relative flex-1 flex flex-col min-h-0 overflow-hidden",
        isFullscreen ? "rounded-none border-none bg-card/50" : ""
      )}>
        <div 
          className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-primary/50 transition-all origin-top-left relative"
          style={{ zoom: `${zoomLevel}%` } as React.CSSProperties}
        >
          {isRendering && (
            <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Rendering Rows...</p>
            </div>
          )}
          <Table className="table-fixed" style={{ width: "max-content", minWidth: Math.max(table.getCenterTotalSize(), 100) }}>
            <TableHeader className="bg-muted/30 border-b border-white/5 sticky top-0 z-30 backdrop-blur-3xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className={cn("hover:bg-transparent border-b-0", headerGroup.depth === 0 ? "h-10" : "h-16")}>
                  {headerGroup.headers.map((header) => {
                    const isGroupHeader = header.subHeaders.length > 0;
                    return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      draggable={!isGroupHeader && !header.isPlaceholder}
                      onDragStart={(e) => {
                        if (!isGroupHeader) e.dataTransfer.setData("colId", header.column.id);
                      }}
                      onDragOver={(e) => {
                        if (!isGroupHeader) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (isGroupHeader) return;
                        const colId = e.dataTransfer.getData("colId");
                        if (colId !== header.column.id) handleDragHeader(colId, header.column.id);
                      }}
                      className={cn(
                        "relative group border-r border-white/5 last:border-r-0",
                        isGroupHeader ? "p-0 border-b border-white/5 align-top" : "px-6 text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] cursor-move active:cursor-grabbing"
                      )}
                      style={{ width: header.getSize(), minWidth: "max-content" }}
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
                  )})}
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
                        "cursor-pointer border-b border-border/20 hover:bg-muted/30 transition-all h-20 group relative border-l-[6px]",
                        row.index % 2 === 0 ? "bg-muted/30" : "bg-transparent",
                        row.getIsSelected() && "!bg-primary/20 border-l-primary shadow-inner"
                      )}
                      style={{ 
                        backgroundColor: isCustom ? `${rColor}1a` : undefined, // Add transparency if hex
                        background: rColor.includes("gradient") ? `${rColor}` : undefined,
                        borderLeftColor: getBorderColor(),
                      }}
                      onClick={() => setSelectedContact(rowOriginal)}
                      onDragOver={(e) => {
                        if (dragFillStart) {
                          e.preventDefault();
                          setDragFillHoverRowIdx(row.index);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const cellId = cell.column.id;
                        const cColor = rowOriginal.cellColors?.[cellId];
                        return (
                          <ContextMenu key={cell.id}>
                            <ContextMenuTrigger asChild>
                              <TableCell className="relative py-2 px-6 group-hover:translate-x-0.5 transition-transform border-r border-border/10 last:border-r-0"
                                style={{
                                  backgroundColor: cColor ? (cColor.includes("gradient") ? undefined : cColor) : undefined,
                                  background: cColor?.includes("gradient") ? cColor : undefined,
                                  minWidth: "max-content"
                                }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                
                                {/* Excel Drag Fill Handle */}
                                {!['select', 'actions'].includes(cellId) && (
                                  <div 
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      const val = (rowOriginal as any)[cellId];
                                      setDragFillStart({ rowIdx: row.index, colId: cellId, value: val });
                                    }}
                                    onDragEnd={() => {
                                      if (dragFillStart && dragFillHoverRowIdx !== null && onUpdateContact) {
                                        const startIdx = Math.min(dragFillStart.rowIdx, dragFillHoverRowIdx);
                                        const endIdx = Math.max(dragFillStart.rowIdx, dragFillHoverRowIdx);
                                        const rowsToUpdate = table.getRowModel().rows.slice(startIdx, endIdx + 1);
                                        rowsToUpdate.forEach(r => {
                                          if (r.index !== dragFillStart.rowIdx) {
                                            const rOrig = r.original as any;
                                            onUpdateContact(rOrig.id, { [dragFillStart.colId]: dragFillStart.value });
                                          }
                                        });
                                      }
                                      setDragFillStart(null);
                                      setDragFillHoverRowIdx(null);
                                    }}
                                    className="absolute bottom-0 right-0 w-2 h-2 bg-primary cursor-crosshair opacity-0 group-hover:opacity-100 hover:scale-150 transition-transform z-10"
                                  />
                                )}

                                {/* Drag Fill Highlight Overlay */}
                                {dragFillStart?.colId === cellId && 
                                 dragFillHoverRowIdx !== null && 
                                 row.index >= Math.min(dragFillStart.rowIdx, dragFillHoverRowIdx) && 
                                 row.index <= Math.max(dragFillStart.rowIdx, dragFillHoverRowIdx) && (
                                    <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed pointer-events-none z-20 animate-pulse" />
                                 )}
                              </TableCell>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="w-[280px] glass-card p-1 rounded-3xl border-white/10 shadow-2xl z-[100]" alignOffset={-50}>
                              <div className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Set Cell Color</div>
                              <div onSelect={(e) => e.preventDefault()} className="outline-none">
                                <AdvancedColorPicker
                                  color={cColor || "transparent"}
                                  onChange={(color) => {
                                    if (onUpdateContact) {
                                      onUpdateContact(rowOriginal.id, {
                                        cellColors: { ...rowOriginal.cellColors, [cellId]: color === "transparent" ? "" : color }
                                      });
                                    }
                                  }}
                                />
                              </div>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
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
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rows</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => startTransition(() => table.setPageSize(Number(value)))}
            >
              <SelectTrigger className="h-10 w-[70px] bg-muted/30 border border-white/10 rounded-xl text-[10px] font-black focus:ring-primary outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10 shadow-2xl rounded-xl z-[150]">
                {[25, 50, 100, 250, 500].map(pageSize => (
                  <SelectItem key={pageSize} value={pageSize.toString()} className="text-[10px] font-black cursor-pointer hover:bg-primary/20">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-10 px-4 sm:px-6 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all disabled:opacity-20 active:scale-95"
              onClick={() => startTransition(() => table.previousPage())}
              disabled={!table.getCanPreviousPage() || isTransitioning}
            >
              PREV
            </button>
            <div className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-xl bg-muted/30 border border-white/5 font-black text-[10px]">
              <span className="text-primary">{table.getState().pagination.pageIndex + 1}</span>
              <span className="opacity-20">/</span>
              <span>{table.getPageCount()}</span>
            </div>
            <button
              className="h-10 px-4 sm:px-6 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all disabled:opacity-20 active:scale-95"
              onClick={() => startTransition(() => table.nextPage())}
              disabled={!table.getCanNextPage() || isTransitioning}
            >
              NEXT
            </button>
          </div>
        </div>
      </div>

      <ContactDrawer 
        contact={selectedContact} 
        open={!!selectedContact} 
        onOpenChange={(open) => !open && setSelectedContact(null)} 
      />
    </div>
  );

  if (isFullscreen) {
    return createPortal(content, document.body);
  }

  return content;
}
