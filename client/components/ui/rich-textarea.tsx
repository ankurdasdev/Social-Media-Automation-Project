import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  Bold, Italic, Underline, Highlighter, AlertTriangle, RotateCcw,
  ChevronDown, X as XIcon, GripVertical, Smile, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Undo2, Redo2, Type
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { cn } from "@/lib/utils";

// ─── Platform Constraints ─────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  whatsapp: {
    maxChars: 65536,
    warnAt: 60000,
    supportsBold: true,
    supportsItalic: true,
    supportsUnderline: false,
    supportsHighlight: false,
    isRichText: false,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function getCharCount(value: string, platform: string): number {
  if (platform === "whatsapp" || platform === "instagram") {
    return stripHtml(value).length;
  }
  return value.length;
}

// ─── Highlight Color Options ──────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { label: "Yellow", color: "#fef08a", tw: "bg-yellow-200" },
  { label: "Cyan", color: "#a5f3fc", tw: "bg-cyan-200" },
  { label: "Green", color: "#bbf7d0", tw: "bg-green-200" },
  { label: "Pink", color: "#fbcfe8", tw: "bg-pink-200" },
];

const TEXT_COLORS = [
  { label: "Default", color: "#000000", tw: "bg-black dark:bg-white" },
  { label: "Red", color: "#ef4444", tw: "bg-red-500" },
  { label: "Blue", color: "#3b82f6", tw: "bg-blue-500" },
  { label: "Green", color: "#22c55e", tw: "bg-green-500" },
];

