import { useState, useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
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
import { Search, ChevronDown, Zap, RefreshCw, Plus, Trash2, X } from "lucide-react";
import { Contact } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onTriggerAction?: (contactIds: string[]) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onBulkAction?: (action: string, contactIds: string[], payload?: any) => void;
  onAddSheet?: (sheetName: string) => void;
  onDeleteSheet?: (sheetName: string) => void;
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
  onDeleteSheet,
  activeTab = "all",
  onTabChange,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;
  
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [deleteSheetConfirm, setDeleteSheetConfirm] = useState<string | null>(null);
  
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
    <div className="flex flex-col gap-6 animate-in slide-in-from-top-2 duration-500">
      {/* Top Row: Neural Segments + Global Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="flex h-14 p-1.5 bg-muted/20 border border-white/5 rounded-2xl backdrop-blur-xl">
              <TabsTrigger value="all" className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                Registry Alpha
              </TabsTrigger>
              {(table.options.meta as any)?.uniqueSheets?.map((sheet: string) => (
                <TabsTrigger key={sheet} value={sheet} className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] group relative transition-all">
                  {sheet}
                  {activeTab === sheet && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteSheetConfirm(sheet); }}
                      className="ml-3 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/20 p-1 hover:scale-110"
                      title={`Decommission segment "${sheet}"`}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-14 w-14 rounded-2xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all shrink-0" 
            onClick={() => setIsAddSheetOpen(true)} 
            title="Deploy New Segment"
          >
            <Plus className="h-6 w-6 text-primary" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="lg" 
          className="h-14 px-8 gap-3 rounded-2xl border-white/10 bg-muted/20 hover:bg-muted/40 font-black text-[10px] tracking-[0.2em] transition-all active:scale-95 shrink-0"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700")} />
          FORCE SYNC
        </Button>
      </div>

      <Dialog open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <DialogContent className="sm:max-w-[450px] glass-card border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-muted/30">
            <DialogTitle className="text-3xl font-black tracking-tighter">DEPLOY <span className="text-primary italic">SEGMENT</span></DialogTitle>
            <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Establish a new intelligence cluster for node organization.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
                <Input 
                  placeholder="E.g. High Priority Targets" 
                  value={newSheetName} 
                  onChange={e => setNewSheetName(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleCreateSheet()}
                  className="h-14 rounded-xl bg-muted/40 border-border/50 font-bold focus:ring-primary shadow-inner"
                />
            </div>
            <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setIsAddSheetOpen(false)} className="h-14 flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest">ABORT</Button>
                <Button onClick={handleCreateSheet} className="h-14 flex-1 rounded-xl bg-primary text-white font-black shadow-xl hover:shadow-primary/20">INITIALIZE</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Sheet Confirmation */}
      <AlertDialog open={!!deleteSheetConfirm} onOpenChange={(o) => !o && setDeleteSheetConfirm(null)}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase">Decommission Cluster?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">
              Terminating segment "<span className="text-primary font-black uppercase tracking-widest">{deleteSheetConfirm}</span>" 
              will return all orphan nodes to Registry Alpha. Metadata will persist but structural grouping will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl border-white/10 font-black text-[10px] uppercase tracking-widest">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 rounded-xl bg-destructive text-white hover:bg-destructive/90 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-destructive/20"
              onClick={() => {
                if (deleteSheetConfirm && onDeleteSheet) {
                  onDeleteSheet(deleteSheetConfirm);
                  if (onTabChange) onTabChange("all");
                }
                setDeleteSheetConfirm(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> CONFIRM TERMINATION
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Row: Query + Global Commands */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="relative w-full max-w-xl group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            placeholder="Query Registry Columns..."
            value={table.getState().globalFilter ?? ""}
            onChange={(event) =>
              table.setGlobalFilter(event.target.value)
            }
            className="h-14 pl-14 rounded-2xl bg-muted/20 border-white/5 focus:bg-background focus:ring-primary font-bold shadow-inner transition-all"
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] bg-foreground text-background hover:bg-foreground/90 gap-4 shadow-2xl transition-all active:scale-95 flex-1 sm:flex-none">
                  <Zap className="h-4 w-4 fill-background" />
                  BATCH COMMANDS ({selectedRows.length})
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 p-3 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
                <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Neural Protocol</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => {
                    const ids = selectedRows.map(r => (r.original as any).id);
                    onTriggerAction?.(ids);
                  }}
                  className="h-12 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-primary focus:bg-primary/10 focus:text-primary cursor-pointer gap-3"
                >
                  <Zap className="h-4 w-4" /> TRIGGER OUTREACH SEQUENCE
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-3 bg-white/5" />
                
                <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Node Metadata (Color)</DropdownMenuLabel>
                <div className="flex items-center justify-around p-3">
                  {[
                    { color: "yellow", bg: "bg-yellow-400" },
                    { color: "green", bg: "bg-emerald-400" },
                    { color: "red", bg: "bg-rose-400" },
                    { color: "blue", bg: "bg-blue-400" }
                  ].map((c) => (
                      <DropdownMenuItem key={c.color} asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", c.color); }}>
                        <div className={cn("w-8 h-8 rounded-full cursor-pointer hover:ring-4 ring-white/20 transition-all shadow-lg", c.bg)} title={c.color} />
                      </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild onSelect={(e) => { e.preventDefault(); executeBulkAction("color", "transparent"); }}>
                    <div className="w-8 h-8 rounded-full bg-muted border border-white/10 cursor-pointer hover:ring-4 ring-white/20 flex items-center justify-center text-[10px] font-black transition-all shadow-lg" title="Reset Registry">X</div>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-3 bg-white/5" />

                <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Migration Scopes</DropdownMenuLabel>
                <div className="max-h-40 overflow-y-auto py-1">
                    {dynamicSheets.length > 0 ? dynamicSheets.map((sheet: any) => (
                      <DropdownMenuItem key={sheet} onSelect={(e) => { e.preventDefault(); executeBulkAction("move", sheet); }} className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground focus:text-foreground cursor-pointer">
                         TO :: {sheet}
                      </DropdownMenuItem>
                    )) : (
                        <p className="px-4 py-2 text-[9px] font-bold text-muted-foreground/50 italic">No secondary segments active.</p>
                    )}
                </div>
                
                <DropdownMenuSeparator className="my-3 bg-white/5" />
                
                <DropdownMenuItem 
                  className="h-12 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-3"
                  onSelect={(e) => { e.preventDefault(); executeBulkAction("delete"); }}
                >
                  <Trash2 className="h-4 w-4" /> PURGE SELECTED NODES
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
