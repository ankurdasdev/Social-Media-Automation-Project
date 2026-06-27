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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  density?: "compact" | "normal" | "spacious";
  onDensityChange?: (density: "compact" | "normal" | "spacious") => void;
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
  density = "normal",
  onDensityChange,
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
    
    // Don't unselect rows when picking a color so they can tweak custom colors live
    if (action !== "color") {
      table.toggleAllPageRowsSelected(false);
    }
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
               <div className="px-3 py-2 space-y-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground block">Grid Density</span>
                 <div className="flex bg-muted/30 p-1 rounded-xl">
                   {(["compact", "normal", "spacious"] as const).map((d) => (
                     <button
                       key={d}
                       onClick={() => onDensityChange?.(d)}
                       className={cn(
                         "flex-1 text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg transition-all",
                         density === d ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-white/5"
                       )}
                     >
                       {d}
                     </button>
                   ))}
                 </div>
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

          {/* Floating Bulk Actions Bar */}
          {hasSelection && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
               <div className="flex items-center gap-1 p-2 bg-background/80 backdrop-blur-xl border border-border/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] rounded-full dark:shadow-primary/10">
                   {/* Selected Count Indicator */}
                   <div className="flex items-center gap-2 px-4 border-r border-border/50">
                       <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-black shadow-inner shadow-white/20 shrink-0">
                           {selectedRows.length}
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-foreground hidden sm:inline shrink-0">Selected</span>
                   </div>

                   {/* Automation */}
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={() => {
                        const ids = selectedRows.map(r => (r.original as any).id);
                        onTriggerAction?.(ids);
                     }}
                     className="h-9 rounded-full font-black text-[10px] uppercase tracking-widest gap-2 text-foreground hover:bg-primary/20 hover:text-primary transition-all px-4"
                   >
                     <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                     <span className="hidden md:inline">Trigger</span>
                   </Button>

                   {/* Row Formatting (Popover) */}
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-9 rounded-full font-black text-[10px] uppercase tracking-widest gap-2 text-foreground hover:bg-purple-500/20 hover:text-purple-500 transition-all px-4">
                         <Palette className="w-3.5 h-3.5 shrink-0" />
                         <span className="hidden md:inline">Color</span>
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent align="center" side="top" sideOffset={16} className="w-auto p-0 rounded-3xl border-border shadow-2xl glass-card z-[100]">
                       <AdvancedColorPicker 
                         color="transparent" 
                         onChange={(c) => executeBulkAction("color", c)} 
                       />
                     </PopoverContent>
                   </Popover>

                   {/* Organization (Popover) */}
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-9 rounded-full font-black text-[10px] uppercase tracking-widest gap-2 text-foreground hover:bg-emerald-500/20 hover:text-emerald-500 transition-all px-4">
                         <Layers className="w-3.5 h-3.5 shrink-0" />
                         <span className="hidden md:inline">Move</span>
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent align="center" side="top" sideOffset={16} className="w-[220px] p-2 rounded-3xl border-border shadow-2xl glass-card z-[100]">
                        <div className="px-3 py-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Move To Sheet</div>
                        <div className="max-h-[160px] overflow-y-auto px-1 space-y-1 scrollbar-thin">
                          {dynamicSheets.length > 0 ? (
                            dynamicSheets.map((sheet: any) => (
                              <Button 
                                key={sheet}
                                variant="ghost"
                                onClick={() => executeBulkAction("move", sheet)} 
                                className="w-full justify-start px-3 py-2 text-[11px] font-bold tracking-widest text-foreground hover:bg-emerald-500/20 hover:text-emerald-500 rounded-xl transition-all h-auto"
                              >
                                {sheet}
                              </Button>
                            ))
                          ) : (
                             <div className="px-3 py-2 text-[10px] text-muted-foreground italic">No other sheets</div>
                          )}
                        </div>
                     </PopoverContent>
                   </Popover>

                   {/* Smart Clear */}
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={() => setIsSmartClearOpen(true)}
                     className="h-9 rounded-full font-black text-[10px] uppercase tracking-widest gap-2 text-foreground hover:bg-amber-500/20 hover:text-amber-500 transition-all px-4"
                   >
                     <Sparkles className="w-3.5 h-3.5 shrink-0" />
                     <span className="hidden md:inline">Clear</span>
                   </Button>

                   {/* Delete */}
                   <div className="pl-1 border-l border-border/50 ml-1">
                     <Button 
                       variant="ghost" 
                       size="icon"
                       onClick={() => executeBulkAction("delete")}
                       className="h-9 w-9 rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all shrink-0"
                       title="Delete Selected"
                     >
                       <Trash2 className="w-4 h-4 shrink-0" />
                     </Button>
                   </div>
               </div>
            </div>
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
