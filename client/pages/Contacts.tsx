import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
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
      const res = await fetch("/api/ingestion/trigger", { method: "POST" });
      if (!res.ok) throw new Error("Failed to trigger ingestion");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ingestion Started",
        description: "The background scraper has been triggered manually.",
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
      toast({ title: "Lead Added", description: `${newLead.name} has been added.` });
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
        body: JSON.stringify({ sheetName: "" }),
      }).then(() => queryClient.invalidateQueries({ queryKey: ["contacts"] }));
    });
  };

  const bulkMutation = useMutation({
    mutationFn: async ({ action, ids, payload }: { action: string, ids: string[], payload?: any }) => {
      const promises = ids.map((id) => {
        if (action === "delete") {
          return fetch(`/api/contacts/${id}`, { method: "DELETE" });
        } else if (action === "color" || action === "move") {
          const body = action === "color" ? { rowColor: payload } : { sheetName: payload };
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
        title: "Bulk Action Completed",
        description: `Successfully processed ${variables.ids.length} contacts.`,
      });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const handleBulkTrigger = (contactIds: string[]) => {
    toast({
      title: "Automations Triggered",
      description: `Dispatched ${contactIds.length} outreach sequences via AI composer.`,
    });
    console.log("Triggering IDs:", contactIds);
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
      <div className="flex h-full flex-col">
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contact Network</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your casting pipeline, auto-ingested leads, and AI messaging.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              disabled={triggerIngestion.isPending || ingestionStatus?.isRunning}
              onClick={() => triggerIngestion.mutate()}
            >
              {(triggerIngestion.isPending || ingestionStatus?.isRunning) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Force Pipeline Sync
            </Button>
            <Button onClick={handleOpenAddLead}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead Manually
            </Button>
          </div>
        </div>

        {/* Dashboard Alerts / Info Cards */}
        {ingestionStatus?.isRunning && (
          <div className="px-6 pt-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-blue-800">Pipeline Ingestion Running</CardTitle>
                  <CardDescription className="text-xs text-blue-600">
                    Scraping WhatsApp groups and Instagram accounts. Auto-refreshing...
                  </CardDescription>
                </div>
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Data Grid Section */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {contactsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Lead Manually</DialogTitle>
            <DialogDescription>
              Create a new contact in your CRM. You can also assign them to a sheet later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Name</Label>
              <Input value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="col-span-3 h-8" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Casting Name</Label>
              <Input value={newLead.castingName} onChange={e => setNewLead({...newLead, castingName: e.target.value})} className="col-span-3 h-8" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Sheet</Label>
              <div className="col-span-3">
                <Select value={newLead.sheetName} onValueChange={(val) => setNewLead({ ...newLead, sheetName: val })}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="No Sheet Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicSheets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">WhatsApp</Label>
              <Input value={newLead.whatsapp} onChange={e => setNewLead({...newLead, whatsapp: e.target.value})} className="col-span-3 h-8" placeholder="+91..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Email</Label>
              <Input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="col-span-3 h-8" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Insta Handle</Label>
              <Input value={newLead.instaHandle} onChange={e => setNewLead({...newLead, instaHandle: e.target.value})} className="col-span-3 h-8" placeholder="@username" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Acting Context</Label>
              <Input value={newLead.actingContext} onChange={e => setNewLead({...newLead, actingContext: e.target.value})} className="col-span-3 h-8" placeholder="e.g. Lead Detective" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Project</Label>
              <Input value={newLead.project} onChange={e => setNewLead({...newLead, project: e.target.value})} className="col-span-3 h-8" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-xs">Age Range</Label>
              <Input value={newLead.age} onChange={e => setNewLead({...newLead, age: e.target.value})} className="col-span-3 h-8" placeholder="e.g. 25-30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>Cancel</Button>
            <Button onClick={submitAddLead} disabled={addLeadMutation.isPending}>
              {addLeadMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin"/>}
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
