import React, { useState, useEffect, useRef } from "react";
import { Send, Pin, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import api from "../api/axios.ts";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  content: string;
  is_pinned: number;
  created_at: string;
}

interface LiveChatProps {
  liveClassId: number;
  isTeacher: boolean;
}

const LiveChat: React.FC<LiveChatProps> = ({ liveClassId, isTeacher }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/live-class/${liveClassId}/chat`);
        setMessages(res.data.messages);
        const pinned = res.data.messages.find((m: Message) => m.is_pinned === 1);
        if (pinned) setPinnedMessage(pinned);
      } catch (err) {
        console.error("Fetch chat error:", err);
      }
    };

    fetchMessages();

    if (socket) {
      socket.on("new-live-message", (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on("message-pinned", ({ pinnedMessage }: { pinnedMessage: Message }) => {
        setPinnedMessage(pinnedMessage);
        setMessages(prev => prev.map(m => ({ ...m, is_pinned: m.id === pinnedMessage.id ? 1 : 0 })));
      });
    }

    return () => {
      if (socket) {
        socket.off("new-live-message");
        socket.off("message-pinned");
      }
    };
  }, [liveClassId, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !user) return;

    socket.emit("send-live-message", {
      liveClassId,
      userId: user.id,
      content: newMessage,
      userName: user.name,
      userAvatar: user.profileImage || user.avatar
    });

    setNewMessage("");
  };

  const handlePinMessage = async (messageId: number) => {
    if (!isTeacher) return;
    try {
      await api.put(`/live-class/${liveClassId}/chat/${messageId}/pin`);
    } catch (err) {
      console.error("Pin message error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {/* Pinned Message */}
        <AnimatePresence>
          {pinnedMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pin className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Pinned by Teacher</span>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">{pinnedMessage.content}</p>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{pinnedMessage.user_name}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg) => (
          <div key={`message-${msg.id}`} className={`flex flex-col ${msg.user_id === user?.id ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.user_id === user?.id 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-slate-50 text-slate-900 rounded-tl-none border border-slate-100"
            }`}>
              {msg.user_id !== user?.id && (
                <p className="text-[10px] font-bold mb-1.5 opacity-60 uppercase tracking-wider">{msg.user_name}</p>
              )}
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <span className="text-[10px] text-slate-400 font-medium">{format(new Date(msg.created_at), "HH:mm")}</span>
              {isTeacher && msg.is_pinned === 0 && (
                <button 
                  onClick={() => handlePinMessage(msg.id)}
                  className="text-[10px] text-indigo-600 font-bold hover:text-indigo-700 uppercase tracking-wider transition-colors"
                >
                  Pin
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 bg-white">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default LiveChat;
