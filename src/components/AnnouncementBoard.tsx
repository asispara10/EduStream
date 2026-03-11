import React, { useState, useEffect, useRef } from "react";
import { Send, Trash2, MessageCircle, Image as ImageIcon, Video, FileText, Link as LinkIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatExactTimestamp } from "../utils/date.ts";
import api from "../api/axios.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";

interface Attachment {
  type: 'image' | 'video' | 'pdf' | 'link';
  fileUrl: string;
  fileName: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
  replies: any[];
  user_id: number;
  attachments?: Attachment[];
}

const AnnouncementBoard = ({ classId }: { classId: string }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", content: "", link: "" });
  const [replyContent, setReplyContent] = useState<Record<number, string>>({});

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get(`/class/${classId}/announcements`);
      setAnnouncements(res.data.announcements);
    } catch (err) {
      toast.error("Failed to fetch announcements");
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    
    if (socket) {
      socket.emit("join-class", parseInt(classId, 10));
      socket.on("new-announcement", (announcement: Announcement) => {
        setAnnouncements(prev => [announcement, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off("new-announcement");
      }
    };
  }, [classId, socket]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", newAnnouncement.title);
      formData.append("content", newAnnouncement.content);
      if (newAnnouncement.link) formData.append("link", newAnnouncement.link);
      if (imageFile) formData.append("image", imageFile);
      if (videoFile) formData.append("video", videoFile);
      if (documentFile) formData.append("document", documentFile);

      await api.post(`/class/${classId}/announcement`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setNewAnnouncement({ title: "", content: "", link: "" });
      setImageFile(null);
      setVideoFile(null);
      setDocumentFile(null);
      setShowLinkInput(false);
      fetchAnnouncements();
      toast.success("Announcement posted!");
    } catch (err) {
      toast.error("Failed to post announcement");
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await api.delete(`/announcement/${id}`);
      fetchAnnouncements();
      toast.success("Announcement deleted!");
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  const handleCreateReply = async (announcementId: number) => {
    try {
      await api.post(`/announcement/${announcementId}/reply`, { content: replyContent[announcementId] });
      setReplyContent({ ...replyContent, [announcementId]: "" });
      fetchAnnouncements();
      toast.success("Reply posted!");
    } catch (err) {
      toast.error("Failed to post reply");
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    try {
      await api.delete(`/reply/${replyId}`);
      fetchAnnouncements();
      toast.success("Reply deleted!");
    } catch (err) {
      toast.error("Failed to delete reply");
    }
  };

  return (
    <div className="space-y-6">
      {user?.role === "teacher" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">📢 Create Announcement</h3>
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <input
              type="text"
              placeholder="Topic"
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <textarea
              placeholder="Description"
              value={newAnnouncement.content}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
              required
            />

            {/* Attachments UI */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">Attachments:</span>
                <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Photo">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => videoInputRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Video">
                  <Video className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => documentInputRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="PDF / Document">
                  <FileText className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setShowLinkInput(!showLinkInput)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Link">
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Hidden Inputs */}
              <input type="file" ref={imageInputRef} className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              <input type="file" ref={documentInputRef} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />

              {/* Selected Files Display */}
              <div className="flex flex-wrap gap-2">
                {imageFile && (
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm">
                    <ImageIcon className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{imageFile.name}</span>
                    <button type="button" onClick={() => setImageFile(null)} className="hover:text-indigo-900"><X className="w-4 h-4" /></button>
                  </div>
                )}
                {videoFile && (
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm">
                    <Video className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{videoFile.name}</span>
                    <button type="button" onClick={() => setVideoFile(null)} className="hover:text-indigo-900"><X className="w-4 h-4" /></button>
                  </div>
                )}
                {documentFile && (
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm">
                    <FileText className="w-4 h-4" />
                    <span className="truncate max-w-[150px]">{documentFile.name}</span>
                    <button type="button" onClick={() => setDocumentFile(null)} className="hover:text-indigo-900"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              {/* Link Input */}
              {showLinkInput && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    placeholder="Paste Link: https://example.com"
                    value={newAnnouncement.link}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, link: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button type="button" onClick={() => { setShowLinkInput(false); setNewAnnouncement({ ...newAnnouncement, link: "" }); }} className="p-2 text-slate-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
              <Send className="w-4 h-4" /> Post Announcement
            </button>
          </form>
        </div>
      )}

      {announcements && announcements.map(ann => (
        <div key={`announcement-${ann.id}`} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{ann.title}</h3>
              <p className="text-slate-600 mt-1 whitespace-pre-wrap">{ann.content}</p>
              <p className="text-xs text-slate-400 mt-2">Posted by: {ann.author_name} • {formatExactTimestamp(ann.created_at)}</p>
            </div>
            {user?.role === "teacher" && user.id === ann.user_id && (
              <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Display Attachments */}
          {ann.attachments && ann.attachments.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">Attachments:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ann.attachments.map((att, idx) => (
                  <div key={`${att.fileUrl}-${idx}`} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    {att.type === 'image' && (
                      <div className="flex flex-col">
                        <img src={att.fileUrl} alt={att.fileName} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                        <div className="p-2 text-xs text-slate-500 truncate">{att.fileName}</div>
                      </div>
                    )}
                    {att.type === 'video' && (
                      <div className="flex flex-col">
                        <video src={att.fileUrl} controls className="w-full h-48 object-cover bg-black" />
                        <div className="p-2 text-xs text-slate-500 truncate">{att.fileName}</div>
                      </div>
                    )}
                    {att.type === 'pdf' && (
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="w-8 h-8 text-red-500 shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate">{att.fileName}</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg">View</a>
                          <a href={att.fileUrl} download className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-200 px-3 py-1.5 rounded-lg">Download</a>
                        </div>
                      </div>
                    )}
                    {att.type === 'link' && (
                      <div className="flex items-center gap-3 p-4">
                        <LinkIcon className="w-6 h-6 text-blue-500 shrink-0" />
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">
                          {att.fileName}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <h4 className="font-bold text-slate-900 mb-2">Replies</h4>
            {ann.replies && ann.replies.map(reply => (
              <div key={`${ann.id}-${reply.id}`} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-2">
                <div>
                  <p className="text-sm font-bold">{reply.user_name}</p>
                  <p className="text-sm">{reply.content}</p>
                </div>
                {(user?.id === reply.user_id || user?.role === "teacher") && (
                  <button onClick={() => handleDeleteReply(reply.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent[ann.id] || ""}
                onChange={e => setReplyContent({ ...replyContent, [ann.id]: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button onClick={() => handleCreateReply(ann.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBoard;
