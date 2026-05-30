import React, { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, Underline, Highlighter, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Platform Constraints ────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  whatsapp: {
    maxChars: 65536,
    warnAt: 60000,
    supportsBold: true,
    supportsItalic: true,
    supportsUnderline: false,
    supportsHighlight: false,
    isRichText: false, // WA uses plain text with *bold* _italic_ markers
    warnings: {
      formatting: "WhatsApp only supports *bold* and _italic_ markdown — HTML formatting will be stripped on send.",
      charLimit: (n: number) => `WhatsApp has a 65,536 character limit. You are at ${n.toLocaleString()} characters.`,
    },
  },
  email: {
    maxChars: 100000,
    warnAt: 95000,
    supportsBold: true,
    supportsItalic: true,
    supportsUnderline: true,
    supportsHighlight: true,
    isRichText: true,
    warnings: {
      charLimit: (n: number) => `This email template is very long (${n.toLocaleString()} chars). Gmail may clip it.`,
    },
  },
  instagram: {
    maxChars: 1000,
    warnAt: 900,
    supportsBold: false,
    supportsItalic: false,
    supportsUnderline: false,
    supportsHighlight: false,
    isRichText: false,
    warnings: {
      formatting: "Instagram DMs only support plain text — no bold, italic or formatting.",
      charLimit: (n: number) => `Instagram DM limit is 1,000 characters. You are at ${n} — message will be truncated.`,
    },
  },
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextareaProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  platform?: "whatsapp" | "email" | "instagram";
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip HTML tags — used to count real chars for WA/IG which are plain text */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/** Get actual display character count */
function getCharCount(value: string, platform: string): number {
  if (platform === "whatsapp" || platform === "instagram") {
    return stripHtml(value).length;
  }
  return value.length;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RichTextarea({
  value,
  onChange,
  className,
  placeholder,
  platform = "email",
  textareaRef: externalRef,
}: RichTextareaProps) {
  const config = PLATFORM_CONFIG[platform];
  const isRich = config.isRichText;

  // For plain-text platforms (WA, IG), use a <textarea>
  // For email, use a contentEditable div
  const textareaInternalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || textareaInternalRef;
  const editorRef = useRef<HTMLDivElement>(null);

  const [warning, setWarning] = useState<string | null>(null);
  const charCount = getCharCount(value, platform);

  // ── Sync value → textarea (plain-text platforms) ──────────────────────────
  useEffect(() => {
    if (!isRich && textareaRef.current) {
      // Strip any HTML that may have been stored and show as plain text
      const plain = stripHtml(value);
      if (textareaRef.current.value !== plain) {
        textareaRef.current.value = plain;
      }
    }
  }, [value, isRich]);

  // ── Sync value → contentEditable (email) ─────────────────────────────────
  useEffect(() => {
    if (isRich && editorRef.current) {
      if (document.activeElement !== editorRef.current) {
        if (editorRef.current.innerHTML !== value) {
          editorRef.current.innerHTML = value || "";
        }
      }
    }
  }, [value, isRich]);

  // ── Check warnings on value change ────────────────────────────────────────
  useEffect(() => {
    if (charCount >= config.warnAt) {
      setWarning((config.warnings as any).charLimit?.(charCount) ?? null);
    } else {
      setWarning(null);
    }
  }, [charCount, config]);

  // ── Plain-text handler (WA + IG) ─────────────────────────────────────────
  const handlePlainInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const raw = (e.currentTarget as HTMLTextAreaElement).value;
      // For IG, enforce hard limit
      if (platform === "instagram" && raw.length > config.maxChars) {
        (e.currentTarget as HTMLTextAreaElement).value = raw.slice(0, config.maxChars);
        onChange(raw.slice(0, config.maxChars));
        return;
      }
      onChange(raw);
    },
    [onChange, platform, config.maxChars]
  );

  // ── Rich-text handler (email) ─────────────────────────────────────────────
  const handleRichInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // ── Handle paste on plain-text (strip formatting) ─────────────────────────
  const handlePlainPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      const next = before + text + after;
      ta.value = next;
      ta.selectionStart = ta.selectionEnd = start + text.length;
      onChange(next);
    },
    [onChange]
  );

  // ── WA Bold shortcut: wrap selection in *…* ───────────────────────────────
  const wrapWaMarkdown = useCallback(
    (marker: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.slice(start, end);
      const next =
        ta.value.slice(0, start) + marker + selected + marker + ta.value.slice(end);
      ta.value = next;
      ta.selectionStart = start + marker.length;
      ta.selectionEnd = end + marker.length;
      onChange(next);
      ta.focus();
    },
    [onChange, textareaRef]
  );

  // ── Email execCommand toolbar ─────────────────────────────────────────────
  const execRich = useCallback(
    (command: string, val?: string) => {
      document.execCommand(command, false, val);
      editorRef.current?.focus();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    },
    [onChange]
  );

  const isOverLimit = charCount > config.maxChars;
  const isNearLimit = charCount >= config.warnAt;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col border border-input rounded-xl shadow-sm overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/20 flex-wrap">
        {platform === "whatsapp" && (
          <>
            <ToolbarButton
              title="Bold (*bold*)"
              onClick={() => wrapWaMarkdown("*")}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              title="Italic (_italic_)"
              onClick={() => wrapWaMarkdown("_")}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <PlatformTag label="WA MARKDOWN" color="emerald" />
          </>
        )}

        {platform === "email" && (
          <>
            <ToolbarButton title="Bold" onMouseDown={(e) => { e.preventDefault(); execRich("bold"); }}>
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Italic" onMouseDown={(e) => { e.preventDefault(); execRich("italic"); }}>
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Underline" onMouseDown={(e) => { e.preventDefault(); execRich("underline"); }}>
              <Underline className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <ToolbarButton title="Highlight" onMouseDown={(e) => { e.preventDefault(); execRich("hiliteColor", "yellow"); }}>
              <Highlighter className="w-4 h-4 text-yellow-500" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <PlatformTag label="HTML RICH TEXT" color="blue" />
          </>
        )}

        {platform === "instagram" && (
          <>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <span className="text-[9px] font-black uppercase tracking-widest text-pink-500">
                PLAIN TEXT ONLY
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground/50 font-medium ml-1">
              — Bold, Italic &amp; formatting not supported by Instagram
            </span>
          </>
        )}
      </div>

      {/* Inline warning banner */}
      {(warning || (platform === "instagram" && charCount > 800)) && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 text-[10px] font-bold border-b",
          isOverLimit
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
        )}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {warning || `${charCount}/1000 characters — approaching Instagram limit`}
        </div>
      )}

      {/* Editor area */}
      {isRich ? (
        // Email: contentEditable div
        <div
          ref={editorRef}
          className="flex-1 p-4 outline-none min-h-[180px] overflow-y-auto text-sm leading-relaxed"
          contentEditable
          suppressContentEditableWarning
          onInput={handleRichInput}
          onBlur={handleRichInput}
          onPaste={(e) => {
            // Allow rich paste for email
          }}
          data-placeholder={placeholder}
          style={{
            // Placeholder via CSS
          }}
          dangerouslySetInnerHTML={value ? undefined : undefined}
        />
      ) : (
        // WA / IG: plain textarea (no RTL / cursor bugs)
        <textarea
          ref={textareaRef}
          className={cn(
            "flex-1 p-4 outline-none resize-none min-h-[180px] bg-transparent text-sm leading-relaxed font-normal placeholder:text-muted-foreground/50",
            isOverLimit && "text-destructive"
          )}
          placeholder={placeholder}
          onInput={handlePlainInput}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePlainPaste}
          spellCheck
          autoComplete="off"
          autoCorrect="off"
          dir="ltr"
        />
      )}

      {/* Footer: char count */}
      <div className={cn(
        "flex items-center justify-end px-4 py-2 border-t bg-muted/10",
        isOverLimit ? "bg-destructive/5" : ""
      )}>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          isOverLimit
            ? "text-destructive"
            : isNearLimit
            ? "text-yellow-500"
            : "text-muted-foreground/40"
        )}>
          {charCount.toLocaleString()}
          {platform === "instagram" && " / 1,000"}
          {platform === "whatsapp" && charCount > 50000 && ` / 65,536`}
          {" chars"}
        </span>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToolbarButton({
  children,
  title,
  onClick,
  onMouseDown,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

function PlatformTag({ label, color }: { label: string; color: "emerald" | "blue" | "pink" }) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  };
  return (
    <div className={cn("flex items-center px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ml-auto", colorMap[color])}>
      {label}
    </div>
  );
}
