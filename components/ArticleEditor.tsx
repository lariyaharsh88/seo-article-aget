"use client";

import type { ReactNode } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { htmlToMarkdown } from "@/lib/html-to-markdown";
import { markdownToEditorHtml } from "@/lib/markdown-to-html";

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
        active
          ? "bg-accent/25 text-accent"
          : "text-text-secondary hover:bg-background/80 hover:text-accent"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return (
      <div className="flex flex-wrap gap-1 border-b border-border bg-background/90 p-2">
        <span className="font-mono text-[11px] text-text-muted">Loading editor…</span>
      </div>
    );
  }

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL (https://…)");
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-border bg-background/90 p-2"
      role="toolbar"
      aria-label="Article formatting"
    >
      <ToolbarButton
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        Redo
      </ToolbarButton>
      <span className="mx-1 text-text-muted" aria-hidden>
        |
      </span>
      <ToolbarButton
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        title="Strike"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </ToolbarButton>
      <ToolbarButton
        title="Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {"</>"}
      </ToolbarButton>
      <span className="mx-1 text-text-muted" aria-hidden>
        |
      </span>
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        H3
      </ToolbarButton>
      <span className="mx-1 text-text-muted" aria-hidden>
        |
      </span>
      <ToolbarButton
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        “”
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        HR
      </ToolbarButton>
      <span className="mx-1 text-text-muted" aria-hidden>
        |
      </span>
      <ToolbarButton title="Insert link" onClick={addLink}>
        Link
      </ToolbarButton>
      <ToolbarButton title="Insert image" onClick={addImage}>
        Image
      </ToolbarButton>
      <ToolbarButton
        title="Insert 3×3 table with header"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        Table
      </ToolbarButton>
      <ToolbarButton
        title="Add row"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
      >
        +Row
      </ToolbarButton>
      <ToolbarButton
        title="Add column"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
      >
        +Col
      </ToolbarButton>
      <ToolbarButton
        title="Delete table"
        onClick={() => editor.chain().focus().deleteTable().run()}
        disabled={!editor.can().deleteTable()}
      >
        Del table
      </ToolbarButton>
    </div>
  );
}

export interface ArticleEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export function ArticleEditor({ markdown, onChange }: ArticleEditorProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
          },
        }),
        TableKit.configure({
          table: { resizable: true },
        }),
        Image.configure({
          allowBase64: true,
          HTMLAttributes: {
            class: "max-w-full rounded-lg border border-border",
          },
        }),
        Placeholder.configure({
          placeholder:
            "Edit your article here — use the toolbar for headings, lists, tables, links, and images.",
        }),
      ],
      content: markdownToEditorHtml(markdown),
      editorProps: {
        attributes: {
          class:
            "article-editor-prose focus:outline-none min-h-[min(70vh,520px)] max-w-none px-4 py-4 font-serif text-[1.05rem] leading-relaxed text-text-primary",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(htmlToMarkdown(ed.getHTML()));
      },
    },
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/60">
      <p className="border-b border-border bg-accent/5 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-muted">
        Rich editor · Markdown saved automatically
      </p>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="custom-scrollbar max-h-[min(75vh,560px)] overflow-y-auto" />
    </div>
  );
}
