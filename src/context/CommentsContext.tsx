import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useIdentity } from "./IdentityContext";

const STORAGE_KEY = "collab-canvas:comments";

export type ThreadMessage = {
  authorColor: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  id: string;
  text: string;
};

// a comment = the root message of a thread
export type Comment = ThreadMessage & {
  replies: ThreadMessage[];
  resolved: boolean;
  x: number; // x coordinate on canvas
  y: number; // y coordinate on canvas
};

export type Draft = Pick<Comment, "x" | "y">;

type CommentsContextType = {
  comments: Comment[];
  draft: Draft | null;
  startDraft: (position: Draft) => void;
  cancelDraft: () => void;
  commitDraft: (text: string) => void;
  updateComment: (id: string, text: string) => void;
  toggleResolved: (id: string) => void;
  removeComment: (id: string) => void;
  addReply: (commentId: string, text: string) => void;
  updateReply: (commentId: string, replyId: string, text: string) => void;
  removeReply: (commentId: string, replyId: string) => void;
};

const CommentsContext = createContext<CommentsContextType | null>(null);

const getStoredComments = (): Comment[] => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    // older stored comments predate threads, so backfill an empty reply list
    return (parsed as Comment[]).map((comment) => ({
      ...comment,
      replies: comment.replies ?? [],
      resolved: comment.resolved ?? false,
    }));
  } catch {
    return [];
  }
};

export const CommentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { identity } = useIdentity();
  // actual stored comments
  const [comments, setComments] = useState<Comment[]>(getStoredComments);
  // current draft comment (not stored)
  const [draft, setDraft] = useState<Draft | null>(null);

  const startDraft = useCallback((position: Draft) => {
    setDraft(position);
  }, []);

  const cancelDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const commitDraft = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (!trimmed || !draft) return;

      // only store draft if it has text
      setComments((current) => [
        ...current,
        {
          authorColor: identity.color,
          authorId: identity.id,
          authorName: identity.name,
          id: crypto.randomUUID(),
          x: draft.x,
          y: draft.y,
          text: trimmed,
          createdAt: Date.now(),
          replies: [],
          resolved: false,
        },
      ]);
      setDraft(null);
    },
    [draft, identity],
  );

  const removeComment = useCallback((id: string) => {
    setComments((current) => current.filter((comment) => comment.id !== id));
  }, []);

  const toggleResolved = useCallback((id: string) => {
    setComments((current) =>
      current.map((comment) =>
        comment.id === id
          ? { ...comment, resolved: !comment.resolved }
          : comment,
      ),
    );
  }, []);

  const updateComment = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();

      // empty comments are not stored
      if (!trimmed) {
        removeComment(id);
        return;
      }

      setComments((current) =>
        current.map((comment) =>
          comment.id === id ? { ...comment, text: trimmed } : comment,
        ),
      );
    },
    [removeComment],
  );

  const addReply = useCallback(
    (commentId: string, text: string) => {
      const trimmed = text.trim();

      if (!trimmed) return;

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [
                  ...comment.replies,
                  {
                    authorColor: identity.color,
                    authorId: identity.id,
                    authorName: identity.name,
                    id: crypto.randomUUID(),
                    text: trimmed,
                    createdAt: Date.now(),
                  },
                ],
              }
            : comment,
        ),
      );
    },
    [identity],
  );

  const removeReply = useCallback((commentId: string, replyId: string) => {
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: comment.replies.filter((reply) => reply.id !== replyId),
            }
          : comment,
      ),
    );
  }, []);

  const updateReply = useCallback(
    (commentId: string, replyId: string, text: string) => {
      const trimmed = text.trim();

      // empty replies are not stored
      if (!trimmed) {
        removeReply(commentId, replyId);
        return;
      }

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === replyId ? { ...reply, text: trimmed } : reply,
                ),
              }
            : comment,
        ),
      );
    },
    [removeReply],
  );

  useEffect(() => {
    try {
      // update local storage whenever comments is updated
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch {
      // storage unavailable, do nothing for now in this hacky solution
    }
  }, [comments]);

  const value = useMemo(
    () => ({
      comments,
      draft,
      startDraft,
      cancelDraft,
      commitDraft,
      updateComment,
      toggleResolved,
      removeComment,
      addReply,
      updateReply,
      removeReply,
    }),
    [
      comments,
      draft,
      startDraft,
      cancelDraft,
      commitDraft,
      updateComment,
      toggleResolved,
      removeComment,
      addReply,
      updateReply,
      removeReply,
    ],
  );

  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);

  if (!context) {
    throw new Error("useComments must be used within a CommentsProvider");
  }

  return context;
};
