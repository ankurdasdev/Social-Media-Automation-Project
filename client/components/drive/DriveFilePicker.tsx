import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { File, X, Search, Loader2, HardDrive, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { cn } from "@/lib/utils";

import { DriveFile } from "@shared/api";

interface DriveFilePickerProps {
  userId: string;
  selectedFiles: DriveFile[];
  onChange: (files: DriveFile[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

async function searchFiles(userId: string, q: string): Promise<{ files: DriveFile[]; folderName?: string }> {
  const params = new URLSearchParams({ userId, q });
  const res = await fetch(`/api/drive/files?${params}`);
  if (res.status === 401) throw new Error("not_connected");
  if (!res.ok) throw new Error("search_failed");
  return res.json();
}

export function DriveFilePicker({
  userId,
  selectedFiles,
  onChange,
  placeholder = "Search Drive for files...",
  disabled = false,
}: DriveFilePickerProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["drive-files", userId, debouncedSearch],
    queryFn: () => searchFiles(userId, debouncedSearch),
    enabled: open && !!userId,
    staleTime: 0,
    retry: 1,
  });

  const isNotConnected = (error as any)?.message === "not_connected";

  const toggleFile = (file: DriveFile) => {
    const isSelected = selectedFiles.some((f) => f.id === file.id);
    if (isSelected) {
      onChange(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      onChange([...selectedFiles, file]);
    }
  };

  const removeFile = (id: string) => {
    onChange(selectedFiles.filter((f) => f.id !== id));
  };

  const getMimeIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("video")) return "🎬";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📑";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    return "📁";
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Selected files chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/20 border border-border/30 rounded-[2rem] min-h-[60px] items-center">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl border border-primary/20 bg-primary/5 text-primary max-w-[280px] hover:bg-primary/10 transition-all group animate-in zoom-in duration-300"
            >
              <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{getMimeIcon(file.mimeType)}</span>
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-black truncate hover:underline max-w-[180px] tracking-tight"
                onClick={(e) => e.stopPropagation()}
              >
                {file.name}
              </a>
              <button
                onClick={() => removeFile(file.id)}
                className="ml-1 rounded-xl hover:bg-destructive/20 hover:text-destructive p-1.5 shrink-0 transition-all active:scale-90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-auto px-4 opacity-50">
            {selectedFiles.length} FILES LINKED
          </p>
        </div>
      )}

      {/* Search popover trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            disabled={disabled}
            className="w-full h-16 justify-start text-muted-foreground font-black gap-4 rounded-[1.5rem] border-dashed border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01] active:scale-[0.99] transition-all group"
            onClick={() => setOpen(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <span className="truncate text-sm tracking-tight uppercase tracking-widest">{placeholder}</span>
            <div className="ml-auto w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Search className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0 glass-card rounded-[2rem] border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-300" align="start">
          <div className="flex items-center border-b border-white/10 px-6 h-16 bg-muted/40">
            <Search className="h-5 w-5 shrink-0 text-primary mr-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Drive files..."
              className="border-0 h-full px-0 shadow-none focus-visible:ring-0 text-sm font-bold bg-transparent placeholder:text-muted-foreground/50 tracking-tight"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
          </div>

          {isNotConnected ? (
            <div className="p-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-yellow-500/10 flex items-center justify-center mx-auto border border-yellow-500/20 shadow-xl shadow-yellow-500/5">
                <AlertTriangle className="h-10 w-10 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black tracking-tight">ENCRYPTION KEY MISSING</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                  Establish a secure connection in Settings to access these files.
                </p>
              </div>
              <Link to="/settings" onClick={() => setOpen(false)}>
                <Button className="h-12 px-8 rounded-xl font-black bg-foreground text-background shadow-xl">
                    SYNC PROTOCOLS
                </Button>
              </Link>
            </div>
          ) : isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-5 text-muted-foreground">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 animate-pulse">Scanning Drive...</span>
            </div>
          ) : data?.files?.length === 0 ? (
            <div className="p-16 text-center space-y-4">
               <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Search className="w-8 h-8 text-muted-foreground" />
               </div>
               <p className="text-sm font-black uppercase tracking-widest opacity-30">Null Result Search</p>
               <p className="text-[10px] text-muted-foreground px-8 font-medium leading-relaxed">
                 No protocol matches identified for "<span className="text-primary font-bold">{debouncedSearch}</span>" 
                 within {data.folderName || "root directories"}.
               </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <div className="p-3 space-y-2">
                {data?.files?.map((file) => {
                  const isSelected = selectedFiles.some((f) => f.id === file.id);
                  return (
                    <button
                      key={file.id}
                      className={cn(
                        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all group relative overflow-hidden",
                        isSelected 
                          ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10" 
                          : "hover:bg-primary/10 hover:translate-x-1"
                      )}
                      onClick={() => toggleFile(file)}
                    >
                      {isSelected && (
                         <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                      )}
                      <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform">{getMimeIcon(file.mimeType)}</span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-black truncate tracking-tight", isSelected ? "text-white" : "text-foreground")}>
                          {file.name}
                        </p>
                        <p className={cn("text-[9px] uppercase font-black tracking-[0.2em]", isSelected ? "text-white/60" : "text-muted-foreground/60")}>
                           {file.mimeType.split("/").pop()} file type
                        </p>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shadow-inner">
                          <CheckCircle2 className="text-white w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {data?.folderName && (
                <div className="px-8 py-4 bg-muted/20 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] truncate">
                            Scope: {data.folderName}
                        </span>
                    </div>
                </div>
              )}
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
