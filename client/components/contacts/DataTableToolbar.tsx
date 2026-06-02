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
            <TabsList className="flex h-12 p-1 bg-muted/20 border border-white/5 rounded-2xl backdrop-blur-xl">
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
            className="h-12 w-12 rounded-2xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all shrink-0"
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
                "h-12 w-12 rounded-2xl border-white/10 shadow-xl shrink-0 transition-all active:scale-90",
                isFullscreen ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              )}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
          )}
          {onZoomChange && (
            <div className="flex items-center gap-1 bg-muted/20 border border-white/5 rounded-2xl p-1 h-12">
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
                : "bg-muted/20 border-white/5 text-muted-foreground hover:bg-muted/40"
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
                  className="h-12 pl-11 rounded-full bg-muted/20 border-white/5 focus:bg-background focus:ring-primary focus:border-primary font-bold shadow-inner transition-all text-sm w-full"
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
              "h-12 rounded-full border-white/10 px-5 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shrink-0 shadow-sm",
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
                className="h-12 rounded-full border-white/10 px-5 font-black text-[10px] uppercase tracking-widest gap-2 transition-all shrink-0 bg-muted/20 hover:bg-muted/40 shadow-sm"
              >
                <View className="w-4 h-4 opacity-50" />
                <span className="hidden md:inline">VIEW OPTIONS</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] glass-card border-white/10 p-2 rounded-2xl shadow-2xl z-[100]">
               <DropdownMenuLabel className="px-3 py-1.5 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Display Settings</DropdownMenuLabel>
               <DropdownMenuSeparator className="bg-white/5 mx-2 my-1" />
               <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Freeze Title</span>
                  <Switch 
                     checked={isTitleFrozen}
                     onCheckedChange={(val) => onToggleTitleFreeze?.(val)}
                     className="scale-75"
                  />
               </div>
               <DropdownMenuSeparator className="bg-white/10" />
              
               <DropdownMenuItem 
                 onClick={() => setIsColumnManagerOpen(true)}
                 className="text-[11px] font-black uppercase tracking-widest text-primary cursor-pointer hover:bg-primary/20"
               >
                 <Settings2 className="mr-2 h-3.5 w-3.5" />
                 Manage Column Groups
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ROW 3: Bulk Actions (Dedicated Section) */}
      {hasSelection && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 w-full glass-card bg-primary/5 border border-primary/20 rounded-[2rem] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 md:pr-6 md:border-r border-primary/20 w-full md:w-auto shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-inner">
              {selectedRows.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black uppercase tracking-[0.3em] text-primary leading-tight">Selected</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contacts</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap items-center gap-3 w-full">
            <Button
              onClick={() => { const ids = selectedRows.map(r => (r.original as any).id); onTriggerAction?.(ids); }}
              className="rounded-xl lg:rounded-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest h-12 px-4 lg:px-6 shadow-lg shadow-primary/30 gap-2 transition-transform active:scale-95 col-span-2 md:col-span-1"
            >
              <Zap className="w-4 h-4 fill-current" /> SEND OUTREACH
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl lg:rounded-full bg-background/50 hover:bg-background border-primary/20 h-12 px-4 lg:px-5 text-[10px] font-bold uppercase gap-2 hover:border-primary/50 transition-colors w-full">
                  <Palette className="w-4 h-4 text-primary" /> COLOR
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[280px] glass-card border-white/10 p-1 rounded-3xl shadow-2xl z-[100]">
                <DropdownMenuLabel className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Set Row Color</DropdownMenuLabel>
                <div onSelect={(e) => e.preventDefault()} className="outline-none">
                  <AdvancedColorPicker
                    color={(selectedRows[0]?.original as any).rowColor || "transparent"}
                    onChange={(color) => executeBulkAction("color", color)}
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl lg:rounded-full bg-background/50 hover:bg-background border-primary/20 h-12 px-4 lg:px-5 text-[10px] font-bold uppercase gap-2 hover:border-primary/50 transition-colors w-full">
                  <Layers className="w-4 h-4 text-primary" /> MOVE
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[240px] glass-card border-white/10 p-2 rounded-2xl shadow-2xl z-[100]">
                <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Select Sheet</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 my-1" />
                <div className="max-h-48 overflow-y-auto py-1">
                  {dynamicSheets.length > 0 ? dynamicSheets.map((sheet: any) => (
                    <DropdownMenuItem key={sheet} onSelect={(e) => { e.preventDefault(); executeBulkAction("move", sheet); }} className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground focus:text-foreground cursor-pointer">
                      {sheet}
                    </DropdownMenuItem>
                  )) : (
                    <p className="px-4 py-3 text-[10px] font-bold text-muted-foreground/50 italic text-center">No other sheets found.</p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => executeBulkAction("reset_automation")} className="rounded-xl lg:rounded-full bg-background/50 hover:bg-background border-blue-500/20 hover:border-blue-500/50 text-blue-500 h-12 px-4 lg:px-5 text-[10px] font-bold uppercase gap-2 transition-colors w-full">
              <RefreshCw className="w-4 h-4" /> RESET
            </Button>

            <Button variant="outline" onClick={() => setIsSmartClearOpen(true)} className="rounded-xl lg:rounded-full bg-background/50 hover:bg-background border-amber-500/20 hover:border-amber-500/50 text-amber-500 h-12 px-4 lg:px-5 text-[10px] font-bold uppercase gap-2 transition-colors w-full">
              <Eraser className="w-4 h-4" /> CLEAR
            </Button>

            <div className="hidden lg:block flex-1" />

            <Button variant="outline" onClick={() => executeBulkAction("delete")} className="rounded-xl lg:rounded-full bg-background/50 hover:bg-destructive/10 border-destructive/20 hover:border-destructive/50 text-destructive h-12 px-4 lg:px-5 text-[10px] font-bold uppercase gap-2 transition-colors w-full lg:w-auto col-span-2 md:col-span-1">
              <Trash2 className="w-4 h-4" /> DELETE
            </Button>
          </div>
        </div>
      )}

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
