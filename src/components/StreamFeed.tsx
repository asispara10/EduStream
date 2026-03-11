import React, { useState, useEffect } from "react";
import { Plus, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../services/post.service.ts";
import { useSocket } from "../context/SocketContext.tsx";
import PostCard from "./stream/PostCard.tsx";
import CreatePostModal from "./stream/CreatePostModal.tsx";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";

interface StreamFeedProps {
  classId?: number;
}

const StreamFeed: React.FC<StreamFeedProps> = ({ classId }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { socket } = useSocket();

  const fetchPosts = async () => {
    try {
      const res = classId 
        ? await postService.getClassPosts(classId.toString())
        : await postService.getGlobalPosts();
      setPosts(res.data.posts);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to fetch posts"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [classId]);

  useEffect(() => {
    if (!socket) return;

    if (classId) {
      socket.emit("join-class", classId);
    }

    socket.on("stream:new-post", (post) => {
      if (classId && post.class_id === classId) {
        setPosts((prev) => [post, ...prev]);
      }
    });

    socket.on("stream:new-global-post", (post) => {
      if (!classId) {
        setPosts((prev) => [post, ...prev]);
      }
    });

    socket.on("new-reaction", (reaction) => {
      if (classId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === reaction.post_id
              ? { ...p, reactions: [...p.reactions.filter((r: any) => r.user_id !== reaction.user_id), reaction] }
              : p
          )
        );
      }
    });

    socket.on("new-global-reaction", (reaction) => {
      if (!classId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === reaction.post_id
              ? { ...p, reactions: [...p.reactions.filter((r: any) => r.user_id !== reaction.user_id), reaction] }
              : p
          )
        );
      }
    });

    socket.on("stream:new-comment", (comment) => {
      if (classId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === comment.post_id
              ? { ...p, comments: [...(p.comments || []), comment] }
              : p
          )
        );
      }
    });

    socket.on("stream:new-global-comment", (comment) => {
      if (!classId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === comment.post_id
              ? { ...p, comments: [...(p.comments || []), comment] }
              : p
          )
        );
      }
    });

    socket.on("stream:post-deleted", ({ post_id, class_id }) => {
      if (!classId || class_id === classId) {
        setPosts((prev) => prev.filter((p) => p.post_id !== post_id));
      }
    });

    return () => {
      socket.off("stream:new-post");
      socket.off("stream:new-global-post");
      socket.off("new-reaction");
      socket.off("new-global-reaction");
      socket.off("stream:new-comment");
      socket.off("stream:new-global-comment");
      socket.off("stream:post-deleted");
    };
  }, [socket, classId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading feed...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Class Stream</h3>
        {classId && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        )}
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No posts yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.post_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PostCard post={post} classId={classId} onRefresh={fetchPosts} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <CreatePostModal isOpen={showModal} onClose={() => setShowModal(false)} onPostCreated={fetchPosts} classId={classId} />
    </div>
  );
};

export default StreamFeed;