const FONT_SIZES = [
  { label: "Small", size: "2" },
  { label: "Normal", size: "3" },
  { label: "Large", size: "5" },
  { label: "Huge", size: "7" },
];

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

  const textareaInternalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || textareaInternalRef;
  const editorRef = useRef<HTMLDivElement>(null);

  const [warning, setWarning] = useState<string | null>(null);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const charCount = getCharCount(value, platform);

  // ── Sync value → contentEditable ─────────────────────────────────────────
  useEffect(() => {
    if (isRich && editorRef.current) {
      if (document.activeElement !== editorRef.current) {
        if (editorRef.current.innerHTML !== value) {
          editorRef.current.innerHTML = value || "";
        }
      }
    }
  }, [value, isRich]);

  // ── Char limit warning ────────────────────────────────────────────────────
  useEffect(() => {
    if (charCount >= config.warnAt) {
      setWarning((config.warnings as any).charLimit?.(charCount) ?? null);
    } else {
      setWarning(null);
    }
  }, [charCount, config]);

  // ── History Stack (for plain text Undo/Redo) ──────────────────────────
  const [history, setHistory] = useState<string[]>([value || ""]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Helper to push to history
  const pushHistory = useCallback((newVal: string) => {
    setHistory((prev) => {
      const upToNow = prev.slice(0, historyIdx + 1);
      if (upToNow[upToNow.length - 1] === newVal) return prev; // no change
      return [...upToNow, newVal];
    });
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  useEffect(() => {
    if (!isRich && value !== history[historyIdx]) {
      pushHistory(value);
    }
  }, [value, isRich, history, historyIdx, pushHistory]);

  const handleUndo = useCallback(() => {
    if (isRich) {
      editorRef.current?.focus();
      document.execCommand("undo", false);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    } else {
      if (historyIdx > 0) {
        const newVal = history[historyIdx - 1];
        setHistoryIdx(historyIdx - 1);
        onChange(newVal);
      }
    }
  }, [isRich, history, historyIdx, onChange]);

  const handleRedo = useCallback(() => {
    if (isRich) {
      editorRef.current?.focus();
      document.execCommand("redo", false);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    } else {
      if (historyIdx < history.length - 1) {
        const newVal = history[historyIdx + 1];
        setHistoryIdx(historyIdx + 1);
        onChange(newVal);
      }
    }
  }, [isRich, history, historyIdx, onChange]);

  const handlePlainChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;
      if (platform === "instagram" && raw.length > config.maxChars) {
        const capped = raw.slice(0, config.maxChars);
        onChange(capped);
        return;
      }
      onChange(raw);
    },
    [onChange, platform, config.maxChars]
  );

  // ── Rich-text input handler (email) ──────────────────────────────────────
  const handleRichInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // ── Email: Strip external formatting on paste, preserve only text structure ──
  const handleRichPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Try to get HTML first for structure (links, line breaks), then plain text
    let pastedHtml = clipboardData.getData('text/html');
    let pastedText = clipboardData.getData('text/plain');

    let finalHtml: string;

    if (pastedHtml) {
      // Parse and strip all formatting: fonts, colors, sizes, classes, styles
      // but preserve structural elements: <br>, <p>, <a>, <b>, <i>, <u>, <strong>, <em>
      const tmp = document.createElement('div');
      tmp.innerHTML = pastedHtml;

      // Remove all style attributes and classes
      tmp.querySelectorAll('*').forEach((el) => {
        el.removeAttribute('style');
        el.removeAttribute('class');
        el.removeAttribute('id');
        el.removeAttribute('bgcolor');
        el.removeAttribute('color');
        el.removeAttribute('face');
        el.removeAttribute('size');
      });

      // Remove span tags (they only carry styling), unwrap content
      tmp.querySelectorAll('span').forEach((span) => {
        const parent = span.parentNode;
        if (parent) {
          while (span.firstChild) parent.insertBefore(span.firstChild, span);
          parent.removeChild(span);
        }
      });

      // Replace div/section/article with p for consistency
      tmp.querySelectorAll('div, section, article, header, footer').forEach((el) => {
        const p = document.createElement('p');
        while (el.firstChild) p.appendChild(el.firstChild);
        el.parentNode?.replaceChild(p, el);
      });

      // Remove all tags except allowed ones
      const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'ul', 'ol', 'li']);
      tmp.querySelectorAll('*').forEach((el) => {
        if (!ALLOWED_TAGS.has(el.tagName.toLowerCase())) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
        }
      });

      finalHtml = tmp.innerHTML;
    } else {
      // Plain text — convert newlines to <br>
      finalHtml = pastedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    }

    // Insert at cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(finalHtml);
      range.insertNode(fragment);
      // Move cursor to end of inserted content
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (editorRef.current) {
      editorRef.current.innerHTML += finalHtml;
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // ── Plain-text: strip any HTML that may be pasted ────────────────────────
  const handlePlainPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = ta.value;
    const next = current.slice(0, start) + text + current.slice(end);
    // Cap for instagram
    const capped = platform === 'instagram' ? next.slice(0, config.maxChars) : next;
    onChange(capped);
    // Restore cursor
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
    }, 0);
  }, [onChange, platform, config.maxChars]);

  // ── WhatsApp markdown wrap ────────────────────────────────────────────────
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

  // ── WhatsApp: remove markdown markers from selection ─────────────────────
  const clearWaMarkdown = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cleaned = ta.value
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/~(.*?)~/g, "$1");
    ta.value = cleaned;
    onChange(cleaned);
    ta.focus();
  }, [onChange, textareaRef]);

  // ── Email execCommand toolbar ─────────────────────────────────────────────
  const execRich = useCallback(
    (command: string, val?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, val);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    },
    [onChange]
  );

  const applyHighlight = useCallback(
    (color: string | null) => {
      editorRef.current?.focus();
      if (color === null) {
        // Remove highlight
        document.execCommand("hiliteColor", false, "transparent");
        document.execCommand("backColor", false, "transparent");
      } else {
        document.execCommand("hiliteColor", false, color);
      }
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      setHighlightOpen(false);
    },
    [onChange]
  );

  const applyTextColor = useCallback(
    (color: string) => {
      editorRef.current?.focus();
      document.execCommand("foreColor", false, color);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      setTextColorOpen(false);
    },
    [onChange]
  );

  const applyFontSize = useCallback(
    (size: string) => {
      editorRef.current?.focus();
      document.execCommand("fontSize", false, size);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
      setFontSizeOpen(false);
    },
    [onChange]
  );

  // ── Email: Reset All formatting ───────────────────────────────────────────
  const resetAllFormatting = useCallback(() => {
    editorRef.current?.focus();
    document.execCommand("selectAll", false);
    document.execCommand("removeFormat", false);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const isOverLimit = charCount > config.maxChars;
  const isNearLimit = charCount >= config.warnAt;

  const handleEmojiSelect = (emojiData: any) => {
    if (isRich && editorRef.current) {
      editorRef.current.focus();
      // Use execCommand to insert at current cursor position
      document.execCommand("insertText", false, emojiData.emoji);
      onChange(editorRef.current.innerHTML);
    } else {
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const newVal = val.substring(0, start) + emojiData.emoji + val.substring(end);
        
        if (platform === "instagram" && newVal.length > config.maxChars) {
          return; // Do not insert if it exceeds the hard limit
        }
        
        onChange(newVal);
        setTimeout(() => {
          ta.focus();
          ta.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }, 0);
      } else {
        onChange(value + emojiData.emoji);
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn("flex flex-col border border-input rounded-xl shadow-sm overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/20 flex-wrap min-h-[44px]">
        
        {/* Universal Emoji Picker */}
        <div className="relative">
          <ToolbarButton
            title="Insert Emoji"
            onMouseDown={(e) => { 
              e.preventDefault(); 
              setEmojiOpen((o) => !o); 
              setHighlightOpen(false); 
              setTextColorOpen(false);
              setFontSizeOpen(false);
            }}
            className={cn(emojiOpen && "bg-muted ring-1 ring-primary/30")}
          >
            <Smile className="w-4 h-4 text-foreground/80" />
          </ToolbarButton>
          {emojiOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 animate-in fade-in zoom-in-95 duration-150 shadow-2xl">
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setEmojiOpen(false)} 
              />
              <div className="relative z-50">
                <EmojiPicker 
                  onEmojiClick={handleEmojiSelect}
                  theme={Theme.AUTO}
                  lazyLoadEmojis={true}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                />
              </div>
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* Universal Undo/Redo */}
        <ToolbarButton title="Undo" onMouseDown={(e) => { e.preventDefault(); handleUndo(); }} disabled={!isRich && historyIdx === 0}>
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onMouseDown={(e) => { e.preventDefault(); handleRedo(); }} disabled={!isRich && historyIdx === history.length - 1}>
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border/50 mx-1" />

        {/* ── WhatsApp toolbar ── */}
        {platform === "whatsapp" && (
          <>
            <ToolbarButton title="Bold (*bold*)" onClick={() => wrapWaMarkdown("*")}>
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Italic (_italic_)" onClick={() => wrapWaMarkdown("_")}>
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <ToolbarButton
              title="Clear all markdown formatting"
              onClick={clearWaMarkdown}
              className="text-rose-500 hover:bg-rose-500/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </ToolbarButton>
          </>
        )}

        {/* ── Email toolbar ── */}
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
            <ToolbarButton title="Strikethrough" onMouseDown={(e) => { e.preventDefault(); execRich("strikeThrough"); }}>
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-border/50 mx-1" />
            
            {/* Font Size picker */}
            <div className="relative">
              <ToolbarButton
                title="Font Size"
                onMouseDown={(e) => { 
                  e.preventDefault(); 
                  setFontSizeOpen((o) => !o); 
                  setHighlightOpen(false);
                  setTextColorOpen(false);
                  setEmojiOpen(false);
                }}
                className={cn(fontSizeOpen && "bg-muted ring-1 ring-primary/30")}
              >
                <span className="flex items-center gap-1">
                  <span className="text-xs font-black">A</span>
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                </span>
              </ToolbarButton>
              {fontSizeOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border/50 rounded-xl shadow-xl p-2 flex flex-col gap-1.5 min-w-[120px] animate-in fade-in zoom-in-95 duration-150">
                  {FONT_SIZES.map((fs) => (
                    <button
                      key={fs.label}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyFontSize(fs.size); }}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-xs font-bold">{fs.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-border/50 mx-1" />

            <ToolbarButton title="Align Left" onMouseDown={(e) => { e.preventDefault(); execRich("justifyLeft"); }}>
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Align Center" onMouseDown={(e) => { e.preventDefault(); execRich("justifyCenter"); }}>
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Align Right" onMouseDown={(e) => { e.preventDefault(); execRich("justifyRight"); }}>
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-border/50 mx-1" />

            <ToolbarButton title="Bulleted List" onMouseDown={(e) => { e.preventDefault(); execRich("insertUnorderedList"); }}>
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton title="Numbered List" onMouseDown={(e) => { e.preventDefault(); execRich("insertOrderedList"); }}>
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-border/50 mx-1" />
            
            <ToolbarButton title="Insert Link" onMouseDown={(e) => { 
              e.preventDefault(); 
              const url = prompt("Enter link URL:");
              if (url) execRich("createLink", url); 
            }}>
              <Link className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-5 bg-border/50 mx-1" />

            {/* Text Color picker */}
            <div className="relative">
              <ToolbarButton
                title="Text Color"
                onMouseDown={(e) => { 
                  e.preventDefault(); 
                  setTextColorOpen((o) => !o); 
                  setHighlightOpen(false);
                  setFontSizeOpen(false);
                  setEmojiOpen(false);
                }}
                className={cn(textColorOpen && "bg-muted ring-1 ring-primary/30")}
              >
                <span className="flex items-center gap-1">
                  <Type className="w-4 h-4 text-foreground" />
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                </span>
              </ToolbarButton>
              {textColorOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border/50 rounded-xl shadow-xl p-2 flex flex-col gap-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                  {TEXT_COLORS.map((tc) => (
                    <button
                      key={tc.label}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyTextColor(tc.color); }}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span className={cn("w-4 h-4 rounded-full border border-border/50 shrink-0", tc.tw)} />
                      <span className="text-xs font-bold">{tc.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Highlight picker */}
            <div className="relative">
              <ToolbarButton
                title="Highlight"
                onMouseDown={(e) => { 
                  e.preventDefault(); 
                  setHighlightOpen((o) => !o); 
                  setTextColorOpen(false);
                  setFontSizeOpen(false);
                  setEmojiOpen(false);
                }}
                className={cn(highlightOpen && "bg-muted ring-1 ring-primary/30")}
              >
                <span className="flex items-center gap-1">
                  <Highlighter className="w-4 h-4 text-yellow-500" />
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                </span>
              </ToolbarButton>
              {highlightOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border/50 rounded-xl shadow-xl p-2 flex flex-col gap-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                  {HIGHLIGHT_COLORS.map((hc) => (
                    <button
                      key={hc.label}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyHighlight(hc.color); }}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span className={cn("w-4 h-4 rounded border border-border/50 shrink-0", hc.tw)} />
                      <span className="text-xs font-bold">{hc.label}</span>
                    </button>
                  ))}
                  <div className="h-px bg-border/50 my-1" />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); applyHighlight(null); }}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-bold">Remove Highlight</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset All button */}
            <ToolbarButton
              title="Reset all formatting (removes bold, italic, underline, highlight)"
              onMouseDown={(e) => { e.preventDefault(); resetAllFormatting(); }}
              className="text-rose-500 hover:bg-rose-500/10"
            >
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-wider hidden sm:block">Reset</span>
              </span>
            </ToolbarButton>

            <div className="w-px h-5 bg-border/50 mx-1" />
            <PlatformTag label="HTML RICH TEXT" color="blue" />
          </>
        )}

        {/* ── Instagram: plain text banner ── */}
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
        <div
          ref={editorRef}
          className="flex-1 p-4 outline-none min-h-[180px] overflow-y-auto text-sm leading-relaxed"
          style={{ fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', color: 'inherit' }}
          contentEditable
          suppressContentEditableWarning
          onInput={handleRichInput}
          onBlur={handleRichInput}
          onPaste={handleRichPaste}
          data-placeholder={placeholder}
        />
      ) : (
        <textarea
          ref={textareaRef}
          className={cn(
            "flex-1 p-4 outline-none resize-none min-h-[180px] bg-transparent text-sm leading-relaxed font-normal placeholder:text-muted-foreground/50",
            isOverLimit && "text-destructive"
          )}
          placeholder={placeholder}
          value={stripHtml(value)}
          onChange={handlePlainChange}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolbarButton({
  children,
  title,
  onClick,
  onMouseDown,
  className,
  disabled,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={disabled}
      className={cn(
        "p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
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
