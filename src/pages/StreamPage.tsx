import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../services/post.service.ts";
import { useSocket } from "../context/SocketContext.tsx";
import PostCard from "../components/stream/PostCard.tsx";
import CreatePostModal from "../components/stream/CreatePostModal.tsx";
import NepalClock from "../components/NepalClock.tsx";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";

const StreamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const classId = parseInt(id!);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { socket } = useSocket();

  const fetchPosts = async () => {
    try {
      const res = await postService.getClassPosts(classId.toString());
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

    socket.emit("join-class", classId);

    socket.on("stream:new-post", (post) => {
      if (post.class_id === classId) {
        setPosts((prev) => [post, ...prev]);
      }
    });

    socket.on("new-reaction", (reaction) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === reaction.post_id
            ? { ...p, reactions: [...p.reactions.filter((r: any) => r.user_id !== reaction.user_id), reaction] }
            : p
        )
      );
    });

    socket.on("stream:new-comment", (comment) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === comment.post_id
            ? { ...p, comments: [...(p.comments || []), comment] }
            : p
        )
      );
    });

    socket.on("stream:post-deleted", ({ post_id, class_id }) => {
      if (class_id === classId) {
        setPosts((prev) => prev.filter((p) => p.post_id !== post_id));
      }
    });

    return () => {
      socket.off("stream:new-post");
      socket.off("new-reaction");
      socket.off("stream:new-comment");
      socket.off("stream:post-deleted");
    };
  }, [socket, classId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading feed...</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Class Stream</h1>
          <p className="text-slate-500 mt-1">Real-time updates and discussions</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <NepalClock />
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" /> New Post
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No posts yet</h3>
            <p className="text-slate-500">Be the first to share something!</p>
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

export default StreamPage;
