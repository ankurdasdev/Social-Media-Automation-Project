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
import { Search, ChevronDown, Zap, RefreshCw, Plus, Trash2, X, Sparkles, MessageCircle, Mail, Instagram, Maximize2, Minimize2, Filter } from "lucide-react";
import { Contact } from "@shared/api";
import { AISearchBar } from "./AISearchBar";
import { AdvancedColorPicker } from "./AdvancedColorPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  onBulkAction?: (action: string, contactIds: string[], payload?: any) => void;
  onAddSheet?: (sheetName: string) => void;
  onDeleteSheet?: (sheetName: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAISearch?: (prompt: string) => void;
  isAISearching?: boolean;
  onClearAISearch?: () => void;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  onTriggerAction,
  onBulkAction,
  onAddSheet,
  onDeleteSheet,
  activeTab = "all",
  onTabChange,
  onAISearch,
  isAISearching,
  onClearAISearch,
  className,
  isFullscreen,
  onToggleFullscreen,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [deleteSheetConfirm, setDeleteSheetConfirm] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"normal" | "ai">("normal");
  const [showPlatformFilters, setShowPlatformFilters] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
    table.toggleAllPageRowsSelected(false);
  };

  return (
    <div className={cn("flex flex-col gap-4 animate-in slide-in-from-top-2 duration-500", className)}>

      {/* ROW 1: Sheet Tabs + Fullscreen Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto shrink-0">
            <TabsList className="flex h-12 p-1 bg-muted/20 border border-white/5 rounded-2xl backdrop-blur-xl">
              <TabsTrigger value="all" className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background transition-all whitespace-nowrap">
                All Contacts
              </TabsTrigger>
              {(table.options.meta as any)?.uniqueSheets?.map((sheet: string) => (
                <TabsTrigger key={sheet} value={sheet} className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] group relative transition-all whitespace-nowrap">
                  {sheet}
                  {activeTab === sheet && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteSheetConfirm(sheet); }}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/20 p-0.5"
                      title={`Delete sheet "${sheet}"`}
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
            className="h-12 w-12 rounded-2xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all shrink-0"
            onClick={() => setIsAddSheetOpen(true)}
            title="Add New Sheet"
          >
            <Plus className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Fullscreen toggle - ALWAYS VISIBLE */}
        {onToggleFullscreen && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFullscreen}
            className={cn(
              "h-12 w-12 rounded-2xl border-white/10 shadow-xl shrink-0 transition-all active:scale-90",
              isFullscreen ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            )}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        )}
      </div>

      {/* ROW 2: Search + Refresh + Filters + Bulk Actions */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* AI Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchMode(searchMode === "normal" ? "ai" : "normal")}
          className={cn(
            "h-11 w-11 rounded-xl border transition-all shrink-0",
            searchMode === "ai"
              ? "bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10"
              : "bg-muted/20 border-white/5 text-muted-foreground hover:bg-muted/40"
          )}
          title={searchMode === "ai" ? "Switch to Normal Search" : "Switch to AI Search"}
        >
          {searchMode === "ai" ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>

        {/* Search bar */}
        {searchMode === "ai" ? (
          <div className="flex-1 min-w-[200px]">
            <AISearchBar
              onSearch={onAISearch || (() => {})}
              isLoading={isAISearching}
              onClear={() => { onClearAISearch?.(); setSearchMode("normal"); }}
            />
          </div>
        ) : (
          <>
            {(!isFullscreen || isSearchExpanded) ? (
              <div className="relative group transition-all duration-300 flex-1 min-w-[180px] max-w-md">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  placeholder="Search Contacts..."
                  value={table.getState().globalFilter ?? ""}
                  onChange={(event) => table.setGlobalFilter(event.target.value)}
                  className="h-11 pl-11 rounded-xl bg-muted/20 border-white/5 focus:bg-background focus:ring-primary font-bold shadow-inner transition-all text-sm"
                  autoFocus={isSearchExpanded}
                  onBlur={() => { if (isFullscreen && !table.getState().globalFilter) setIsSearchExpanded(false); }}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl bg-muted/20 border-white/5 shrink-0"
                onClick={() => setIsSearchExpanded(true)}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Refresh All */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { table.resetGlobalFilter(); table.resetColumnFilters(); onClearAISearch?.(); }}
          className="h-11 px-4 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest gap-2 transition-all active:scale-95 group shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          <span className="hidden md:inline">REFRESH</span>
        </Button>

        {/* Status Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPlatformFilters(!showPlatformFilters)}
          className={cn(
            "h-11 rounded-xl border-white/10 px-4 font-black text-[9px] uppercase tracking-widest gap-2 transition-all shrink-0",
            showPlatformFilters ? "bg-foreground text-background border-foreground" : "bg-muted/20"
          )}
        >
          <Filter className={cn("w-3.5 h-3.5", showPlatformFilters && "text-background")} />
          <span className="hidden md:inline">FILTERS</span>
        </Button>

        {/* Bulk Action Buttons - shown inline when rows selected */}
        {hasSelection && (
          <>
            <div className="w-px h-8 bg-white/10 shrink-0" />
            <Button
              variant="default"
              onClick={() => { const ids = selectedRows.map(r => (r.original as any).id); onTriggerAction?.(ids); }}
              className="h-11 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-xl transition-all active:scale-95 shrink-0"
            >
              <Zap className="h-4 w-4 fill-background" />
              SEND ({selectedRows.length})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-11 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-xl transition-all active:scale-95 shrink-0">
                  BULK
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] glass-card border-white/10 p-1 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 z-[100]">
                <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Set Row Color</DropdownMenuLabel>
                <div onSelect={(e) => e.preventDefault()} className="outline-none">
                  <AdvancedColorPicker
                    color={(selectedRows[0]?.original as any).rowColor || "transparent"}
                    onChange={(color) => executeBulkAction("color", color)}
                  />
                </div>
                <DropdownMenuSeparator className="my-3 bg-white/5" />
                <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Move to Sheet</DropdownMenuLabel>
                <div className="max-h-40 overflow-y-auto py-1">
                  {dynamicSheets.length > 0 ? dynamicSheets.map((sheet: any) => (
                    <DropdownMenuItem key={sheet} onSelect={(e) => { e.preventDefault(); executeBulkAction("move", sheet); }} className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground focus:text-foreground cursor-pointer">
                      MOVE TO :: {sheet}
                    </DropdownMenuItem>
                  )) : (
                    <p className="px-4 py-2 text-[9px] font-bold text-muted-foreground/50 italic">No other sheets found.</p>
                  )}
                </div>
                <DropdownMenuSeparator className="my-3 bg-white/5" />
                <DropdownMenuItem
                  className="h-12 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-3"
                  onSelect={(e) => { e.preventDefault(); executeBulkAction("delete"); }}
                >
                  <Trash2 className="h-4 w-4" /> DELETE CONTACTS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Platform filters expand row */}
      {showPlatformFilters && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {[
            { id: "whatsappCompleted", label: "WA", icon: MessageCircle, color: "text-emerald-500" },
            { id: "emailCompleted", label: "Gmail", icon: Mail, color: "text-blue-500" },
            { id: "instagramCompleted", label: "Insta", icon: Instagram, color: "text-pink-500" },
          ].map(f => {
            const currentVal = table.getColumn(f.id)?.getFilterValue() as string;
            const isActive = !!currentVal;
            return (
              <DropdownMenu key={f.id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={cn(
                    "h-10 rounded-xl border-white/10 px-4 font-black text-[9px] uppercase tracking-widest gap-2 min-w-[100px] transition-all",
                    isActive ? "bg-muted/40 border-primary/30" : "bg-muted/20"
                  )}>
                    <f.icon className={cn("w-3 h-3", isActive ? f.color : "opacity-30")} />
                    {currentVal ? (currentVal === "Yes" ? "SENT" : currentVal === "Failed" ? "FAILED" : currentVal === "In Progress" ? "BUSY" : "PENDING") : f.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass-card border-white/10 p-2 rounded-2xl z-[100] min-w-[140px]">
                  <DropdownMenuLabel className="px-3 py-1.5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Select {f.label} Status</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5 mx-2" />
                  {[
                    { label: "ALL STATUS", val: undefined },
                    { label: "SENT / COMPLETED", val: "Yes" },
                    { label: "FAILED / ERROR", val: "Failed" },
                    { label: "PENDING / NO", val: "No" },
                    { label: "IN PROGRESS", val: "In Progress" }
                  ].map(v => (
                    <DropdownMenuItem
                      key={v.label}
                      onSelect={() => table.getColumn(f.id)?.setFilterValue(v.val)}
                      className="h-9 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {v.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <DialogContent className="sm:max-w-[450px] glass-card border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-muted/30">
            <DialogTitle className="text-3xl font-black tracking-tighter">ADD <span className="text-primary italic">SHEET</span></DialogTitle>
            <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Create a new sheet to organize your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <Input
              placeholder="E.g. High Priority Targets"
              value={newSheetName}
              onChange={e => setNewSheetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateSheet()}
              className="h-14 rounded-xl bg-muted/40 border-border/50 font-bold focus:ring-primary shadow-inner"
            />
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setIsAddSheetOpen(false)} className="h-14 flex-1 rounded-xl font-black text-[11px] uppercase tracking-widest">CANCEL</Button>
              <Button onClick={handleCreateSheet} className="h-14 flex-1 rounded-xl bg-primary text-white font-black shadow-xl hover:shadow-primary/20">CREATE</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSheetConfirm} onOpenChange={(o) => !o && setDeleteSheetConfirm(null)}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase">Delete Sheet?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">
              Deleting sheet "<span className="text-primary font-black uppercase tracking-widest">{deleteSheetConfirm}</span>"
              will move all contacts to All Contacts. The contacts will not be deleted.
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
              <Trash2 className="mr-2 h-4 w-4" /> CONFIRM DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
