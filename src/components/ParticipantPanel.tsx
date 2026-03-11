import React from "react";
import { Users, UserMinus, ShieldCheck, Mic, MicOff, Video, VideoOff } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar.tsx";
import { motion, AnimatePresence } from "framer-motion";

interface Participant {
  id: number;
  name: string;
  avatar?: string;
  profileImage?: string;
  isTeacher?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface ParticipantPanelProps {
  participants: Participant[];
  isTeacher: boolean;
  onRemove: (userId: number) => void;
  teacherId: number;
  onMuteAll?: () => void;
  onUnmuteAll?: () => void;
}

const ParticipantPanel: React.FC<ParticipantPanelProps> = ({ participants, isTeacher, onRemove, teacherId, onMuteAll, onUnmuteAll }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Participants</h3>
        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100">
          {participants.length} Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        <AnimatePresence>
          {participants.map((p) => (
            <motion.div 
              key={`participant-${p.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ProfileAvatar 
                    size="sm" 
                    userId={p.id} 
                    name={p.name} 
                    src={p.profileImage || p.avatar} 
                    showStatus={true} 
                  />
                  {p.id === teacherId && (
                    <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full p-0.5 border-2 border-white">
                      <ShieldCheck className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                      {p.id === teacherId ? "Host" : "Student"}
                    </p>
                    <div className="flex items-center gap-1.5 ml-1">
                      {p.isMuted ? <MicOff className="w-2.5 h-2.5 text-red-400" /> : <Mic className="w-2.5 h-2.5 text-slate-300" />}
                      {p.isVideoOff ? <VideoOff className="w-2.5 h-2.5 text-red-400" /> : <Video className="w-2.5 h-2.5 text-slate-300" />}
                    </div>
                  </div>
                </div>
              </div>

              {isTeacher && p.id !== teacherId && (
                <button 
                  onClick={() => onRemove(p.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from class"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isTeacher && (
        <div className="p-4 border-t border-slate-50 flex gap-2">
          <button 
            onClick={onMuteAll}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <MicOff className="w-3.5 h-3.5" /> Mute All
          </button>
          <button 
            onClick={onUnmuteAll}
            className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" /> Unmute All
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantPanel;
