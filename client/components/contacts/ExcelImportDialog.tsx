import * as React from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getOrCreateUserId, cn } from "@/lib/utils";

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedSheets: string[]) => void;
}

interface ParsedSheet {
  name: string;
  headers: string[];
  rows: any[][];
}

const targetSchema = [
  { key: "name", label: "Lead Name", required: true, synonyms: ["name", "full name", "lead name", "contact name", "talent name", "lead", "candidate", "actor"] },
  { key: "castingName", label: "Casting Name", required: false, synonyms: ["casting", "casting name", "casting director", "director", "agency"] },
  { key: "whatsapp", label: "WhatsApp Number", required: false, synonyms: ["whatsapp", "phone", "mobile", "tel", "phone number", "number", "contact", "cell"] },
  { key: "email", label: "Gmail Address", required: false, synonyms: ["email", "gmail", "email address", "address", "mail", "mailbox"] },
  { key: "instaHandle", label: "Instagram Handle", required: false, synonyms: ["instagram", "insta", "handle", "ig", "instagram handle", "social", "insta handle"] },
  { key: "actingContext", label: "Acting Context", required: false, synonyms: ["acting", "context", "experience", "bio", "acting context", "role", "description"] },
  { key: "project", label: "Project / Reference", required: false, synonyms: ["project", "reference", "film", "show", "audition", "production"] },
  { key: "age", label: "Age", required: false, synonyms: ["age", "years", "dob", "birthdate"] },
  { key: "notes", label: "Notes / Comments", required: false, synonyms: ["notes", "comments", "info", "additional", "remark", "remarks"] },
];

