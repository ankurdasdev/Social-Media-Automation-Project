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
import { File, X, Search, Loader2, HardDrive, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    staleTime: 30_000,
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
    <div className="space-y-2">
      {/* Selected files chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedFiles.map((file) => (
            <Badge
              key={file.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1 max-w-[200px]"
            >
              <span className="text-xs">{getMimeIcon(file.mimeType)}</span>
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs truncate hover:underline max-w-[130px]"
                onClick={(e) => e.stopPropagation()}
              >
                {file.name}
              </a>
              <button
                onClick={() => removeFile(file.id)}
                className="ml-0.5 rounded hover:bg-slate-300 p-0.5 shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search popover trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full h-8 justify-start text-muted-foreground font-normal gap-2"
            onClick={() => setOpen(true)}
          >
            <HardDrive className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">{placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="border-0 h-9 px-0 shadow-none focus-visible:ring-0 text-sm"
            />
          </div>

          {isNotConnected ? (
            <div className="p-4 text-center space-y-1">
              <AlertTriangle className="h-5 w-5 mx-auto text-yellow-500" />
              <p className="text-xs text-muted-foreground">
                Google Drive not connected.
              </p>
              <a
                href="/settings"
                className="text-xs text-primary underline"
                onClick={() => setOpen(false)}
              >
                Connect in Settings →
              </a>
            </div>
          ) : isLoading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Searching Drive...</span>
            </div>
          ) : data?.files?.length === 0 ? (
            <p className="p-4 text-xs text-center text-muted-foreground">
              No files found{debouncedSearch ? ` for "${debouncedSearch}"` : ""}.
              {data.folderName && (
                <span className="block mt-0.5 text-[10px]">Searching in: {data.folderName}</span>
              )}
            </p>
          ) : (
            <ScrollArea className="max-h-56">
              <div className="py-1">
                {data?.files?.map((file) => {
                  const isSelected = selectedFiles.some((f) => f.id === file.id);
                  return (
                    <button
                      key={file.id}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleFile(file)}
                    >
                      <span className="text-base shrink-0">{getMimeIcon(file.mimeType)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{file.mimeType.split("/").pop()}</p>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-[9px]">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
                {data?.folderName && (
                  <p className="px-3 py-1 text-[10px] text-muted-foreground border-t mt-1">
                    Showing files from: {data.folderName}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
