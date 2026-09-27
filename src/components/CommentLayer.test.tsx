import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommentsProvider, useComments } from "../context/CommentsContext";
import { IdentityProvider } from "../context/IdentityContext";
import CommentLayer from "./CommentLayer";

const identity = {
  color: "#06b6d4",
  id: "identity-1",
  name: "Curious Llama",
};

const comment = {
  authorColor: identity.color,
  authorId: identity.id,
  authorName: identity.name,
  createdAt: 1700000000000,
  id: "comment-1",
  text: "Original comment",
  x: 20,
  y: 30,
  replies: [],
  resolved: false,
};

function DraftController() {
  const { startDraft } = useComments();

  return (
    <button onClick={() => startDraft({ x: 40, y: 50 })} type="button">
      Start draft
    </button>
  );
}

function renderCommentLayer() {
  window.localStorage.setItem(
    "collab-canvas:identity",
    JSON.stringify(identity),
  );
  window.localStorage.setItem(
    "collab-canvas:comments",
    JSON.stringify([comment]),
  );

  return render(
    <IdentityProvider>
      <CommentsProvider>
        <DraftController />
        <CommentLayer scale={2} />
      </CommentsProvider>
    </IdentityProvider>,
  );
}

describe("CommentLayer", () => {
  it("edits and deletes a comment owned by the current identity", () => {
    renderCommentLayer();

    fireEvent.click(screen.getByRole("button", { name: /Original comment/ }));

    const editor = screen.getByRole("textbox");
    expect(editor).toHaveValue("Original comment");

    fireEvent.change(editor, { target: { value: "Updated comment" } });
    fireEvent.keyDown(editor, { key: "Enter" });

    expect(screen.getByText("Updated comment")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));
    expect(screen.queryByText("Updated comment")).not.toBeInTheDocument();
  });

  it("saves a draft comment and trims its text", () => {
    renderCommentLayer();

    fireEvent.click(screen.getByRole("button", { name: "Start draft" }));

    const editor = screen.getByPlaceholderText("Add a comment…");
    const saveButton = screen.getByRole("button", { name: "Save" });

    expect(saveButton).toBeDisabled();

    fireEvent.change(editor, { target: { value: "  New comment  " } });
    fireEvent.click(saveButton);

    expect(screen.getByText("New comment")).toBeInTheDocument();
  });

  it("adds a reply to a comment thread", () => {
    renderCommentLayer();

    fireEvent.click(screen.getByRole("button", { name: "Reply" }));

    const editor = screen.getByPlaceholderText("Reply…");
    fireEvent.change(editor, { target: { value: "A reply" } });
    fireEvent.keyDown(editor, { key: "Enter" });

    expect(screen.getByText("A reply")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete reply" }));
    expect(screen.queryByText("A reply")).not.toBeInTheDocument();
  });

  it("resolves and reopens the full comment thread", () => {
    renderCommentLayer();

    expect(screen.getByTestId("thread-status")).toHaveTextContent("Open");

    fireEvent.click(screen.getByRole("button", { name: "Resolve thread" }));

    expect(screen.getByTestId("thread-status")).toHaveTextContent("Resolved");
    expect(
      JSON.parse(window.localStorage.getItem("collab-canvas:comments")!)[0]
        .resolved,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Reopen thread" }));

    expect(screen.getByTestId("thread-status")).toHaveTextContent("Open");
  });
});
