import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import api from "../api/axios.ts";
import Peer from "simple-peer";
import VideoGrid from "../components/VideoGrid.tsx";
import LiveChat from "../components/LiveChat.tsx";
import ParticipantPanel from "../components/ParticipantPanel.tsx";
import { 
  Loader2, X, Users, MessageSquare, ShieldAlert, 
  Mic, MicOff, Video, VideoOff, MonitorUp, LogOut,
  PanelRightClose, PanelRightOpen, ChevronRight,
  LayoutGrid, User as UserIcon, Minimize2, Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";

interface Participant {
  id: number;
  name: string;
  avatar?: string;
  profileImage?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface LiveClassPageProps {
  onClose?: () => void;
  classId?: string;
}

const LiveClassPage: React.FC<LiveClassPageProps> = ({ onClose, classId: propClassId }) => {
  const params = useParams();
  const classId = propClassId || params.classId || params.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [liveClass, setLiveClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ userId: number; stream: MediaStream; name: string; isVideoOff?: boolean; isMuted?: boolean; avatar?: string }[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"gallery" | "spotlight">("spotlight");
  const [isMinimized, setIsMinimized] = useState(false);

  const peersRef = useRef<{ peerID: string; peer: Peer.Instance; userId: number }[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const init = async () => {
      const loadingToast = toast.loading("Connecting to live session...");
      try {
        const res = await api.get(`/live-class/active/${classId}`);
        if (!res.data.liveClass) {
          toast.dismiss(loadingToast);
          toast.error("No active live class found");
          if (onClose) onClose();
          else navigate(`/class/${classId}`);
          return;
        }
        setLiveClass(res.data.liveClass);

        const isTeacherUser = user?.id === res.data.liveClass.teacher_id;

        // Get user media
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          setLocalStream(stream);
          streamRef.current = stream;

          // Video is ON by default for everyone to ensure they see themselves
          setIsVideoOff(false);
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) videoTrack.enabled = true;
        } catch (mediaErr: any) {
          console.warn("Could not get media devices:", mediaErr);
          toast("Joined without camera/microphone. You can still watch the class.", { icon: "👀", duration: 5000 });
          setIsVideoOff(true);
          setIsMuted(true);
        }

        if (socket) {
          socket.emit("join-live-class", {
            liveClassId: res.data.liveClass.id,
            userId: user?.id,
            name: user?.name,
            avatar: user?.profileImage || user?.avatar
          });
          
          socket.on("current-participants", (users: Participant[]) => {
            setParticipants(users);
            
            // If I am the teacher, create peers for all existing students
            if (user?.id === res.data.liveClass.teacher_id) {
              users.forEach(p => {
                if (p.id !== user?.id) {
                  const peer = createPeer(p.id, socket.id!, streamRef.current);
                  peersRef.current.push({
                    peerID: socket.id!,
                    peer,
                    userId: p.id
                  });
                }
              });
            }
          });

          socket.on("user-joined-live", ({ userId, name, avatar }: any) => {
            setParticipants(prev => {
              if (prev.find(p => p.id === userId)) return prev;
              return [...prev, { id: userId, name, avatar }];
            });
            toast.success(`${name} joined the class`);
            
            if (user?.id === res.data.liveClass.teacher_id) {
              const peer = createPeer(userId, socket.id!, streamRef.current);
              peersRef.current.push({
                peerID: socket.id!,
                peer,
                userId
              });
            }
          });

          socket.on("user-video-toggled", ({ userId, isVideoOff }: any) => {
            setRemoteStreams(prev => prev.map(rs => rs.userId === userId ? { ...rs, isVideoOff } : rs));
            setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isVideoOff } : p));
          });

          socket.on("user-audio-toggled", ({ userId, isMuted }: any) => {
            setRemoteStreams(prev => prev.map(rs => rs.userId === userId ? { ...rs, isMuted } : rs));
            setParticipants(prev => prev.map(p => p.id === userId ? { ...p, isMuted } : p));
          });

          socket.on("force-mute", () => {
            if (streamRef.current) {
              const audioTrack = streamRef.current.getAudioTracks()[0];
              if (audioTrack && audioTrack.enabled) {
                audioTrack.enabled = false;
                setIsMuted(true);
                socket.emit("user-audio-toggle", { 
                  liveClassId: res.data.liveClass.id, 
                  userId: user?.id, 
                  isMuted: true 
                });
                toast("The host has muted everyone.", { icon: "🔇" });
              }
            }
          });

          socket.on("force-unmute", () => {
            if (streamRef.current) {
              const audioTrack = streamRef.current.getAudioTracks()[0];
              if (audioTrack && !audioTrack.enabled) {
                audioTrack.enabled = true;
                setIsMuted(false);
                socket.emit("user-audio-toggle", { 
                  liveClassId: res.data.liveClass.id, 
                  userId: user?.id, 
                  isMuted: false 
                });
                toast("The host has unmuted everyone.", { icon: "🔊" });
              }
            }
          });

          socket.on("user-joined-signal", (payload: any) => {
            // Student receives signal from teacher
            const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
            peersRef.current.push({
              peerID: payload.callerID,
              peer,
              userId: res.data.liveClass.teacher_id // Assuming only teacher initiates for now
            });
          });

          socket.on("receiving-returned-signal", (payload: any) => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) {
              item.peer.signal(payload.signal);
            }
          });

          socket.on("user-left-live", ({ userId }: any) => {
            setParticipants(prev => prev.filter(p => p.id !== userId));
            setRemoteStreams(prev => prev.filter(rs => rs.userId !== userId));
            const peerObj = peersRef.current.find(p => p.userId === userId);
            if (peerObj) {
              peerObj.peer.destroy();
            }
            peersRef.current = peersRef.current.filter(p => p.userId !== userId);
          });

          socket.on("participant-removed", ({ userId }: any) => {
            if (user?.id === userId) {
              toast.error("You have been removed from the live class");
              handleLeave();
            }
          });

          socket.on("live-class-ended", () => {
            toast.error("Class has ended by teacher", { duration: 5000 });
            handleLeave();
          });
        }
        toast.dismiss(loadingToast);
        toast.success("Connected to live class!", { icon: "✅" });
      } catch (err: any) {
        toast.dismiss(loadingToast);
        console.error("Live class init error:", err);
        if (err.name === "NotAllowedError" || err.message === "Permission denied") {
          toast.error("Camera/Microphone permission denied. Please allow access to join the live class.", { duration: 5000 });
        } else if (err.name === "NotFoundError") {
          toast.error("No camera or microphone found on your device.", { duration: 5000 });
        } else {
          toast.error(getErrorMessage(err, "Failed to join live class"));
        }
        if (onClose) onClose();
        else navigate(`/class/${classId}`);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      handleLeave(undefined, true);
    };
  }, [classId, socket]);

  const createPeer = (userToSignal: number, callerID: string, stream: MediaStream | null) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream || undefined,
    });

    peer.on("signal", signal => {
      socket?.emit("sending-signal", { userToSignal, callerID, signal });
    });

    peer.on("stream", stream => {
      const student = participants.find(p => p.id === userToSignal);
      setRemoteStreams(prev => {
        if (prev.find(rs => rs.userId === userToSignal)) return prev;
        return [...prev, { 
          userId: userToSignal, 
          stream, 
          name: student?.name || "Student",
          avatar: student?.profileImage || student?.avatar
        }];
      });
    });

    return peer;
  };

  const addPeer = (incomingSignal: any, callerID: string, stream: MediaStream | null) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream || undefined,
    });

    peer.on("signal", signal => {
      socket?.emit("returning-signal", { signal, callerID });
    });

    peer.on("stream", stream => {
      setRemoteStreams(prev => {
        if (prev.find(rs => rs.userId === liveClass.teacher_id)) return prev;
        return [...prev, { 
          userId: liveClass.teacher_id, 
          stream, 
          name: liveClass.teacher_name,
          avatar: liveClass.teacher_avatar
        }];
      });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const isTeacher = Number(user?.id) === Number(liveClass?.teacher_id) || user?.role === "admin";

  const liveClassIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (liveClass) {
      liveClassIdRef.current = liveClass.id;
    }
  }, [liveClass]);

  const handleLeave = (destination?: string, isUnmounting = false) => {
    if (socket && liveClassIdRef.current) {
      socket.emit("leave-live-class", { liveClassId: liveClassIdRef.current, userId: user?.id });
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    peersRef.current.forEach(p => p.peer.destroy());
    
    if (!isUnmounting) {
      if (onClose) {
        onClose();
      } else {
        navigate(destination || `/class/${classId}`);
      }
    }
  };

  const [isEnding, setIsEnding] = useState(false);

  const handleEndClass = async () => {
    if (!liveClass || (!isTeacher) || isEnding) return;
    setIsEnding(true);
    try {
      // Update DB via API. The server will emit 'live-class-ended' which will trigger handleLeave for everyone.
      await api.put(`/live-class/${liveClass.id}/end`);
      // Explicitly leave the class for the teacher who clicked "End Call"
      handleLeave();
    } catch (err) {
      console.error("End class error:", err);
      toast.error(getErrorMessage(err, "Failed to end live class"));
      setIsEnding(false);
    }
  };

  const toggleMic = async () => {
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !isVideoOff });
        setLocalStream(stream);
        streamRef.current = stream;
        setIsMuted(false);
        socket?.emit("user-audio-toggle", { liveClassId: liveClass?.id, userId: user?.id, isMuted: false });
        // Add stream to all peers
        peersRef.current.forEach(p => {
          try { p.peer.addStream(stream); } catch (e) { console.error(e); }
        });
      } catch (err) {
        toast.error("Could not access microphone.");
      }
      return;
    }

    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      socket?.emit("user-audio-toggle", { 
        liveClassId: liveClass?.id, 
        userId: user?.id, 
        isMuted: !audioTrack.enabled 
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = stream.getAudioTracks()[0];
        streamRef.current.addTrack(newTrack);
        setIsMuted(false);
        socket?.emit("user-audio-toggle", { liveClassId: liveClass?.id, userId: user?.id, isMuted: false });
        peersRef.current.forEach(p => {
          try { p.peer.addStream(streamRef.current!); } catch (e) { console.error(e); }
        });
      } catch (err) {
        toast.error("Could not access microphone.");
      }
    }
  };

  const toggleVideo = async () => {
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: !isMuted, video: { facingMode: "user" } });
        setLocalStream(stream);
        streamRef.current = stream;
        setIsVideoOff(false);
        socket?.emit("user-video-toggle", { liveClassId: liveClass?.id, userId: user?.id, isVideoOff: false });
        peersRef.current.forEach(p => {
          try { p.peer.addStream(stream); } catch (e) { console.error(e); }
        });
      } catch (err) {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.");
        toast.error("Could not access camera.");
      }
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      socket?.emit("user-video-toggle", { 
        liveClassId: liveClass?.id, 
        userId: user?.id, 
        isVideoOff: !videoTrack.enabled 
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        const newTrack = stream.getVideoTracks()[0];
        streamRef.current.addTrack(newTrack);
        setIsVideoOff(false);
        // Create a new MediaStream object to trigger re-render
        setLocalStream(new MediaStream(streamRef.current.getTracks()));
        socket?.emit("user-video-toggle", { liveClassId: liveClass?.id, userId: user?.id, isVideoOff: false });
        peersRef.current.forEach(p => {
          try { p.peer.addStream(streamRef.current!); } catch (e) { console.error(e); }
        });
      } catch (err) {
        setCameraError("Camera access denied. Please allow camera access in your browser settings.");
        toast.error("Could not access camera.");
      }
    }
  };

  const handleRemoveParticipant = async (userId: number) => {
    if (user?.id !== liveClass.teacher_id) return;
    try {
      await api.delete(`/live-class/${liveClass.id}/participants/${userId}`);
      toast.success("Participant removed");
    } catch (err) {
      console.error("Remove participant error:", err);
      toast.error(getErrorMessage(err, "Failed to remove participant"));
    }
  };

  const handleMuteAll = () => {
    if (!isTeacher) return;
    socket?.emit("mute-all-participants", { liveClassId: liveClass.id });
    toast.success("Muted all participants");
  };

  const handleUnmuteAll = () => {
    if (!isTeacher) return;
    socket?.emit("unmute-all-participants", { liveClassId: liveClass.id });
    toast.success("Requested all participants to unmute");
  };

  if (loading) {
    return createPortal(
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111111]"
      >
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-white/70 font-medium">Connecting to live class...</p>
      </motion.div>,
      document.body
    );
  }

  const content = (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.div 
          key="minimized"
          layout
          drag
          dragConstraints={{ left: 0, right: window.innerWidth - 384, top: 0, bottom: window.innerHeight - 256 }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 right-6 w-96 h-64 z-[9999] bg-[#111111] rounded-3xl shadow-2xl overflow-hidden border-2 border-white/10 flex flex-col group cursor-move"
        >
          <div className="flex-1 relative">
            <VideoGrid 
              localStream={localStream}
              remoteStreams={remoteStreams}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              teacherId={liveClass.teacher_id}
              localUserId={user?.id || 0}
              viewMode="spotlight"
            />
            
            {/* Minimized Overlay Controls */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                onClick={() => setIsMinimized(false)}
                className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl transition-all transform hover:scale-110"
                title="Full Screen"
              >
                <Maximize2 className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleLeave()}
                className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl transition-all transform hover:scale-110"
                title="Leave"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Live Class</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex flex-col bg-[#111111] overflow-hidden font-sans"
        >
          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Video Grid Container */}
            <div className="flex-1 flex flex-col relative">
              {/* Header Overlay (Floating) */}
              <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">Live</span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/20" />
                  <div className="flex flex-col">
                    <h1 className="text-white font-bold text-sm leading-none">{liveClass?.teacher_name}'s Class</h1>
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">Classroom: {liveClass?.class_name || "EduStream"}</span>
                  </div>
                </div>
                
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-white font-bold text-xs">{participants.length} Participants</span>
                </div>

                <button 
                  onClick={() => setIsMinimized(true)}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl text-white/70 hover:text-white transition-all shadow-2xl"
                  title="Minimize to Small Screen"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => handleLeave()}
                  className="bg-red-500/80 backdrop-blur-xl border border-red-500/20 p-2.5 rounded-2xl text-white hover:bg-red-500 transition-all shadow-2xl"
                  title="Leave Class"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Top Right Controls (Chat Toggle) */}
              <div className="absolute top-6 right-6 z-30 flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl text-white/70 hover:text-white transition-all shadow-2xl flex items-center gap-2"
                  title={isSidebarOpen ? "Hide Chat" : "Show Chat"}
                >
                  {isSidebarOpen ? (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Hide Chat</span>
                      <PanelRightClose className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Show Chat</span>
                      <MessageSquare className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <VideoGrid 
                localStream={localStream}
                remoteStreams={remoteStreams}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                teacherId={liveClass.teacher_id}
                localUserId={user?.id || 0}
                viewMode={viewMode}
              />

              {/* Bottom Controls Bar */}
              {cameraError && (
                <div className="bg-red-500/20 text-red-200 p-2 text-center text-xs flex flex-col items-center gap-2">
                  <span>{cameraError}</span>
                  <button 
                    onClick={() => { setCameraError(null); toggleVideo(); }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-[10px] uppercase font-bold"
                  >
                    Retry
                  </button>
                </div>
              )}
              <div className="h-16 bg-[#1a1a1a] border-t border-white/5 flex-shrink-0 flex items-center justify-between px-6 z-40">
                {/* Left Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setIsSidebarOpen(!isSidebarOpen);
                      setActiveTab("chat");
                    }}
                    className="text-white/70 hover:text-white transition-colors"
                    title="Chat"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                      isVideoOff ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title={isVideoOff ? "Open Camera" : "Close Camera"}
                  >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </button>
                  
                  <button 
                    onClick={toggleMic}
                    className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                      isMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>

                  <button 
                    onClick={() => {
                      if (isTeacher) {
                        // Removed window.confirm because it is blocked in iframes
                        handleEndClass();
                      } else {
                        handleLeave();
                      }
                    }}
                    disabled={isEnding}
                    className={`bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20 ${isEnding ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={isTeacher ? "End Live Class" : "Leave Call"}
                  >
                    {isEnding ? "Ending..." : (isTeacher ? "End Call" : "Leave")}
                  </button>

                  {isTeacher && (
                    <button 
                      className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                      title="Record"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      </div>
                    </button>
                  )}

                  {isTeacher && (
                    <button 
                      className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                      title="Share Screen"
                    >
                      <MonitorUp className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="text-white/70 hover:text-white transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode(viewMode === "gallery" ? "spotlight" : "gallery")}
                    className="text-white/70 hover:text-white transition-colors"
                    title={viewMode === "gallery" ? "Switch to Spotlight" : "Switch to Gallery"}
                  >
                    {viewMode === "gallery" ? <UserIcon className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Sidebar */}
            <motion.div 
              initial={false}
              animate={{ width: isSidebarOpen ? 360 : 0, opacity: isSidebarOpen ? 1 : 0 }}
              className="bg-white flex flex-col shadow-2xl relative z-50 overflow-hidden"
            >
              <div className="w-[360px] h-full flex flex-col">
                <div className="flex border-b border-slate-100 p-2 gap-1">
                  <button 
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      activeTab === "chat" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> Chat
                  </button>
                  <button 
                    onClick={() => setActiveTab("participants")}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      activeTab === "participants" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4" /> People
                  </button>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  {activeTab === "chat" ? (
                    <LiveChat liveClassId={liveClass.id} isTeacher={isTeacher} />
                  ) : (
                    <ParticipantPanel 
                      participants={participants} 
                      isTeacher={isTeacher} 
                      onRemove={handleRemoveParticipant}
                      teacherId={liveClass.teacher_id}
                      onMuteAll={handleMuteAll}
                      onUnmuteAll={handleUnmuteAll}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default LiveClassPage;
