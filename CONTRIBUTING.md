# Contributing Results

Harness-Bench accepts pull requests that add or correct benchmark results. The goal is to make every result inspectable, comparable, and eventually reproducible.

## Submission Flow

1. Add or update registry metadata if needed:
   - `data/harnesses/<harness>.yaml`
   - `data/models/<model>.yaml`
   - `data/benchmarks/<benchmark>.yaml`
2. Add the run:
   - `data/runs/<benchmark>/<version>/<harness>/<model>/<yyyy-mm-dd>/result.yaml`
3. Include artifact links. For large logs, traces, predictions, or workspaces, publish a GitHub Release or another stable URL and link to it from the YAML.
4. Run:

```bash
pnpm install
pnpm generate:data
pnpm check:data
pnpm test
pnpm build
```

5. Open a pull request with the command or manual protocol you used.

## Trust Tiers

- `self_reported`: The submitter provides a score and basic metadata, but the artifacts are incomplete.
- `artifact_complete`: The submission includes enough artifacts for a maintainer to inspect the run: command/protocol, logs, predictions or trajectories, and benchmark version.
- `maintainer_verified`: A maintainer has reviewed or reproduced the result.

Maintainers may lower a trust tier if the evidence is incomplete. They may also ask for extra artifacts before merging.

## Run YAML Shape

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
notes: Optional context for reviewers.
```

Manual IDE submissions should use `execution.mode: manual` and include `execution.protocol` instead of `execution.command`.

Use `model.intelligenceLevel` to record the run's model effort or reasoning mode. Accepted values are `none`, `minimal`, `low`, `medium`, `high`, and `xhigh`.

## Review Checklist

- The referenced harness, model, and benchmark IDs exist.
- The score is between `0` and `1`.
- The run path matches the YAML metadata.
- The artifact URL is stable and public.
- The generated `src/generated/site-data.json` is updated.
