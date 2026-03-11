import React from "react";
import { postService } from "../../services/post.service.ts";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/error.ts";

interface ReactionBarProps {
  postId: number;
  classId?: number;
  reactions: any[];
  userId: number;
  onReactionAdded: () => void;
}

const ReactionBar: React.FC<ReactionBarProps> = ({ postId, classId, reactions, userId, onReactionAdded }) => {
  const reactionTypes = [
    { type: "love", emoji: "❤️" },
    { type: "sad", emoji: "😢" },
    { type: "angry", emoji: "😠" },
  ];

  const handleReact = async (type: string) => {
    try {
      await postService.reactToPost(postId, type);
      onReactionAdded();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to react"));
    }
  };

  const getCount = (type: string) => reactions.filter((r) => r.type === type).length;
  const userReaction = reactions.find((r) => r.user_id === userId)?.type;

  return (
    <div className="flex gap-4 pt-4 border-t border-slate-100">
      {reactionTypes.map((r) => (
        <button
          key={r.type}
          onClick={() => handleReact(r.type)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold transition-all ${
            userReaction === r.type ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {r.emoji} {getCount(r.type)}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
