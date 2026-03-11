import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import db from "./db.ts";

export const onlineUsers = new Map<number, string>(); // userId -> socketId
const socketToUser = new Map<string, number>(); // socketId -> userId

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("login", (userId: number) => {
      onlineUsers.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      console.log(`User ${userId} logged in with socket ${socket.id}`);
      io.emit("user-online", userId);
    });

    // Join class room for general notifications
    socket.on("join-class", (classId: number) => {
      socket.join(`class_${classId}`);
    });

    // Live Class Events
    socket.on("join-live-class", ({ liveClassId, userId, name, avatar }) => {
      socket.join(`live_class_${liveClassId}`);
      
      // Add to participants in DB
      try {
        db.prepare("INSERT OR IGNORE INTO live_class_participants (live_class_id, user_id) VALUES (?, ?)").run(liveClassId, userId);
        
        // Mark attendance for the student
        const liveClass = db.prepare("SELECT class_id, teacher_id FROM live_classes WHERE id = ?").get(liveClassId);
        if (liveClass && userId !== liveClass.teacher_id) {
          const today = new Date().toISOString().split('T')[0];
          db.prepare(`
            INSERT INTO attendance (class_id, student_id, date, status)
            VALUES (?, ?, ?, 'present')
            ON CONFLICT(class_id, student_id, date) DO UPDATE SET status = 'present'
          `).run(liveClass.class_id, userId, today);
        }

        // Notify others in the room
        socket.to(`live_class_${liveClassId}`).emit("user-joined-live", { userId, name, avatar });
        
        // Send current participants to the joining user
        const participants = db.prepare(`
          SELECT u.id, u.name, u.avatar, u.profileImage
          FROM live_class_participants lcp
          JOIN users u ON lcp.user_id = u.id
          WHERE lcp.live_class_id = ?
        `).all(liveClassId);
        
        socket.emit("current-participants", participants);
      } catch (err) {
        console.error("Join live class error:", err);
      }
    });

    socket.on("user-video-toggle", ({ liveClassId, userId, isVideoOff }) => {
      socket.to(`live_class_${liveClassId}`).emit("user-video-toggled", { userId, isVideoOff });
    });

    socket.on("user-audio-toggle", ({ liveClassId, userId, isMuted }) => {
      socket.to(`live_class_${liveClassId}`).emit("user-audio-toggled", { userId, isMuted });
    });

    socket.on("mute-all-participants", ({ liveClassId }) => {
      socket.to(`live_class_${liveClassId}`).emit("force-mute");
    });

    socket.on("unmute-all-participants", ({ liveClassId }) => {
      socket.to(`live_class_${liveClassId}`).emit("force-unmute");
    });

    socket.on("end-live-class", ({ liveClassId }) => {
      io.to(`live_class_${liveClassId}`).emit("live-class-ended", { liveClassId });
    });

    socket.on("leave-live-class", ({ liveClassId, userId }) => {
      socket.leave(`live_class_${liveClassId}`);
      try {
        db.prepare("DELETE FROM live_class_participants WHERE live_class_id = ? AND user_id = ?").run(liveClassId, userId);
        socket.to(`live_class_${liveClassId}`).emit("user-left-live", { userId });
      } catch (err) {
        console.error("Leave live class error:", err);
      }
    });

    // WebRTC Signaling
    socket.on("sending-signal", (payload) => {
      const targetSocketId = onlineUsers.get(payload.userToSignal);
      if (targetSocketId) {
        io.to(targetSocketId).emit("user-joined-signal", { 
          signal: payload.signal, 
          callerID: payload.callerID 
        });
      }
    });

    socket.on("returning-signal", (payload) => {
      io.to(payload.callerID).emit("receiving-returned-signal", { 
        signal: payload.signal, 
        id: socket.id 
      });
    });

    // Live Chat
    socket.on("send-live-message", ({ liveClassId, userId, content, userName, userAvatar }) => {
      try {
        const result = db.prepare(
          "INSERT INTO live_chat_messages (live_class_id, user_id, content) VALUES (?, ?, ?)"
        ).run(liveClassId, userId, content);
        
        const newMessage = {
          id: result.lastInsertRowid,
          live_class_id: liveClassId,
          user_id: userId,
          content,
          user_name: userName,
          user_avatar: userAvatar,
          created_at: new Date().toISOString()
        };
        
        io.to(`live_class_${liveClassId}`).emit("new-live-message", newMessage);
      } catch (err) {
        console.error("Send live message error:", err);
      }
    });

    socket.on("disconnect", () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        onlineUsers.delete(userId);
        socketToUser.delete(socket.id);
        console.log(`User ${userId} disconnected`);
        io.emit("user-offline", userId);
        
        // Clean up live class participants if they were in one
        // This is a bit complex without tracking which rooms they were in, 
        // but we can query DB for active participations
        try {
          const activeParticipations = db.prepare("SELECT live_class_id FROM live_class_participants WHERE user_id = ?").all(userId);
          activeParticipations.forEach((p: any) => {
            db.prepare("DELETE FROM live_class_participants WHERE live_class_id = ? AND user_id = ?").run(p.live_class_id, userId);
            io.to(`live_class_${p.live_class_id}`).emit("user-left-live", { userId });
          });
        } catch (err) {
          console.error("Socket disconnect cleanup error:", err);
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const sendNotification = (userId: number, notification: any) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit("new-notification", notification);
  }
};

export const broadcastToClass = (studentIds: number[], notification: any) => {
  studentIds.forEach(id => {
    sendNotification(id, notification);
  });
};
