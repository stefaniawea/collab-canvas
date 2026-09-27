import React, { useEffect, useRef, useState } from "react";
import { useComments } from "../context/CommentsContext";
import { useIdentity } from "../context/IdentityContext";

type CommentLayerProps = {
  scale: number;
};

type EditTarget = {
  commentId: string;
  replyId: string | null;
};

export default function CommentLayer({ scale }: CommentLayerProps) {
  const {
    comments,
    draft,
    cancelDraft,
    commitDraft,
    updateComment,
    removeComment,
    addReply,
    updateReply,
    removeReply,
  } = useComments();
  const { identity } = useIdentity();
  const [draftText, setDraftText] = useState("");
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // keeps comments the same visual size at all zoom levels
  const commentScale = 1 / scale;

  const startEditing = (
    commentId: string,
    replyId: string | null,
    text: string,
  ) => {
    setEditingTarget({ commentId, replyId });
    setEditText(text);
  };

  const stopEditing = () => {
    setEditingTarget(null);
    setEditText("");
  };

  const saveEdit = () => {
    if (!editingTarget) return;

    if (editingTarget.replyId) {
      updateReply(editingTarget.commentId, editingTarget.replyId, editText);
    } else {
      updateComment(editingTarget.commentId, editText);
    }
    stopEditing();
  };

  const startReplying = (commentId: string) => {
    setReplyingId(commentId);
    setReplyText("");
  };

  const stopReplying = () => {
    setReplyingId(null);
    setReplyText("");
  };

  const saveReply = (commentId: string) => {
    addReply(commentId, replyText);
    stopReplying();
  };

  const closeOnEsc = (
    e:
      | React.KeyboardEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Escape") {
      cancelDraft();
    }
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitDraft(draftText);
    }
    closeOnEsc(e);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }

    closeOnEsc(e);
  };

  const handleReplyKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    commentId: string,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveReply(commentId);
    }

    closeOnEsc(e);
  };

  useEffect(() => {
    setDraftText("");
    inputRef.current?.focus();
  }, [draft]);

  return (
    <>
      {comments.map((comment) => {
        const isMe = comment.authorId === identity.id;
        const isEditingRoot =
          editingTarget?.commentId === comment.id &&
          editingTarget.replyId === null;

        // existing comment thread: root message, replies, and reply composer
        return (
          <div
            key={comment.id}
            className="absolute z-20 flex max-w-[220px] flex-col gap-2 rounded-sm bg-white px-2 py-1 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.25)] origin-top-left"
            onClick={(e) => e.stopPropagation()}
            style={{
              left: comment.x,
              top: comment.y,
              transform: `scale(${commentScale})`,
            }}
          >
            {isEditingRoot ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  className="w-[200px] resize-none border rounded-sm p-2 text-sm focus:outline-none"
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={2}
                  value={editText}
                />
                <div className="flex justify-end gap-2 text-sm">
                  <button onClick={stopEditing} type="button">
                    Cancel
                  </button>

                  <button onClick={saveEdit} type="button">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <button
                  className="flex flex-col text-left disabled:cursor-default overflow-hidden"
                  disabled={!isMe}
                  onClick={() => startEditing(comment.id, null, comment.text)}
                  type="button"
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: comment.authorColor }}
                  >
                    {comment.authorName}
                    {isMe && " (you)"}
                  </span>

                  <span className="break-words">{comment.text}</span>

                  <time
                    className="text-xs text-gray-500"
                    dateTime={new Date(comment.createdAt).toISOString()}
                  >
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </button>

                {/* only me should be able to remove my own comments */}
                {isMe && (
                  <button
                    aria-label="Delete comment"
                    onClick={() => removeComment(comment.id)}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="flex flex-col gap-2 border-t pt-2">
                {comment.replies.map((reply) => {
                  const isReplyMe = reply.authorId === identity.id;
                  const isEditingReply =
                    editingTarget?.commentId === comment.id &&
                    editingTarget.replyId === reply.id;

                  return (
                    <div key={reply.id}>
                      {isEditingReply ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            autoFocus
                            className="w-[200px] resize-none border rounded-sm p-2 text-sm focus:outline-none"
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            rows={2}
                            value={editText}
                          />
                          <div className="flex justify-end gap-2 text-sm">
                            <button onClick={stopEditing} type="button">
                              Cancel
                            </button>

                            <button onClick={saveEdit} type="button">
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <button
                            className="flex flex-col text-left disabled:cursor-default overflow-hidden"
                            disabled={!isReplyMe}
                            onClick={() =>
                              startEditing(comment.id, reply.id, reply.text)
                            }
                            type="button"
                          >
                            <span
                              className="text-xs font-medium"
                              style={{ color: reply.authorColor }}
                            >
                              {reply.authorName}
                              {isReplyMe && " (you)"}
                            </span>

                            <span className="break-words">{reply.text}</span>

                            <time
                              className="text-xs text-gray-500"
                              dateTime={new Date(reply.createdAt).toISOString()}
                            >
                              {new Date(reply.createdAt).toLocaleString()}
                            </time>
                          </button>

                          {isReplyMe && (
                            <button
                              aria-label="Delete reply"
                              onClick={() => removeReply(comment.id, reply.id)}
                              type="button"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {replyingId === comment.id ? (
              <div className="flex flex-col gap-2 border-t pt-2">
                <textarea
                  autoFocus
                  className="w-[200px] resize-none border rounded-sm p-2 text-sm focus:outline-none"
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                  placeholder="Reply…"
                  rows={2}
                  value={replyText}
                />
                <div className="flex justify-end gap-2 text-sm">
                  <button onClick={stopReplying} type="button">
                    Cancel
                  </button>

                  <button
                    disabled={!replyText.trim()}
                    onClick={() => saveReply(comment.id)}
                    type="button"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="self-start text-xs text-gray-500 border-t pt-2 w-full text-left"
                onClick={() => startReplying(comment.id)}
                type="button"
              >
                Reply
              </button>
            )}
          </div>
        );
      })}

      {/* new draft comment */}
      {draft && (
        <div
          className="absolute z-30 flex flex-col gap-2 rounded-sm bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.25)] origin-top-left"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => closeOnEsc(e)}
          style={{
            left: draft.x,
            top: draft.y,
            transform: `scale(${commentScale})`,
          }}
          data-testid="draft-comment"
        >
          <textarea
            className="w-[200px] resize-none border rounded-sm p-2 text-sm focus:outline-none"
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => handleDraftKeyDown(e)}
            placeholder="Add a comment…"
            ref={inputRef}
            rows={2}
            value={draftText}
          />

          <div className="flex justify-end gap-2 text-sm">
            <button
              // className="bg-white text-black px-4 py-2 border border-black rounded-full"
              onClick={cancelDraft}
              type="button"
            >
              Cancel
            </button>

            <button
              // className="bg-black text-white px-4 py-2 rounded-full"
              disabled={!draftText.trim()}
              onClick={() => commitDraft(draftText)}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}
