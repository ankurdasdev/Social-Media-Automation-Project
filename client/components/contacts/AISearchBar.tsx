import * as React from "react";
import { Search, Sparkles, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AISearchBarProps {
  onSearch: (prompt: string) => void;
  isLoading?: boolean;
  onClear?: () => void;
  className?: string;
}

export function AISearchBar({ onSearch, isLoading, onClear, className }: AISearchBarProps) {
  const [prompt, setPrompt] = React.useState("");

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (prompt.trim()) {
      onSearch(prompt.trim());
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className={cn(
        "relative group flex-1 max-w-xl animate-in fade-in slide-in-from-left-4 duration-500",
        className
      )}
    >
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5 text-primary animate-pulse shadow-primary/20" />
        )}
      </div>
      <Input
        placeholder="Ask AI to find contacts (e.g. 'Show talent from Delhi who hasn't been emailed')"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className={cn(
          "h-14 pl-14 pr-12 rounded-2xl bg-primary/5 border-primary/20 focus:bg-background focus:ring-primary font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)] transition-all placeholder:text-primary/30",
          isLoading && "opacity-50 pointer-events-none"
        )}
      />
      {prompt && (
        <button
          type="button"
          onClick={() => {
            setPrompt("");
            onClear?.();
          }}
          className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Button 
        type="submit"
        size="sm"
        disabled={!prompt.trim() || isLoading}
        className="absolute right-2 top-2 h-10 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
      >
        ASK AI
      </Button>
    </form>
  );
}
