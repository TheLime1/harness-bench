# Contributing Results

The full contribution guide lives in the repository root as `CONTRIBUTING.md`.

Short version:

1. Add registry YAML under `data/harnesses`, `data/models`, or `data/benchmarks` when needed.
2. Add a run under `data/runs/<benchmark>/<version>/<harness>/<model>/<yyyy-mm-dd>/result.yaml`.
3. Link stable public artifacts for logs, predictions, trajectories, and manual IDE evidence.
4. Run `pnpm generate:data`, `pnpm check:data`, `pnpm test`, and `pnpm build`.
5. Open a pull request.

Trust tiers are `self_reported`, `artifact_complete`, and `maintainer_verified`.
Intelligence levels are `none`, `minimal`, `low`, `medium`, `high`, and `xhigh`.
