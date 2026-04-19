import type { ModelParams, ScanResult, TriggeredRule } from "./types";

// ─── Model Parameters ─────────────────────────────────────────────────────────
const ALPHA = 1.0; // Laplace smoothing

// Spam vocabulary with token counts from training corpus
const SPAM_VOCAB: Record<string, number> = {
  free: 12,
  click: 18,
  winner: 9,
  congratulations: 7,
  prize: 11,
  urgent: 15,
  verify: 14,
  account: 8,
  suspended: 6,
  login: 10,
  password: 13,
  confirm: 9,
  bank: 7,
  paypal: 8,
  update: 6,
  security: 5,
  alert: 10,
  limited: 7,
  offer: 9,
  claim: 8,
  reset: 6,
  phishing: 11,
  malware: 9,
  exploit: 7,
  credential: 8,
};

const HAM_VOCAB: Record<string, number> = {
  hello: 20,
  thanks: 18,
  meeting: 15,
  report: 12,
  schedule: 10,
  project: 14,
  review: 11,
  attached: 9,
  document: 13,
  please: 16,
  regarding: 8,
  team: 17,
  update: 7,
  follow: 9,
  information: 11,
};

const TOTAL_SPAM_TOKENS = Object.values(SPAM_VOCAB).reduce((a, b) => a + b, 0);
const TOTAL_HAM_TOKENS = Object.values(HAM_VOCAB).reduce((a, b) => a + b, 0);
const VOCAB_SIZE = new Set([
  ...Object.keys(SPAM_VOCAB),
  ...Object.keys(HAM_VOCAB),
]).size;

// ─── Heuristic Rules ──────────────────────────────────────────────────────────
const HEURISTIC_RULES = [
  {
    id: 1,
    name: "Email-in-URL pattern detected",
    pattern: "/@[a-zA-Z0-9.-]+/",
    weight: 0.4,
    regex: /@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  },
  {
    id: 2,
    name: "IP-based URL detected",
    pattern: "/\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b/",
    weight: 0.5,
    regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  },
  {
    id: 3,
    name: "Punycode pattern detected",
    pattern: "/xn--[a-zA-Z0-9]+/",
    weight: 0.6,
    regex: /xn--[a-zA-Z0-9]+/i,
  },
  {
    id: 4,
    name: "Suspicious TLD detected (.xyz/.tk/.ml)",
    pattern: "/\\.(xyz|tk|ml|gq|cf|ga)([\\/\\s]|$)/i",
    weight: 0.3,
    regex: /\.(xyz|tk|ml|gq|cf|ga)([\\/\s]|$)/i,
  },
];

// ─── Tokenizer ────────────────────────────────────────────────────────────────
export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s.,;:!?@/\\()\[\]{}<>"'|=+\-_&#%^*~`]+/)
    .filter((t) => t.length > 2);
}

// ─── Naive Bayes Scorer ───────────────────────────────────────────────────────
function naiveBayesScore(tokens: string[]): number {
  let logSpam = Math.log(0.5);
  let logHam = Math.log(0.5);

  for (const token of tokens) {
    const spamCount = SPAM_VOCAB[token] ?? 0;
    const hamCount = HAM_VOCAB[token] ?? 0;

    // P(token | spam) with Laplace smoothing
    const pSpam =
      (spamCount + ALPHA) / (TOTAL_SPAM_TOKENS + ALPHA * VOCAB_SIZE);
    // P(token | ham) with Laplace smoothing
    const pHam = (hamCount + ALPHA) / (TOTAL_HAM_TOKENS + ALPHA * VOCAB_SIZE);

    logSpam += Math.log(pSpam);
    logHam += Math.log(pHam);
  }

  // Convert log-probabilities to probability via softmax
  const maxLog = Math.max(logSpam, logHam);
  const expSpam = Math.exp(logSpam - maxLog);
  const expHam = Math.exp(logHam - maxLog);
  return expSpam / (expSpam + expHam);
}

// ─── Main Scan Function ───────────────────────────────────────────────────────
export function scanInput(input: string): ScanResult {
  const tokens = tokenize(input);

  // Run heuristic rules
  const triggeredRules: TriggeredRule[] = HEURISTIC_RULES.filter((rule) =>
    rule.regex.test(input),
  ).map(({ id, name, weight, pattern }) => ({ id, name, weight, pattern }));

  // Compute heuristic boost
  const heuristicBoost = triggeredRules.reduce((sum, r) => sum + r.weight, 0);

  // Naive Bayes base probability
  const bayesProb = tokens.length > 0 ? naiveBayesScore(tokens) : 0.1;

  // Combine: weighted blend capped at 1.0
  const combined = Math.min(1.0, bayesProb * 0.6 + heuristicBoost * 0.4);

  const isHighRisk = combined >= 0.7;

  const modelParams: ModelParams = {
    alpha: ALPHA,
    vocabSize: VOCAB_SIZE,
    spamTokens: TOTAL_SPAM_TOKENS,
    hamTokens: TOTAL_HAM_TOKENS,
  };

  let systemLogEntry: string | undefined;
  if (isHighRisk) {
    const ts = new Date().toISOString();
    const ruleIds = triggeredRules
      .map((r) => `RULE-${r.id.toString().padStart(3, "0")}`)
      .join(", ");
    systemLogEntry = `[${ts}] THREAT_DETECTED :: PROBABILITY=${(combined * 100).toFixed(1)}% :: RULES=[${ruleIds || "NB_CLASSIFIER"}] :: STATUS=ACTIVE_BLOCKING_ENGAGED`;
  }

  return {
    probability: combined,
    tokens,
    triggeredRules,
    modelParams,
    isHighRisk,
    systemLogEntry,
  };
}

export const ENGINE_META = {
  version: "VGUARD_ML_2.1",
  trainingDataset: "SEC_LOGS_OCT_2023",
  alpha: ALPHA,
  vocabSize: VOCAB_SIZE,
};
