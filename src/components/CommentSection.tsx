import React, { useState } from "react";
import { Send } from "lucide-react";
import CommentItem from "./CommentItem.tsx";
import { commentService } from "../services/api.service.ts";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";

interface CommentSectionProps {
  parentId: number;
  parentType: "announcement" | "assignment";
  comments: any[];
  onCommentAdded: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ parentId, parentType, comments, onCommentAdded }) => {
  const [text, setText] = useState("");

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await commentService.createComment({
        parentId,
        parentType,
        content: text
      });
      setText("");
      onCommentAdded();
      toast.success("Comment added");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add comment"));
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
      <form onSubmit={handleComment} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a class comment..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          type="submit" 
          disabled={!text.trim()}
          className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
