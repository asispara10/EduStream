import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext.tsx";
import { useNotifications } from "./NotificationContext.tsx";
import api from "../api/axios.ts";
import toast from "react-hot-toast";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<number>;
  activeLiveClasses: Set<number>; // Set of classIds
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [activeLiveClasses, setActiveLiveClasses] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      const newSocket = io(window.location.origin, {
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("login", user.id);
        
        // Join all classes for real-time stream updates
        api.get("/classes").then(res => {
          if (res.data.classes) {
            res.data.classes.forEach((c: any) => {
              newSocket.emit("join-class", c.id);
            });
          }
        }).catch(err => {
          if (err.response?.status !== 401) {
            console.error("Join classes error:", err);
          }
        });

        // Fetch initially active live classes
        api.get("/live-class/active/all").then(res => {
          if (res.data.activeClasses) {
            setActiveLiveClasses(new Set(res.data.activeClasses.map((c: any) => c.class_id)));
          }
        }).catch(err => {
          if (err.response?.status !== 401) {
            console.error("Fetch active classes error:", err);
          }
        });
      });

      newSocket.on("new-notification", (notification) => {
        console.log("New notification received:", notification);
        fetchNotifications(); // Refresh list
        toast.success(notification.title, {
          icon: '🔔',
          duration: 4000
        });
      });

      newSocket.on("live-class-started", ({ classId, className }) => {
        setActiveLiveClasses(prev => new Set(prev).add(classId));
        toast.success(`Live Class Started: ${className}`, {
          icon: '🔴',
          duration: 6000
        });
        
        // Browser notification
        if (Notification.permission === "granted") {
          new Notification("Live Class Started", {
            body: `Your teacher has started a live session in ${className}`,
            icon: "/favicon.ico"
          });
        }
      });

      newSocket.on("live-class-ended", ({ classId }) => {
        setActiveLiveClasses(prev => {
          const newSet = new Set(prev);
          newSet.delete(classId);
          return newSet;
        });
      });

      newSocket.on("user-online", (userId: number) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      });

      newSocket.on("user-offline", (userId: number) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
      setOnlineUsers(new Set());
      setActiveLiveClasses(new Set());
    }
  }, [user, fetchNotifications]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, activeLiveClasses }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
