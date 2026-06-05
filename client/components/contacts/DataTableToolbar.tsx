import { useState, useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
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
import { Search, ChevronDown, Zap, RefreshCw, Plus, Trash2, X, Sparkles, MessageCircle, Mail, Instagram, Maximize2, Minimize2, Filter, Upload, ZoomIn, ZoomOut, View, Eraser, Settings2, Palette, Layers } from "lucide-react";
import { Contact } from "@shared/api";
import { AISearchBar } from "./AISearchBar";
import { AdvancedColorPicker } from "./AdvancedColorPicker";
import { useQueryClient } from "@tanstack/react-query";
import { ExcelImportDialog } from "./ExcelImportDialog";
import { SmartClearDialog } from "./SmartClearDialog";
import { ColumnManagerDialog } from "./ColumnManagerDialog";
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
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onAddContact?: () => void;
  isTitleFrozen?: boolean;
  onToggleTitleFreeze?: (frozen: boolean) => void;
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
  zoomLevel = 100,
  onZoomChange,
  onAddContact,
  isTitleFrozen,
  onToggleTitleFreeze,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [deleteSheetConfirm, setDeleteSheetConfirm] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"normal" | "ai">("normal");
  const [showPlatformFilters, setShowPlatformFilters] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isSmartClearOpen, setIsSmartClearOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);

  const queryClient = useQueryClient();

  const handleImportComplete = (importedSheets: string[]) => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    importedSheets.forEach((sheet) => {
      onAddSheet?.(sheet);
    });
    if (importedSheets.length > 0 && onTabChange) {
      onTabChange(importedSheets[0]);
    }
  };

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
          <Tabs id="tutorial-contacts-sheets" value={activeTab} onValueChange={handleTabChange} className="w-auto shrink-0">
            <TabsList className="flex h-12 p-1 bg-muted/20 border border-border/50 rounded-2xl backdrop-blur-xl">
              <TabsTrigger value="all" className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background transition-all whitespace-nowrap">
                All Contacts
              </TabsTrigger>
              {(table.options.meta as any)?.uniqueSheets?.map((sheet: string) => (
                <TabsTrigger key={sheet} value={sheet} className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] group relative transition-all whitespace-nowrap data-[state=active]:bg-foreground data-[state=active]:text-background">
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
            className="h-12 w-12 rounded-2xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all shrink-0"
            onClick={() => setIsAddSheetOpen(true)}
            title="Add New Sheet"
          >
            <Plus className="h-5 w-5 text-primary" />
          </Button>
        </div>

        {/* Fullscreen toggle & Add Contact - ALWAYS VISIBLE if defined */}
        <div className="flex items-center gap-2">
          {isFullscreen && onAddContact && (
            <Button
              onClick={onAddContact}
              className="h-12 px-5 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black shadow-xl transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> ADD CONTACT
            </Button>
          )}
          {onToggleFullscreen && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFullscreen}
              className={cn(
                "h-12 w-12 rounded-2xl border-border shadow-xl shrink-0 transition-all active:scale-90",
                isFullscreen ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              )}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
          )}
          {onZoomChange && (
            <div className="flex items-center gap-1 bg-muted/20 border border-border/50 rounded-2xl p-1 h-12">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onZoomChange(Math.max(50, zoomLevel - 15))}
                className="h-full w-10 rounded-xl hover:bg-muted/40 transition-all text-muted-foreground hover:text-foreground"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-black w-8 text-center">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onZoomChange(Math.min(150, zoomLevel + 15))}
                className="h-full w-10 rounded-xl hover:bg-muted/40 transition-all text-muted-foreground hover:text-foreground"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Search + Refresh + Filters + View Options */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

        {/* Search area */}
        <div className="flex items-center gap-2 flex-1 w-full xl:max-w-2xl">
          {/* AI Mode Toggle */}
          <Button
            id="tutorial-contacts-ai"
            variant="ghost"
            size="icon"
            onClick={() => {
              const nextMode = searchMode === "normal" ? "ai" : "normal";
              if (nextMode === "normal") {
                onClearAISearch?.();
              }
              setSearchMode(nextMode);
            }}
            className={cn(
              "h-12 w-12 rounded-full border transition-all shrink-0",
              searchMode === "ai"
                ? "bg-primary/20 border-primary/50 text-primary shadow-lg shadow-primary/20"
                : "bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40"
            )}
            title={searchMode === "ai" ? "Switch to Normal Search" : "Switch to AI Search"}
          >
            <Sparkles className="h-5 w-5" />
          </Button>

          {/* Search bar */}
          <div className="flex-1 min-w-[200px] h-12 relative group">
            {searchMode === "ai" ? (
              <AISearchBar
                onSearch={onAISearch || (() => {})}
                isLoading={isAISearching}
                onClear={() => { onClearAISearch?.(); setSearchMode("normal"); }}
                className="max-w-none h-12 rounded-full"
              />
            ) : (
              <>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  placeholder="Search Contacts..."
                  value={table.getState().globalFilter ?? ""}
                  onChange={(event) => table.setGlobalFilter(event.target.value)}
                  className="h-12 pl-11 rounded-full bg-muted/20 border-border/50 focus:bg-background focus:ring-primary focus:border-primary font-bold shadow-inner transition-all text-sm w-full"
                />
              </>
            )}
          </div>

          {/* Filtered Rows Count */}
          {table.getState().columnFilters.length > 0 && (
            <div className="hidden md:flex items-center gap-2 px-5 h-12 rounded-full bg-primary/10 border border-primary/20 shrink-0 shadow-inner">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                {table.getFilteredRowModel().rows.length} Matches
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide shrink-0 w-full xl:w-auto">
          {/* Refresh All */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { table.resetGlobalFilter(); table.resetColumnFilters(); onClearAISearch?.(); if (onTabChange) onTabChange("all"); }}
            className="h-12 px-5 rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-95 group shrink-0 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden md:inline">REFRESH</span>
          </Button>

          {/* Import Excel */}
          <Button
            id="tutorial-contacts-import"
            variant="outline"
            size="sm"
            onClick={() => setIsExcelImportOpen(true)}
            className="h-12 px-5 rounded-full border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 font-black text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-95 group shrink-0 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>IMPORT</span>
          </Button>

          {/* Status Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlatformFilters(!showPlatformFilters)}
            className={cn(
              "h-12 rounded-full border-border px-5 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shrink-0 shadow-sm",
              showPlatformFilters ? "bg-foreground text-background border-foreground" : "bg-muted/20 hover:bg-muted/40"
            )}
          >
            <Filter className={cn("w-4 h-4", showPlatformFilters && "text-background")} />
            <span className="hidden md:inline">FILTERS</span>
          </Button>

          {/* View Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-12 rounded-full border-border px-5 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shrink-0 bg-muted/20 hover:bg-muted/40 shadow-sm"
              >
                <View className="w-4 h-4 opacity-50" />
                <span className="hidden md:inline">VIEW OPTIONS</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] glass-card border-border p-2 rounded-2xl shadow-2xl z-[100]">
               <DropdownMenuLabel className="px-3 py-1.5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Display Settings</DropdownMenuLabel>
               <DropdownMenuSeparator className="dark:bg-white/5 bg-black/5 mx-2 my-1" />
               <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Freeze Title</span>
                  <Switch 
                     checked={isTitleFrozen}
                     onCheckedChange={(val) => onToggleTitleFreeze?.(val)}
                     className="scale-75"
                  />
               </div>
               <DropdownMenuSeparator className="dark:bg-white/[0.02] bg-black/5" />
              
               <DropdownMenuItem 
                 onClick={() => setIsColumnManagerOpen(true)}
                 className="text-[11px] font-black uppercase tracking-widest text-primary cursor-pointer hover:bg-primary/20"
               >
                 <Settings2 className="mr-2 h-3.5 w-3.5" />
                 Manage Column Groups
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Advanced Bulk Actions Dropdown */}
          {hasSelection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="h-12 rounded-full font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-primary/30 transition-all active:scale-95 shrink-0 px-5 bg-primary hover:bg-primary/90 text-white">
                  <Zap className="h-4 w-4 fill-current" />
                  <span className="hidden md:inline">BULK ACTIONS ({selectedRows.length})</span>
                  <span className="md:hidden">({selectedRows.length})</span>
                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[320px] glass-card border-border p-3 rounded-[2rem] shadow-2xl z-[100] flex flex-col gap-2 max-h-[80vh] overflow-y-auto scrollbar-thin">
                
                {/* AUTOMATION */}
                <div className="space-y-1">
                  <DropdownMenuLabel className="px-2 py-1 text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 fill-current" /> Automation
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => {
                      const ids = selectedRows.map(r => (r.original as any).id);
                      onTriggerAction?.(ids);
                    }}
                    className="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-foreground cursor-pointer hover:bg-primary/20 rounded-xl transition-all"
                  >
                    Trigger Automation Sequence
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="dark:bg-white/5 bg-black/5" />

                {/* ROW FORMATTING */}
                <div className="space-y-1">
                  <DropdownMenuLabel className="px-2 py-1 text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Row Formatting
                  </DropdownMenuLabel>
                  <div className="-mx-2 -my-2">
                    <AdvancedColorPicker 
                      color="transparent" 
                      onChange={(c) => executeBulkAction("color", c)} 
                    />
                  </div>
                </div>

                <DropdownMenuSeparator className="dark:bg-white/5 bg-black/5" />

                {/* ORGANIZATION */}
                <div className="space-y-1">
                  <DropdownMenuLabel className="px-2 py-1 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Organization
                  </DropdownMenuLabel>
                  <div className="max-h-[120px] overflow-y-auto px-1 space-y-1 scrollbar-thin">
                    {dynamicSheets.length > 0 ? (
                      dynamicSheets.map((sheet: any) => (
                        <DropdownMenuItem 
                          key={sheet}
                          onSelect={(e) => { e.preventDefault(); executeBulkAction("move", sheet); }} 
                          className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-500 rounded-xl transition-all"
                        >
                          Move to "{sheet}"
                        </DropdownMenuItem>
                      ))
                    ) : (
                       <div className="px-3 py-2 text-[10px] text-muted-foreground italic">No other sheets</div>
                    )}
                  </div>
                </div>

                <DropdownMenuSeparator className="dark:bg-white/5 bg-black/5" />

                {/* DATA MANAGEMENT */}
                <div className="space-y-1">
                  <DropdownMenuLabel className="px-2 py-1 text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Eraser className="w-3 h-3" /> Data Management
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onSelect={(e) => { e.preventDefault(); setIsSmartClearOpen(true); }}
                    className="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-amber-500 cursor-pointer hover:bg-amber-500/20 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Smart Clear...
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    className="px-3 py-3 text-[11px] font-black uppercase tracking-widest text-destructive cursor-pointer hover:bg-destructive/20 rounded-xl transition-all flex items-center gap-2"
                    onSelect={(e) => { e.preventDefault(); executeBulkAction("delete"); }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete Selected
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
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
                    "h-10 rounded-xl border-border px-4 font-black text-[9px] uppercase tracking-widest gap-2 min-w-[100px] transition-all",
                    isActive ? "bg-muted/40 border-primary/30" : "bg-muted/20"
                  )}>
                    <f.icon className={cn("w-3 h-3", isActive ? f.color : "opacity-30")} />
                    {currentVal ? (currentVal === "Yes" ? "SENT" : currentVal === "Failed" ? "FAILED" : currentVal === "In Progress" ? "BUSY" : "PENDING") : f.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass-card border-border p-2 rounded-2xl z-[100] min-w-[140px]">
                  <DropdownMenuLabel className="px-3 py-1.5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Select {f.label} Status</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-white/5 bg-black/5 mx-2" />
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
        <DialogContent className="sm:max-w-[450px] glass-card border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
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
        <AlertDialogContent className="glass-card border-border rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase">Delete Sheet?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">
              Deleting sheet "<span className="text-primary font-black uppercase tracking-widest">{deleteSheetConfirm}</span>"
              will move all contacts to All Contacts. The contacts will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl border-border font-black text-[10px] uppercase tracking-widest">CANCEL</AlertDialogCancel>
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

      {/* Smart Clear Dialog */}
      <SmartClearDialog
        isOpen={isSmartClearOpen}
        onOpenChange={setIsSmartClearOpen}
        selectedCount={selectedRows.length}
        onConfirm={(fields) => {
          if (onBulkAction) {
            const ids = selectedRows.map(r => (r.original as any).id);
            onBulkAction("smart_clear", ids, fields);
          }
        }}
      />

      <ColumnManagerDialog
        isOpen={isColumnManagerOpen}
        onOpenChange={setIsColumnManagerOpen}
        onSaved={() => {
          // Re-render handled by the event listener in DataTable
        }}
      />

      <ExcelImportDialog
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
