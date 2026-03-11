import React, { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, User } from "lucide-react";

interface ParticipantVideoProps {
  stream: MediaStream | null;
  name: string;
  isLocal: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking?: boolean;
  avatar?: string;
  isTeacher?: boolean;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  stream,
  name,
  isLocal,
  isMuted,
  isVideoOff,
  isSpeaking,
  avatar,
  isTeacher
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div 
      className={`relative aspect-video bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden border-2 transition-all duration-500 group shadow-2xl ${
        isSpeaking ? "border-emerald-500 ring-4 ring-emerald-500/20" : "border-slate-800/50"
      }`}
    >
      <video 
        ref={videoRef}
        autoPlay 
        muted={isLocal}
        playsInline 
        className={`w-full h-full object-cover transition-all duration-700 ${isVideoOff ? "opacity-0 scale-95" : "opacity-100 scale-100"} ${isLocal ? "scale-x-[-1]" : ""}`}
      />
      
      {/* Video Off Placeholder */}
      {(isVideoOff || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="relative">
            <div className={`w-20 h-20 md:w-32 md:h-32 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 border-4 border-slate-700 shadow-2xl overflow-hidden transition-all duration-500 ${isSpeaking ? "scale-110 border-emerald-500/50" : "scale-100"}`}>
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-10 h-10 md:w-16 md:h-16" />
              )}
            </div>
            {isSpeaking && (
              <div className="absolute -inset-4 border-2 border-emerald-500 rounded-full animate-ping opacity-20" />
            )}
          </div>
        </div>
      )}

      {/* Overlay Info */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
        <span className="text-white text-[10px] md:text-xs font-bold truncate max-w-[120px] md:max-w-[180px]">
          {isLocal ? "You" : name} {isTeacher && <span className="text-indigo-400 ml-1 font-black">HOST</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {isMuted && <MicOff className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500" />}
          {isVideoOff && <VideoOff className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500" />}
        </div>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/20 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-emerald-500/30 shadow-lg">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-emerald-500 text-[8px] font-black uppercase tracking-widest">Speaking</span>
        </div>
      )}
    </div>
  );
};

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: { 
    userId: number; 
    stream: MediaStream; 
    name: string; 
    isVideoOff?: boolean; 
    isMuted?: boolean;
    avatar?: string;
    isSpeaking?: boolean;
  }[];
  isMuted: boolean;
  isVideoOff: boolean;
  teacherId: number;
  localUserId: number;
  viewMode?: "gallery" | "spotlight";
}

const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  isMuted,
  isVideoOff,
  teacherId,
  localUserId,
  viewMode = "spotlight"
}) => {
  // All participants including local user
  const allParticipants = [
    {
      userId: localUserId,
      stream: localStream,
      name: "You",
      isVideoOff,
      isMuted,
      avatar: "",
      isLocal: true,
      isTeacher: localUserId === teacherId
    },
    ...remoteStreams.map(rs => ({ ...rs, isLocal: false, isTeacher: rs.userId === teacherId }))
  ];

  const teacher = allParticipants.find(p => p.isTeacher);
  const others = allParticipants.filter(p => !p.isTeacher);
  const participantCount = allParticipants.length;

  const getGridConfig = (count: number) => {
    if (count === 1) return "grid-cols-1 max-w-4xl";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-6xl";
    if (count <= 4) return "grid-cols-2 max-w-6xl";
    if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  if (viewMode === "spotlight" && teacher && participantCount > 1) {
    return (
      <div className="flex-1 bg-[#111111] p-4 md:p-6 overflow-hidden flex flex-col gap-4">
        {/* Top Row Grid (Others) */}
        <div className="h-28 md:h-36 flex-shrink-0 w-full overflow-x-auto scrollbar-hide px-4">
          <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 h-full min-w-max mx-auto">
            {others.map((p) => (
              <div key={p.userId} className="h-full aspect-video flex-shrink-0">
                <ParticipantVideo
                  stream={p.stream}
                  name={p.name}
                  isLocal={p.isLocal}
                  isMuted={p.isMuted}
                  isVideoOff={p.isVideoOff || false}
                  isSpeaking={p.isSpeaking}
                  avatar={p.avatar}
                  isTeacher={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Spotlight Area (Teacher) */}
        <div className="flex-1 flex items-center justify-center min-h-0 bg-[#222222] rounded-2xl md:rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
          <div className="w-full h-full max-w-6xl p-2 md:p-4">
            <ParticipantVideo
              stream={teacher.stream}
              name={teacher.name}
              isLocal={teacher.isLocal}
              isMuted={teacher.isMuted}
              isVideoOff={teacher.isVideoOff || false}
              isSpeaking={teacher.isSpeaking}
              avatar={teacher.avatar}
              isTeacher={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#111111] p-4 md:p-8 overflow-y-auto min-h-0 scrollbar-hide flex items-center justify-center">
      <div className={`grid gap-4 md:gap-6 w-full transition-all duration-700 ${getGridConfig(participantCount)}`}>
        {allParticipants.map((p) => (
          <ParticipantVideo
            key={p.userId}
            stream={p.stream}
            name={p.name}
            isLocal={p.isLocal}
            isMuted={p.isMuted}
            isVideoOff={p.isVideoOff || false}
            isSpeaking={p.isSpeaking}
            avatar={p.avatar}
            isTeacher={p.isTeacher}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
