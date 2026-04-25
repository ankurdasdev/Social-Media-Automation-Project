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
} from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplatesResponse } from "@shared/api";
import { DriveFilePicker } from "@/components/drive/DriveFilePicker";
import { 
  EditableTextCell, 
  MultiTemplateSelect, 
  AttachmentCell 
} from "./GridCells";

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

function TemplateSelect({
  value,
  onChange,
  category,
  placeholder,
  ringColor,
  userId,
}: {
  value: string;
  onChange: (v: string) => void;
  category: "whatsapp" | "email" | "instagram";
  placeholder?: string;
  ringColor?: string;
  userId: string;
}) {
  const { data: templates = [] } = useQuery({
    queryKey: ["templates", category, userId],
    queryFn: () => fetchTemplates(userId, category),
  });

  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className={`h-8 shadow-none text-xs ${ringColor ?? ""}`}>
        <SelectValue placeholder={placeholder ?? "Select template..."} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__" className="text-xs text-muted-foreground">-- None --</SelectItem>
        {templates.map((t) => (
          <SelectItem key={t.id} value={t.name} className="text-xs">{t.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
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
                    <Label className="text-[9px] font-black text-muted-foreground">PERS. NAME</Label>
                    <Select value={form.personalizedNameWA} onValueChange={(v) => set("personalizedNameWA")(v)}>
                      <SelectTrigger className="h-10 rounded-lg bg-background/50 border-white/5 font-black text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">NAME (N)</SelectItem>
                        <SelectItem value="C">CASTING (C)</SelectItem>
                        <SelectItem value="NA">NONE (NA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">TEMPLATES</Label>
                    <TemplateSelect userId={contact.user_id} category="whatsapp" value={(form.templateSelectionWP as string[])?.[0] || ""} onChange={(v) => set("templateSelectionWP")([v])} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox checked={form.hasCustomMessageWA} onCheckedChange={(c) => set("hasCustomMessageWA")(!!c)} id="wa-custom" />
                    <Label htmlFor="wa-custom" className="text-[9px] font-black uppercase tracking-widest cursor-pointer">Override with Custom Message</Label>
                  </div>
                  {form.hasCustomMessageWA && (
                    <Textarea 
                      value={form.editableMessageWP} 
                      onChange={(e) => set("editableMessageWP")(e.target.value)}
                      className="min-h-[100px] rounded-xl bg-background/40 text-xs font-medium border-emerald-500/20"
                      placeholder="Write custom WhatsApp content..."
                    />
                  )}
                </div>
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
                    <Label className="text-[9px] font-black text-muted-foreground">PERS. NAME</Label>
                    <Select value={form.personalizedNameGmail} onValueChange={(v) => set("personalizedNameGmail")(v)}>
                      <SelectTrigger className="h-10 rounded-lg bg-background/50 border-white/5 font-black text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N">NAME (N)</SelectItem>
                        <SelectItem value="C">CASTING (C)</SelectItem>
                        <SelectItem value="NA">NONE (NA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">TEMPLATES</Label>
                    <TemplateSelect userId={contact.user_id} category="email" value={(form.templateSelectionGmail as string[])?.[0] || ""} onChange={(v) => set("templateSelectionGmail")([v])} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground">EMAIL SUBJECT</Label>
                    <Input value={form.editableGmailSubject || ""} onChange={(e) => set("editableGmailSubject")(e.target.value)} className="h-10 rounded-lg bg-background/50 border-white/5 font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox checked={form.hasCustomMessageEmail} onCheckedChange={(c) => set("hasCustomMessageEmail")(!!c)} id="email-custom" />
                      <Label htmlFor="email-custom" className="text-[9px] font-black uppercase tracking-widest cursor-pointer">Override with Custom Body</Label>
                    </div>
                    {form.hasCustomMessageEmail && (
                      <Textarea 
                        value={form.editableMessageGmail} 
                        onChange={(e) => set("editableMessageGmail")(e.target.value)}
                        className="min-h-[100px] rounded-xl bg-background/40 text-xs font-medium border-blue-500/20"
                        placeholder="Write custom email body..."
                      />
                    )}
                  </div>
                </div>
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
