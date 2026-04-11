export type VisualKind = "chart" | "table" | "illustration";

export type ParsedSection = {
  title: string;
  body: string;
};

export type EnrichedSectionLog = {
  title: string;
  kind: VisualKind;
  detail: string;
};
