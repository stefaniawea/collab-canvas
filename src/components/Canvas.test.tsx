import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CommentsProvider } from "../context/CommentsContext";
import { IdentityProvider } from "../context/IdentityContext";
import Canvas from "./Canvas";

describe("Canvas", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "collab-canvas:identity",
      JSON.stringify({
        color: "#06b6d4",
        id: "identity-1",
        name: "Curious Llama",
      }),
    );
  });

  function renderCanvas() {
    return render(
      <IdentityProvider>
        <CommentsProvider>
          <Canvas />
        </CommentsProvider>
      </IdentityProvider>,
    );
  }

  it("starts a draft when the canvas is clicked and cancels with Escape", () => {
    renderCanvas();

    expect(screen.getByRole("slider")).toHaveValue("100");
    fireEvent.click(screen.getAllByRole("img", { name: "Lama" })[0]);

    const draftEditor = screen.getByTestId("draft-comment");
    expect(draftEditor).toBeInTheDocument();

    fireEvent.keyDown(draftEditor, { key: "Escape" });
    expect(screen.queryByTestId("draft-comment")).toBeNull();
  });

  it("increments zoom with the zoom control", async () => {
    renderCanvas();

    fireEvent.click(screen.getByRole("button", { name: "+" }));

    await waitFor(() => expect(screen.getByRole("slider")).toHaveValue("110"), {
      timeout: 3000,
    });
  });
});