export function ExcelImportDialog({ isOpen, onClose, onImportComplete }: ExcelImportDialogProps) {
  const { toast } = useToast();
  const userId = getOrCreateUserId();

  const [step, setStep] = React.useState<"upload" | "mapping" | "importing">("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [sheets, setSheets] = React.useState<ParsedSheet[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = React.useState<number>(0);
  
  // Mapping state: record of active targetSchema.key -> excel header
  const [mappings, setMappings] = React.useState<Record<string, string>>({});
  // Track sheets that have been successfully queued for import
  const [queuedSheets, setQueuedSheets] = React.useState<Set<string>>(new Set());

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Smart Auto-Mapping Synonyms Matcher
  const runAutoMapper = (headers: string[]) => {
    const newMappings: Record<string, string> = {};
    
    targetSchema.forEach((schema) => {
      const match = headers.find((h) => {
        const cleanedHeader = h.toLowerCase().trim();
        return schema.synonyms.some(
          (syn) => cleanedHeader === syn || cleanedHeader.includes(syn) || syn.includes(cleanedHeader)
        );
      });
      if (match) {
        newMappings[schema.key] = match;
      }
    });

    setMappings(newMappings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv", "ods"].includes(ext || "")) {
      toast({
        variant: "destructive",
        title: "INVALID FILE TYPE",
        description: "Please upload only Excel spreadsheets (.xlsx, .xls, .csv, .ods).",
      });
      return;
    }

    setFile(selectedFile);
    setStep("importing");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        
        const parsedSheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
          const worksheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 }) as any[][];
          
          const headers = (json[0] || []).map((h) => String(h).trim()).filter(Boolean);
          const rows = json.slice(1);
          
          return { name, headers, rows };
        }).filter((s) => s.headers.length > 0);

        if (parsedSheets.length === 0) {
          toast({
            variant: "destructive",
            title: "EMPTY SPREADSHEET",
            description: "No columns or data rows found in the spreadsheet.",
          });
          setStep("upload");
          return;
        }

        setSheets(parsedSheets);
        setActiveSheetIdx(0);
        setQueuedSheets(new Set());
        runAutoMapper(parsedSheets[0].headers);
        setStep("mapping");

        toast({
          title: "SPREADSHEET PARSED",
          description: `Loaded ${parsedSheets.length} sheet(s) successfully.`,
        });
      } catch (err: any) {
        console.error("Excel parse error:", err);
        toast({
          variant: "destructive",
          title: "PARSE ERROR",
          description: "Failed to read Excel workbook: " + err.message,
        });
        setStep("upload");
      }
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "FILE READ ERROR",
        description: "Failed to read file from disk.",
      });
      setStep("upload");
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleSheetChange = (idx: number) => {
    setActiveSheetIdx(idx);
    runAutoMapper(sheets[idx].headers);
  };

  const handleImportCurrentSheet = async () => {
    const activeSheet = sheets[activeSheetIdx];
    
    // Validate mappings: Name is strictly required
    const nameMapping = mappings["name"];
    if (!nameMapping) {
      toast({
        variant: "destructive",
        title: "MAPPING REQUIRED",
        description: "You must map the Lead Name field to continue.",
      });
      return;
    }

    setStep("importing");

    try {
      const activeSheetHeaders = activeSheet.headers;
      
      const contactsPayload = activeSheet.rows
        .map((row) => {
          const contactObj: Record<string, any> = {
            sheetName: activeSheet.name,
            source: "manual",
            status: "pending",
          };

          targetSchema.forEach((schema) => {
            const mappedHeader = mappings[schema.key];
            if (mappedHeader) {
              const colIdx = activeSheetHeaders.indexOf(mappedHeader);
              if (colIdx !== -1 && row[colIdx] !== undefined) {
                contactObj[schema.key] = String(row[colIdx]).trim();
              }
            }
          });

          return contactObj;
        })
        .filter((c) => c.name); // only include rows that have a name

      if (contactsPayload.length === 0) {
        toast({
          variant: "destructive",
          title: "NO DATA TO IMPORT",
          description: `No valid contact rows with names found in sheet "${activeSheet.name}".`,
        });
        setStep("mapping");
        return;
      }

      const res = await fetch("/api/contacts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          contacts: contactsPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to batch insert contacts");
      }

      // Add to queued sheets
      const nextQueued = new Set(queuedSheets);
      nextQueued.add(activeSheet.name);
      setQueuedSheets(nextQueued);

      toast({
        title: "SHEET IMPORTED",
        description: `Imported ${contactsPayload.length} contacts to sheet "${activeSheet.name}".`,
      });

      // If all sheets are queued or imported, close dialog
      const unimported = sheets.filter((s) => !nextQueued.has(s.name));
      if (unimported.length === 0) {
        onImportComplete(Array.from(nextQueued));
        onClose();
        resetDialog();
      } else {
        // Go to the first unimported sheet
        const nextIdx = sheets.findIndex((s) => !nextQueued.has(s.name));
        if (nextIdx !== -1) {
          setActiveSheetIdx(nextIdx);
          runAutoMapper(sheets[nextIdx].headers);
        }
        setStep("mapping");
      }
    } catch (err: any) {
      console.error("[ExcelImport] Server error:", err);
      toast({
        variant: "destructive",
        title: "IMPORT FAILED",
        description: err.message,
      });
      setStep("mapping");
    }
  };

  const handleSkipSheet = () => {
    const activeSheet = sheets[activeSheetIdx];
    const nextQueued = new Set(queuedSheets);
    nextQueued.add(activeSheet.name); // mark as resolved (skipped)
    setQueuedSheets(nextQueued);

    const unimported = sheets.filter((s) => !nextQueued.has(s.name));
    if (unimported.length === 0) {
      if (nextQueued.size > 0) {
        onImportComplete(Array.from(nextQueued));
      }
      onClose();
      resetDialog();
    } else {
      const nextIdx = sheets.findIndex((s) => !nextQueued.has(s.name));
      if (nextIdx !== -1) {
        setActiveSheetIdx(nextIdx);
        runAutoMapper(sheets[nextIdx].headers);
      }
    }
  };

  const resetDialog = () => {
    setStep("upload");
    setFile(null);
    setSheets([]);
    setActiveSheetIdx(0);
    setMappings({});
    setQueuedSheets(new Set());
  };

  const activeSheet = sheets[activeSheetIdx];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetDialog(); } }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] glass-card border-white/10 dark:border-white/5 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <DialogHeader className="p-8 pb-4 bg-muted/30 border-b border-white/5 flex-shrink-0">
          <DialogTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            IMPORT <span className="text-primary italic">SPREADSHEET</span>
          </DialogTitle>
          <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {step === "upload" && "Select an Excel spreadsheet file to parse and map leads into columns."}
            {step === "mapping" && `Map fields for sheet "${activeSheet?.name}" (${activeSheetIdx + 1} of ${sheets.length}).`}
            {step === "importing" && "Securing and uploading spreadsheet rows to the data store..."}
          </DialogDescription>
        </DialogHeader>

        {/* Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto p-8 min-h-0 flex flex-col">
          
          {/* STEP 1: Drag & Drop File Selector */}
          {step === "upload" && (
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-white/10 hover:border-primary/50 bg-white/[0.01] hover:bg-primary/[0.02] rounded-[2rem] flex flex-col items-center justify-center gap-5 p-10 cursor-pointer transition-all duration-300 group shadow-inner"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv,.ods"
                  className="hidden"
                />
                
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <Upload className="h-10 w-10 text-primary" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">DRAG & DROP SPREADSHEET</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    OR <span className="text-primary hover:underline">BROWSE FROM DISK</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-muted/40 px-5 py-2.5 rounded-xl border border-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-4">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  Supports: .xlsx, .xls, .csv, .ods spreadsheet formats
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Excel Column Mapping Panel */}
          {step === "mapping" && activeSheet && (
            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
              
              {/* Sheets Sidebar */}
              <div className="lg:w-1/4 flex-shrink-0 flex flex-col gap-2.5 border-b lg:border-b-0 lg:border-r border-white/5 pb-6 lg:pb-0 lg:pr-6 overflow-y-auto max-h-[160px] lg:max-h-none">
                <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-2 px-2">Worksheets</p>
                
                {sheets.map((sheet, index) => {
                  const isCurrent = activeSheetIdx === index;
                  const isQueued = queuedSheets.has(sheet.name);
                  
                  return (
                    <button
                      key={sheet.name}
                      onClick={() => handleSheetChange(index)}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-xl text-left font-black text-xs transition-all relative group shrink-0",
                        isCurrent
                          ? "bg-primary/10 text-primary shadow-inner border border-primary/20"
                          : isQueued
                            ? "bg-emerald-500/5 text-emerald-500/80 border border-emerald-500/10 cursor-default"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent"
                      )}
                    >
                      <span className="truncate pr-2">{sheet.name}</span>
                      {isQueued ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity", isCurrent && "opacity-100 text-primary")} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Column Mapping Grid */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                  <div>
                    <h4 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      COLUMN MAPPING
                    </h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Identify how excel headers map to our lead fields.
                    </p>
                  </div>
                  
                  <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary tracking-widest uppercase">
                    {activeSheet.rows.length} rows detected
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/5">
                  {targetSchema.map((schema) => {
                    const isMapped = !!mappings[schema.key];
                    
                    return (
                      <div
                        key={schema.key}
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-2 items-center gap-4 p-4 rounded-2xl border transition-all",
                          isMapped
                            ? "bg-white/[0.02] border-primary/20"
                            : schema.required
                              ? "bg-red-500/5 border-red-500/20"
                              : "bg-muted/10 border-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            isMapped ? "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" : schema.required ? "bg-red-500 animate-pulse" : "bg-muted-foreground/30"
                          )} />
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-foreground">
                              {schema.label} {schema.required && <span className="text-red-500 font-bold">*</span>}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-bold mt-0.5">
                              {schema.required ? "Strictly required to build lead profile." : "Optional field."}
                            </p>
                          </div>
                        </div>

                        <Select
                          value={mappings[schema.key] || "skip"}
                          onValueChange={(val) => {
                            setMappings((prev) => {
                              const next = { ...prev };
                              if (val === "skip") {
                                delete next[schema.key];
                              } else {
                                next[schema.key] = val;
                              }
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/50 focus:ring-primary text-xs font-bold font-mono">
                            <SelectValue placeholder="Skip Column" />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-white/10 rounded-2xl max-h-56 z-[120]">
                            <SelectItem value="skip" className="text-xs font-bold font-mono text-muted-foreground hover:text-foreground">
                              [ Skip Column ]
                            </SelectItem>
                            {activeSheet.headers.map((h) => (
                              <SelectItem key={h} value={h} className="text-xs font-bold font-mono">
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Loading Progress Spinner */}
          {step === "importing" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-[300px]">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
                <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black tracking-tight uppercase">Processing Spreadsheet</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  Batch creating leads in the postgres database...
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        {step === "mapping" && activeSheet && (
          <DialogFooter className="p-8 bg-muted/30 border-t border-white/5 gap-3 flex-shrink-0 flex flex-row justify-end">
            <Button
              variant="ghost"
              onClick={handleSkipSheet}
              className="h-14 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              SKIP THIS SHEET
            </Button>
            <Button
              onClick={handleImportCurrentSheet}
              disabled={!mappings["name"]}
              className="h-14 px-8 rounded-xl bg-primary text-white font-black text-[10px] tracking-widest uppercase shadow-xl shadow-primary/20 hover:shadow-primary/30"
            >
              IMPORT WORKBOOK SHEET
            </Button>
          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}
