import React, { useState } from "react";
import { Send } from "lucide-react";
import CommentItem from "./CommentItem.tsx";
import { postService } from "../../services/post.service.ts";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/error.ts";

interface CommentSectionProps {
  postId: number;
  classId?: number;
  comments: any[];
  onCommentAdded: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, classId, comments, onCommentAdded }) => {
  const [text, setText] = useState("");

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !postId) {
      toast.error("Cannot add comment: Post ID is missing");
      return;
    }
    try {
      await postService.commentOnPost(postId, text);
      setText("");
      onCommentAdded();
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
          placeholder="Write a comment..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
