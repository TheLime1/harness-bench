import { type ChangeEvent, useMemo, useState } from "react";

import siteDataJson from "./generated/site-data.json";
import {
  buildLeaderboardRows,
  filterRuns,
  formatCurrency,
  formatMinutes,
  formatPercent,
} from "./lib/leaderboard";
import type {
  IntelligenceLevel,
  LeaderboardFilters,
  SiteData,
  TrustTier,
} from "./lib/types";

const siteData = siteDataJson as SiteData;

const trustLabels: Record<TrustTier, string> = {
  self_reported: "Self reported",
  artifact_complete: "Artifact complete",
  maintainer_verified: "Maintainer verified",
};

const intelligenceOrder: IntelligenceLevel[] = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

const initialFilters: LeaderboardFilters = {
  trustTier: "all",
  harnessId: "all",
  modelId: "all",
  benchmarkId: "all",
  intelligenceLevel: "all",
  search: "",
};

function App() {
  const rows = useMemo(() => buildLeaderboardRows(siteData), []);
  const [filters, setFilters] = useState<LeaderboardFilters>(initialFilters);
  const filteredRows = useMemo(() => filterRuns(rows, filters), [filters, rows]);

  const harnessOptions = useMemo(
    () =>
      Array.from(
        new Map(
          rows.map((row) => [
            row.harnessId,
            { id: row.harnessId, label: row.harnessName },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [rows],
  );

  const modelOptions = useMemo(
    () =>
      Array.from(
        new Map(
          rows.map((row) => [
            row.modelId,
            { id: row.modelId, label: row.modelName, provider: row.modelProvider },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [rows],
  );

  const intelligenceOptions = useMemo(
    () =>
      intelligenceOrder.filter((level) =>
        rows.some((row) => row.intelligenceLevel === level),
      ),
    [rows],
  );

  const updateFilter =
    <Key extends "harnessId" | "modelId" | "intelligenceLevel">(key: Key) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        [key]: event.target.value as LeaderboardFilters[Key],
      }));
    };

  return (
    <>
      <div className="mock-data-banner" role="status">
        THIS IS A MOCK DATA
      </div>
      <main className="app-shell">
      <header className="page-title" aria-labelledby="page-title">
        <h1 id="page-title">Harness-Bench</h1>
        <p>
          Compare coding harnesses by model, benchmark, score, cost, runtime,
          and evidence quality.
        </p>
      </header>

      <section id="leaderboard" className="leaderboard-layout">
        <div className="table-panel">
          <div className="section-heading">
            <div>
              <h2>Leaderboard</h2>
              <p>
                {filteredRows.length} of {rows.length} submissions
              </p>
            </div>
          </div>
          <form className="leaderboard-filters" aria-label="Leaderboard filters">
            <label>
              <span>Model</span>
              <select value={filters.modelId} onChange={updateFilter("modelId")}>
                <option value="all">All models</option>
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label} · {model.provider}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Harness</span>
              <select
                value={filters.harnessId}
                onChange={updateFilter("harnessId")}
              >
                <option value="all">All harnesses</option>
                {harnessOptions.map((harness) => (
                  <option key={harness.id} value={harness.id}>
                    {harness.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Intelligence</span>
              <select
                value={filters.intelligenceLevel}
                onChange={updateFilter("intelligenceLevel")}
              >
                <option value="all">All levels</option>
                {intelligenceOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </form>
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
                {filteredRows.map((row, index) => (
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
                      <span className="artifact-status">
                        {row.artifactsUrl ? "Listed" : "Missing"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? (
                  <tr>
                    <td className="empty-cell" colSpan={10}>
                      No submissions match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <h2>Contribute a result</h2>
          <p>
            Add a YAML run under <code>data/runs</code>, include logs or
            trajectories in an artifact bundle, then open a pull request.
          </p>
        </div>
        <a className="footer-link" href="./CONTRIBUTING.md">
          Contribution guide
        </a>
      </footer>
      </main>
    </>
  );
}

export default App;
