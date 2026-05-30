import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextareaProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  platform?: "whatsapp" | "email" | "instagram";
}

export function RichTextarea({ value, onChange, className, placeholder, platform = "email" }: RichTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Sync external value changes if the editor is not currently focused
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(currentHTML);
      }, 300); // 300ms debounce to fix lagging
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (platform === "whatsapp" || platform === "instagram") {
      // Strip formatting on paste for WhatsApp and Instagram
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={cn("flex flex-col border border-input rounded-md shadow-sm overflow-hidden bg-background", className)}>
      <div className="flex items-center gap-1 p-2 border-b bg-muted/20">
        {platform !== "instagram" && (
          <>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand("bold"); }}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand("italic"); }}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand("underline"); }}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
          </>
        )}
        
        {platform === "email" && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand("hiliteColor", "yellow"); }}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Highlight"
            >
              <Highlighter className="w-4 h-4 text-yellow-500" />
            </button>
            {/* Extended email options could go here */}
          </>
        )}
      </div>
      <div
        ref={editorRef}
        className="flex-1 p-3 outline-none min-h-[100px] overflow-y-auto"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    </div>
  );
}
