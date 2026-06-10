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

// ─── Module-level helpers (never recreated during render) ─────────────────────
function getBorderColor(rColor: string): string {
  if (rColor === "yellow") return "#f59e0b";
  if (rColor === "green") return "#10b981";
  if (rColor === "red") return "#ef4444";
  if (rColor === "blue") return "#3b82f6";
  if (rColor.startsWith("#") || rColor.includes("gradient")) {
    return rColor.includes("gradient") ? "#8b5cf6" : rColor;
  }
  return "transparent";
}

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
import { columns as defaultColumns, GroupHeader } from "./columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdvancedColorPicker } from "./AdvancedColorPicker";


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

// ─── Drag Fill State (Decoupled from React State for Performance) ──────
const dragFillState = {
  startIdx: null as number | null,
  hoverIdx: null as number | null,
  colId: null as string | null,
  value: null as any,
};

function updateDragFillHighlights() {
  document.querySelectorAll('.drag-fill-highlight').forEach(el => el.remove());
  if (dragFillState.startIdx === null || dragFillState.hoverIdx === null || !dragFillState.colId) return;
  
  const min = Math.min(dragFillState.startIdx, dragFillState.hoverIdx);
  const max = Math.max(dragFillState.startIdx, dragFillState.hoverIdx);
  
  for (let i = min; i <= max; i++) {
    const cellEl = document.getElementById(`cell-${i}-${dragFillState.colId}`);
    if (cellEl) {
       const highlight = document.createElement('div');
       highlight.className = 'drag-fill-highlight absolute inset-0 bg-primary/20 border-2 border-primary border-dashed pointer-events-none z-20 animate-pulse';
       cellEl.appendChild(highlight);
    }
  }
}

// ─── Memoized Components ───────────────────────────────────────────────

const MemoizedTableCell = React.memo(({
  cell,
  rowOriginal,
  cellId,
  cColor,
  rowIndex,
  colSize,
  isPinned,
  isLastPinned,
  isSelected,
  onContextMenu,
  onDragFillComplete
}: any) => {
  return (
    <TableCell
      id={`cell-${rowIndex}-${cellId}`}
      className={cn(
        "relative py-2 px-6 border-r border-border/10 last:border-r-0",
        isPinned && "sticky z-[15] bg-background shadow-[2px_0_10px_-3px_rgba(0,0,0,0.3)]",
        isPinned && isLastPinned && "border-r-[3px] border-r-border/50"
      )}
      style={{
        backgroundColor: cColor ? (cColor.includes("gradient") ? undefined : cColor) : undefined,
        background: cColor?.includes("gradient") ? cColor : undefined,
        minWidth: "max-content",
        left: isPinned ? `${cell.column.getStart("left")}px` : undefined,
      }}
      onContextMenu={(e) => {
        if (['select', 'actions'].includes(cellId)) return;
        e.preventDefault();
        onContextMenu(e, rowOriginal, cellId, cColor);
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}

      {/* Excel Drag Fill Handle */}
      {!['select', 'actions'].includes(cellId) && (
        <div 
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            dragFillState.startIdx = rowIndex;
            dragFillState.hoverIdx = rowIndex;
            dragFillState.colId = cellId;
            dragFillState.value = rowOriginal[cellId];
            updateDragFillHighlights();
          }}
          onDragEnd={() => {
            onDragFillComplete(
              dragFillState.startIdx, 
              dragFillState.hoverIdx, 
              dragFillState.colId, 
              dragFillState.value
            );
            dragFillState.startIdx = null;
            dragFillState.hoverIdx = null;
            dragFillState.colId = null;
            dragFillState.value = null;
            updateDragFillHighlights();
          }}
          className="absolute bottom-0 right-0 w-2 h-2 bg-primary cursor-crosshair opacity-0 group-hover:opacity-100 hover:scale-150 transition-transform z-10"
        />
      )}
    </TableCell>
  );
}, (prev, next) => {
  if (prev.rowOriginal !== next.rowOriginal) return false;
  if (prev.cColor !== next.cColor) return false;
  if (prev.rowIndex !== next.rowIndex) return false;
  if (prev.colSize !== next.colSize) return false;
  if (prev.isPinned !== next.isPinned) return false;
  if (prev.isSelected !== next.isSelected) return false;
  return true;
});

