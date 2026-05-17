import {
  BarChart3,
  Clock3,
  Code2,
  ExternalLink,
  Filter,
  GitPullRequest,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import siteDataJson from "./generated/site-data.json";
import {
  buildLeaderboardRows,
  filterRuns,
  formatCompactNumber,
  formatCurrency,
  formatMinutes,
  formatPercent,
} from "./lib/leaderboard";
import type { LeaderboardFilters, LeaderboardRow, SiteData, TrustTier } from "./lib/types";

const siteData = siteDataJson as SiteData;

const trustLabels: Record<TrustTier, string> = {
  self_reported: "Self reported",
  artifact_complete: "Artifact complete",
  maintainer_verified: "Maintainer verified",
};

const trustDescriptions: Record<TrustTier, string> = {
  self_reported: "Submitted by a user without enough evidence to reproduce.",
  artifact_complete: "Includes command/protocol plus logs, predictions, or traces.",
  maintainer_verified: "Reviewed or reproduced by project maintainers.",
};

const defaultFilters: LeaderboardFilters = {
  trustTier: "all",
  harnessId: "all",
  modelId: "all",
  benchmarkId: "all",
  intelligenceLevel: "all",
  search: "",
};

function latestDate(rows: LeaderboardRow[]): string {
  if (rows.length === 0) {
    return "n/a";
  }

  const latest = rows.reduce((value, row) =>
    row.submittedAt > value ? row.submittedAt : value,
  rows[0].submittedAt);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(latest));
}

function App() {
  const rows = useMemo(() => buildLeaderboardRows(siteData), []);
  const [filters, setFilters] = useState<LeaderboardFilters>(defaultFilters);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLElement | null>(null);

  const filteredRows = useMemo(() => filterRuns(rows, filters), [filters, rows]);
  const selectedRun = useMemo(
    () => rows.find((row) => row.runId === selectedRunId) ?? null,
    [rows, selectedRunId],
  );

  const trendData = useMemo(
    () =>
      [...rows]
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
        .map((row) => ({
          date: row.submittedAt.slice(5, 10),
          score: Number((row.score * 100).toFixed(1)),
          name: `${row.harnessName} + ${row.modelName}`,
        })),
    [rows],
  );

  const costData = useMemo(
    () =>
      rows
        .filter((row) => row.costUsd !== undefined)
        .map((row) => ({
          x: row.costUsd,
          y: Number((row.score * 100).toFixed(1)),
          name: row.harnessName,
        })),
    [rows],
  );

  const runtimeData = useMemo(
    () =>
      rows
        .filter((row) => row.wallTimeMinutes !== undefined)
        .map((row) => ({
          x: row.wallTimeMinutes,
          y: Number((row.score * 100).toFixed(1)),
          name: row.harnessName,
        })),
    [rows],
  );

  const topRows = filteredRows.slice(0, 8);
  const intelligenceLevels = useMemo(
    () => [...new Set(rows.map((row) => row.intelligenceLevel))],
    [rows],
  );

  useEffect(() => {
    const detailPanel = detailPanelRef.current;

    if (!selectedRunId || !detailPanel || typeof detailPanel.scrollIntoView !== "function") {
      return;
    }

    window.requestAnimationFrame(() => {
      detailPanel.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [selectedRunId]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#leaderboard" aria-label="Harness-Bench leaderboard">
          <span className="brand-mark">
            <BarChart3 aria-hidden="true" size={22} />
          </span>
          <span>Harness-Bench</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#charts">Charts</a>
          <a href="#contribute">Contribute</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer">
            GitHub
            <ExternalLink aria-hidden="true" size={14} />
          </a>
        </nav>
      </header>

      <section className="intro-grid" aria-labelledby="page-title">
        <div className="intro-copy">
          <h1 id="page-title">Harness-Bench</h1>
          <p>
            Compare coding harnesses by model, intelligence level, benchmark,
            cost, runtime, and evidence quality. Automated CLI runs lead the
            table; manual IDE submissions stay visible with their trust tier
            attached.
          </p>
        </div>
      </section>

      <section className="filter-band" aria-label="Leaderboard filters">
        <div className="filter-title">
          <Filter aria-hidden="true" size={18} />
          <span>Filters</span>
        </div>
        <label>
          Verification
          <select
            value={filters.trustTier}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                trustTier: event.target.value as LeaderboardFilters["trustTier"],
              }))
            }
          >
            <option value="all">All submissions</option>
            <option value="maintainer_verified">Maintainer verified</option>
            <option value="artifact_complete">Artifact complete</option>
            <option value="self_reported">Self reported</option>
          </select>
        </label>
        <label>
          Harness
          <select
            value={filters.harnessId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                harnessId: event.target.value,
              }))
            }
          >
            <option value="all">All harnesses</option>
            {siteData.harnesses.map((harness) => (
              <option key={harness.id} value={harness.id}>
                {harness.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Model
          <select
            value={filters.modelId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                modelId: event.target.value,
              }))
            }
          >
            <option value="all">All models</option>
            {siteData.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Benchmark
          <select
            value={filters.benchmarkId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                benchmarkId: event.target.value,
              }))
            }
          >
            <option value="all">All benchmarks</option>
            {siteData.benchmarks.map((benchmark) => (
              <option key={`${benchmark.id}-${benchmark.version}`} value={benchmark.id}>
                {benchmark.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Intelligence
          <select
            value={filters.intelligenceLevel}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                intelligenceLevel: event.target
                  .value as LeaderboardFilters["intelligenceLevel"],
              }))
            }
          >
            <option value="all">All levels</option>
            {intelligenceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="search-control">
          Search
          <span className="search-box">
            <Search aria-hidden="true" size={16} />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Harness, model, submitter"
            />
          </span>
        </label>
      </section>

      <section id="charts" className="charts-grid" aria-label="Charts">
        <ChartPanel
          title="Score over time"
          subtitle={`Latest data: ${latestDate(rows)}`}
          icon={<Clock3 />}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe7e4" />
              <XAxis dataKey="date" stroke="#53615d" tickLine={false} axisLine={false} />
              <YAxis stroke="#53615d" tickLine={false} axisLine={false} domain={[50, 100]} />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#cbd8d3" }} />
              <Line type="monotone" dataKey="score" stroke="#0f8f75" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Cost vs score" subtitle="USD per submitted run" icon={<GitPullRequest />}>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe7e4" />
              <XAxis dataKey="x" name="Cost" stroke="#53615d" tickLine={false} axisLine={false} />
              <YAxis dataKey="y" name="Score" stroke="#53615d" tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 8, borderColor: "#cbd8d3" }} />
              <Scatter data={costData} fill="#d26b4f" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Runtime vs score" subtitle="Wall-clock minutes" icon={<Code2 />}>
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe7e4" />
              <XAxis dataKey="x" name="Minutes" stroke="#53615d" tickLine={false} axisLine={false} />
              <YAxis dataKey="y" name="Score" stroke="#53615d" tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 8, borderColor: "#cbd8d3" }} />
              <Scatter data={runtimeData} fill="#2766ad" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section id="leaderboard" className="leaderboard-layout">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <h2>Leaderboard</h2>
              <p>{filteredRows.length} matching submissions</p>
            </div>
            <span className="data-note">Generated {latestDate(rows)}</span>
          </div>
          <div className="table-scroll">
            <table aria-label="Leaderboard">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Harness</th>
                  <th>Model</th>
                  <th>Intelligence</th>
                  <th>Benchmark</th>
                  <th>Score</th>
                  <th>Cost</th>
                  <th>Runtime</th>
                  <th>Trust</th>
                  <th>Artifacts</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row, index) => (
                  <tr key={row.runId}>
                    <td className="rank-cell">#{index + 1}</td>
                    <td>
                      <strong>{row.harnessName}</strong>
                      <span>{row.harnessCategory} · v{row.harnessVersion}</span>
                    </td>
                    <td>
                      <strong>{row.modelName}</strong>
                      <span>{row.modelProvider}</span>
                    </td>
                    <td>
                      <span className={`intelligence-pill ${row.intelligenceLevel}`}>
                        {row.intelligenceLevel}
                      </span>
                    </td>
                    <td>
                      <strong>{row.benchmarkName}</strong>
                      <span>{row.benchmarkVersion}</span>
                    </td>
                    <td className="score-cell">
                      {formatPercent(row.score)}
                      {row.stderr !== undefined ? <span>± {formatPercent(row.stderr)}</span> : null}
                    </td>
                    <td>{formatCurrency(row.costUsd)}</td>
                    <td>{formatMinutes(row.wallTimeMinutes)}</td>
                    <td>
                      <span className={`trust-pill ${row.trustTier}`}>
                        {trustLabels[row.trustTier]}
                      </span>
                    </td>
                    <td>
                      <button
                        className="details-button"
                        type="button"
                        onClick={() => setSelectedRunId(row.runId)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside id="run-details-panel" ref={detailPanelRef} className="detail-panel" aria-live="polite">
          {selectedRun ? (
            <RunDetails row={selectedRun} />
          ) : (
            <div className="empty-detail">
              <ShieldCheck aria-hidden="true" size={28} />
              <h2>Run details</h2>
              <p>
                Select a row to inspect the exact command or manual protocol,
                artifact bundle, intelligence level, tokens, submitter, and
                trust tier.
              </p>
            </div>
          )}
        </aside>
      </section>

      <section id="contribute" className="contribution-band" aria-labelledby="contribute-title">
        <div>
          <h2 id="contribute-title">Contribute a result</h2>
          <p>
            Add a YAML run under <code>data/runs</code>, include logs or
            trajectories in an artifact bundle, then open a pull request. CI
            validates the schema and generated static data before review.
          </p>
        </div>
        <a className="primary-link" href="./CONTRIBUTING.md">
          Contribution guide
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      </section>
    </main>
  );
}

function ChartPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="chart-panel">
      <div className="chart-title">
        <span>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function RunDetails({ row }: { row: LeaderboardRow }) {
  return (
    <div className="run-details">
      <div className="details-header">
        <span className={`trust-pill ${row.trustTier}`}>{trustLabels[row.trustTier]}</span>
        <a href={row.artifactsUrl} target="_blank" rel="noreferrer">
          Artifacts
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>
      <h2>{row.harnessName} + {row.modelName}</h2>
      <p>{row.benchmarkName} {row.benchmarkVersion}</p>
      <dl>
        <div>
          <dt>Score</dt>
          <dd>{formatPercent(row.score)}{row.stderr !== undefined ? ` ± ${formatPercent(row.stderr)}` : ""}</dd>
        </div>
        <div>
          <dt>Tasks</dt>
          <dd>{row.taskCount}</dd>
        </div>
        <div>
          <dt>Tokens</dt>
          <dd>{formatCompactNumber(row.totalTokens)}</dd>
        </div>
        <div>
          <dt>Intelligence</dt>
          <dd>{row.intelligenceLevel}</dd>
        </div>
        <div>
          <dt>Submitter</dt>
          <dd>{row.submittedBy}</dd>
        </div>
      </dl>
      <div className="command-box">
        <strong>{row.executionMode === "automated" ? "Command" : "Manual protocol"}</strong>
        <code>{row.command ?? row.protocol}</code>
      </div>
      <p className="trust-description">{trustDescriptions[row.trustTier]}</p>
      {row.notes ? <p className="notes">{row.notes}</p> : null}
    </div>
  );
}

export default App;
