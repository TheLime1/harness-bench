import { describe, expect, it } from "vitest";

import {
  buildLeaderboardRows,
  filterRuns,
  formatCurrency,
  formatPercent,
} from "./leaderboard";
import type { SiteData } from "./types";

const siteData: SiteData = {
  generatedAt: "2026-05-09T00:00:00.000Z",
  harnesses: [
    {
      id: "codex-cli",
      name: "Codex CLI",
      category: "cli",
      automation: "automated",
      openaiCompatible: true,
      website: "https://developers.openai.com/codex/cli",
      summary: "Terminal coding agent.",
    },
    {
      id: "zed",
      name: "Zed",
      category: "ide",
      automation: "manual",
      openaiCompatible: true,
      website: "https://zed.dev",
      summary: "IDE agent harness.",
    },
  ],
  models: [
    {
      id: "gpt-5.5",
      name: "GPT-5.5",
      provider: "OpenAI",
      family: "GPT",
      providerModelId: "gpt-5.5",
    },
  ],
  benchmarks: [
    {
      id: "terminal-bench",
      name: "Terminal-Bench",
      version: "2.1",
      suite: "coding-agent",
      metricLabel: "Accuracy",
      website: "https://www.tbench.ai/leaderboard/terminal-bench/2.1",
      description: "Terminal agent tasks.",
    },
  ],
  runs: [
    {
      id: "terminal-bench__2.1__zed__gpt-5.5__2026-05-02",
      submittedAt: "2026-05-02T12:00:00.000Z",
      submittedBy: "example",
      trustTier: "self_reported",
      harness: {
        id: "zed",
        version: "0.186.0",
        config: "Manual IDE protocol",
      },
      model: {
        id: "gpt-5.5",
        providerModelId: "gpt-5.5",
        intelligenceLevel: "low",
      },
      benchmark: {
        id: "terminal-bench",
        version: "2.1",
        split: "terminal-bench-2-1",
      },
      metrics: {
        score: 0.72,
        stderr: 0.03,
        taskCount: 60,
        costUsd: 140.25,
        wallTimeMinutes: 320,
        totalTokens: 11200000,
      },
      execution: {
        mode: "manual",
        protocol: "Run task prompt in Zed Agent Panel and collect artifacts.",
      },
      artifacts: {
        url: "https://github.com/example/harness-bench/releases/tag/zed-gpt55",
      },
    },
    {
      id: "terminal-bench__2.1__codex-cli__gpt-5.5__2026-05-01",
      submittedAt: "2026-05-01T12:00:00.000Z",
      submittedBy: "maintainers",
      trustTier: "maintainer_verified",
      harness: {
        id: "codex-cli",
        version: "0.58.0",
        config: "Harbor installed agent",
      },
      model: {
        id: "gpt-5.5",
        providerModelId: "gpt-5.5",
        intelligenceLevel: "xhigh",
      },
      benchmark: {
        id: "terminal-bench",
        version: "2.1",
        split: "terminal-bench-2-1",
      },
      metrics: {
        score: 0.834,
        stderr: 0.022,
        taskCount: 200,
        costUsd: 211.4,
        wallTimeMinutes: 455,
        totalTokens: 18400000,
      },
      execution: {
        mode: "automated",
        command:
          'harbor run -d terminal-bench/terminal-bench-2-1 -a "codex-cli" -m "gpt-5.5" -k 5',
      },
      artifacts: {
        url: "https://www.tbench.ai/leaderboard/terminal-bench/2.1",
      },
    },
  ],
  summary: {
    runCount: 2,
    verifiedRunCount: 1,
    harnessCount: 2,
    modelCount: 1,
    benchmarkCount: 1,
  },
};

describe("leaderboard helpers", () => {
  it("joins registry metadata and sorts rows by score descending", () => {
    const rows = buildLeaderboardRows(siteData);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      harnessName: "Codex CLI",
      modelName: "GPT-5.5",
      benchmarkName: "Terminal-Bench",
      score: 0.834,
      trustTier: "maintainer_verified",
      intelligenceLevel: "xhigh",
    });
    expect(rows[1].harnessName).toBe("Zed");
  });

  it("filters by verification tier while preserving joined row metadata", () => {
    const rows = filterRuns(buildLeaderboardRows(siteData), {
      trustTier: "maintainer_verified",
      harnessId: "all",
      modelId: "all",
      benchmarkId: "all",
      intelligenceLevel: "all",
      search: "",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].runId).toContain("codex-cli");
  });

  it("filters by intelligence level so model effort can be compared", () => {
    const rows = filterRuns(buildLeaderboardRows(siteData), {
      trustTier: "all",
      harnessId: "all",
      modelId: "all",
      benchmarkId: "all",
      intelligenceLevel: "xhigh",
      search: "",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      harnessName: "Codex CLI",
      intelligenceLevel: "xhigh",
    });
  });

  it("formats leaderboard numbers for display", () => {
    expect(formatPercent(0.834, 1)).toBe("83.4%");
    expect(formatCurrency(211.4)).toBe("$211.40");
    expect(formatCurrency(undefined)).toBe("n/a");
  });
});
