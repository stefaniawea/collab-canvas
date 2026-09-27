import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("keeps the cursor position anchored while zooming", async () => {
    renderCanvas();

    const container = screen.getByTestId("canvas-container");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      bottom: 600,
      height: 600,
      left: 0,
      right: 800,
      toJSON: () => ({}),
      top: 0,
      width: 800,
      x: 0,
      y: 0,
    });

    fireEvent.wheel(container, { clientX: 200, clientY: 150, deltaY: -20 });

    await waitFor(() => {
      expect(screen.getByRole("slider")).toHaveValue("110");
      const transform = screen.getByTestId("canvas").style.transform;
      const translation = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);

      expect(translation).not.toBeNull();
      expect(Number(translation?.[1])).toBeCloseTo(-20, 5);
      expect(Number(translation?.[2])).toBeCloseTo(-15, 5);
      expect(transform).toContain("scale(1.1)");
    }, { timeout: 3000 });
  });
});
