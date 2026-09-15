import evidence from "@/research/jay-post-evidence-v1.json";

type EvidencePost = {
  phrase: string;
  metrics: {
    views: number;
    reach: number;
    saves: number;
    shares: number;
    follows: number;
  };
  derived: {
    value_rate_pct: number;
    follow_rate_per_10k_reach: number;
  };
};

export const historicalJayPhrases = (evidence.posts as EvidencePost[]).map((post) => post.phrase);

const comparisonTokens = (value: string) => new Set(
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && ![
      "para", "como", "pero", "tambien", "porque", "cuando", "donde", "desde",
      "hasta", "puede", "puedes", "todo", "toda", "todos", "todas", "algo",
      "cada", "mismo", "misma",
    ].includes(word)),
);

const phraseSimilarity = (left: string, right: string) => {
  const a = comparisonTokens(left);
  const b = comparisonTokens(right);
  if (!a.size || !b.size) return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase() ? 1 : 0;
  const shared = [...a].filter((token) => b.has(token)).length;
  return shared / Math.min(a.size, b.size);
};

export const isTooCloseToJayHistory = (value: string, threshold = 0.72) =>
  historicalJayPhrases.some((phrase) => phraseSimilarity(value, phrase) >= threshold);

export const jayPerformanceEvidence = [
  "Evidence from 67 verified recent posts: 1,115,377 views, 684,186 reach, 6,750 saves, 3,122 shares and 263 follows.",
  "The two breakout posts generated 36.8% of all views and 74.9% of all follows, so never treat their visual templates as universally winning.",
  "The strongest repeated mechanism is a recognizable private behavior followed by a moral or emotional tension and a concrete consequence.",
  "Among posts with at least 5,000 reach, the highest save-plus-share rates came from: replacing motivation with keeping a commitment (2.545%), keeping your word without recognition (2.323%), caring about unseen details (2.032%), and acting without desire to earn self-respect (1.921%).",
  "Photo-with-text was the weakest tested format at 0.27% value rate and zero follows across two examples.",
  "Without the two viral outliers, no visual template dominates. The idea mechanism must lead; design supports it.",
  "Transformation copy such as X → Y is promising but has only two observations, so use it as an experiment rather than a proven rule.",
  "Spacing posts is an experiment, not a settled conclusion: single-post and multi-post days had nearly identical median views.",
].join(" ");

export const jayWinningMechanism = [
  "Build from one specific private behavior, decision or ordinary scene.",
  "Expose one contradiction, cost or responsibility the reader recognizes.",
  "End with one concrete consequence or personal criterion.",
  "The result must sound true before it sounds clever.",
].join(" ");
