import React, { useState } from "react";
import { MessageSquare, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext.tsx";
import ProfileAvatar from "../ProfileAvatar.tsx";
import ReactionBar from "./ReactionBar.tsx";
import CommentSection from "./CommentSection.tsx";
import LinkPreview from "./LinkPreview.tsx";
import { formatExactTimestamp } from "../../utils/date.ts";
import { postService } from "../../services/post.service.ts";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/error.ts";

interface PostCardProps {
  post: any;
  classId?: number;
  onRefresh: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, classId, onRefresh }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);

  const handleDelete = async () => {
    try {
      await postService.deletePost(post.post_id);
      onRefresh();
      toast.success("Post deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete post"));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar size="md" userId={post.user_id} name={post.author_name} src={post.author_avatar} />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900">{post.author_name}</h4>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {post.user_role || "Student"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                🕒 {formatExactTimestamp(post.created_at)}
              </span>
            </div>
          </div>
        </div>
        {(user?.id === post.user_id || user?.role === "teacher") && (
          <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
          <span className="inline-block mr-2">📄</span>
          {post.text_content}
        </p>
      </div>
      
      <div className="post-media space-y-4">
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
            <img 
              src={post.image_url} 
              alt="Post attachment" 
              className="w-full object-cover max-h-[600px] hover:scale-[1.02] transition-transform duration-500" 
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          </div>
        )}
        
        {post.video_url && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm aspect-video flex items-center justify-center">
            <video 
              src={post.video_url} 
              controls 
              className="w-full h-full max-h-[600px]" 
              preload="metadata"
            />
          </div>
        )}

        {post.link_url && <LinkPreview url={post.link_url} />}
      </div>
      
      <div className="mt-6">
        <ReactionBar postId={post.post_id} classId={classId} reactions={post.reactions} userId={user!.id} onReactionAdded={onRefresh} />
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors group/btn"
        >
          <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          💬 {post.comments?.length || 0} Comments
        </button>
        {showComments && (
          <div className="mt-4">
            <CommentSection postId={post.post_id} classId={classId} comments={post.comments || []} onCommentAdded={onRefresh} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
