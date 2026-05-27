import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextareaProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function RichTextarea({ value, onChange, className, placeholder }: RichTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null);

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
      onChange(editorRef.current.innerHTML);
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
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("hiliteColor", "yellow"); }}
          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
          title="Highlight"
        >
          <Highlighter className="w-4 h-4 text-yellow-500" />
        </button>
      </div>
      <div
        ref={editorRef}
        className="flex-1 p-3 outline-none min-h-[100px] overflow-y-auto"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    </div>
  );
}
