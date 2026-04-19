import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Contact, type ContactsResponse, type IngestionStatusResponse } from "@shared/api";
import { DataTable } from "@/components/contacts/DataTable";
import { columns } from "@/components/contacts/columns";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateUserId } from "@/lib/utils";

export default function Contacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [localSheets, setLocalSheets] = useState<string[]>([]);
  const userId = getOrCreateUserId();
  
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    castingName: "",
    whatsapp: "",
    email: "",
    instaHandle: "",
    actingContext: "",
    project: "",
    age: "",
    sheetName: ""
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", userId],
    queryFn: async (): Promise<Contact[]> => {
      const res = await fetch(`/api/contacts?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data: ContactsResponse = await res.json();
      return data.contacts;
    },
  });

  const contacts = contactsData || [];
  
  const dynamicSheets = useMemo(() => {
    const sheets = new Set([...contacts.map(c => c.sheetName).filter(Boolean), ...localSheets]);
    return Array.from(sheets) as string[];
  }, [contacts, localSheets]);

  const { data: ingestionStatus, refetch: refetchStatus, isFetching: isRefreshingStatus } =
    useQuery<IngestionStatusResponse>({
      queryKey: ["ingestion-status", userId],
      queryFn: async () => {
        const res = await fetch(`/api/ingestion/status?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch ingestion status");
        return res.json();
      },
      refetchInterval: (query) => {
        const data = query.state.data as IngestionStatusResponse | undefined;
        return data?.isRunning ? 3000 : false;
      },
    });

  const triggerIngestion = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ingestion/trigger?userId=${userId}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to trigger ingestion");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "SYNC STARTED",
        description: "Scanning for new casting opportunities.",
      });
      queryClient.invalidateQueries({ queryKey: ["ingestion-status"] });
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (leadConfig: typeof newLead) => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...leadConfig, 
          userId,
          source: "manual", 
          status: "pending",
          whatsappRun: !!leadConfig.whatsapp,
          emailRun: !!leadConfig.email,
          instagramRun: !!leadConfig.instaHandle
        }),
      });
      if (!res.ok) throw new Error("Failed to create lead");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "CONTACT ADDED", description: `${newLead.name} added to sheet.` });
      setIsAddLeadOpen(false);
      setNewLead({
      name: "",
      castingName: "",
      whatsapp: "",
      email: "",
      instaHandle: "",
      actingContext: "",
      project: "",
      age: "",
        sheetName: ""
    });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleDeleteSheet = (sheetName: string) => {
    // Remove from localSheets
    setLocalSheets(prev => prev.filter(s => s !== sheetName));
    // Unassign all contacts that belong to this sheet
    const contactsInSheet = (contactsData || []).filter(c => c.sheetName === sheetName);
    contactsInSheet.forEach(c => {
      fetch(`/api/contacts/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetName: "", userId }),
      }).then(() => queryClient.invalidateQueries({ queryKey: ["contacts"] }));
    });
  };

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids, payload }: { action: string, ids: string[], payload?: any }) => {
      const promises = ids.map((id) => {
        if (action === "delete") {
          return fetch(`/api/contacts/${id}?userId=${userId}`, { method: "DELETE" });
        } else if (action === "color" || action === "move") {
          const body = action === "color" ? { rowColor: payload, userId } : { sheetName: payload, userId };
          return fetch(`/api/contacts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
      });
      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "BULK ACTION SUCCESSFUL",
        description: `Processed ${variables.ids.length} contacts successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleBulkTrigger = (contactIds: string[]) => {
    toast({
      title: "OUTREACH SENT",
      description: `Dispatched ${contactIds.length} messages via outreach system.`,
    });
  };

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    refetchStatus();
  };

  const submitAddLead = () => {
    if (!newLead.name.trim()) return toast({title: "Error", description: "Name is required", variant: "destructive"});
    addLeadMutation.mutate(newLead);
  };

  const handleOpenAddLead = () => {
    setNewLead({
      name: "",
      castingName: "",
      whatsapp: "",
      email: "",
      instaHandle: "",
      actingContext: "",
      project: "",
      age: "",
      sheetName: activeTab === "all" ? "" : activeTab
    });
    setIsAddLeadOpen(true);
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col space-y-10 pb-10 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 px-6 pt-4">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black tracking-[0.2em] uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Contact List :: Active
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground text-glow whitespace-nowrap">LEAD <span className="text-primary italic">CONTACTS</span></h1>
            <p className="text-muted-foreground/80 text-sm font-medium max-w-xl leading-relaxed">
              Real-time synchronization of casting opportunities across your sheets. 
              Assign templates and initiate automated outreach messages.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-16 border-white/10 bg-background/30 backdrop-blur-xl hover:bg-muted/50 rounded-2xl font-black px-8 shadow-xl transition-all active:scale-[0.98] group"
              disabled={triggerIngestion.isPending || ingestionStatus?.isRunning}
              onClick={() => triggerIngestion.mutate()}
            >
              {(triggerIngestion.isPending || ingestionStatus?.isRunning) ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
              ) : (
                <RefreshCw className="mr-3 h-5 w-5 text-primary group-hover:rotate-180 transition-transform duration-700" />
              )}
              SYNC CONTACTS
            </Button>
            <Button size="lg" onClick={handleOpenAddLead} className="h-16 bg-foreground text-background hover:bg-foreground/90 shadow-2xl shadow-primary/20 rounded-2xl font-black px-10 transition-all hover:-translate-y-1 active:scale-[0.98]">
              <Plus className="mr-3 h-6 w-6" /> ADD CONTACT
            </Button>
          </div>
        </div>

        {ingestionStatus?.isRunning && (
          <div className="px-6">
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-row items-center justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-500 opacity-[0.02] -z-10 group-hover:scale-x-110 transition-transform duration-1000 origin-left" />
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg">
                    <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-base font-black text-blue-500 uppercase tracking-tighter">Sync In Progress</h3>
                    <p className="text-xs font-bold text-blue-400 opacity-70 tracking-widest uppercase">
                      Loading contacts from your sources...
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Grid Section */}
        <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col min-h-[500px]">
          {contactsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Loading Contacts...</p>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={contacts} 
              onTriggerAction={handleBulkTrigger}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshingStatus || contactsLoading}
              onBulkAction={(action, ids, payload) => bulkMutation.mutate({ action, ids, payload })}
              onUpdateContact={(id, data) => {
                fetch(`/api/contacts/${id}?userId=${userId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...data, userId }),
                }).then(() => queryClient.invalidateQueries({ queryKey: ["contacts"] }));
              }}
              uniqueSheets={dynamicSheets}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAddSheet={(sheet) => setLocalSheets(prev => [...prev, sheet])}
              onDeleteSheet={handleDeleteSheet}
            />
          )}
        </div>
      </div>

      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card border-white/10 dark:border-white/5 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <DialogHeader className="p-8 pb-4 bg-muted/30">
            <DialogTitle className="text-3xl font-black tracking-tighter">ADD NEW <span className="text-primary italic">CONTACT</span></DialogTitle>
            <DialogDescription className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Fill in the details to establish a new contact record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 scrollbar-hide">
            <div className="space-y-6">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Contact Name</Label>
                    <Input value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold focus:ring-primary shadow-inner" placeholder="E.g. John Doe" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Casting Contact</Label>
                        <Input value={newLead.castingName} onChange={e => setNewLead({...newLead, castingName: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Sheet Name</Label>
                        <Select value={newLead.sheetName} onValueChange={(val) => setNewLead({ ...newLead, sheetName: val })}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            {dynamicSheets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">WhatsApp Number</Label>
                        <Input value={newLead.whatsapp} onChange={e => setNewLead({...newLead, whatsapp: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold" placeholder="+91..." />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Instagram Link</Label>
                        <Input value={newLead.instaHandle} onChange={e => setNewLead({...newLead, instaHandle: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold" placeholder="@username" />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Email Address</Label>
                    <Input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold" placeholder="protocol@example.com" />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Context / Role</Label>
                    <Input value={newLead.actingContext} onChange={e => setNewLead({...newLead, actingContext: e.target.value})} className="h-12 rounded-xl bg-muted/40 border-border/50 font-bold" placeholder="E.g. Lead Antagonist" />
                </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/30 border-t border-white/5 gap-4">
            <Button variant="ghost" onClick={() => setIsAddLeadOpen(false)} className="h-12 rounded-xl font-black text-[11px] uppercase tracking-widest">CANCEL</Button>
            <Button onClick={submitAddLead} disabled={addLeadMutation.isPending} className="h-12 rounded-xl bg-primary text-white font-black px-8 shadow-xl hover:shadow-primary/30 transition-all flex-1">
              {addLeadMutation.isPending ? <Loader2 className="mr-3 h-5 w-5 animate-spin"/> : <Plus className="mr-3 h-5 w-5" />}
              ADD CONTACT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

