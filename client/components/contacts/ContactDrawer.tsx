import * as React from "react";
import { Contact } from "@shared/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MessageCircle,
  Mail,
  Paperclip,
  FileText,
  Loader2,
  Instagram,
  Send,
  ShieldCheck,
  X,
  Plus,
  Wand2,
  Sparkles,
  Check,
} from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplatesResponse } from "@shared/api";
import { DriveFilePicker } from "@/components/drive/DriveFilePicker";
import { cn, getOrCreateUserId } from "@/lib/utils";
import { 
  EditableTextCell, 
  MultiTemplateSelect, 
  AttachmentCell 
} from "./GridCells";

// ─── Salutation Picker (full-size, drawer version) ────────────────────────────
function SalutationPicker({
  value,
  onChange,
  accentClass = "text-primary",
  borderClass = "border-white/10",
}: {
  value: string;
  onChange: (v: string) => void;
  accentClass?: string;
  borderClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState("");
  const userId = getOrCreateUserId();
  const queryClient = useQueryClient();

  const { data: serverSalutations = [] } = useQuery({
    queryKey: ["salutations", userId],
    queryFn: async () => {
      const res = await fetch(`/api/salutations?userId=${userId}`);
      if (!res.ok) return [];
      return (await res.json()).salutations || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      await fetch("/api/salutations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["salutations", userId] }),
  });

  const defaults = ["Hi", "Hey", "Dear Sir", "Dear Mam"];
  const options = Array.from(new Set([...defaults, ...serverSalutations]));

  const handleAdd = () => {
    const v = custom.trim();
    if (!v) return;
    addMutation.mutate(v);
    onChange(v);
    setCustom("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full h-11 px-4 rounded-xl border text-sm font-bold text-left flex items-center justify-between transition-all hover:opacity-80",
            borderClass,
            "bg-background/50"
          )}
        >
          <span className={accentClass}>{value || "Select greeting..."}</span>
          <span className="text-muted-foreground text-xs">▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 rounded-2xl border-white/10 glass-card shadow-2xl space-y-1"
        align="start"
      >
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:bg-white/5",
              value === opt ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}
          >
            {value === opt && <Check className="h-3 w-3 text-primary shrink-0" />}
            <span>{opt}</span>
          </button>
        ))}
        <div className="h-px bg-white/5 my-2" />
        <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest px-2 pb-1">Custom</p>
        <div className="flex gap-2 px-1">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Type greeting..."
            className="h-9 text-xs font-bold rounded-xl bg-white/5 border-white/10"
          />
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={addMutation.isPending || !custom.trim()}
            className="h-9 w-9 shrink-0 rounded-xl bg-primary hover:bg-primary/90"
          >
            {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── AI-Powered Message Editor (drawer version) ──────────────────────────────
function MessageEditor({
  checked,
  onCheckedChange,
  value,
  onChange,
  placeholder,
  accentColor,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accentColor: string;
  label: string;
}) {
  const [localText, setLocalText] = React.useState(value || "");
  const [isAIMode, setIsAIMode] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => { setLocalText(value || ""); }, [value]);

  const handleGenerate = async () => {
    if (!aiPrompt.trim() && !localText.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/improve-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, currentText: localText }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setLocalText(data.result);
        onChange(data.result);
        setIsAIMode(false);
        setAiPrompt("");
      } else {
        alert(data.error || "AI generation failed.");
      }
    } catch (e: any) {
      alert("AI generation failed: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(c) => onCheckedChange(!!c)}
          className="border-primary/30"
        />
        <span className={cn("text-[11px] font-black uppercase tracking-widest", accentColor)}>
          {label}
        </span>
      </div>

      {checked && (
        <div className="rounded-2xl bg-white/3 border border-white/5 p-4 space-y-3 animate-in fade-in duration-300">
          {/* Mode toggle header */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {isAIMode ? "✦ AI Generator" : "✏ Custom Message"}
            </p>
            <button
              onClick={() => setIsAIMode(!isAIMode)}
              className={cn(
                "h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all",
                isAIMode
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <Sparkles className="h-3 w-3" />
              {isAIMode ? "Back to Edit" : "Use AI"}
            </button>
          </div>

          {isAIMode ? (
            <div className="space-y-3">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want (e.g. 'Write a warm outreach for a casting call')..."
                className="min-h-[90px] rounded-xl text-sm font-medium bg-primary/5 border-primary/20 resize-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <Button
                className="w-full h-11 rounded-xl font-black text-[11px] bg-primary hover:bg-primary/90 gap-2"
                onClick={handleGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                {isGenerating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> GENERATING...</>
                  : <><Wand2 className="h-4 w-4" /> GENERATE MESSAGE</>}
              </Button>
            </div>
          ) : (
            <Textarea
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={() => { if (localText !== value) onChange(localText); }}
              placeholder={placeholder}
              className="min-h-[140px] rounded-xl text-sm font-medium bg-background/50 border-white/10 resize-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ContactDrawerProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = Partial<Contact>;

async function fetchTemplates(userId: string, category: string): Promise<Template[]> {
  const res = await fetch(`/api/templates?category=${category}&userId=${userId}`);
  if (!res.ok) return [];
  const data: TemplatesResponse = await res.json();
  return data.templates;
}

export function DrawerMultiTemplateSelect({
  value,
  onChange,
  category,
  userId,
}: {
  value: string | string[];
  onChange: (v: string[]) => void;
  category: "whatsapp" | "email" | "instagram";
  userId: string;
}) {
  const currentIds = Array.isArray(value) ? value : (value ? [value] : []);
  const { data: templates = [] } = useQuery({
    queryKey: ["templates", category, userId],
    queryFn: () => fetchTemplates(userId, category),
  });

  const handleToggle = (id: string) => {
    if (currentIds.includes(id)) {
      onChange(currentIds.filter((i) => i !== id));
    } else {
      onChange([...currentIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-1.5 min-h-[40px] items-center rounded-lg bg-background/50 border border-white/5 w-full">
      {currentIds.map((id, idx) => {
        const t = templates.find((tmp) => tmp.id === id);
        return (
          <Badge key={id} variant="secondary" className="h-6 px-2 gap-1.5 text-[10px] font-black bg-primary/10 text-primary border-none">
            {idx + 1}. {t?.name || "..."}
            <X className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => handleToggle(id)} />
          </Badge>
        );
      })}
      <Select onValueChange={handleToggle}>
        <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-muted transition-all shadow-none flex justify-center items-center">
          <Plus className="w-3 h-3" />
        </SelectTrigger>
        <SelectContent>
            {templates.filter((t) => !currentIds.includes(t.id)).map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs font-black">{t.name}</SelectItem>
            ))}
            {templates.length === 0 && <div className="p-2 text-xs text-muted-foreground font-black">No templates</div>}
        </SelectContent>
      </Select>
      {currentIds.length === 0 && <span className="text-[10px] text-muted-foreground/50 px-2 font-black uppercase tracking-widest">Select...</span>}
    </div>
  );
}


export function ContactDrawer({ contact, open, onOpenChange }: ContactDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({});

  // Sync form state whenever the contact changes
  React.useEffect(() => {
    if (contact) {
      setForm({ ...contact });
    }
  }, [contact]);

  const set = (field: keyof Contact) => (val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    if (!contact?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: contact.user_id }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Updated", description: "Database record synchronized." });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Protocol update failed.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!contact) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] md:max-w-[700px] overflow-y-auto px-0 border-l border-white/5 glass-card shadow-2xl animate-in slide-in-from-right duration-500">
        <SheetHeader className="px-8 pb-8 pt-10 border-b border-white/5 bg-muted/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-3xl font-black tracking-tighter flex items-center gap-3">
                {form.name || "Unnamed Entity"}
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-black uppercase tracking-widest">{form.status || "IDLE"}</Badge>
              </SheetTitle>
              <SheetDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                UID: <span className="text-foreground font-black">{contact.id.slice(0,8).toUpperCase()}</span> :: REF: <span className="text-foreground font-black">{form.sheetName ? form.sheetName.toUpperCase() : "EXTERNAL"}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-8 space-y-12">
          {/* 1. Core Identity */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <User className="h-3 w-3" /> Core Identity
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input value={form.name ?? ""} onChange={(e) => set("name")(e.target.value)} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Casting Alias</Label>
                <Input value={form.castingName ?? ""} onChange={(e) => set("castingName")(e.target.value)} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acting Context</Label>
                 <Input value={form.actingContext ?? ""} onChange={(e) => set("actingContext")(e.target.value)} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Project</Label>
                 <Input value={form.project ?? ""} onChange={(e) => set("project")(e.target.value)} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Age Group</Label>
                <Input value={form.age ?? ""} onChange={(e) => set("age")(e.target.value)} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Source Sheet</Label>
                <Input value={form.sheetName ?? ""} disabled className="h-11 rounded-xl bg-muted/20 opacity-50 cursor-not-allowed font-mono text-xs" />
              </div>
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* 2. Communication Channels */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <MessageCircle className="h-3 w-3" /> Outreach Channels
            </h4>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Whatsapp</Label>
                 <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp")(e.target.value)} placeholder="+91..." className="h-11 rounded-xl bg-emerald-500/5 border-emerald-500/10" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gmail</Label>
                 <Input value={form.email ?? ""} onChange={(e) => set("email")(e.target.value)} placeholder="mail@example.com" className="h-11 rounded-xl bg-blue-500/5 border-blue-500/10" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Instagram</Label>
                 <Input value={form.instaHandle ?? ""} onChange={(e) => set("instaHandle")(e.target.value)} placeholder="@handle" className="h-11 rounded-xl bg-pink-500/5 border-pink-500/10" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visit Log</Label>
                 <Input value={form.visit ?? ""} onChange={(e) => set("visit")(e.target.value)} className="h-11 rounded-xl bg-background/50" />
               </div>
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* 3. Personalized Outreach Control */}
          <section className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <FileText className="h-3 w-3" /> Outreach Personalization
            </h4>

            <div className="space-y-8">
              {/* WhatsApp Config */}
              <div className="space-y-4 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">WA PROTOCOL</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted-foreground">DRIVE ATTACHMENTS</span>
                    <AttachmentCell attachments={form.drive_attachments_wa || []} onUpdate={(val) => set("drive_attachments_wa")(val)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">SALUTATION</Label>
                    <SalutationPicker
                      value={form.personalizedNameWA || "Hi"}
                      onChange={(v) => set("personalizedNameWA")(v)}
                      accentClass="text-emerald-400"
                      borderClass="border-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">TEMPLATES</Label>
                    <DrawerMultiTemplateSelect userId={contact.user_id} category="whatsapp" value={form.templateSelectionWP || []} onChange={(v) => set("templateSelectionWP")(v)} />
                  </div>
                </div>
                <MessageEditor
                  checked={!!form.hasCustomMessageWA}
                  onCheckedChange={(c) => set("hasCustomMessageWA")(c)}
                  value={form.editableMessageWP || ""}
                  onChange={(v) => set("editableMessageWP")(v)}
                  placeholder="Write custom WhatsApp message..."
                  accentColor="text-emerald-400"
                  label="Custom Message Override"
                />
              </div>

              {/* Gmail Config */}
              <div className="space-y-4 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">GMAIL PROTOCOL</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted-foreground">DRIVE ATTACHMENTS</span>
                    <AttachmentCell attachments={form.drive_attachments_email || []} onUpdate={(val) => set("drive_attachments_email")(val)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">SALUTATION</Label>
                    <SalutationPicker
                      value={form.personalizedNameGmail || "Hi"}
                      onChange={(v) => set("personalizedNameGmail")(v)}
                      accentClass="text-blue-400"
                      borderClass="border-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">TEMPLATES</Label>
                    <DrawerMultiTemplateSelect userId={contact.user_id} category="email" value={form.templateSelectionGmail || []} onChange={(v) => set("templateSelectionGmail")(v)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-muted-foreground">EMAIL SUBJECT</Label>
                  <Input
                    value={form.editableGmailSubject || ""}
                    onChange={(e) => set("editableGmailSubject")(e.target.value)}
                    placeholder="Override email subject line..."
                    className="h-11 rounded-xl bg-background/50 border-blue-500/10 font-medium text-sm"
                  />
                </div>
                <MessageEditor
                  checked={!!form.hasCustomMessageEmail}
                  onCheckedChange={(c) => set("hasCustomMessageEmail")(c)}
                  value={form.editableMessageGmail || ""}
                  onChange={(v) => set("editableMessageGmail")(v)}
                  placeholder="Write custom email body..."
                  accentColor="text-blue-400"
                  label="Custom Body Override"
                />
              </div>

              {/* Instagram Config */}
              <div className="space-y-4 p-6 rounded-2xl bg-pink-500/5 border border-pink-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-pink-500">INSTAGRAM PROTOCOL</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted-foreground">DRIVE ATTACHMENTS</span>
                    <AttachmentCell attachments={form.drive_attachments_ig || []} onUpdate={(val) => set("drive_attachments_ig")(val)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">SALUTATION</Label>
                    <SalutationPicker
                      value={form.personalizedNameIG || "Hi"}
                      onChange={(v) => set("personalizedNameIG")(v)}
                      accentClass="text-pink-400"
                      borderClass="border-pink-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">TEMPLATES</Label>
                    <DrawerMultiTemplateSelect userId={contact.user_id} category="instagram" value={form.templateSelectionIG || []} onChange={(v) => set("templateSelectionIG")(v)} />
                  </div>
                </div>
                <MessageEditor
                  checked={!!form.hasCustomMessageIG}
                  onCheckedChange={(c) => set("hasCustomMessageIG")(c)}
                  value={form.editableMessageIG || ""}
                  onChange={(v) => set("editableMessageIG")(v)}
                  placeholder="Write custom Instagram DM..."
                  accentColor="text-pink-400"
                  label="Custom Message Override"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* 4. Tracking Intel (Read-Only) */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Data Intel
            </h4>
            <div className="space-y-6">
               <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-muted/30 border border-white/5">
                     <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Followups</p>
                     <p className="text-xl font-black text-primary">{form.followups || "0"}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-white/5">
                     <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Last Sync</p>
                     <p className="text-[10px] font-mono font-bold text-foreground truncate">{form.lastContactedDate || "NONE"}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-white/5">
                     <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sessions</p>
                     <p className="text-xl font-black text-foreground">{form.totalDatesContacts || "0"}</p>
                  </div>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Bot Intel / Remarks</Label>
                  <Input value={form.automationComment ?? ""} onChange={(e) => set("automationComment")(e.target.value)} placeholder="Bot diagnostics..." className="h-11 rounded-xl bg-primary/5 border-primary/20 italic text-xs" />
               </div>
            </div>
          </section>

          <div className="pb-10 pt-4 flex gap-3">
             <Button variant="ghost" size="lg" className="flex-1 rounded-2xl font-bold h-14" onClick={() => onOpenChange(false)}>
                DISCARD
             </Button>
             <Button size="lg" className="flex-[2] rounded-2xl font-black h-14 bg-foreground text-background shadow-2xl transition-all" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                SYNC TO DATABASE
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
