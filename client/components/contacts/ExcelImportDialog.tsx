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
  Check,
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
  { key: "status", label: "Status", required: false, synonyms: ["status", "state"] },
  { key: "whatsappCompleted", label: "WhatsApp Done", required: false, synonyms: ["whatsapp done", "whatsapp completed", "wa done"] },
  { key: "emailCompleted", label: "Email Done", required: false, synonyms: ["email done", "email completed", "gmail done"] },
  { key: "instagramCompleted", label: "Instagram Done", required: false, synonyms: ["instagram done", "instagram completed", "ig done"] },
  { key: "personalizedNameWA", label: "Personalized Name WA", required: false, synonyms: ["personalized name wa", "wa personalized name"] },
  { key: "personalizedNameGmail", label: "Personalized Name Gmail", required: false, synonyms: ["personalized name gmail", "gmail personalized name"] },
  { key: "personalizedNameIG", label: "Personalized Name IG", required: false, synonyms: ["personalized name ig", "ig personalized name"] },
  { key: "templateSelectionWP", label: "Template Selection WA", required: false, synonyms: ["template selection wa", "template wa", "wa template"] },
  { key: "templateSelectionGmail", label: "Template Selection Gmail", required: false, synonyms: ["template selection gmail", "template gmail", "gmail template"] },
  { key: "templateSelectionIG", label: "Template Selection IG", required: false, synonyms: ["template selection ig", "template ig", "ig template"] },
  { key: "salutationWA", label: "Salutation WA", required: false, synonyms: ["salutation wa", "wa salutation"] },
  { key: "salutationEmail", label: "Salutation Email", required: false, synonyms: ["salutation email", "email salutation"] },
  { key: "salutationIG", label: "Salutation IG", required: false, synonyms: ["salutation ig", "ig salutation"] },
  { key: "hasCustomMessageWA", label: "Has Custom Message WA", required: false, synonyms: ["has custom message wa"] },
  { key: "editableMessageWP", label: "Editable Message WA", required: false, synonyms: ["editable message wa", "custom message wa", "message wa"] },
  { key: "hasCustomMessageEmail", label: "Has Custom Message Email", required: false, synonyms: ["has custom message email"] },
  { key: "editableMessageGmail", label: "Editable Message Gmail", required: false, synonyms: ["editable message gmail", "custom message gmail", "message gmail"] },
  { key: "editableGmailSubject", label: "Editable Gmail Subject", required: false, synonyms: ["editable gmail subject", "custom subject gmail", "subject gmail"] },
  { key: "hasCustomMessageIG", label: "Has Custom Message IG", required: false, synonyms: ["has custom message ig"] },
  { key: "editableMessageIG", label: "Editable Message IG", required: false, synonyms: ["editable message ig", "custom message ig", "message ig"] },
  { key: "automationComment", label: "Automation Comment", required: false, synonyms: ["automation comment", "bot comment"] },
  { key: "rowColor", label: "Row Color", required: false, synonyms: ["row color", "color"] },
];

