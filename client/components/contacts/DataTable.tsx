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
    <div className="space-y-4">
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
      
      <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
        <Table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}>
          <TableHeader className="bg-slate-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className="h-10 text-xs font-semibold uppercase text-slate-500 tracking-wider relative group border-r last:border-r-0"
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
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize user-select-none touch-action-none bg-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-400 z-10 ${
                          header.column.getIsResizing() ? "bg-blue-500 opacity-100" : ""
                        }`}
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowOriginal = row.original as unknown as Contact;
                const rColor = rowOriginal.rowColor;
                const colorClass = rColor === "yellow" ? "bg-yellow-50/60" :
                                 rColor === "green" ? "bg-green-50/60" :
                                 rColor === "red" ? "bg-red-50/60" :
                                 rColor === "blue" ? "bg-blue-50/60" : "";

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`cursor-pointer hover:bg-slate-100/50 transition-colors h-14 ${colorClass}`}
                    onClick={() => setSelectedContact(rowOriginal)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          {/* Simple Pagination */}
          <button
            className="text-sm border px-3 py-1 rounded-md disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="text-sm border px-3 py-1 rounded-md disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
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
