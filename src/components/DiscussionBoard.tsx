import React, { useState, useEffect } from "react";
import { MessageCircle, Send, Plus, X } from "lucide-react";
import { discussionService } from "../services/api.service.ts";
import ProfileAvatar from "./ProfileAvatar.tsx";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";
import { formatExactTimestamp } from "../utils/date.ts";
import { motion, AnimatePresence } from "framer-motion";

const DiscussionBoard = ({ classId }: { classId: string }) => {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState("");

  const fetchDiscussions = async () => {
    try {
      const res = await discussionService.getDiscussions(classId);
      setDiscussions(res.data.discussions);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to fetch discussions"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [classId]);

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await discussionService.createDiscussion(classId, { title: newTitle, content: newContent });
      setNewTitle("");
      setNewContent("");
      setShowCreateModal(false);
      fetchDiscussions();
      toast.success("Discussion created!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create discussion"));
    }
  };

  const fetchReplies = async (discussionId: string) => {
    try {
      const res = await discussionService.getDiscussionReplies(discussionId);
      setReplies(res.data.replies);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to fetch replies"));
    }
  };

  const handleSelectDiscussion = (discussion: any) => {
    setSelectedDiscussion(discussion);
    fetchReplies(discussion.id.toString());
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedDiscussion) return;
    try {
      await discussionService.createDiscussionReply(selectedDiscussion.id.toString(), { content: replyContent });
      setReplyContent("");
      fetchReplies(selectedDiscussion.id.toString());
      fetchDiscussions(); // Update reply count
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to post reply"));
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading discussions...</div>;

  return (
    <div className="space-y-6">
      {!selectedDiscussion ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-600" /> Discussion Forum
            </h3>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Topic
            </button>
          </div>

          <div className="space-y-4">
            {discussions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No discussions yet. Start a new topic!</p>
              </div>
            ) : (
              discussions.map(disc => (
                <div 
                  key={`discussion-${disc.id}`} 
                  onClick={() => handleSelectDiscussion(disc)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{disc.title}</h4>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {disc.reply_count} {disc.reply_count === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{disc.content}</p>
                  <div className="flex items-center gap-3">
                    <ProfileAvatar size="sm" userId={disc.user_id} name={disc.author_name} src={disc.author_profileImage || disc.author_avatar} />
                    <div className="text-xs">
                      <span className="font-bold text-slate-700">{disc.author_name}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-400">{formatExactTimestamp(disc.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <button 
              onClick={() => setSelectedDiscussion(null)}
              className="text-slate-500 hover:text-indigo-600 font-bold text-sm flex items-center gap-1 transition-colors"
            >
              ← Back to Discussions
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Original Post */}
            <div className="pb-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedDiscussion.title}</h2>
              <div className="flex items-center gap-3 mb-4">
                <ProfileAvatar size="md" userId={selectedDiscussion.user_id} name={selectedDiscussion.author_name} src={selectedDiscussion.author_profileImage || selectedDiscussion.author_avatar} />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedDiscussion.author_name}</p>
                  <p className="text-xs text-slate-500">{formatExactTimestamp(selectedDiscussion.created_at)}</p>
                </div>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{selectedDiscussion.content}</p>
            </div>

            {/* Replies */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Replies ({replies.length})</h4>
              {replies.map(reply => (
                <div key={`${selectedDiscussion.id}-${reply.id}`} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <ProfileAvatar size="sm" userId={reply.user_id} name={reply.author_name} src={reply.author_profileImage || reply.author_avatar} />
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{reply.author_name}</span>
                      <span className="text-xs text-slate-400 ml-2">{formatExactTimestamp(reply.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm ml-11 whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reply Input */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={handleReply} className="flex gap-3">
              <input
                type="text"
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                type="submit"
                disabled={!replyContent.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">New Discussion Topic</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleCreateDiscussion} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Topic Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="What do you want to discuss?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Details</label>
                  <textarea
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none"
                    placeholder="Provide more details or context..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                  >
                    Post Topic
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscussionBoard;
