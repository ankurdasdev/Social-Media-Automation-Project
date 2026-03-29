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
import {
  User,
  MessageCircle,
  Mail,
  Paperclip,
  FileText,
  Loader2,
  Instagram,
} from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Template, TemplatesResponse } from "@shared/api";

interface ContactDrawerProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = Partial<Contact>;

async function fetchTemplates(category: string): Promise<Template[]> {
  const res = await fetch(`/api/templates?category=${category}`);
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
}: {
  value: string;
  onChange: (v: string) => void;
  category: "whatsapp" | "email" | "instagram";
  placeholder?: string;
  ringColor?: string;
}) {
  const { data: templates = [] } = useQuery({
    queryKey: ["templates", category],
    queryFn: () => fetchTemplates(category),
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

  const set = (field: keyof Contact) => (val: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    if (!contact?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: "Saved", description: "Contact updated successfully." });
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!contact) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[450px] md:max-w-[500px] overflow-y-auto px-0">
        <SheetHeader className="px-6 pb-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2">
            {contact.name || "Unnamed Contact"}
            {contact.automationTrigger && (
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ml-1" title="Automation Active" />
            )}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {contact.actingContext || contact.castingName || "No specific role context provided."}
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Profile Context
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Acting Context</Label>
                <Input
                  value={form.actingContext ?? ""}
                  onChange={(e) => set("actingContext")(e.target.value)}
                  placeholder="e.g. Lead Detective"
                  className="h-8 shadow-none"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Project</Label>
                <Input
                  value={form.project ?? ""}
                  onChange={(e) => set("project")(e.target.value)}
                  placeholder="Project name"
                  className="h-8 shadow-none"
                />
              </div>
            </div>
            <div className="space-y-1 w-1/2 pr-2">
              <Label className="text-xs text-muted-foreground">Age Range</Label>
              <Input
                value={form.age ?? ""}
                onChange={(e) => set("age")(e.target.value)}
                placeholder="e.g. 24-32"
                className="h-8 shadow-none"
              />
            </div>
          </section>

          <Separator />

          {/* Outreach Tabs */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> Outreach Customization
            </h4>

            <Tabs defaultValue="whatsapp" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="whatsapp" className="text-xs gap-1.5 data-[state=active]:text-green-600 data-[state=active]:bg-green-50">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </TabsTrigger>
                <TabsTrigger value="gmail" className="text-xs gap-1.5 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50">
                  <Mail className="h-3.5 w-3.5" /> Email
                </TabsTrigger>
                <TabsTrigger value="instagram" className="text-xs gap-1.5 data-[state=active]:text-pink-600 data-[state=active]:bg-pink-50">
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </TabsTrigger>
              </TabsList>

              <div className="pt-4 p-1">
                {/* ── WhatsApp Tab ── */}
                <TabsContent value="whatsapp" className="space-y-4 m-0">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Primary Phone / WA</Label>
                    <Input
                      value={form.whatsapp ?? ""}
                      onChange={(e) => set("whatsapp")(e.target.value)}
                      placeholder="+91..."
                      className="h-8 shadow-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">WA Template</Label>
                      <TemplateSelect
                        value={form.templateSelectionWP ?? ""}
                        onChange={set("templateSelectionWP") as (v: string) => void}
                        category="whatsapp"
                        ringColor="focus:ring-green-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Salutation</Label>
                      <Select value={form.salutationWA ?? "Hi"} onValueChange={set("salutationWA")}>
                        <SelectTrigger className="h-8 shadow-none focus:ring-green-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hi">Hi</SelectItem>
                          <SelectItem value="Hey">Hey</SelectItem>
                          <SelectItem value="Dear Sir/Mam">Dear Sir/Mam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-wa"
                        checked={!!form.hasCustomMessageWA}
                        onCheckedChange={(c) => set("hasCustomMessageWA")(!!c)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <label htmlFor="custom-wa" className="text-sm font-medium leading-none">
                        Customized Message
                      </label>
                    </div>
                    {form.hasCustomMessageWA && (
                      <Textarea
                        value={form.editableMessageWP ?? ""}
                        onChange={(e) => set("editableMessageWP")(e.target.value)}
                        className="min-h-[100px] resize-y shadow-none focus-visible:ring-green-300 bg-green-50/30 text-sm mt-2"
                        placeholder="Type custom text..."
                      />
                    )}
                  </div>

                  <div className="space-y-1 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">WP Attachment</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.specialAttachmentWA ?? ""}
                        onChange={(e) => set("specialAttachmentWA")(e.target.value)}
                        placeholder="Headshot URL or PDF"
                        className="h-8 shadow-none"
                      />
                      <Button size="sm" variant="outline" className="h-8 px-2"><Paperclip className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Email Tab ── */}
                <TabsContent value="gmail" className="space-y-4 m-0">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Email Address</Label>
                    <Input
                      value={form.email ?? ""}
                      onChange={(e) => set("email")(e.target.value)}
                      placeholder="name@example.com"
                      className="h-8 shadow-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email Template</Label>
                      <TemplateSelect
                        value={form.templateSelectionGmail ?? ""}
                        onChange={set("templateSelectionGmail") as (v: string) => void}
                        category="email"
                        ringColor="focus:ring-blue-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Salutation</Label>
                      <Select value={form.salutationEmail ?? "Hi"} onValueChange={set("salutationEmail")}>
                        <SelectTrigger className="h-8 shadow-none focus:ring-blue-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hi">Hi</SelectItem>
                          <SelectItem value="Hey">Hey</SelectItem>
                          <SelectItem value="Dear Sir/Mam">Dear Sir/Mam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-email"
                        checked={!!form.hasCustomMessageEmail}
                        onCheckedChange={(c) => set("hasCustomMessageEmail")(!!c)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label htmlFor="custom-email" className="text-sm font-medium leading-none">
                        Customized Message
                      </label>
                    </div>
                    {form.hasCustomMessageEmail && (
                      <div className="space-y-2 mt-2">
                        <Input
                          value={form.editableGmailSubject ?? ""}
                          onChange={(e) => set("editableGmailSubject")(e.target.value)}
                          placeholder="Subject..."
                          className="h-8 shadow-none focus-visible:ring-blue-300 font-medium bg-blue-50/30"
                        />
                        <Textarea
                          value={form.editableMessageGmail ?? ""}
                          onChange={(e) => set("editableMessageGmail")(e.target.value)}
                          className="min-h-[120px] resize-y shadow-none focus-visible:ring-blue-300 bg-blue-50/30 text-sm"
                          placeholder="Email Body..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">Email Attachment</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.specialAttachmentGmail ?? ""}
                        onChange={(e) => set("specialAttachmentGmail")(e.target.value)}
                        placeholder="Portfolio requested..."
                        className="h-8 shadow-none"
                      />
                      <Button size="sm" variant="outline" className="h-8 px-2"><Paperclip className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Instagram Tab ── */}
                <TabsContent value="instagram" className="space-y-4 m-0">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Instagram Handle</Label>
                    <Input
                      value={form.instaHandle ?? ""}
                      onChange={(e) => set("instaHandle")(e.target.value)}
                      placeholder="@username"
                      className="h-8 shadow-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">IG Template</Label>
                      <TemplateSelect
                        value={form.templateSelectionIG ?? ""}
                        onChange={set("templateSelectionIG") as (v: string) => void}
                        category="instagram"
                        ringColor="focus:ring-pink-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Salutation</Label>
                      <Select value={form.salutationIG ?? "Hey"} onValueChange={set("salutationIG")}>
                        <SelectTrigger className="h-8 shadow-none focus:ring-pink-300">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hi">Hi</SelectItem>
                          <SelectItem value="Hey">Hey</SelectItem>
                          <SelectItem value="Dear Sir/Mam">Dear Sir/Mam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custom-ig"
                        checked={!!form.hasCustomMessageIG}
                        onCheckedChange={(c) => set("hasCustomMessageIG")(!!c)}
                        className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                      />
                      <label htmlFor="custom-ig" className="text-sm font-medium leading-none">
                        Customized Message
                      </label>
                    </div>
                    {form.hasCustomMessageIG && (
                      <Textarea
                        value={form.editableMessageIG ?? ""}
                        onChange={(e) => set("editableMessageIG")(e.target.value)}
                        className="min-h-[100px] resize-y shadow-none focus-visible:ring-pink-300 bg-pink-50/30 text-sm mt-2"
                        placeholder="Type custom text..."
                      />
                    )}
                  </div>

                  <div className="space-y-1 pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">Insta Attachment</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.specialAttachmentIG ?? ""}
                        onChange={(e) => set("specialAttachmentIG")(e.target.value)}
                        placeholder="Headshot URL or PDF"
                        className="h-8 shadow-none"
                      />
                      <Button size="sm" variant="outline" className="h-8 px-2"><Paperclip className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </section>

          <Separator />

          {/* Notes */}
          <section className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Private Notes</Label>
              <Textarea
                value={form.notes ?? ""}
                onChange={(e) => set("notes")(e.target.value)}
                className="h-24 shadow-none resize-y"
                placeholder="Add internal notes about this talent..."
              />
            </div>
          </section>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
