# Harness-Bench

**A benchmark leaderboard for AI coding harnesses by model.**

Harness-Bench compares the tool wrapped around the model, not just the model itself. The same model can behave very differently in Codex CLI, OpenCode, Zed, Aider, OpenHands, Cline, Roo Code, Continue, and future harnesses. This repo tracks those differences with reproducible data files and a static GitHub Pages leaderboard.

> Status: early v1. The data model, contribution flow, and static leaderboard are in place; seeded results are fixtures plus public-reference entries that should be expanded by community submissions.

## Contents

- [Overview](#overview)
- [Leaderboard](#leaderboard)
- [What Harness-Bench Measures](#what-harness-bench-measures)
- [Benchmarks](#benchmarks)
- [Data Format](#data-format)
- [Submitting Results](#submitting-results)
- [Local Development](#local-development)
- [Repository Layout](#repository-layout)
- [Sponsor](#sponsor)
- [Citation](#citation)

## Overview

Most model leaderboards answer: **which model is strongest?**

Harness-Bench asks a different question: **which harness gets the most out of a model on real coding-agent benchmarks?**

For each run, Harness-Bench records:

- harness name, version, category, and configuration
- model provider, model ID, and intelligence/reasoning level
- benchmark suite, version, and split
- score, uncertainty, task count, cost, runtime, and token usage
- execution command or manual IDE protocol
- artifacts, logs, predictions, trajectories, and trust tier

## Leaderboard

The site is a static Vite + React app built for GitHub Pages.

```bash
pnpm install
pnpm generate:data
pnpm dev
```

Open the local app at:

```text
http://127.0.0.1:5173/
```

Build the deployable site:

```bash
pnpm build
```

## What Harness-Bench Measures

Harness-Bench stores one normalized result per harness/model/benchmark run.

| Dimension | Examples |
| --- | --- |
| Harness | Codex CLI, OpenCode, Zed, Aider, OpenHands |
| Model | GPT-5.5, GPT-5.2, Claude Opus 4.7, GLM-4.7 |
| Intelligence level | `none`, `minimal`, `low`, `medium`, `high`, `xhigh` |
| Benchmark | Terminal-Bench, SWE-bench Verified, Aider Polyglot |
| Evidence | command, protocol, logs, predictions, trajectories |
| Trust tier | `self_reported`, `artifact_complete`, `maintainer_verified` |

## Benchmarks

Seeded v1 suites:

- **Terminal-Bench 2.1**: real terminal tasks for autonomous coding and operations agents.
- **SWE-bench Verified**: real GitHub issue resolution tasks.
- **Aider Polyglot**: multi-language code editing tasks based on Exercism exercises.

The repo is intentionally benchmark-agnostic. New benchmark suites can be added with a registry YAML file and normalized run submissions.

## Data Format

Registry files:

```text
data/harnesses/*.yaml
data/models/*.yaml
data/benchmarks/*.yaml
```

Run files:

```text
data/runs/<benchmark>/<version>/<harness>/<model>/<yyyy-mm-dd>/result.yaml
```

Example:

```yaml
submittedAt: 2026-05-01T12:00:00.000Z
submittedBy: your-github-handle
trustTier: artifact_complete
harness:
  id: codex-cli
  version: 0.58.0
  config: Harbor installed agent with default terminal sandbox settings.
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
  costUsd: 211.40
  wallTimeMinutes: 455
  totalTokens: 18400000
execution:
  mode: automated
  command: harbor run -d terminal-bench/terminal-bench-2-1 -a codex-cli -m gpt-5.5 -k 5
artifacts:
  url: https://github.com/owner/repo/releases/tag/run-artifacts
  logs: https://github.com/owner/repo/releases/tag/run-artifacts
  trajectories: https://github.com/owner/repo/releases/tag/run-artifacts
  predictions: https://github.com/owner/repo/releases/tag/run-artifacts
notes: Optional reviewer context.
```

Generated site data lives at:

```text
src/generated/site-data.json
```

Regenerate it after editing YAML:

```bash
pnpm generate:data
```

## Submitting Results

1. Add or update registry metadata under `data/harnesses`, `data/models`, or `data/benchmarks`.
2. Add a run under `data/runs/<benchmark>/<version>/<harness>/<model>/<yyyy-mm-dd>/result.yaml`.
3. Link stable public artifacts. Large logs and traces should live in GitHub Releases or object storage, not directly in the repo.
4. Run the validation suite:

```bash
pnpm generate:data
pnpm check:data
pnpm test
pnpm build
```

5. Open a pull request.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full checklist and trust-tier rules.

## Local Development

```bash
pnpm install
pnpm generate:data
pnpm test
pnpm dev
```

Useful commands:

```bash
pnpm check:data   # fail if generated site data is stale
pnpm test         # run schema, generator, and UI tests
pnpm build        # generate data, typecheck, and build the static site
```

## Repository Layout

```text
.
├── data/                 # benchmark registries and result submissions
├── scripts/              # YAML validation and static-data generation
├── src/                  # React leaderboard app
├── public/               # static files copied to GitHub Pages
├── .github/workflows/    # GitHub Pages CI
├── CONTRIBUTING.md       # submission guide
└── README.md
```

## Sponsor

If Harness-Bench helps you compare tools, publish results, or build better coding-agent harnesses, consider sponsoring the project:

**GitHub Sponsors:** [github.com/sponsors/thelime1](https://github.com/sponsors/thelime1)

Sponsorship helps cover benchmark runs, artifact storage, maintenance, and the unglamorous work of keeping result submissions clean.

## Citation

If you use Harness-Bench in a report, paper, benchmark comparison, or product evaluation, cite the repository:

```bibtex
@software{harness_bench,
  title = {Harness-Bench: A Leaderboard for AI Coding Harnesses by Model},
  author = {thelime1 and contributors},
  year = {2026},
  url = {https://github.com/thelime1/harness-bench}
}
```

## Acknowledgements

Harness-Bench is inspired by the public evaluation culture around SWE-bench, Terminal-Bench, Aider Polyglot, HELM, and related benchmark projects.
