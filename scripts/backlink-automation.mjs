#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INPUT_PATH = process.argv[2] || "scripts/backlink-input.json";
const OUTPUT_DIR =
  process.argv[3] || `scripts/backlink-output-${new Date().toISOString().slice(0, 10)}`;

const WEB20_PLATFORMS = ["Medium", "Blogger", "WordPress.com"];
const SUBREDDITS = [
  "Indian_Academia",
  "UPSC",
  "ssc",
  "RRB",
  "CBSE",
  "JEENEETards",
  "IndianEducation",
];
const DIRECTORIES = [
  "educationdirectories.org",
  "indiastudychannel.com",
  "collegedekho-directory",
  "educationworld-directory",
];

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function pick(arr, idx) {
  return arr[idx % arr.length];
}

function variedAnchor(article, idx) {
  const base = article.keyword || article.title;
  const options = [
    `${base} latest update`,
    `${base} official details`,
    `${base} result link guide`,
    `${base} admit card update`,
    `${base} exam date summary`,
    `latest ${base} news`,
  ];
  return pick(options, idx);
}

function buildWeb20Post(article, idx) {
  const anchor = variedAnchor(article, idx);
  return `# ${article.title}

Students often miss critical timelines when updates are spread across different sources. This quick note highlights the most actionable details and what to check next.

## Key Update Snapshot
- What changed: ${article.summary || "Latest notification details updated"}
- Who should check: candidates tracking this exam or board notice
- Why it matters: deadlines and document windows can shift quickly

## What to verify immediately
1. Official notice date and reference number
2. Eligibility and document checklist
3. Last date and correction window

For the full breakdown, read: [${anchor}](${article.url})

Use official portals for final confirmation before submission.`;
}

function buildRedditDraft(article, idx) {
  const anchor = variedAnchor(article, idx);
  const subreddit = pick(SUBREDDITS, idx);
  return {
    subreddit,
    title: `${article.title} — key points students should verify today`,
    body: `Sharing a quick breakdown for students tracking this update.

Main points:
- Notice timing and practical impact
- Documents/checklist candidates should keep ready
- Deadline-related actions for this cycle

I found this detailed explainer useful: [${anchor}](${article.url})

If anyone has seen additional official clarification, share it here so everyone can verify.`,
  };
}

function buildQuoraAnswer(article, idx) {
  const anchor = variedAnchor(article, idx);
  const question = `${article.keyword || article.title}: what should candidates do after the latest update?`;
  const answer = `If you're tracking this update, focus on three things first:

1) Check the official notice date and the latest eligibility/documents requirement.
2) Confirm the timeline (application window, admit card, result date, correction window).
3) Keep proofs ready early to avoid last-day issues.

A concise step-by-step explainer is here: [${anchor}](${article.url})

Use the official portal as final source of truth before taking action.`;
  return { question, answer };
}

function buildDirectorySubmission(article, idx) {
  const anchor = variedAnchor(article, idx);
  const directory = pick(DIRECTORIES, idx);
  return {
    directory,
    title: article.title,
    description: (article.summary || article.title).slice(0, 155),
    url: article.url,
    anchor,
    category: "Education News / Exam Updates",
  };
}

async function run() {
  const raw = await readFile(path.resolve(INPUT_PATH), "utf8");
  const config = JSON.parse(raw);
  const articles = Array.isArray(config.articles) ? config.articles : [];
  if (articles.length === 0) {
    throw new Error("Input needs `articles` array.");
  }

  const weeklyTarget = Math.min(
    Math.max(Number(config.weeklyTargetBacklinks || 30), 20),
    50,
  );
  const web20PerArticle = Math.max(1, Math.floor(weeklyTarget / (articles.length * 4)));

  const plans = [];
  const web20 = [];
  const reddit = [];
  const quora = [];
  const directories = [];

  let backlinkCounter = 0;
  articles.forEach((article, idx) => {
    // Web2.0: 2-3 posts/article typically.
    const thisWeb20Count = Math.min(3, web20PerArticle + (idx % 2));
    for (let i = 0; i < thisWeb20Count; i++) {
      web20.push({
        platform: pick(WEB20_PLATFORMS, idx + i),
        article: article.title,
        draft: buildWeb20Post(article, idx + i),
      });
      backlinkCounter += 1;
    }

    reddit.push({
      article: article.title,
      ...buildRedditDraft(article, idx),
    });
    backlinkCounter += 1;

    quora.push({
      article: article.title,
      ...buildQuoraAnswer(article, idx),
    });
    backlinkCounter += 1;

    directories.push(buildDirectorySubmission(article, idx));
    backlinkCounter += 1;

    plans.push({
      article: article.title,
      url: article.url,
      web20Posts: thisWeb20Count,
      redditPosts: 1,
      quoraAnswers: 1,
      directorySubmissions: 1,
      estimatedBacklinks: thisWeb20Count + 3,
    });
  });

  const weekly = {
    weeklyTargetBacklinks: weeklyTarget,
    generatedBacklinkTasks: backlinkCounter,
    antiSpamRules: [
      "Do not repeat the same anchor text in consecutive posts.",
      "Keep each platform post unique in opening and CTA.",
      "Limit direct link ratio: max one backlink per post.",
      "Use natural discussion context before dropping any link.",
      "Respect subreddit and platform moderation rules.",
    ],
    plan: plans,
  };

  await mkdir(path.resolve(OUTPUT_DIR), { recursive: true });
  await Promise.all([
    writeFile(
      path.resolve(OUTPUT_DIR, "weekly-plan.json"),
      JSON.stringify(weekly, null, 2),
      "utf8",
    ),
    writeFile(
      path.resolve(OUTPUT_DIR, "web2-posts.json"),
      JSON.stringify(web20, null, 2),
      "utf8",
    ),
    writeFile(
      path.resolve(OUTPUT_DIR, "reddit-drafts.json"),
      JSON.stringify(reddit, null, 2),
      "utf8",
    ),
    writeFile(
      path.resolve(OUTPUT_DIR, "quora-drafts.json"),
      JSON.stringify(quora, null, 2),
      "utf8",
    ),
    writeFile(
      path.resolve(OUTPUT_DIR, "directory-submissions.json"),
      JSON.stringify(directories, null, 2),
      "utf8",
    ),
  ]);

  process.stdout.write(
    `Backlink automation pack generated in ${OUTPUT_DIR}\nTasks: ${backlinkCounter}\n`,
  );
}

run().catch((err) => {
  process.stderr.write(`backlink automation failed: ${err.message}\n`);
  process.exit(1);
});
