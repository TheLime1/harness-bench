import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the seeded leaderboard and filters to verified runs", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Harness-Bench" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Repository summary")).not.toBeInTheDocument();
    const initialLeaderboard = screen.getByRole("table", { name: "Leaderboard" });
    expect(within(initialLeaderboard).getByText("Codex CLI")).toBeInTheDocument();
    expect(within(initialLeaderboard).getByText("Zed")).toBeInTheDocument();
    expect(within(initialLeaderboard).getByText("xhigh")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Verification"), {
      target: { value: "maintainer_verified" },
    });

    const leaderboard = screen.getByRole("table", { name: "Leaderboard" });
    expect(within(leaderboard).getByText("Codex CLI")).toBeInTheDocument();
    expect(within(leaderboard).queryByText("Zed")).not.toBeInTheDocument();
  });

  it("filters by intelligence level", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Intelligence"), {
      target: { value: "xhigh" },
    });

    const leaderboard = screen.getByRole("table", { name: "Leaderboard" });
    expect(within(leaderboard).getByText("Codex CLI")).toBeInTheDocument();
    expect(within(leaderboard).queryByText("OpenHands")).not.toBeInTheDocument();
  });
});
