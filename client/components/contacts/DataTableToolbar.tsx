import { useState, useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronDown, Zap, RefreshCw, Plus, Trash2, Palette } from "lucide-react";
import { Contact } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onTriggerAction?: (contactIds: string[]) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onBulkAction?: (action: string, contactIds: string[], payload?: any) => void;
  onAddSheet?: (sheetName: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  onTriggerAction,
  onRefresh,
  isRefreshing,
  onBulkAction,
  onAddSheet,
  activeTab = "all",
  onTabChange,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  
  // Extract unique sheets from data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = table.options.data as any[];
  const dynamicSheets = useMemo(() => {
    const sheets = new Set([...rawData.map(c => c.sheetName).filter(Boolean)]);
    return Array.from(sheets);
  }, [rawData]);

  const handleCreateSheet = () => {
    if (newSheetName.trim()) {
      if (onAddSheet) onAddSheet(newSheetName.trim());
      if (onTabChange) onTabChange(newSheetName.trim());
      setIsAddSheetOpen(false);
      setNewSheetName("");
    }
  };

  const handleTabChange = (value: string) => {
    if (onTabChange) onTabChange(value);
    if (value === "all") {
      table.getColumn("sheetName")?.setFilterValue(undefined);
    } else {
      table.getColumn("sheetName")?.setFilterValue(value);
    }
  };

  const executeBulkAction = (action: string, payload?: any) => {
    if (!onBulkAction) return;
    const ids = selectedRows.map(r => (r.original as any).id);
    onBulkAction(action, ids, payload);
    // Optionally clear selection
    table.toggleAllPageRowsSelected(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Tabs + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="flex flex-wrap h-auto p-1">
              <TabsTrigger value="all" className="text-xs">All Contacts</TabsTrigger>
              {(table.options.meta as any)?.uniqueSheets?.map((sheet: string) => (
                <TabsTrigger key={sheet} value={sheet} className="text-xs">
                  {sheet}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsAddSheetOpen(true)} title="Add New Sheet">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Dialog open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add New Sheet</DialogTitle>
            <DialogDescription>
              Create a new sheet tab to organize contacts. You can move contacts here via Bulk Actions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g. Talent Agencies" 
              value={newSheetName} 
              onChange={e => setNewSheetName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleCreateSheet()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSheet}>Create Sheet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Row: AI Filter + Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={table.getState().globalFilter ?? ""}
              onChange={(event) =>
                table.setGlobalFilter(event.target.value)
              }
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-9 gap-1 shadow-sm">
                  <Zap className="h-4 w-4" />
                  Bulk Actions ({selectedRows.length})
                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Automation</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => {
                    const ids = selectedRows.map(r => (r.original as any).id);
                    onTriggerAction?.(ids);
                  }}
                  className="text-primary font-medium focus:text-primary focus:bg-primary/10 cursor-pointer"
                >
                  <Zap className="mr-2 h-4 w-4" /> Trigger Automation
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Row Formatting (Color)</DropdownMenuLabel>
                <div className="flex items-center gap-1 p-2">
                  <DropdownMenuItem asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", "yellow"); }}>
                    <div className="w-6 h-6 rounded-full bg-yellow-400 cursor-pointer hover:ring-2 ring-offset-1" title="Yellow" />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", "green"); }}>
                    <div className="w-6 h-6 rounded-full bg-green-400 cursor-pointer hover:ring-2 ring-offset-1" title="Green" />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", "red"); }}>
                    <div className="w-6 h-6 rounded-full bg-red-400 cursor-pointer hover:ring-2 ring-offset-1" title="Red" />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", "blue"); }}>
                    <div className="w-6 h-6 rounded-full bg-blue-400 cursor-pointer hover:ring-2 ring-offset-1" title="Blue" />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", "transparent"); }}>
                    <div className="w-6 h-6 rounded-full bg-slate-200 cursor-pointer border border-slate-300 hover:ring-2 ring-offset-1 flex items-center justify-center text-[10px]" title="Clear Color">X</div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Organization</DropdownMenuLabel>
                {dynamicSheets.length > 0 && (
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); executeBulkAction("move", dynamicSheets[0]); }} className="cursor-pointer">
                    Move to "{dynamicSheets[0]}"
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  onSelect={(e) => { e.preventDefault(); executeBulkAction("delete"); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
