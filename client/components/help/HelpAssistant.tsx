import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getOrCreateUserId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bot, Play, Maximize2, Minimize2, Sparkles, Star } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I add a contact?",
  "How to connect WhatsApp?",
  "What are template variables?",
  "How does auto-ingestion work?",
  "How to view analytics?",
  "What plans are available?",
];

export default function HelpAssistant() {
  const userId = getOrCreateUserId();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "🤖 Hey! I'm your **CastHub Assistant**. I know everything about the platform — ask me anything about contacts, templates, integrations, analytics, or billing. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch("/api/help/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId }),
      });
      if (!res.ok) throw new Error("Failed to get answer");
      return res.json() as Promise<{ answer: string }>;
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      // Show rating prompt after 5 exchanges
      if (messages.length >= 8) setShowRating(true);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🤖 Sorry, I ran into a problem. Please try again or use the Contact form for detailed support." },
      ]);
    },
  });

  const handleSend = (query?: string) => {
    const q = (query || input).trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    askMutation.mutate(q);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleRate = async (stars: number) => {
    setRating(stars);
    try {
      await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars, context: "ai_chat" }),
      });
    } catch { /* silent */ }
    setTimeout(() => setShowRating(false), 2000);
  };

  const renderChat = (expanded: boolean) => (
    <div className={cn("flex flex-col min-h-0", expanded ? "h-[70vh] flex-1" : "h-[500px] w-full")}>
      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl p-3.5 text-sm break-words overflow-hidden",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              )}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="text-foreground/80 leading-snug" {...props} />,
                    code: ({ node, ...props }) => (
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-primary text-xs break-all whitespace-pre-wrap" {...props} />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm p-3.5 text-sm flex gap-1.5 items-center h-10">
              <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:75ms]" />
              <span className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce [animation-delay:150ms]" />
            </div>
          </div>
        )}

        {/* Suggested questions (only at start) */}
        {messages.length <= 1 && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-1">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rating widget */}
        {showRating && !rating && (
          <div className="flex justify-center animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-muted/50 border border-border/50 rounded-2xl p-4 text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Was this helpful?</p>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star className="w-5 h-5 text-amber-500/30 hover:text-amber-500 hover:fill-amber-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {rating > 0 && (
          <div className="flex justify-center animate-in fade-in duration-300">
            <p className="text-xs font-bold text-emerald-500">Thanks for your feedback! ⭐</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 dark:bg-black/20 bg-muted/50 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about CastHub..."
          className="flex-1 bg-background border border-border rounded-xl px-4 h-11 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 font-medium"
          disabled={askMutation.isPending}
          aria-label="Ask a question"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || askMutation.isPending}
          className="rounded-xl shrink-0 bg-primary hover:bg-primary/90 text-white h-11 w-11"
        >
          <Play className="w-4 h-4 fill-current" />
        </Button>
      </form>
    </div>
  );

  return (
    <>
      <Card className="glass-card border-primary/30 shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)] flex flex-col overflow-hidden">
        <CardHeader className="p-6 border-b border-primary/10 bg-primary/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 text-primary relative">
                <Bot className="w-5 h-5" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg font-black tracking-tight text-primary">AI Help Assistant</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                  Ask me anything about CastHub
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/20 text-primary"
              onClick={() => setIsExpanded(true)}
              title="Expand Chat"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          {renderChat(false)}
        </CardContent>
      </Card>

      {/* Expanded dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] glass-card border-primary/30 p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 border-b border-primary/10 bg-primary/5 flex-shrink-0">
            <DialogTitle className="text-lg font-black tracking-tight text-primary flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <Bot className="w-5 h-5" />
              </div>
              AI Help Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col min-h-0 bg-background/50">
            {renderChat(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
