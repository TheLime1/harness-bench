export type TrustTier =
  | "self_reported"
  | "artifact_complete"
  | "maintainer_verified";

export type HarnessCategory = "cli" | "ide" | "editor-extension" | "web" | "framework";

export type AutomationMode = "automated" | "manual" | "hybrid";

export type ExecutionMode = "automated" | "manual";

export type IntelligenceLevel =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export interface Harness {
  id: string;
  name: string;
  category: HarnessCategory;
  automation: AutomationMode;
  openaiCompatible: boolean;
  website: string;
  summary: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  family: string;
  providerModelId: string;
}

export interface Benchmark {
  id: string;
  name: string;
  version: string;
  suite: string;
  metricLabel: string;
  website: string;
  description: string;
}

export interface Run {
  id: string;
  submittedAt: string;
  submittedBy: string;
  trustTier: TrustTier;
  harness: {
    id: string;
    version: string;
    config: string;
  };
  model: {
    id: string;
    providerModelId: string;
    intelligenceLevel: IntelligenceLevel;
  };
  benchmark: {
    id: string;
    version: string;
    split: string;
  };
  metrics: {
    score: number;
    stderr?: number;
    confidenceInterval?: [number, number];
    taskCount: number;
    costUsd?: number;
    wallTimeMinutes?: number;
    totalTokens?: number;
  };
  execution: {
    mode: ExecutionMode;
    command?: string;
    protocol?: string;
  };
  artifacts: {
    url: string;
    logs?: string;
    trajectories?: string;
    predictions?: string;
  };
  notes?: string;
}

export interface SiteData {
  generatedAt: string;
  harnesses: Harness[];
  models: Model[];
  benchmarks: Benchmark[];
  runs: Run[];
  summary: {
    runCount: number;
    verifiedRunCount: number;
    harnessCount: number;
    modelCount: number;
    benchmarkCount: number;
  };
}

export interface LeaderboardRow {
  runId: string;
  submittedAt: string;
  submittedBy: string;
  trustTier: TrustTier;
  harnessId: string;
  harnessName: string;
  harnessCategory: HarnessCategory;
  harnessAutomation: AutomationMode;
  harnessVersion: string;
  modelId: string;
  modelName: string;
  modelProvider: string;
  providerModelId: string;
  intelligenceLevel: IntelligenceLevel;
  benchmarkId: string;
  benchmarkName: string;
  benchmarkVersion: string;
  score: number;
  stderr?: number;
  taskCount: number;
  costUsd?: number;
  wallTimeMinutes?: number;
  totalTokens?: number;
  executionMode: ExecutionMode;
  command?: string;
  protocol?: string;
  artifactsUrl: string;
  notes?: string;
}

export interface LeaderboardFilters {
  trustTier: TrustTier | "all";
  harnessId: string | "all";
  modelId: string | "all";
  benchmarkId: string | "all";
  intelligenceLevel: IntelligenceLevel | "all";
  search: string;
}
