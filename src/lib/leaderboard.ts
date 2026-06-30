import type { LeaderboardFilters, LeaderboardRow, SiteData } from "./types";

export function buildLeaderboardRows(siteData: SiteData): LeaderboardRow[] {
  const harnesses = new Map(siteData.harnesses.map((harness) => [harness.id, harness]));
  const models = new Map(siteData.models.map((model) => [model.id, model]));
  const benchmarks = new Map(
    siteData.benchmarks.map((benchmark) => [
      `${benchmark.id}@${benchmark.version}`,
      benchmark,
    ]),
  );

  return siteData.runs
    .map((run) => {
      const harness = harnesses.get(run.harness.id);
      const model = models.get(run.model.id);
      const benchmark = benchmarks.get(
        `${run.benchmark.id}@${run.benchmark.version}`,
      );

      if (!harness || !model || !benchmark) {
        throw new Error(`Run ${run.id} references missing registry metadata`);
      }

      return {
        runId: run.id,
        submittedAt: run.submittedAt,
        submittedBy: run.submittedBy,
        trustTier: run.trustTier,
        harnessId: harness.id,
        harnessName: harness.name,
        harnessCategory: harness.category,
        harnessAutomation: harness.automation,
        harnessVersion: run.harness.version,
        modelId: model.id,
        modelName: model.name,
        modelProvider: model.provider,
        providerModelId: run.model.providerModelId,
        intelligenceLevel: run.model.intelligenceLevel,
        benchmarkId: benchmark.id,
        benchmarkName: benchmark.name,
        benchmarkVersion: benchmark.version,
        score: run.metrics.score,
        stderr: run.metrics.stderr,
        taskCount: run.metrics.taskCount,
        costUsd: run.metrics.costUsd,
        wallTimeMinutes: run.metrics.wallTimeMinutes,
        totalTokens: run.metrics.totalTokens,
        executionMode: run.execution.mode,
        command: run.execution.command,
        protocol: run.execution.protocol,
        artifactsUrl: run.artifacts.url,
        notes: run.notes,
      } satisfies LeaderboardRow;
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.harnessName.localeCompare(b.harnessName);
    });
}

export function filterRuns(
  rows: LeaderboardRow[],
  filters: LeaderboardFilters,
): LeaderboardRow[] {
  const query = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesTrustTier =
      filters.trustTier === "all" || row.trustTier === filters.trustTier;
    const matchesHarness =
      filters.harnessId === "all" || row.harnessId === filters.harnessId;
    const matchesModel =
      filters.modelId === "all" || row.modelId === filters.modelId;
    const matchesBenchmark =
      filters.benchmarkId === "all" || row.benchmarkId === filters.benchmarkId;
    const matchesIntelligence =
      filters.intelligenceLevel === "all" ||
      row.intelligenceLevel === filters.intelligenceLevel;
    const matchesSearch =
      query.length === 0 ||
      [
        row.harnessName,
        row.modelName,
        row.modelProvider,
        row.intelligenceLevel,
        row.benchmarkName,
        row.submittedBy,
        row.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return (
      matchesTrustTier &&
      matchesHarness &&
      matchesModel &&
      matchesBenchmark &&
      matchesIntelligence &&
      matchesSearch
    );
  });
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCurrency(value: number | undefined): string {
  if (value === undefined) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number | undefined): string {
  if (value === undefined) {
    return "n/a";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMinutes(value: number | undefined): string {
  if (value === undefined) {
    return "n/a";
  }

  if (value < 90) {
    return `${Math.round(value)} min`;
  }

  return `${(value / 60).toFixed(1)} hr`;
}
