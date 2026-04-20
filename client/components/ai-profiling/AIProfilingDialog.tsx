import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Brain } from "lucide-react";
import { cn, getOrCreateUserId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { UserAIKeyword, UserAIKeywordsResponse } from "@shared/api";

interface AIProfilingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIProfilingDialog({ open, onOpenChange }: AIProfilingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getOrCreateUserId();
  const [newKeyword, setNewKeyword] = useState("");

  const { data: keywordsData, isLoading } = useQuery<UserAIKeywordsResponse>({
    queryKey: ["ai-keywords", userId],
    queryFn: async () => {
      const res = await fetch(`/api/auth/keywords?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch keywords");
      return res.json();
    },
    enabled: open,
  });

  const keywords = keywordsData?.keywords || [];

  const updateMutation = useMutation({
    mutationFn: async (newKeywords: UserAIKeyword[]) => {
      const res = await fetch("/api/auth/keywords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, keywords: newKeywords }),
      });
      if (!res.ok) throw new Error("Failed to update keywords");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-keywords", userId] });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error saving keywords",
        description: err.message,
      });
    },
  });

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    if (keywords.some(k => k.word.toLowerCase() === newKeyword.toLowerCase().trim())) {
      toast({
        variant: "destructive",
        title: "Keyword already exists",
      });
      return;
    }
    const updated = [...keywords, { word: newKeyword.trim(), active: true }];
    updateMutation.mutate(updated);
    setNewKeyword("");
  };

  const handleToggleKeyword = (index: number) => {
    const updated = [...keywords];
    updated[index].active = !updated[index].active;
    updateMutation.mutate(updated);
  };

  const handleDeleteKeyword = (index: number) => {
    const updated = keywords.filter((_, i) => i !== index);
    updateMutation.mutate(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] glass-card border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-muted/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase">AI Ingestion Profiling</DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Define keywords for strict filtering.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="flex gap-3">
            <Input
              placeholder="Add keyword (e.g. Mumbai, Male)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              className="h-12 rounded-xl bg-background/50 border-border/50 font-bold"
            />
            <Button onClick={handleAddKeyword} disabled={updateMutation.isPending} className="h-12 px-5 rounded-xl shadow-lg">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading profiles...</p>
              </div>
            ) : keywords.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic font-medium">
                No active keywords. AI will scan everything.
              </div>
            ) : (
              keywords.map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/20 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id={`kw-${idx}`} 
                      checked={kw.active} 
                      onCheckedChange={() => handleToggleKeyword(idx)}
                      className="border-primary/30"
                    />
                    <label 
                      htmlFor={`kw-${idx}`} 
                      className={cn(
                        "font-bold text-sm transition-opacity",
                        !kw.active && "opacity-40 line-through"
                      )}
                    >
                      {kw.word}
                    </label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteKeyword(idx)}
                    className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="p-8 bg-muted/30 border-t border-white/5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 rounded-xl font-black text-[11px] uppercase tracking-widest">CLOSE</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
