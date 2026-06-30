import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the title, leaderboard, and footer", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Harness-Bench" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("THIS IS A MOCK DATA");
    expect(
      screen.getByRole("heading", { name: "Contribute a result" }),
    ).toBeInTheDocument();

    const leaderboard = screen.getByRole("table", { name: "Leaderboard" });
    expect(within(leaderboard).getByText("Codex CLI")).toBeInTheDocument();
    expect(within(leaderboard).getByText("Zed")).toBeInTheDocument();
    expect(within(leaderboard).getByText("xhigh")).toBeInTheDocument();
  });

  it("filters the leaderboard by model, harness, and intelligence", () => {
    render(<App />);

    const leaderboard = screen.getByRole("table", { name: "Leaderboard" });

    fireEvent.change(screen.getByLabelText("Model"), {
      target: { value: "gpt-5.2" },
    });
    expect(within(leaderboard).getByText("Aider")).toBeInTheDocument();
    expect(within(leaderboard).getByText("OpenHands")).toBeInTheDocument();
    expect(within(leaderboard).queryByText("Codex CLI")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Model"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText("Harness"), {
      target: { value: "zed" },
    });
    expect(within(leaderboard).getByText("Zed")).toBeInTheDocument();
    expect(within(leaderboard).queryByText("Aider")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Harness"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText("Intelligence"), {
      target: { value: "xhigh" },
    });
    expect(within(leaderboard).getByText("Codex CLI")).toBeInTheDocument();
    expect(within(leaderboard).queryByText("Zed")).not.toBeInTheDocument();
  });

  it("removes dead artifact action links while keeping static panels lean", () => {
    render(<App />);

    expect(screen.queryByRole("link", { name: "Open" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Listed")).toHaveLength(4);
    expect(screen.queryByLabelText("Charts")).not.toBeInTheDocument();
    expect(screen.queryByText("Run details")).not.toBeInTheDocument();
  });
});
