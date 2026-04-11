export interface OffPageSeoInput {
  domain: string;
  country: string;
  niche: string;
}

export interface BacklinkOpportunity {
  domain: string;
  type: string;
  /** Estimated 1–100 (Moz-like scale); labeled estimated when no Moz API. */
  estimated_da: number;
  traffic_estimate: string;
  spam_score: number;
  contact_email: string | null;
  contact_page: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  estimated_price: string;
  priority_score: number;
  category: string;
  action: string;
  notes?: string;
}

export interface OffPageSeoResponse {
  opportunities: BacklinkOpportunity[];
  meta: {
    input_domain: string;
    country: string;
    niche: string;
    serper_queries_run: number;
    domains_discovered: number;
    domains_enriched: number;
    note: string;
  };
}
