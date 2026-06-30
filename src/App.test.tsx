import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the title, leaderboard, and footer", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Harness-Bench" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contribute a result" }),
    ).toBeInTheDocument();

    const leaderboard = screen.getByRole("table", { name: "Leaderboard" });
    expect(within(leaderboard).getByText("Codex CLI")).toBeInTheDocument();
    expect(within(leaderboard).getByText("Zed")).toBeInTheDocument();
    expect(within(leaderboard).getByText("xhigh")).toBeInTheDocument();
  });

  it("removes the old filters, charts, and run details panel", () => {
    render(<App />);

    expect(screen.queryByLabelText("Leaderboard filters")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Charts")).not.toBeInTheDocument();
    expect(screen.queryByText("Run details")).not.toBeInTheDocument();
  });
});
