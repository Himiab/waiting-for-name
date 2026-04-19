export interface TriggeredRule {
  id: number;
  name: string;
  weight: number;
  pattern: string;
}

export interface ModelParams {
  alpha: number;
  vocabSize: number;
  spamTokens: number;
  hamTokens: number;
}

export interface ScanResult {
  probability: number;
  tokens: string[];
  triggeredRules: TriggeredRule[];
  modelParams: ModelParams;
  isHighRisk: boolean;
  systemLogEntry?: string;
}
