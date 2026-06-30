import { useMemo } from "react";

import siteDataJson from "./generated/site-data.json";
import {
  buildLeaderboardRows,
  formatCurrency,
  formatMinutes,
  formatPercent,
} from "./lib/leaderboard";
import type { SiteData, TrustTier } from "./lib/types";

const siteData = siteDataJson as SiteData;

const trustLabels: Record<TrustTier, string> = {
  self_reported: "Self reported",
  artifact_complete: "Artifact complete",
  maintainer_verified: "Maintainer verified",
};

function App() {
  const rows = useMemo(() => buildLeaderboardRows(siteData), []);

  return (
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
              <p>{rows.length} submissions</p>
            </div>
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
                {rows.map((row, index) => (
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
                      <a className="artifact-link" href={row.artifactsUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
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
  );
}

export default App;
