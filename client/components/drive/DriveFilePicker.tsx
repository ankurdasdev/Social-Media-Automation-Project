import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import {
  X, Search, Loader2, HardDrive, AlertTriangle, CheckCircle2,
  ZoomIn, ExternalLink, FileText, FileImage, FileVideo, FileAudio,
  File, Eye, Info, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DriveFile } from "@shared/api";
import { createPortal } from "react-dom";

// ─── Platform constraints ────────────────────────────────────────────────────

export type AttachmentPlatform = "whatsapp" | "instagram" | "email";

export const PLATFORM_RULES: Record<AttachmentPlatform, {
  maxMB: number;
  supported: string[];
  note?: string;
  color: string;
  badgeClass: string;
}> = {
  whatsapp: {
    maxMB: 64,
    supported: ["Images", "Video", "Audio", "PDF", "Docs"],
    color: "#25D366",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  instagram: {
    maxMB: 8,
    supported: ["Images only (JPEG, PNG, GIF)"],
    note: "⚠ Instagram only supports image attachments. Other file types will fail to send.",
    color: "#E1306C",
    badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  email: {
    maxMB: 25,
    supported: ["All file types"],
    color: "#4285F4",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileType(mimeType: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return mimeType.split("/")[1]?.toUpperCase() || "IMAGE";
  if (mimeType.includes("video")) return "VIDEO";
  if (mimeType.includes("audio")) return "AUDIO";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "SHEET";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "SLIDE";
  if (mimeType.includes("document") || mimeType.includes("word")) return "DOC";
  return mimeType.split("/").pop()?.toUpperCase() || "FILE";
}

export function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const cls = cn("shrink-0", className);
  if (mimeType.includes("image")) return <FileImage className={cls} />;
  if (mimeType.includes("video")) return <FileVideo className={cls} />;
  if (mimeType.includes("audio")) return <FileAudio className={cls} />;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("word")) return <FileText className={cls} />;
  return <File className={cls} />;
}

// Enforce limits and validate
export function validateFile(file: DriveFile, platform?: AttachmentPlatform): { valid: boolean; reason?: string } {
  if (!platform) return { valid: true };
  const rules = PLATFORM_RULES[platform];
  if (!rules) return { valid: true };

  // Check file size (maxMB)
  if (file.size && file.size > rules.maxMB * 1024 * 1024) {
    return {
      valid: false,
      reason: `File size exceeds ${rules.maxMB}MB platform limit (Selected file is ${formatFileSize(file.size)})`
    };
  }

  // Check file type / mimeType
  const mime = (file.mimeType || "").toLowerCase();
  if (platform === "instagram") {
    // Instagram only supports images
    if (!mime.startsWith("image/")) {
      return {
        valid: false,
        reason: "Instagram only supports image attachments (JPEG, PNG, GIF)"
      };
    }
  } else if (platform === "whatsapp") {
    // WhatsApp supports image, video, audio, pdf, document (docs)
    const isSupported = mime.startsWith("image/") || 
                        mime.startsWith("video/") || 
                        mime.startsWith("audio/") || 
                        mime.includes("pdf") || 
                        mime.includes("document") || 
                        mime.includes("word") || 
                        mime.includes("spreadsheet") || 
                        mime.includes("excel") || 
                        mime.includes("presentation") || 
                        mime.includes("powerpoint");
    if (!isSupported && mime) {
      return {
        valid: false,
        reason: "Unsupported file type for WhatsApp (Use image, video, audio, PDF, or documents)"
      };
    }
  }

  return { valid: true };
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

export function FilePreviewModal({ file, onClose }: { file: DriveFile; onClose: () => void }) {
  const isImg = (file.mimeType || "").startsWith("image/");

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-muted/30">
          <FileIcon mimeType={file.mimeType} className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
              {getFileType(file.mimeType)}{file.size ? ` · ${formatFileSize(file.size)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {file.webViewLink && (
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                title="Open in Drive"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="p-6 bg-black/20 min-h-[280px] flex items-center justify-center">
          {isImg && (file.thumbnailLink || file.webViewLink) ? (
            <img
              src={file.thumbnailLink || file.webViewLink || ""}
              alt={file.name}
              className="max-h-[55vh] max-w-full object-contain rounded-2xl shadow-lg border border-white/5"
            />
          ) : (
            <div className="text-center space-y-5">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
                <FileIcon mimeType={file.mimeType} className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black">{file.name}</p>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  {getFileType(file.mimeType)}{file.size ? ` · ${formatFileSize(file.size)}` : ""}
                </p>
              </div>
              {file.webViewLink && (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Google Drive
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Platform Constraints Banner ──────────────────────────────────────────────

export function PlatformConstraintsBanner({ platform }: { platform: AttachmentPlatform }) {
  const rule = PLATFORM_RULES[platform];
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-2xl border text-[11px] font-bold",
      rule.badgeClass
    )}>
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <div className="space-y-1 min-w-0">
        <p className="font-black uppercase tracking-widest">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Limits · Max {rule.maxMB} MB
        </p>
        <p className="opacity-80 leading-relaxed">
          Supported: {rule.supported.join(", ")}
        </p>
        {rule.note && (
          <p className="text-yellow-400 mt-1 leading-relaxed font-black">{rule.note}</p>
        )}
      </div>
    </div>
  );
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function searchFiles(userId: string, q: string): Promise<{ files: DriveFile[]; folderName?: string }> {
  const params = new URLSearchParams({ userId, q });
  const res = await fetch(`/api/drive/files?${params}`);
  if (res.status === 401) throw new Error("not_connected");
  if (!res.ok) throw new Error("search_failed");
  return res.json();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DriveFilePickerProps {
  userId: string;
  selectedFiles: DriveFile[];
  onChange: (files: DriveFile[]) => void;
  placeholder?: string;
  disabled?: boolean;
  inline?: boolean;
  platform?: AttachmentPlatform;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DriveFilePicker({
  userId,
  selectedFiles,
  onChange,
  placeholder = "Search Drive for files...",
  disabled = false,
  inline = false,
  platform,
}: DriveFilePickerProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [previewFile, setPreviewFile] = React.useState<DriveFile | null>(null);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["drive-files", userId, debouncedSearch],
    queryFn: () => searchFiles(userId, debouncedSearch),
    enabled: (inline || open) && !!userId,
    staleTime: 0,
    retry: 1,
  });

  const isNotConnected = (error as any)?.message === "not_connected";

  const toggleFile = (file: DriveFile) => {
    const isSelected = selectedFiles.some((f) => f.id === file.id);
    if (isSelected) {
      onChange(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      if (platform) {
        const check = validateFile(file, platform);
        if (!check.valid) {
          toast({
            title: "Platform Constraint Error",
            description: check.reason || "This file is ineligible for selection.",
            variant: "destructive"
          });
          return;
        }
      }
      onChange([...selectedFiles, file]);
    }
  };

  const removeFile = (id: string) => {
    onChange(selectedFiles.filter((f) => f.id !== id));
  };

  const isImage = (mimeType: string) => (mimeType || "").startsWith("image/");

  // ── Picker content ──────────────────────────────────────────────────────────

  const pickerContent = (
    <div className={cn(
      "flex flex-col w-full overflow-hidden",
      inline ? "bg-background/50 border border-white/10 rounded-[2rem]" : "bg-transparent"
    )}>

      {/* Platform Limits Banner — shown before search */}
      {platform && (
        <div className="px-4 pt-4 pb-0">
          <PlatformConstraintsBanner platform={platform} />
        </div>
      )}

      {/* Search bar */}
      <div className="flex items-center border-b border-white/10 px-4 h-14 bg-muted/40 mt-3">
        <Search className="h-4 w-4 shrink-0 text-primary mr-3" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Drive files..."
          className="border-0 h-full px-0 shadow-none focus-visible:ring-0 text-sm font-bold bg-transparent placeholder:text-muted-foreground/50 tracking-tight outline-none ring-0"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2 shrink-0" />}
      </div>

      {/* File list body */}
      {isNotConnected ? (
        <div className="p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-[2rem] bg-yellow-500/10 flex items-center justify-center mx-auto border border-yellow-500/20">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-black tracking-tight">Drive Not Connected</p>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest max-w-[220px] mx-auto leading-relaxed">
              Connect Google Drive in Settings to access files.
            </p>
          </div>
          <Link to="/integrations" onClick={() => setOpen(false)}>
            <Button className="h-11 px-7 rounded-xl font-black bg-foreground text-background shadow-xl">
              GO TO INTEGRATIONS
            </Button>
          </Link>
        </div>
      ) : isLoading ? (
        <div className="p-14 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 animate-pulse">Scanning Drive...</span>
        </div>
      ) : data?.files?.length === 0 ? (
        <div className="p-14 text-center space-y-3">
          <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-black uppercase tracking-widest opacity-30">No Results</p>
          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
            No files found for "<span className="text-primary font-bold">{debouncedSearch}</span>"
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[380px] min-h-[200px]">
          <div className="p-3 space-y-1.5">
            {data?.files?.map((file) => {
              const isSelected = selectedFiles.some((f) => f.id === file.id);
              const isImg = isImage(file.mimeType);
              const fileType = getFileType(file.mimeType);
              const fileSize = formatFileSize(file.size);
              const validation = validateFile(file, platform);
              return (
                <div
                  key={file.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group relative overflow-hidden cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : !validation.valid
                      ? "opacity-50 hover:bg-destructive/5 hover:border-destructive/10"
                      : "hover:bg-muted/60"
                  )}
                  onClick={() => toggleFile(file)}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                  )}

                  {/* Thumbnail or icon */}
                  <div className="shrink-0 w-9 h-9 relative rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center border border-white/5">
                    {isImg && file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-9 h-9 object-cover"
                      />
                    ) : (
                      <FileIcon
                        mimeType={file.mimeType}
                        className={cn("w-5 h-5", isSelected ? "text-primary-foreground/80" : "text-primary/70")}
                      />
                    )}
                  </div>

                  {/* File info */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-[13px] font-black truncate leading-tight",
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md",
                        isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {fileType}
                      </span>
                      {fileSize && (
                        <span className={cn(
                          "text-[9px] font-bold",
                          isSelected ? "text-primary-foreground/60" : "text-muted-foreground/60"
                        )}>
                          {fileSize}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions / Limitations warning badge */}
                  <div className="shrink-0 flex items-center gap-1.5 relative z-10">
                    {!validation.valid && (
                      <Badge
                        variant="destructive"
                        className="text-[8px] font-black tracking-widest uppercase px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 shrink-0"
                      >
                        Ineligible
                      </Badge>
                    )}

                    {/* Preview button — works for all files, not just images */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      title="Preview file"
                      className={cn(
                        "p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                        isSelected
                          ? "text-white/70 hover:bg-white/20"
                          : "text-muted-foreground hover:bg-muted hover:text-primary"
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shadow-inner">
                        <CheckCircle2 className="text-white w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {data?.folderName && (
            <div className="px-6 py-3 bg-muted/20 border-t border-white/5">
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
    </div>
  );

  return (
    <>
      {/* Preview modal — works for ALL file types */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Selected files chips */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/20 border border-border/30 rounded-2xl min-h-[52px] items-center">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border border-primary/20 bg-primary/5 text-primary max-w-full sm:max-w-[260px] hover:bg-primary/10 transition-all group animate-in zoom-in duration-300"
              >
                {/* Icon */}
                {isImage(file.mimeType) && file.thumbnailLink ? (
                  <img
                    src={file.thumbnailLink}
                    alt={file.name}
                    className="w-5 h-5 rounded object-cover border border-primary/20 shrink-0"
                  />
                ) : (
                  <FileIcon mimeType={file.mimeType} className="w-4 h-4 text-primary shrink-0" />
                )}
                {/* Name — opens preview on click */}
                <button
                  type="button"
                  className="text-xs font-black truncate hover:underline max-w-[160px] tracking-tight text-left"
                  title={`Preview: ${file.name}`}
                  onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                >
                  {file.name}
                </button>
                {/* Remove */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="ml-0.5 rounded-lg hover:bg-destructive/20 hover:text-destructive p-1 shrink-0 transition-all active:scale-90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-auto px-3 opacity-50">
              {selectedFiles.length} FILE{selectedFiles.length !== 1 ? "S" : ""} LINKED
            </p>
          </div>
        )}

        {/* Picker: inline or dialog */}
        {inline ? (
          pickerContent
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                disabled={disabled}
                className="w-full h-14 justify-start text-muted-foreground font-black gap-3 rounded-[1.5rem] border-dashed border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                onClick={() => setOpen(true)}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <HardDrive className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate text-sm tracking-widest uppercase flex-1 text-left">{placeholder}</span>
                <Search className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="w-[min(540px,95vw)] max-h-[85vh] p-0 glass-card rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-300 flex flex-col"
            >
              <DialogHeader className="px-8 pt-8 pb-4 flex-shrink-0 border-b border-white/5 bg-muted/20 relative">
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <HardDrive className="h-6 w-6 text-primary shrink-0" />
                  SELECT DRIVE FILES
                </DialogTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Choose files matching platform size and type rules
                </p>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {pickerContent}
              </div>
              <DialogFooter className="px-8 py-5 border-t border-white/5 flex-shrink-0 bg-muted/10">
                <Button
                  onClick={() => setOpen(false)}
                  className="h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                  DONE SELECTING ({selectedFiles.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