export function ExcelImportDialog({ isOpen, onClose, onImportComplete }: ExcelImportDialogProps) {
  const { toast } = useToast();
  const userId = getOrCreateUserId();

  const [step, setStep] = React.useState<"upload" | "mapping" | "importing">("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [sheets, setSheets] = React.useState<ParsedSheet[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = React.useState<number>(0);
  
  // Mapping state per sheet: record of sheetIndex -> excel header -> active targetSchema.key
  const [mappingsBySheet, setMappingsBySheet] = React.useState<Record<number, Record<string, string>>>({});
  // Track which excel columns are enabled per sheet: sheetIndex -> Set<string> of excel headers
  const [selectedColumnsBySheet, setSelectedColumnsBySheet] = React.useState<Record<number, Set<string>>>({});
  
  // Track sheets that have been successfully queued for import
  const [selectedSheets, setSelectedSheets] = React.useState<Set<string>>(new Set());
  const [skippedSheets, setSkippedSheets] = React.useState<Set<string>>(new Set());

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Smart Auto-Mapping Synonyms Matcher (Inverted: Header -> TargetKey)
  const runAutoMapper = (headers: string[], sheetIdx: number) => {
    const newMappings: Record<string, string> = {};
    
    headers.forEach((h) => {
      const cleanedHeader = h.toLowerCase().trim();
      const match = targetSchema.find((schema) => 
        schema.synonyms.some((syn) => cleanedHeader === syn || cleanedHeader.includes(syn) || syn.includes(cleanedHeader))
      );
      if (match) {
        newMappings[h] = match.key;
      }
    });

    setMappingsBySheet((prev) => ({
      ...prev,
      [sheetIdx]: newMappings,
    }));
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
        setSelectedSheets(new Set());
        setSkippedSheets(new Set());
        
        // Default all columns to selected for all sheets
        const initialSelections: Record<number, Set<string>> = {};
        parsedSheets.forEach((s, idx) => {
          initialSelections[idx] = new Set(s.headers);
        });
        setSelectedColumnsBySheet(initialSelections);

        setMappingsBySheet({});
        
        // Only run auto mapper if we don't have mappings for this sheet yet
        const initialMappings: Record<number, Record<string, string>> = {};
        const firstSheetMappings: Record<string, string> = {};
        
        parsedSheets[0].headers.forEach((h) => {
          const cleanedHeader = h.toLowerCase().trim();
          const match = targetSchema.find((schema) => 
            schema.synonyms.some((syn) => cleanedHeader === syn || cleanedHeader.includes(syn) || syn.includes(cleanedHeader))
          );
          if (match) {
            firstSheetMappings[h] = match.key;
          }
        });
        initialMappings[0] = firstSheetMappings;
        setMappingsBySheet(initialMappings);
        
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
    if (!mappingsBySheet[idx]) {
      runAutoMapper(sheets[idx].headers, idx);
    }
  };

  const advanceToNextPending = (processedSet: Set<string>) => {
    const unimported = sheets.filter((s) => !processedSet.has(s.name));
    if (unimported.length > 0) {
      const nextIdx = sheets.findIndex((s) => !processedSet.has(s.name));
      if (nextIdx !== -1) {
        setActiveSheetIdx(nextIdx);
        if (!mappingsBySheet[nextIdx]) {
          runAutoMapper(sheets[nextIdx].headers, nextIdx);
        }
      }
    }
  };

  const handleSelectSheet = () => {
    const activeSheet = sheets[activeSheetIdx];
    const currentMappings = mappingsBySheet[activeSheetIdx] || {};
    const currentSelectedCols = selectedColumnsBySheet[activeSheetIdx] || new Set();
    
    // Check if name is mapped and selected
    const isNameMapped = Array.from(currentSelectedCols).some(h => currentMappings[h] === "name");

    if (!isNameMapped) {
      toast({
        variant: "destructive",
        title: "MAPPING REQUIRED",
        description: "You must map at least one selected Excel column to the Lead Name field to select this sheet.",
      });
      return;
    }

    const nextSelected = new Set(selectedSheets);
    const nextSkipped = new Set(skippedSheets);

    // Toggle logic if already selected
    if (nextSelected.has(activeSheet.name)) {
      nextSelected.delete(activeSheet.name);
      setSelectedSheets(nextSelected);
      return;
    }

    nextSelected.add(activeSheet.name);
    nextSkipped.delete(activeSheet.name);

    setSelectedSheets(nextSelected);
    setSkippedSheets(nextSkipped);
    
    advanceToNextPending(new Set([...nextSelected, ...nextSkipped]));
  };

  const handleSkipSheet = () => {
    const activeSheet = sheets[activeSheetIdx];
    const nextSkipped = new Set(skippedSheets);
    const nextSelected = new Set(selectedSheets);

    // Toggle logic if already skipped
    if (nextSkipped.has(activeSheet.name)) {
      nextSkipped.delete(activeSheet.name);
      setSkippedSheets(nextSkipped);
      return;
    }

    nextSkipped.add(activeSheet.name); 
    nextSelected.delete(activeSheet.name);

    setSkippedSheets(nextSkipped);
    setSelectedSheets(nextSelected);

    advanceToNextPending(new Set([...nextSelected, ...nextSkipped]));
  };

  const handleNextSheet = () => {
    const nextIdx = (activeSheetIdx + 1) % sheets.length;
    setActiveSheetIdx(nextIdx);
    if (!mappingsBySheet[nextIdx]) {
      runAutoMapper(sheets[nextIdx].headers, nextIdx);
    }
  };

  const handleImportAllSelected = async () => {
    if (selectedSheets.size === 0) return;

    setStep("importing");

    try {
      let allContactsPayload: any[] = [];

      sheets.forEach((sheet, idx) => {
        if (selectedSheets.has(sheet.name)) {
          const currentMappings = mappingsBySheet[idx] || {};
          const currentSelectedCols = selectedColumnsBySheet[idx] || new Set();
          const sheetHeaders = sheet.headers;
          
          const sheetContacts = sheet.rows
            .map((row) => {
              const contactObj: Record<string, any> = {
                sheetName: sheet.name,
                source: "manual",
                status: "pending",
              };

              const extraNotes: string[] = [];

              sheetHeaders.forEach((header, colIdx) => {
                if (currentSelectedCols.has(header)) {
                  const val = row[colIdx];
                  if (val !== undefined && val !== "") {
                    const mappedKey = currentMappings[header];
                    if (mappedKey) {
                      // It's mapped to a target schema field
                      contactObj[mappedKey] = String(val).trim();
                    } else {
                      // It's unmapped but selected, goes to notes
                      extraNotes.push(`${header}: ${String(val).trim()}`);
                    }
                  }
                }
              });

              if (extraNotes.length > 0) {
                 const existingNotes = contactObj["notes"] ? contactObj["notes"] + "\n\n" : "";
                 contactObj["notes"] = existingNotes + "Extra Data:\n" + extraNotes.join("\n");
              }

              return contactObj;
            })
            .filter((c) => c.name); // only include rows that have a name

          allContactsPayload = allContactsPayload.concat(sheetContacts);
        }
      });

      if (allContactsPayload.length === 0) {
        toast({
          variant: "destructive",
          title: "NO DATA TO IMPORT",
          description: "No valid contact rows with names found in the selected sheets.",
        });
        setStep("mapping");
        return;
      }

      const res = await fetch("/api/contacts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          contacts: allContactsPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to batch insert contacts");
      }

      toast({
        title: "SHEETS IMPORTED",
        description: `Imported ${allContactsPayload.length} contacts from ${selectedSheets.size} sheet(s).`,
      });

      onImportComplete(Array.from(selectedSheets));
      onClose();
      resetDialog();

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

  const resetDialog = () => {
    setStep("upload");
    setFile(null);
    setSheets([]);
    setActiveSheetIdx(0);
    setMappingsBySheet({});
    setSelectedColumnsBySheet({});
    setSelectedSheets(new Set());
    setSkippedSheets(new Set());
  };

  const activeSheet = sheets[activeSheetIdx];
  const currentMappings = mappingsBySheet[activeSheetIdx] || {};
  const currentSelectedCols = selectedColumnsBySheet[activeSheetIdx] || new Set();

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
                  const isSelected = selectedSheets.has(sheet.name);
                  const isSkipped = skippedSheets.has(sheet.name);
                  
                  return (
                    <button
                      key={sheet.name}
                      onClick={() => handleSheetChange(index)}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-xl text-left font-black text-xs transition-all relative group shrink-0",
                        isCurrent
                          ? "bg-primary/10 text-primary shadow-inner border border-primary/20"
                          : isSelected
                            ? "bg-emerald-500/5 text-emerald-500/80 border border-emerald-500/10"
                            : isSkipped
                              ? "bg-muted/30 text-muted-foreground border border-white/5 opacity-50"
                              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground border border-transparent"
                      )}
                    >
                      <span className={cn("truncate pr-2", isSkipped && "line-through")}>{sheet.name}</span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      ) : isSkipped ? (
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                      EXCEL COLUMNS
                    </h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Select columns to import and map them to database fields.
                    </p>
                  </div>
                  
                  <div className="px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary tracking-widest uppercase">
                    {activeSheet.rows.length} rows detected
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/5">
                  {activeSheet.headers.map((header) => {
                    const isSelected = currentSelectedCols.has(header);
                    const mappedKey = currentMappings[header];
                    const matchedSchema = targetSchema.find(s => s.key === mappedKey);
                    
                    return (
                      <div
                        key={header}
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-2 items-center gap-4 p-4 rounded-2xl border transition-all",
                          isSelected 
                            ? mappedKey 
                              ? "bg-white/[0.02] border-primary/20" // selected & mapped
                              : "bg-amber-500/5 border-amber-500/20" // selected & unmapped (goes to notes)
                            : "bg-muted/10 border-white/5 opacity-50" // unselected
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {/* Toggle selection */}
                          <button
                            onClick={() => {
                              setSelectedColumnsBySheet(prev => {
                                const next = { ...prev };
                                const set = new Set(next[activeSheetIdx] || []);
                                if (set.has(header)) set.delete(header);
                                else set.add(header);
                                next[activeSheetIdx] = set;
                                return next;
                              });
                            }}
                            className={cn(
                              "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary/50"
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>

                          <div className="truncate">
                            <p className="text-[11px] font-black uppercase tracking-wider text-foreground truncate pr-2">
                              {header}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-bold mt-0.5">
                              {isSelected ? (mappedKey ? `Mapped to: ${matchedSchema?.label}` : "Will append to notes") : "Excluded from import"}
                            </p>
                          </div>
                        </div>

                        <Select
                          disabled={!isSelected}
                          value={mappedKey || "unmapped"}
                          onValueChange={(val) => {
                            setMappingsBySheet((prev) => {
                              const next = { ...prev };
                              const sheetMappings = { ...(next[activeSheetIdx] || {}) };
                              if (val === "unmapped") {
                                delete sheetMappings[header];
                              } else {
                                sheetMappings[header] = val;
                              }
                              next[activeSheetIdx] = sheetMappings;
                              return next;
                            });
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/50 focus:ring-primary text-xs font-bold font-mono truncate">
                            <SelectValue placeholder="Do Not Map" />
                          </SelectTrigger>
                          <SelectContent className="glass-card border-white/10 rounded-2xl max-h-56 z-[120]">
                            <SelectItem value="unmapped" className="text-xs font-bold font-mono text-muted-foreground hover:text-foreground">
                              [ Map to Notes (Unmapped) ]
                            </SelectItem>
                            {targetSchema.map((schema) => (
                              <SelectItem key={schema.key} value={schema.key} className="text-xs font-bold font-mono flex items-center gap-2">
                                {schema.label} {schema.required && "*"}
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
          <DialogFooter className="p-8 bg-muted/30 border-t border-white/5 flex-shrink-0 flex flex-col md:flex-row items-center justify-between w-full gap-4">
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="ghost"
                onClick={handleSkipSheet}
                className={cn(
                  "h-14 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all w-full md:w-auto",
                  skippedSheets.has(activeSheet.name) ? "bg-muted/50 text-muted-foreground" : "text-muted-foreground hover:text-foreground hover:bg-red-500/10"
                )}
              >
                {skippedSheets.has(activeSheet.name) ? "MARK PENDING" : "SKIP THIS SHEET"}
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleNextSheet}
                className="h-14 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-white/5 w-full md:w-auto"
              >
                NEXT SHEET
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleSelectSheet}
                className={cn(
                  "h-14 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all w-full md:w-auto",
                  selectedSheets.has(activeSheet.name) ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {selectedSheets.has(activeSheet.name) ? "UNSELECT SHEET" : "SELECT FOR IMPORT"}
              </Button>
            </div>
            
            <Button
              onClick={handleImportAllSelected}
              disabled={selectedSheets.size === 0}
              className="h-14 px-8 rounded-xl bg-primary text-white font-black text-[10px] tracking-widest uppercase shadow-xl shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 w-full md:w-auto"
            >
              IMPORT {selectedSheets.size} SELECTED SHEETS
            </Button>
          </DialogFooter>
        )}

      </DialogContent>
    </Dialog>
  );
}
