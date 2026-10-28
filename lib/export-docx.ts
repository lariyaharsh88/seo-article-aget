import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type ParagraphChild,
} from "docx";
import { marked, type Token, type Tokens } from "marked";

/**
 * Markdown → .docx (native Word headings, lists, tables, links). Runs in the browser.
 * Word/Google Docs both open the result; Google Docs users can File → Open → Upload.
 */

const HEADINGS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
] as const;

type RunStyle = { bold?: boolean; italics?: boolean; code?: boolean };

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function inlineRuns(tokens: Token[] | undefined, style: RunStyle = {}): ParagraphChild[] {
  if (!tokens) return [];
  const out: ParagraphChild[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case "strong":
        out.push(...inlineRuns((t as Tokens.Strong).tokens, { ...style, bold: true }));
        break;
      case "em":
        out.push(...inlineRuns((t as Tokens.Em).tokens, { ...style, italics: true }));
        break;
      case "codespan":
        out.push(new TextRun({ text: decodeEntities((t as Tokens.Codespan).text), font: "Courier New", ...style }));
        break;
      case "link": {
        const link = t as Tokens.Link;
        out.push(
          new ExternalHyperlink({
            link: link.href,
            children: [
              new TextRun({
                text: decodeEntities(link.text),
                style: "Hyperlink",
                bold: style.bold,
                italics: style.italics,
              }),
            ],
          }),
        );
        break;
      }
      case "br":
        out.push(new TextRun({ text: "", break: 1 }));
        break;
      case "image":
        out.push(new TextRun({ text: `[Image: ${(t as Tokens.Image).text || (t as Tokens.Image).href}]`, italics: true }));
        break;
      default: {
        const nested = (t as { tokens?: Token[] }).tokens;
        if (nested?.length) out.push(...inlineRuns(nested, style));
        else out.push(new TextRun({ text: decodeEntities((t as { text?: string }).text ?? t.raw), ...style }));
      }
    }
  }
  return out;
}

function listParagraphs(list: Tokens.List, level: number): Paragraph[] {
  const out: Paragraph[] = [];
  list.items.forEach((item) => {
    const inline: Token[] = [];
    const nestedLists: Tokens.List[] = [];
    for (const child of item.tokens) {
      if (child.type === "list") nestedLists.push(child as Tokens.List);
      else if (child.type === "text" || child.type === "paragraph") {
        inline.push(...((child as Tokens.Text).tokens ?? [child]));
      }
    }
    out.push(
      new Paragraph({
        children: inlineRuns(inline),
        ...(list.ordered
          ? { numbering: { reference: "ordered", level: Math.min(level, 2) } }
          : { bullet: { level: Math.min(level, 2) } }),
      }),
    );
    for (const nested of nestedLists) out.push(...listParagraphs(nested, level + 1));
  });
  return out;
}

function tableBlock(t: Tokens.Table): Table {
  const row = (cells: Tokens.TableCell[], header: boolean) =>
    new TableRow({
      tableHeader: header,
      children: cells.map(
        (c) =>
          new TableCell({
            children: [new Paragraph({ children: inlineRuns(c.tokens, header ? { bold: true } : {}) })],
          }),
      ),
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [row(t.header, true), ...t.rows.map((r) => row(r, false))],
  });
}

function blocks(tokens: Token[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case "heading": {
        const h = t as Tokens.Heading;
        out.push(new Paragraph({ heading: HEADINGS[Math.min(h.depth, 6) - 1], children: inlineRuns(h.tokens) }));
        break;
      }
      case "paragraph":
        out.push(new Paragraph({ children: inlineRuns((t as Tokens.Paragraph).tokens), spacing: { after: 160 } }));
        break;
      case "list":
        out.push(...listParagraphs(t as Tokens.List, 0));
        break;
      case "table":
        out.push(tableBlock(t as Tokens.Table), new Paragraph({}));
        break;
      case "blockquote":
        out.push(...blocks((t as Tokens.Blockquote).tokens));
        break;
      case "code":
        for (const line of (t as Tokens.Code).text.split("\n")) {
          out.push(new Paragraph({ children: [new TextRun({ text: line, font: "Courier New", size: 20 })] }));
        }
        break;
      case "hr":
        out.push(new Paragraph({ thematicBreak: true }));
        break;
      case "space":
        break;
      default:
        if (t.raw.trim()) out.push(new Paragraph({ children: [new TextRun(decodeEntities(t.raw.trim()))] }));
    }
  }
  return out;
}

export async function markdownToDocxBlob(markdown: string, title: string): Promise<Blob> {
  const tokens = marked.lexer(markdown);
  const doc = new Document({
    title,
    creator: "RankFlowHQ",
    numbering: {
      config: [
        {
          reference: "ordered",
          levels: [0, 1, 2].map((level) => ({
            level,
            format: "decimal" as const,
            text: `%${level + 1}.`,
            style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
          })),
        },
      ],
    },
    sections: [{ children: blocks(tokens) }],
  });
  return Packer.toBlob(doc);
}
