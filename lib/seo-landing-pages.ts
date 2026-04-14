export type SeoLandingSlug =
  | "ai-seo-tools"
  | "automate-blog-writing-ai"
  | "keyword-clustering-tool"
  | "generative-engine-optimization"
  | "ai-content-automation";

export type SeoLandingPageConfig = {
  slug: SeoLandingSlug;
  keyword: string;
  longTailKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheading: string;
  whatIs: string[];
  howItWorks: Array<{ title: string; description: string }>;
  benefits: string[];
  tool: {
    title: string;
    description: string;
    href: string;
    ctaLabel: string;
    embedUrl?: string;
  };
  cta: {
    headline: string;
    text: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
  internalLinks: Array<{ label: string; href: string; description?: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const SEO_LANDING_PAGES: Record<SeoLandingSlug, SeoLandingPageConfig> = {
  "ai-seo-tools": {
    slug: "ai-seo-tools",
    keyword: "AI SEO tools",
    longTailKeywords: [
      "best AI SEO tools for long-form content",
      "AI SEO workflow for keyword to article automation",
      "how to use AI SEO tools with SERP insights",
    ],
    metaTitle: "AI SEO Tools to Build Ranking Content Faster",
    metaDescription:
      "Use RankFlowHQ AI SEO tools to move from keyword research to optimized content with SERP insights, citations, and enrichment in one workflow.",
    heroHeadline: "AI SEO Tools to Build Ranking Content Faster",
    heroSubheading:
      "Plan keywords, analyze SERP intent, and generate optimization-ready articles in one clean workflow built for modern search and answer engines.",
    whatIs: [
      "AI SEO tools help teams turn search data into actionable content decisions. Instead of switching between multiple apps, you can research topics, map intent, and draft optimized pages in one flow. For teams asking how to build SEO content with AI without losing quality, the answer is workflow discipline: use AI for speed, then use structure, evidence, and clear intent mapping for quality. That is where the right toolset creates leverage.",
      "With RankFlowHQ, the pipeline connects keyword research, evidence-backed writing, and on-page SEO outputs so your team can publish faster while keeping structure and quality consistent. If you are searching for the best AI SEO tools for long-form content, what matters most is not just generation speed. It is whether your process covers clustering, SERP context, references, and post-draft optimization before publishing.",
      "Modern SEO also means writing for both classic search and answer-style discovery. That requires semantic coverage, clear headings, concise definitions, and practical examples. A good AI SEO workflow should produce content that is readable, verifiable, and aligned with user intent across informational, commercial, and comparison queries. This is especially important for growing sites where every article must contribute to topical authority.",
      "RankFlowHQ is designed for teams that want repeatable SEO execution, not one-off AI drafts. You can use it to go from topic brief to structured article with fewer manual handoffs. That makes it useful for in-house marketers, agencies, and indie publishers trying to scale output while protecting quality standards.",
    ],
    howItWorks: [
      {
        title: "Keyword discovery",
        description:
          "Start with a topic and capture primary, secondary, and long-tail opportunities based on search intent.",
      },
      {
        title: "SERP and research context",
        description:
          "Pull SERP patterns, PAA signals, and external references to shape coverage depth and section priorities.",
      },
      {
        title: "Content generation and audit",
        description:
          "Generate a long-form draft, then extract SEO metadata and structure checks before publishing.",
      },
    ],
    benefits: [
      "Reduce manual SEO research time across every article brief while preserving strategic control.",
      "Keep headings, supporting sections, and FAQs aligned with search intent for stronger relevance.",
      "Publish with richer context from citations and structured output that editors can review quickly.",
      "Move from idea to publish-ready draft in a repeatable pipeline suitable for team collaboration.",
      "Improve consistency across content operations by standardizing how briefs and drafts are generated.",
      "Support long-tail keyword optimization without writing disconnected, low-context article sections.",
    ],
    tool: {
      title: "Try the SEO article pipeline",
      description:
        "Open the production tool to run the full flow from keyword inputs to final article and SEO package.",
      href: "/seo-agent",
      ctaLabel: "Open Article Pipeline",
    },
    cta: {
      headline: "Start building your next ranking article",
      text: "Use RankFlowHQ to generate optimized content with faster research, stronger structure, and clear SEO outputs.",
      primaryLabel: "Try RankFlowHQ",
      primaryHref: "/seo-agent",
      secondaryLabel: "Explore Free Tools",
      secondaryHref: "/",
    },
    internalLinks: [
      {
        label: "Repurpose from URL",
        href: "/repurpose-url",
        description: "Turn an existing URL into a fresh SEO-oriented draft.",
      },
      {
        label: "AI SEO Toolkit",
        href: "/ai-seo-toolkit",
        description: "Test visibility, prompt clusters, and AEO optimization ideas.",
      },
      {
        label: "Off-page SEO",
        href: "/off-page-seo",
        description: "Plan outreach and backlink opportunities after publishing.",
      },
    ],
    faqs: [
      {
        question: "What are AI SEO tools used for in real content teams?",
        answer:
          "They are used to speed up repetitive SEO work: keyword discovery, SERP pattern analysis, first-draft generation, and metadata creation. The strongest workflows still include human review for factual accuracy, brand voice, and strategic positioning.",
      },
      {
        question: "Can AI SEO tools help with long-tail keyword optimization?",
        answer:
          "Yes. Long-tail terms are often easier to win and easier to convert. A good AI SEO workflow groups related long-tail intent and builds one coherent article instead of creating fragmented pages.",
      },
      {
        question: "Do AI SEO tools replace manual SEO strategy?",
        answer:
          "No. They accelerate execution but do not replace strategic decisions such as topic prioritization, audience fit, product alignment, and editorial quality control.",
      },
      {
        question: "How does RankFlowHQ differ from a generic AI writer?",
        answer:
          "Generic writers produce text quickly. RankFlowHQ emphasizes SEO process: intent-driven input, research context, SERP-aware structure, and audit output that supports publishing decisions.",
      },
    ],
  },
  "automate-blog-writing-ai": {
    slug: "automate-blog-writing-ai",
    keyword: "automate blog writing with AI",
    longTailKeywords: [
      "how to automate blog writing with AI and SEO",
      "AI blog automation workflow for content teams",
      "automate blog article creation from keyword research",
    ],
    metaTitle: "Automate Blog Writing with AI Without Losing SEO Quality",
    metaDescription:
      "Learn how to automate blog writing with AI using a structured SEO workflow. RankFlowHQ helps teams generate optimized drafts with research, SERP context, and clear on-page outputs.",
    heroHeadline: "Automate Blog Writing with AI, Structure, and SEO Control",
    heroSubheading:
      "Build a repeatable blog system from keyword intent to publish-ready drafts with citations, SERP context, and optimization guidance.",
    whatIs: [
      "When people search for how to automate blog writing with AI, they usually want two things at once: higher output and stable quality. The challenge is that speed without process creates inconsistent articles that are hard to rank. Automation works best when each stage has clear inputs and output checks, including keyword intent, source quality, heading structure, and editorial clarity.",
      "A practical AI blog automation workflow starts before writing. You need a topic target, primary keyword, and a clear sense of what the searcher wants. Then you enrich that brief with SERP signals and external references so your draft is not just fluent text, but content that actually covers what readers compare and decide on. This is where many teams save time while improving relevance.",
      "RankFlowHQ helps automate the parts that consume time every week: clustering terms, building an outline, drafting full sections, and preparing SEO metadata. Instead of copy-pasting between scattered tools, the process runs in one place. That reduces operational drag, especially for agencies or in-house teams publishing at a weekly cadence.",
      "Automation should still be human-guided. AI can generate structure and draft language quickly, but your team should review product claims, numerical references, and brand positioning before publishing. The best outcome is not fully hands-off publishing. It is high-quality first drafts that need lighter edits and move faster through review.",
    ],
    howItWorks: [
      {
        title: "Start with keyword and audience intent",
        description:
          "Define a primary keyword, target audience, and goal so the article direction is clear from the first step.",
      },
      {
        title: "Generate structure with research context",
        description:
          "Use SERP patterns, questions, and references to shape section order, depth, and supporting examples.",
      },
      {
        title: "Automate drafting, then audit",
        description:
          "Produce the article draft and export actionable SEO metadata for title, description, and on-page refinement.",
      },
    ],
    benefits: [
      "Increase blog output without lowering editorial standards.",
      "Reduce time spent on repetitive brief and outline creation.",
      "Improve SEO consistency across multi-author publishing teams.",
      "Turn keyword plans into complete article drafts in fewer steps.",
      "Make review cycles faster with structured, citation-aware content.",
      "Support scalable content operations for agencies and in-house teams.",
    ],
    tool: {
      title: "Run AI blog automation in RankFlowHQ",
      description:
        "Use the SEO article pipeline to move from topic brief to optimized long-form draft.",
      href: "/seo-agent",
      ctaLabel: "Automate a Blog Draft",
    },
    cta: {
      headline: "Build your AI blog automation workflow today",
      text: "Use RankFlowHQ to automate blog drafting while keeping SEO structure, research quality, and editorial control.",
      primaryLabel: "Try RankFlowHQ",
      primaryHref: "/seo-agent",
      secondaryLabel: "Explore Free Tools",
      secondaryHref: "/",
    },
    internalLinks: [
      {
        label: "Repurpose from URL",
        href: "/repurpose-url",
        description: "Turn existing pages into fresh SEO article drafts.",
      },
      {
        label: "AI SEO Toolkit",
        href: "/ai-seo-toolkit",
        description: "Expand prompts and optimization ideas for blog planning.",
      },
      {
        label: "Blog",
        href: "/blogs",
        description: "See how content and product updates are published.",
      },
    ],
    faqs: [
      {
        question: "Can I fully automate blog writing with AI and skip editing?",
        answer:
          "You can automate drafting, but skipping editing is risky. Keep a review step for fact checks, tone, and brand alignment.",
      },
      {
        question: "How do I keep AI blog content from sounding generic?",
        answer:
          "Use strong inputs: real SERP context, clear audience intent, and examples from your product or market. Specific inputs create specific output.",
      },
      {
        question: "Is AI blog automation suitable for SEO at scale?",
        answer:
          "Yes, when your workflow includes keyword strategy, consistent structure, and post-draft audit checks before publishing.",
      },
      {
        question: "Which teams benefit most from blog automation?",
        answer:
          "Agencies, SaaS marketing teams, and publishers with regular content calendars benefit the most because they repeat similar workflows each week.",
      },
    ],
  },
  "keyword-clustering-tool": {
    slug: "keyword-clustering-tool",
    keyword: "keyword clustering tool",
    longTailKeywords: [
      "best keyword clustering tool for SEO strategy",
      "how to cluster keywords by search intent",
      "keyword clustering workflow for topic authority",
    ],
    metaTitle: "Keyword Clustering Tool for SEO Topic Groups",
    metaDescription:
      "Cluster related keywords by intent and build better content outlines. Use RankFlowHQ to map topic groups and create articles that match search demand.",
    heroHeadline: "Keyword Clustering Tool for Better SEO Topic Maps",
    heroSubheading:
      "Group related search terms by intent, prioritize coverage, and turn clusters into structured outlines your content team can execute quickly.",
    whatIs: [
      "A keyword clustering tool helps you group terms that should be covered together in one page or content hub. This reduces cannibalization and improves topical clarity. If your team publishes multiple pages around similar queries, clustering is one of the simplest ways to avoid overlap and protect ranking potential.",
      "RankFlowHQ combines clustering signals with SERP context so each article can target a coherent search theme and satisfy related user questions. Instead of treating every phrase as a separate page, you can map parent and supporting intent into one practical structure. That is especially helpful for long-tail keyword strategies where query variations are common.",
      "Many teams treat clustering as a spreadsheet task, but execution breaks when there is no connection to drafting. The key advantage of using a clustering tool inside a broader SEO workflow is continuity. Your cluster directly informs headings, section depth, FAQs, and supporting entities in the draft.",
      "If you are looking for the best keyword clustering tool for SEO strategy, evaluate whether it helps you make publishing decisions. Great clustering is not just labels. It should improve page architecture, internal linking plans, and editorial confidence before writing starts.",
    ],
    howItWorks: [
      {
        title: "Collect and normalize keywords",
        description:
          "Capture main and supporting terms, then normalize variants to avoid duplicate targeting.",
      },
      {
        title: "Map intent and SERP overlap",
        description:
          "Use intent clues and SERP relationship signals to place terms into practical clusters.",
      },
      {
        title: "Convert clusters into outlines",
        description:
          "Generate section plans and article structure so each cluster becomes a publishable content asset.",
      },
    ],
    benefits: [
      "Create cleaner content architecture with less keyword overlap and fewer duplicate pages.",
      "Improve topical authority by covering related intent in one focused article structure.",
      "Build briefs and outlines faster for writers and editors with clearer section intent.",
      "Connect cluster strategy directly to production-ready article drafts in one workflow.",
      "Support long-tail expansion by mapping semantically related variants into usable groups.",
      "Improve internal linking decisions across hubs, supporting pages, and comparison content.",
    ],
    tool: {
      title: "Use the pipeline with clustered topics",
      description:
        "Run clustered keyword themes through the article workflow and generate long-form content with SEO outputs.",
      href: "/seo-agent",
      ctaLabel: "Generate Clustered Article",
    },
    cta: {
      headline: "Turn clusters into ranking pages",
      text: "Move from grouped keywords to complete SEO content with RankFlowHQ's end-to-end workflow.",
      primaryLabel: "Try RankFlowHQ",
      primaryHref: "/seo-agent",
      secondaryLabel: "See All Tools",
      secondaryHref: "/",
    },
    internalLinks: [
      {
        label: "Education Trends",
        href: "/education-trends",
        description: "Find rising query patterns for cluster expansion ideas.",
      },
      {
        label: "Blog",
        href: "/blogs",
        description: "Read product and SEO workflow updates from the team.",
      },
      {
        label: "News",
        href: "/news",
        description: "See how repurposed articles are published on-site.",
      },
    ],
    faqs: [
      {
        question: "Why is keyword clustering important for SEO?",
        answer:
          "It helps you align related queries to the right page. This prevents cannibalization and improves topical relevance.",
      },
      {
        question: "How do I cluster keywords by intent?",
        answer:
          "Group terms by user goal first, then validate with SERP overlap. Queries with similar result patterns often belong in one page.",
      },
      {
        question: "Can keyword clustering improve internal linking?",
        answer:
          "Yes. Once clusters are defined, it becomes easier to plan hub pages, supporting pages, and logical internal links between them.",
      },
      {
        question: "Does RankFlowHQ use clusters in article creation?",
        answer:
          "Yes. Cluster-aware inputs can guide outline structure and section coverage in the article pipeline.",
      },
    ],
  },
  "generative-engine-optimization": {
    slug: "generative-engine-optimization",
    keyword: "generative engine optimization",
    longTailKeywords: [
      "what is generative engine optimization for AI search",
      "generative engine optimization strategy for SaaS",
      "how to optimize content for generative AI answers",
    ],
    metaTitle: "Generative Engine Optimization (GEO) Strategy Guide",
    metaDescription:
      "Understand generative engine optimization for AI-driven discovery. Use RankFlowHQ to create structured, evidence-backed content for Google and AI answer engines.",
    heroHeadline: "Generative Engine Optimization for AI-Era Content Discovery",
    heroSubheading:
      "Build content that performs in classic search and in AI-generated answers with stronger structure, evidence, and intent alignment.",
    whatIs: [
      "Generative engine optimization (GEO) is the practice of shaping content so it can be understood, selected, and cited by AI answer systems as well as traditional search engines. Teams exploring GEO often ask how to optimize content for generative AI answers without abandoning proven SEO fundamentals. The answer is integration, not replacement.",
      "Core SEO still matters: clear headings, strong topical relevance, crawlable architecture, and useful internal links. GEO adds another layer: concise definitions, evidence-backed claims, and section design that helps language models extract accurate summaries. Content that is verbose but vague may rank less effectively in both environments.",
      "RankFlowHQ supports this blended strategy by combining keyword intent, SERP context, and structured drafting. You can build content that remains human-readable while being easier for retrieval and synthesis systems to interpret. This is especially useful for SaaS, education, and B2B topics where nuance and trust signals are critical.",
      "If you are building a generative engine optimization strategy for SaaS, focus on clarity and citation discipline. Define terms early, answer high-intent questions directly, and use supporting examples where needed. These habits improve readability for people and machine-mediated discovery paths.",
    ],
    howItWorks: [
      {
        title: "Map user intent and answer intent",
        description:
          "Identify what users ask and what an AI system would summarize, then build sections that serve both patterns.",
      },
      {
        title: "Draft with structure and evidence",
        description:
          "Create content with clean hierarchy, concise explanations, and references that strengthen factual confidence.",
      },
      {
        title: "Audit for SEO and generative readiness",
        description:
          "Review metadata, section clarity, and supporting context before publishing to improve multi-surface visibility.",
      },
    ],
    benefits: [
      "Strengthen visibility in both search listings and AI answer experiences.",
      "Improve extractability through clearer headings and concise explanation patterns.",
      "Reduce ambiguity in technical topics with better context and source discipline.",
      "Support future-proof content strategy as search behavior continues to evolve.",
      "Maintain one workflow for SEO and GEO instead of separate production systems.",
      "Increase confidence in article quality before publication and distribution.",
    ],
    tool: {
      title: "Use RankFlowHQ for GEO-ready article creation",
      description:
        "Run your topics through an intent-aware SEO workflow that supports both ranking and answer visibility.",
      href: "/seo-agent",
      ctaLabel: "Generate GEO-Ready Draft",
    },
    cta: {
      headline: "Create content built for search and AI answers",
      text: "Use RankFlowHQ to produce structured, citation-aware content aligned with modern discovery behavior.",
      primaryLabel: "Try RankFlowHQ",
      primaryHref: "/seo-agent",
      secondaryLabel: "Try AI SEO Toolkit",
      secondaryHref: "/ai-seo-toolkit",
    },
    internalLinks: [
      {
        label: "AI SEO Toolkit",
        href: "/ai-seo-toolkit",
        description: "Explore visibility and answer-oriented optimization workflows.",
      },
      {
        label: "SEO article pipeline",
        href: "/seo-agent",
        description: "Generate long-form structured content from intent and research.",
      },
      {
        label: "Off-page SEO",
        href: "/off-page-seo",
        description: "Extend authority with outreach after publishing core content.",
      },
    ],
    faqs: [
      {
        question: "Is generative engine optimization different from SEO?",
        answer:
          "GEO extends SEO. It adds optimization for AI-generated answer systems while keeping classic ranking fundamentals.",
      },
      {
        question: "What content format works best for GEO?",
        answer:
          "Clear hierarchy, concise definitions, direct answers, and evidence-backed claims work well for both users and AI systems.",
      },
      {
        question: "Can GEO help B2B and SaaS content?",
        answer:
          "Yes. Technical domains benefit from structured explanations and citation discipline, which are central to GEO-friendly content.",
      },
      {
        question: "How do I start a GEO strategy quickly?",
        answer:
          "Start with your highest-intent pages, improve structure and factual support, then apply the same workflow across related clusters.",
      },
    ],
  },
  "ai-content-automation": {
    slug: "ai-content-automation",
    keyword: "AI content automation",
    longTailKeywords: [
      "AI content automation workflow for SEO teams",
      "best AI content automation tool for blogs",
      "automate SEO content creation with quality control",
    ],
    metaTitle: "AI Content Automation for SEO Teams and Agencies",
    metaDescription:
      "Scale content operations with AI content automation. RankFlowHQ helps teams automate research, drafting, and SEO packaging with better structure and quality control.",
    heroHeadline: "AI Content Automation That Keeps SEO Quality Intact",
    heroSubheading:
      "Automate repetitive content workflows while preserving strategic control, editorial quality, and search-focused structure.",
    whatIs: [
      "AI content automation means designing a process where repetitive tasks are handled by systems, not by manual copy-paste. For SEO teams, this usually includes keyword preparation, outline building, article drafting, and metadata packaging. The objective is not to remove editors. It is to let editors focus on quality decisions instead of repeated setup work.",
      "The best AI content automation tool for blogs should support workflow continuity. If research happens in one tool, drafting in another, and optimization in a third, teams lose time and context. RankFlowHQ addresses this by connecting stages into one execution path from intent input to publish-ready output.",
      "Automation also improves consistency. When every article follows a repeatable process, your brand voice and content architecture become easier to maintain across multiple writers or clients. This is especially useful for agencies balancing many campaigns and internal teams with strict publishing schedules.",
      "If you want to automate SEO content creation with quality control, define review checkpoints in advance: factual validation, message accuracy, and conversion clarity. Automation should speed production, but your acceptance criteria should remain strict. This balance is what turns automation into reliable growth.",
    ],
    howItWorks: [
      {
        title: "Standardize inputs",
        description:
          "Start each run with keyword, audience, and intent so automation follows a consistent directional brief.",
      },
      {
        title: "Automate research and draft production",
        description:
          "Generate structured draft content with context from SERP and supporting references.",
      },
      {
        title: "Run QA and SEO packaging",
        description:
          "Audit the draft, finalize metadata, and hand over a cleaner output for editorial sign-off and publishing.",
      },
    ],
    benefits: [
      "Scale content output without scaling manual setup work linearly.",
      "Improve consistency across writers, topics, and campaign timelines.",
      "Reduce turnaround time from idea to publish-ready article package.",
      "Keep human review focused on strategy and message quality.",
      "Support agency and in-house workflows with repeatable delivery standards.",
      "Build a more predictable content production system for growth.",
    ],
    tool: {
      title: "Automate SEO content in RankFlowHQ",
      description:
        "Use the full pipeline to produce structured drafts and SEO outputs faster.",
      href: "/seo-agent",
      ctaLabel: "Start Content Automation",
    },
    cta: {
      headline: "Build a reliable AI content system",
      text: "Use RankFlowHQ to automate repetitive SEO content work and publish with stronger consistency.",
      primaryLabel: "Try RankFlowHQ",
      primaryHref: "/seo-agent",
      secondaryLabel: "Repurpose from URL",
      secondaryHref: "/repurpose-url",
    },
    internalLinks: [
      {
        label: "SEO article pipeline",
        href: "/seo-agent",
        description: "Run end-to-end content production with SEO outputs.",
      },
      {
        label: "Repurpose from URL",
        href: "/repurpose-url",
        description: "Convert existing URLs into fresh optimization-ready drafts.",
      },
      {
        label: "Blog",
        href: "/blogs",
        description: "Explore updates and practical content workflow notes.",
      },
    ],
    faqs: [
      {
        question: "What is AI content automation in SEO?",
        answer:
          "It is the use of automation to handle repetitive content tasks like outlining, drafting, and metadata generation while humans review final quality.",
      },
      {
        question: "Can automation reduce content quality?",
        answer:
          "It can, if you skip review. With clear QA checkpoints, automation usually improves consistency and speeds delivery.",
      },
      {
        question: "Is AI content automation useful for agencies?",
        answer:
          "Yes. Agencies benefit from repeatable delivery processes, especially across multiple clients and publishing calendars.",
      },
      {
        question: "How do I start with AI content automation quickly?",
        answer:
          "Start with one workflow: keyword intent to first draft. Once stable, add audit and internal linking steps for full pipeline adoption.",
      },
    ],
  },
};

export function getSeoLandingConfig(
  slug: string,
): SeoLandingPageConfig | undefined {
  return SEO_LANDING_PAGES[slug as SeoLandingSlug];
}

export function getSeoLandingSlugs(): SeoLandingSlug[] {
  return Object.keys(SEO_LANDING_PAGES) as SeoLandingSlug[];
}
