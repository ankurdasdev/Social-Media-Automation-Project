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
  const [isSending, setIsSending] = React.useState<string | null>(null);
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
      toast({ title: "Saved", description: "Contact updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async (channel: "whatsapp" | "email" | "instagram") => {
    if (!contact?.id) return;
    setIsSending(channel);
    try {
      const res = await fetch(`/api/outreach/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          userId: contact.user_id,
          channel,
          // Send latest form state
          ...form,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send");
      }
      toast({ title: "Sent", description: `Message sent via ${channel} successfully.` });
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (err: any) {
      toast({ title: "Send Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(null);
    }
  };

  if (!contact) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] md:max-w-[540px] overflow-y-auto px-0 border-l border-white/5 glass-card shadow-2xl animate-in slide-in-from-right duration-500">
        <SheetHeader className="px-8 pb-8 pt-10 border-b border-white/5 bg-muted/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-3xl font-black tracking-tighter flex items-center gap-2">
                {contact.name || "Unnamed Contact"}
                {contact.automationTrigger && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0 h-5 text-[9px] font-black uppercase tracking-widest animate-pulse">
                    Live
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {contact.actingContext || contact.castingName || "No Role Context"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="p-8 space-y-10">
          {/* Profile Section */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <User className="h-3 w-3" /> Profile Intelligence
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acting Context</Label>
                <Input
                  value={form.actingContext ?? ""}
                  onChange={(e) => set("actingContext")(e.target.value)}
                  placeholder="e.g. Lead Detective"
                  className="h-11 rounded-xl bg-background/50 border-border/50 focus:ring-primary shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project</Label>
                <Input
                  value={form.project ?? ""}
                  onChange={(e) => set("project")(e.target.value)}
                  placeholder="Project name"
                  className="h-11 rounded-xl bg-background/50 border-border/50 focus:ring-primary shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2 w-1/2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Age Range</Label>
              <Input
                value={form.age ?? ""}
                onChange={(e) => set("age")(e.target.value)}
                placeholder="e.g. 24-32"
                className="h-11 rounded-xl bg-background/50 border-border/50 focus:ring-primary shadow-inner"
              />
            </div>
          </section>

          <Separator className="bg-white/5" />

          {/* Outreach Tabs */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <FileText className="h-3 w-3" /> Outreach Terminal
            </h4>

            <Tabs defaultValue="whatsapp" className="w-full">
              <TabsList className="bg-muted/50 border border-border/50 p-1 h-12 rounded-2xl w-full">
                <TabsTrigger value="whatsapp" className="flex-1 rounded-xl gap-2 font-bold data-[state=active]:bg-background transition-all">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                </TabsTrigger>
                <TabsTrigger value="gmail" className="flex-1 rounded-xl gap-2 font-bold data-[state=active]:bg-background transition-all">
                  <Mail className="h-3.5 w-3.5 text-blue-500" /> Email
                </TabsTrigger>
                <TabsTrigger value="instagram" className="flex-1 rounded-xl gap-2 font-bold data-[state=active]:bg-background transition-all">
                  <Instagram className="h-3.5 w-3.5 text-pink-500" /> Insta
                </TabsTrigger>
              </TabsList>

              <div className="pt-8">
                {/* ── WhatsApp Tab ── */}
                <TabsContent value="whatsapp" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verification Number</Label>
                    <Input
                      value={form.whatsapp ?? ""}
                      onChange={(e) => set("whatsapp")(e.target.value)}
                      placeholder="+91..."
                      className="h-11 rounded-xl bg-background/50 border-border/50 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Casting Template</Label>
                      <TemplateSelect
                        value={form.templateSelectionWP ?? ""}
                        onChange={set("templateSelectionWP") as (v: string) => void}
                        category="whatsapp"
                        ringColor="focus:ring-emerald-500"
                        userId={contact.user_id}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Salutation</Label>
                      <Select value={form.salutationWA ?? "Hi"} onValueChange={set("salutationWA")}>
                        <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                          <SelectItem value="Hi">Hi</SelectItem>
                          <SelectItem value="Hey">Hey</SelectItem>
                          <SelectItem value="Dear Sir/Mam">Dear Sir/Mam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="custom-wa"
                        checked={!!form.hasCustomMessageWA}
                        onCheckedChange={(c) => set("hasCustomMessageWA")(!!c)}
                        className="w-5 h-5 rounded-lg border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <label htmlFor="custom-wa" className="text-sm font-bold tracking-tight">
                        Enable AI-Custom Message Override
                      </label>
                    </div>
                    {form.hasCustomMessageWA && (
                      <Textarea
                        value={form.editableMessageWP ?? ""}
                        onChange={(e) => set("editableMessageWP")(e.target.value)}
                        className="min-h-[120px] rounded-2xl resize-none bg-emerald-500/5 border-emerald-500/20 focus-visible:ring-emerald-500 text-sm p-4 font-medium"
                        placeholder="Type customized transmission..."
                      />
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Digital Assets (Cloud)</Label>
                    <DriveFilePicker
                      userId={contact.user_id}
                      selectedFiles={form.drive_attachments_wa || []}
                      onChange={(files) => set("drive_attachments_wa")(files)}
                      placeholder="Attach portfolio or headshots..."
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-3 rounded-2xl font-black shadow-xl shadow-emerald-500/20 h-14 transition-all hover:-translate-y-1 active:scale-95"
                      onClick={() => handleSend("whatsapp")}
                      disabled={!!isSending}
                    >
                      {isSending === "whatsapp" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      TRANSMIT VIA WHATSAPP
                    </Button>
                  </div>
                </TabsContent>

                {/* ── Email Tab ── */}
                <TabsContent value="gmail" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Digital Mail Address</Label>
                    <Input
                      value={form.email ?? ""}
                      onChange={(e) => set("email")(e.target.value)}
                      placeholder="name@example.com"
                      className="h-11 rounded-xl bg-background/50 border-border/50 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Strategy</Label>
                      <TemplateSelect
                        value={form.templateSelectionGmail ?? ""}
                        onChange={set("templateSelectionGmail") as (v: string) => void}
                        category="email"
                        ringColor="focus:ring-blue-500"
                        userId={contact.user_id}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Salutation</Label>
                      <Select value={form.salutationEmail ?? "Hi"} onValueChange={set("salutationEmail")}>
                        <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                          <SelectItem value="Hi">Hi</SelectItem>
                          <SelectItem value="Hey">Hey</SelectItem>
                          <SelectItem value="Dear Sir/Mam">Dear Sir/Mam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="custom-email"
                        checked={!!form.hasCustomMessageEmail}
                        onCheckedChange={(c) => set("hasCustomMessageEmail")(!!c)}
                        className="w-5 h-5 rounded-lg border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label htmlFor="custom-email" className="text-sm font-bold tracking-tight">
                        Enable Custom Email Content
                      </label>
                    </div>
                    {form.hasCustomMessageEmail && (
                      <div className="space-y-3">
                        <Input
                          value={form.editableGmailSubject ?? ""}
                          onChange={(e) => set("editableGmailSubject")(e.target.value)}
                          placeholder="Subject line..."
                          className="h-11 rounded-xl bg-blue-500/5 border-blue-500/20 focus-visible:ring-blue-500 font-bold"
                        />
                        <Textarea
                          value={form.editableMessageGmail ?? ""}
                          onChange={(e) => set("editableMessageGmail")(e.target.value)}
                          className="min-h-[150px] rounded-2xl resize-none bg-blue-500/5 border-blue-500/20 focus-visible:ring-blue-500 text-sm p-4 font-medium"
                          placeholder="Write email body..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Mail Attachments (Cloud)</Label>
                    <DriveFilePicker
                      userId={contact.user_id}
                      selectedFiles={form.drive_attachments_email || []}
                      onChange={(files) => set("drive_attachments_email")(files)}
                      placeholder="Attach profile documents..."
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-3 rounded-2xl font-black shadow-xl shadow-blue-500/20 h-14 transition-all hover:-translate-y-1 active:scale-95"
                      onClick={() => handleSend("email")}
                      disabled={!!isSending}
                    >
                      {isSending === "email" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      DISPATCH GMAIL SEQUENCE
                    </Button>
                  </div>
                </TabsContent>

                {/* ── Instagram Tab ── */}
                <TabsContent value="instagram" className="space-y-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Social Handle</Label>
                    <Input
                      value={form.instaHandle ?? ""}
                      onChange={(e) => set("instaHandle")(e.target.value)}
                      placeholder="@username"
                      className="h-11 rounded-xl bg-background/50 border-border/50 focus:ring-pink-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DM Template</Label>
                      <TemplateSelect
                        value={form.templateSelectionIG ?? ""}
                        onChange={set("templateSelectionIG") as (v: string) => void}
                        category="instagram"
                        ringColor="focus:ring-pink-500"
                        userId={contact.user_id}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Salutation</Label>
                      <Select value={form.salutationIG ?? "Hey"} onValueChange={set("salutationIG")}>
                        <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                          <SelectItem value="Hi">Hi</SelectItem>
                          <SelectItem value="Hey">Hey</SelectItem>
                          <SelectItem value="Dear Sir/Mam">Dear Sir/Mam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="custom-ig"
                        checked={!!form.hasCustomMessageIG}
                        onCheckedChange={(c) => set("hasCustomMessageIG")(!!c)}
                        className="w-5 h-5 rounded-lg border-2 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                      />
                      <label htmlFor="custom-ig" className="text-sm font-bold tracking-tight">
                        Enable Custom Direct Message
                      </label>
                    </div>
                    {form.hasCustomMessageIG && (
                      <Textarea
                        value={form.editableMessageIG ?? ""}
                        onChange={(e) => set("editableMessageIG")(e.target.value)}
                        className="min-h-[120px] rounded-2xl resize-none bg-pink-500/5 border-pink-500/20 focus-visible:ring-pink-500 text-sm p-4 font-medium"
                        placeholder="Type social text..."
                      />
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Social Assets (Cloud)</Label>
                    <DriveFilePicker
                      userId={contact.user_id}
                      selectedFiles={form.drive_attachments_ig || []}
                      onChange={(files) => set("drive_attachments_ig")(files)}
                      placeholder="Attach headshots for DM..."
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      size="lg"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white gap-3 rounded-2xl font-black shadow-xl shadow-pink-500/20 h-14 transition-all hover:-translate-y-1 active:scale-95"
                      onClick={() => handleSend("instagram")}
                      disabled={!!isSending}
                    >
                      {isSending === "instagram" ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      DISPATCH INSTAGRAM DM
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </section>

          <Separator className="bg-white/5" />

          {/* Notes */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <FileText className="h-3 w-3" /> Intelligence Logs
            </h4>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Internal Notes</Label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => set("notes")(e.target.value)}
                className="h-32 rounded-2xl resize-none bg-muted/30 border-white/5 focus-visible:ring-primary text-sm p-4"
                placeholder="Synchronize internal knowledge about this talent..."
              />
            </div>
          </section>

          <div className="pb-10 pt-4 flex gap-3">
             <Button
                variant="ghost"
                size="lg"
                className="flex-1 rounded-2xl font-bold h-14 text-muted-foreground hover:bg-muted/50"
                onClick={() => onOpenChange(false)}
             >
                CANCEL
             </Button>
             <Button
                size="lg"
                className="flex-[2] rounded-2xl font-black h-14 bg-foreground text-background hover:bg-foreground/90 shadow-2xl transition-all active:scale-95"
                onClick={handleSave}
                disabled={isSaving}
             >
                {isSaving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-5 w-5" />
                )}
                COMMIT CHANGES
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
