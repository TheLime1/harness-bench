import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";
import { z } from "zod";

import type { Benchmark, Harness, Model, Run, SiteData } from "../src/lib/types";

const rootFromModule = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const dateStringSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}, z.string().datetime());

const urlSchema = z.string().url();

const harnessSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["cli", "ide", "editor-extension", "web", "framework"]),
  automation: z.enum(["automated", "manual", "hybrid"]),
  openaiCompatible: z.boolean(),
  website: urlSchema,
  summary: z.string().min(1),
}) satisfies z.ZodType<Harness>;

const modelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  family: z.string().min(1),
  providerModelId: z.string().min(1),
}) satisfies z.ZodType<Model>;

const benchmarkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  suite: z.string().min(1),
  metricLabel: z.string().min(1),
  website: urlSchema,
  description: z.string().min(1),
}) satisfies z.ZodType<Benchmark>;

const runSchema = z.object({
  submittedAt: dateStringSchema,
  submittedBy: z.string().min(1),
  trustTier: z.enum([
    "self_reported",
    "artifact_complete",
    "maintainer_verified",
  ]),
  harness: z.object({
    id: z.string().min(1),
    version: z.coerce.string().min(1),
    config: z.string().min(1),
  }),
  model: z.object({
      id: z.string().min(1),
      providerModelId: z.string().min(1),
      intelligenceLevel: z.enum([
        "none",
        "minimal",
        "low",
        "medium",
        "high",
        "xhigh",
      ]),
    }),
  benchmark: z.object({
    id: z.string().min(1),
    version: z.coerce.string().min(1),
    split: z.string().min(1),
  }),
  metrics: z.object({
    score: z.number().min(0).max(1),
    stderr: z.number().min(0).optional(),
    confidenceInterval: z.tuple([z.number().min(0), z.number().max(1)]).optional(),
    taskCount: z.number().int().positive(),
    costUsd: z.number().min(0).optional(),
    wallTimeMinutes: z.number().min(0).optional(),
    totalTokens: z.number().int().min(0).optional(),
  }),
  execution: z
    .object({
      mode: z.enum(["automated", "manual"]),
      command: z.string().min(1).optional(),
      protocol: z.string().min(1).optional(),
    })
    .refine((execution) => execution.command || execution.protocol, {
      message: "execution.command or execution.protocol is required",
    }),
  artifacts: z.object({
    url: urlSchema,
    logs: z.string().min(1).optional(),
    trajectories: z.string().min(1).optional(),
    predictions: z.string().min(1).optional(),
  }),
  notes: z.string().min(1).optional(),
});

export interface GenerateSiteDataOptions {
  rootDir?: string;
  generatedAt?: string;
}

async function readYamlFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const source = await readFile(filePath, "utf8");
  const parsed = YAML.parse(source);
  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `${path.relative(rootFromModule, filePath)} failed schema validation: ${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

async function listYamlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listYamlFiles(fullPath);
      }

      if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
        return [fullPath];
      }

      return [];
    }),
  );

  return files.flat().sort((a, b) => a.localeCompare(b));
}

function assertUnique<T>(
  values: T[],
  getKey: (value: T) => string,
  label: string,
) {
  const seen = new Set<string>();

  for (const value of values) {
    const key = getKey(value);

    if (seen.has(key)) {
      throw new Error(`Duplicate ${label}: ${key}`);
    }

    seen.add(key);
  }
}

function runId(run: Omit<Run, "id">): string {
  const submittedDay = run.submittedAt.slice(0, 10);

  return [
    run.benchmark.id,
    run.benchmark.version,
    run.harness.id,
    run.model.id,
    submittedDay,
  ].join("__");
}

function validateReferences(
  runs: Run[],
  harnesses: Harness[],
  models: Model[],
  benchmarks: Benchmark[],
) {
  const harnessIds = new Set(harnesses.map((harness) => harness.id));
  const modelIds = new Set(models.map((model) => model.id));
  const benchmarkKeys = new Set(
    benchmarks.map((benchmark) => `${benchmark.id}@${benchmark.version}`),
  );

  for (const run of runs) {
    if (!harnessIds.has(run.harness.id)) {
      throw new Error(`Run ${run.id} references unknown harness ${run.harness.id}`);
    }

    if (!modelIds.has(run.model.id)) {
      throw new Error(`Run ${run.id} references unknown model ${run.model.id}`);
    }

    const benchmarkKey = `${run.benchmark.id}@${run.benchmark.version}`;

    if (!benchmarkKeys.has(benchmarkKey)) {
      throw new Error(`Run ${run.id} references unknown benchmark ${benchmarkKey}`);
    }
  }
}

export async function generateSiteData(
  options: GenerateSiteDataOptions = {},
): Promise<SiteData> {
  const rootDir = options.rootDir ?? rootFromModule;
  const dataDir = path.join(rootDir, "data");

  const harnesses = await Promise.all(
    (await listYamlFiles(path.join(dataDir, "harnesses"))).map((filePath) =>
      readYamlFile(filePath, harnessSchema),
    ),
  );
  const models = await Promise.all(
    (await listYamlFiles(path.join(dataDir, "models"))).map((filePath) =>
      readYamlFile(filePath, modelSchema),
    ),
  );
  const benchmarks = await Promise.all(
    (await listYamlFiles(path.join(dataDir, "benchmarks"))).map((filePath) =>
      readYamlFile(filePath, benchmarkSchema),
    ),
  );
  const runs = (
    await Promise.all(
      (await listYamlFiles(path.join(dataDir, "runs"))).map(async (filePath) => {
        const run = await readYamlFile(filePath, runSchema);

        return {
          id: runId(run),
          ...run,
        } satisfies Run;
      }),
    )
  ).sort((a, b) => b.metrics.score - a.metrics.score);

  assertUnique(harnesses, (harness) => harness.id, "harness id");
  assertUnique(models, (model) => model.id, "model id");
  assertUnique(
    benchmarks,
    (benchmark) => `${benchmark.id}@${benchmark.version}`,
    "benchmark id/version",
  );
  assertUnique(runs, (run) => run.id, "run id");
  validateReferences(runs, harnesses, models, benchmarks);

  const generatedAt =
    options.generatedAt ??
    runs.reduce(
      (latest, run) => (run.submittedAt > latest ? run.submittedAt : latest),
      "1970-01-01T00:00:00.000Z",
    );

  return {
    generatedAt,
    harnesses,
    models,
    benchmarks,
    runs,
    summary: {
      runCount: runs.length,
      verifiedRunCount: runs.filter(
        (run) => run.trustTier === "maintainer_verified",
      ).length,
      harnessCount: harnesses.length,
      modelCount: models.length,
      benchmarkCount: benchmarks.length,
    },
  };
}

export async function writeSiteData(
  rootDir: string,
  siteData: SiteData,
): Promise<void> {
  const outputPath = path.join(rootDir, "src/generated/site-data.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(siteData, null, 2)}\n`, "utf8");
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const siteData = await generateSiteData();
  const outputPath = path.join(rootFromModule, "src/generated/site-data.json");
  const nextOutput = `${JSON.stringify(siteData, null, 2)}\n`;

  if (checkOnly) {
    const currentOutput = await readFile(outputPath, "utf8").catch(() => "");

    if (currentOutput !== nextOutput) {
      throw new Error(
        "Generated site data is stale. Run `pnpm generate:data` and commit the result.",
      );
    }

    return;
  }

  await writeSiteData(rootFromModule, siteData);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
