import React from "react";
import ProfileAvatar from "./ProfileAvatar.tsx";
import { formatExactTimestamp } from "../utils/date.ts";

interface CommentItemProps {
  comment: any;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <div className="flex gap-3">
      <ProfileAvatar size="sm" userId={comment.user_id} name={comment.user_name} src={comment.user_avatar} />
      <div className="bg-slate-50 rounded-2xl px-4 py-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">{comment.user_name}</span>
          <span className="text-[10px] text-slate-400">
            {formatExactTimestamp(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-slate-700">{comment.text || comment.content}</p>
      </div>
    </div>
  );
};

export default CommentItem;
