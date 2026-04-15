export type NewsClusterId = "ssc" | "rrb" | "upsc" | "board-results";

export type NewsClusterMeta = {
  id: NewsClusterId;
  label: string;
  heading: string;
  description: string;
  path: string;
};

const CLUSTERS: Record<NewsClusterId, NewsClusterMeta> = {
  ssc: {
    id: "ssc",
    label: "SSC",
    heading: "SSC Exam News, Results, Admit Card & Exam Date Updates",
    description:
      "Latest SSC notifications, result announcements, admit card releases, and exam date updates in one place.",
    path: "/news/category/ssc",
  },
  rrb: {
    id: "rrb",
    label: "RRB",
    heading: "RRB Recruitment News, Results, Admit Card & Exam Schedule",
    description:
      "Track RRB updates including railway exam dates, hall tickets, result notices, and official recruitment alerts.",
    path: "/news/category/rrb",
  },
  upsc: {
    id: "upsc",
    label: "UPSC",
    heading: "UPSC News Hub: Prelims, Mains, Admit Card, Result & Notifications",
    description:
      "All UPSC civil services updates including exam timeline, official notices, admit cards, and result-related developments.",
    path: "/news/category/upsc",
  },
  "board-results": {
    id: "board-results",
    label: "Board Results",
    heading: "Board Result Updates: CBSE, State Boards, 10th & 12th Results",
    description:
      "Board exam result coverage for CBSE and state boards, including mark-sheet, scorecard, and release-date announcements.",
    path: "/news/category/board-results",
  },
};

const SSC_RE = /\b(ssc|cgl|chsl|mts|gd constable|stenographer|je exam)\b/i;
const RRB_RE = /\b(rrb|railway recruitment|ntpc|group d|alp|rpf|technician)\b/i;
const UPSC_RE = /\b(upsc|civil services|ias|ips|ifs|nda|cds)\b/i;
const BOARD_RESULTS_RE =
  /\b(cbse|icse|state board|board exam|board result|10th result|12th result|hsc result|sslc result|inter result)\b/i;

export function inferNewsClusterFromText(
  ...parts: (string | null | undefined)[]
): NewsClusterId | null {
  const text = parts.filter(Boolean).join("\n");
  if (!text.trim()) return null;
  if (SSC_RE.test(text)) return "ssc";
  if (RRB_RE.test(text)) return "rrb";
  if (UPSC_RE.test(text)) return "upsc";
  if (BOARD_RESULTS_RE.test(text)) return "board-results";
  return null;
}

export function getNewsClusterMeta(id: NewsClusterId): NewsClusterMeta {
  return CLUSTERS[id];
}

export function listNewsClusters(): NewsClusterMeta[] {
  return [
    CLUSTERS.ssc,
    CLUSTERS.rrb,
    CLUSTERS.upsc,
    CLUSTERS["board-results"],
  ];
}
