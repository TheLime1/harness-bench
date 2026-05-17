import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { generateSiteData, writeSiteData } from "./generate-site-data";

async function writeYaml(root: string, filePath: string, content: string) {
  const fullPath = path.join(root, filePath);
  await import("node:fs/promises").then(({ mkdir }) =>
    mkdir(path.dirname(fullPath), { recursive: true }),
  );
  await writeFile(fullPath, content.trimStart(), "utf8");
}

describe("site data generator", () => {
  it("loads registries and runs into normalized site data", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "harness-bench-"));

    try {
      await writeYaml(
        root,
        "data/harnesses/codex-cli.yaml",
        `
id: codex-cli
name: Codex CLI
category: cli
automation: automated
openaiCompatible: true
website: https://developers.openai.com/codex/cli
summary: Terminal coding agent.
`,
      );
      await writeYaml(
        root,
        "data/models/gpt-5.5.yaml",
        `
id: gpt-5.5
name: GPT-5.5
provider: OpenAI
family: GPT
providerModelId: gpt-5.5
`,
      );
      await writeYaml(
        root,
        "data/benchmarks/terminal-bench-2.1.yaml",
        `
id: terminal-bench
name: Terminal-Bench
version: "2.1"
suite: coding-agent
metricLabel: Accuracy
website: https://www.tbench.ai/leaderboard/terminal-bench/2.1
description: Terminal agent tasks.
`,
      );
      await writeYaml(
        root,
        "data/runs/terminal-bench/2.1/codex-cli/gpt-5.5/2026-05-01/result.yaml",
        `
submittedAt: 2026-05-01T12:00:00.000Z
submittedBy: maintainers
trustTier: maintainer_verified
harness:
  id: codex-cli
  version: 0.58.0
  config: Harbor installed agent
model:
  id: gpt-5.5
  providerModelId: gpt-5.5
  intelligenceLevel: xhigh
benchmark:
  id: terminal-bench
  version: "2.1"
  split: terminal-bench-2-1
metrics:
  score: 0.834
  stderr: 0.022
  taskCount: 200
execution:
  mode: automated
  command: harbor run -d terminal-bench/terminal-bench-2-1 -a codex-cli -m gpt-5.5 -k 5
artifacts:
  url: https://www.tbench.ai/leaderboard/terminal-bench/2.1
`,
      );

      const siteData = await generateSiteData({
        rootDir: root,
        generatedAt: "2026-05-09T00:00:00.000Z",
      });

      expect(siteData.summary).toEqual({
        runCount: 1,
        verifiedRunCount: 1,
        harnessCount: 1,
        modelCount: 1,
        benchmarkCount: 1,
      });
      expect(siteData.runs[0]).toMatchObject({
        id: "terminal-bench__2.1__codex-cli__gpt-5.5__2026-05-01",
        trustTier: "maintainer_verified",
        model: {
          intelligenceLevel: "xhigh",
        },
        metrics: {
          score: 0.834,
          taskCount: 200,
        },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("writes deterministic JSON for the static app", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "harness-bench-"));

    try {
      const data = {
        generatedAt: "2026-05-09T00:00:00.000Z",
        harnesses: [],
        models: [],
        benchmarks: [],
        runs: [],
        summary: {
          runCount: 0,
          verifiedRunCount: 0,
          harnessCount: 0,
          modelCount: 0,
          benchmarkCount: 0,
        },
      };

      await writeSiteData(root, data);

      const output = await readFile(
        path.join(root, "src/generated/site-data.json"),
        "utf8",
      );

      expect(output).toContain('"generatedAt": "2026-05-09T00:00:00.000Z"');
      expect(output.endsWith("\n")).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