const MemoizedTableRow = React.memo(({
  row,
  rowOriginal,
  isSelected,
  rColor,
  isCustom,
  columnsFingerprint,
  setSelectedContact,
  onContextMenu,
  onDragFillComplete
}: any) => {
  return (
    <TableRow
      data-state={isSelected && "selected"}
      className={cn(
        "cursor-pointer border-b border-border/20 h-20 group relative border-l-[6px]",
        "table-row-smooth",
        "hover:bg-muted/25",
        row.index % 2 === 0 ? "bg-muted/20" : "bg-transparent",
        isSelected && "!bg-primary/20 border-l-primary"
      )}
      style={{ 
        backgroundColor: isCustom ? `${rColor}1a` : undefined,
        background: rColor.includes("gradient") ? rColor : undefined,
        borderLeftColor: getBorderColor(rColor),
      }}
      onClick={() => setSelectedContact(rowOriginal)}
      onDragOver={(e) => {
        if (dragFillState.startIdx !== null) {
          e.preventDefault();
          if (dragFillState.hoverIdx !== row.index) {
            dragFillState.hoverIdx = row.index;
            updateDragFillHighlights();
          }
        }
      }}
    >
      {row.getVisibleCells().map((cell: any) => {
        const cellId = cell.column.id;
        const cColor = rowOriginal.cellColors?.[cellId];
        return (
          <MemoizedTableCell
            key={cell.id}
            cell={cell}
            rowOriginal={rowOriginal}
            cellId={cellId}
            cColor={cColor}
            rowIndex={row.index}
            colSize={cell.column.getSize()}
            isPinned={cell.column.getIsPinned() === "left"}
            isLastPinned={cell.column.getIsLastColumn("left")}
            isSelected={isSelected}
            onContextMenu={onContextMenu}
            onDragFillComplete={onDragFillComplete}
          />
        );
      })}
    </TableRow>
  );
}, (prev, next) => {
  if (prev.rowOriginal !== next.rowOriginal) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.columnsFingerprint !== next.columnsFingerprint) return false;
  if (prev.row.index !== next.row.index) return false;
  if (prev.rColor !== next.rColor) return false;
  if (prev.isCustom !== next.isCustom) return false;
  return true;
});

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
  const isRendering = isExternalTransitioning;
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("casthub-column-order");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [columnGroupConfig, setColumnGroupConfig] = React.useState<any[] | null>(() => {
    try {
      const saved = localStorage.getItem("casthub-column-groups");
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("casthub-column-groups");
        if (saved) setColumnGroupConfig(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("casthub-groups-changed", handleUpdate);
    return () => window.removeEventListener("casthub-groups-changed", handleUpdate);
  }, []);

  const activeColumns = React.useMemo(() => {
    if (!columnGroupConfig) return defaultColumns;

    const flatCols: Record<string, any> = {};
    const extract = (cols: any[]) => {
      cols.forEach(c => {
        if (c.columns) extract(c.columns);
        else flatCols[c.id || c.accessorKey] = c;
      });
    };
    extract(defaultColumns);

    const newColumns: any[] = [];
    
    // Top-level ones to preserve
    ["select", "index", "whatsappCompleted", "emailCompleted", "instagramCompleted"].forEach(id => {
      if (flatCols[id]) newColumns.push(flatCols[id]);
    });

    columnGroupConfig.forEach(g => {
      const gCols = g.columns.map((id: string) => flatCols[id]).filter(Boolean);
      if (gCols.length > 0) {
        newColumns.push({
          id: g.id,
          header: () => <GroupHeader id={g.id} defaultTitle={g.title} defaultColor={g.color} />,
          columns: gCols
        });
      }
    });

    return newColumns;
  }, [columnGroupConfig]);

  const [isTitleFrozen, setIsTitleFrozen] = React.useState(() => {
    try {
      return localStorage.getItem("casthub-title-frozen") !== "false";
    } catch {
      return true;
    }
  });
  
  React.useEffect(() => {
    localStorage.setItem("casthub-title-frozen", String(isTitleFrozen));
  }, [isTitleFrozen]);

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
  const [isFullscreenAnimating, setIsFullscreenAnimating] = React.useState(false);

  // iPhone-principle: respond to toggle INSTANTLY, animate visually
  const handleToggleFullscreen = React.useCallback(() => {
    setIsFullscreenAnimating(true);
    setIsFullscreen(prev => !prev);
    // Clear animation class after it completes
    setTimeout(() => setIsFullscreenAnimating(false), 250);
  }, []);

  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [showFilters, setShowFilters] = React.useState(true);
  
  // Drawer state
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);

  // Shared context menu state (one floating menu for ALL cells instead of 750 instances)
  const [ctxMenu, setCtxMenu] = React.useState<{ x: number; y: number; contactId: string; cellId: string; currentColor: string; contact: any } | null>(null);
  const ctxMenuRef = React.useRef<HTMLDivElement>(null);

  // Close the shared context menu on outside click
  React.useEffect(() => {
    if (!ctxMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) {
        setCtxMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMenu]);
  // Pinning is handled separately
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
    columns: activeColumns,
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
      columnPinning: { left: ["select"] },
    },
    enableRowSelection: true,
    enablePinning: true,
    getRowId: (row: any) => row.id,
    // Enable column resizing
    columnResizeMode: "onChange",
    // We want a bigger page size for Excel-like feel
    initialState: {
      pagination: {
        pageSize: 50,
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

  React.useEffect(() => {
    if (!isFullscreen && table.getState().pagination.pageSize !== 50) {
      table.setPageSize(50);
    }
  }, [isFullscreen]);

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

  const columnsFingerprint = React.useMemo(() => 
    table.getVisibleFlatColumns().map(c => `${c.id}:${c.getSize()}`).join(','),
  [table.getState().columnVisibility, table.getState().columnOrder, table.getState().columnSizing]);

  const handleContextMenu = React.useCallback((e: MouseEvent, contact: any, cellId: string, currentColor: string) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, contactId: contact.id, cellId, currentColor, contact });
  }, []);

  const handleDragFillComplete = React.useCallback((startIdx: number | null, hoverIdx: number | null, colId: string | null, value: any) => {
    if (startIdx !== null && hoverIdx !== null && colId && onUpdateContact) {
      const min = Math.min(startIdx, hoverIdx);
      const max = Math.max(startIdx, hoverIdx);
      const rowsToUpdate = table.getRowModel().rows.slice(min, max + 1);
      rowsToUpdate.forEach(r => {
        if (r.index !== startIdx) {
          const rOrig = r.original as any;
          onUpdateContact(rOrig.id, { [colId]: value });
        }
      });
    }
  }, [table, onUpdateContact]);

  const content = (
    <div className={cn(
      isFullscreenAnimating && (isFullscreen ? "fullscreen-enter" : "fullscreen-exit"),
      isFullscreen
        ? "fixed inset-0 z-[40] bg-background p-6 lg:p-10 space-y-6 h-screen flex flex-col overflow-hidden"
        : "space-y-6"
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
          onToggleFullscreen={handleToggleFullscreen}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          isTitleFrozen={isTitleFrozen}
          onToggleTitleFreeze={setIsTitleFrozen}
          className="flex-1"
        />
      </div>
      
      <div id="tutorial-grid" className={cn(
        "rounded-[2.5rem] border border-border/20 dark:border-white/10 shadow-2xl relative flex flex-col overflow-hidden",
        isFullscreen ? "rounded-none border-none bg-card/50 flex-1 min-h-0" : "h-[450px]"
      )}>
        <div 
          className="table-scroll smooth-scroll overflow-auto flex-1 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-primary/50 origin-top-left relative"
          style={{ zoom: `${zoomLevel}%` } as React.CSSProperties}
        >
          <Table wrapperClassName="overflow-visible" className="table-fixed" style={{ width: "max-content", minWidth: Math.max(table.getCenterTotalSize(), 100) }}>
            <TableHeader className={cn("border-b border-white/5 backdrop-blur-3xl", isTitleFrozen ? "sticky top-0 z-30 bg-background/95" : "bg-muted/30")}>
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
                        "group border-r border-white/5 last:border-r-0 backdrop-blur-3xl",
                        isGroupHeader ? "p-0 border-b border-white/5 align-top" : "px-6 text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] cursor-move active:cursor-grabbing",
                        isTitleFrozen && "sticky top-0 z-30 bg-background/95 shadow-sm",
                        header.column.getIsPinned() === "left" && "sticky left-0 z-[35] bg-card/95"
                      )}
                      style={{ 
                        width: header.getSize(), 
                        minWidth: "max-content",
                        left: header.column.getIsPinned() === "left" ? `${header.column.getStart("left")}px` : undefined,
                        top: isTitleFrozen ? (headerGroup.depth === 0 ? 0 : 40) : undefined // Ensure sub-headers stick below group headers
                      }}
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

                  return (
                    <MemoizedTableRow
                      key={row.id}
                      row={row}
                      rowOriginal={rowOriginal}
                      isSelected={row.getIsSelected()}
                      rColor={rColor}
                      isCustom={isCustom}
                      columnsFingerprint={columnsFingerprint}
                      setSelectedContact={setSelectedContact}
                      onContextMenu={handleContextMenu}
                      onDragFillComplete={handleDragFillComplete}
                    />
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
          {isFullscreen && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rows</span>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
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
          )}

          <div className="flex items-center gap-2">
            <button
              className="h-10 px-4 sm:px-6 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all disabled:opacity-20 active:scale-95"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
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
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
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

      {/* Shared floating context menu - ONE instance for the whole table */}
      {ctxMenu && createPortal(
        <div
          ref={ctxMenuRef}
          style={{ position: "fixed", top: ctxMenu.y, left: ctxMenu.x, zIndex: 9999 }}
          className="w-[280px] glass-card p-1 rounded-3xl border-white/10 shadow-2xl"
        >
          <div className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Set Cell Color</div>
          <div className="outline-none">
            <AdvancedColorPicker
              color={ctxMenu.currentColor}
              onChange={(color) => {
                if (onUpdateContact) {
                  onUpdateContact(ctxMenu.contactId, {
                    cellColors: { ...ctxMenu.contact.cellColors, [ctxMenu.cellId]: color === "transparent" ? "" : color }
                  });
                }
                setCtxMenu(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  if (isFullscreen) {
    return createPortal(content, document.body);
  }

  return content;
}
