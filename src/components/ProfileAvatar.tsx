import React, { useState, useRef } from "react";
import api from "../api/axios.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { Camera, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";

interface ProfileAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  userId?: number;
  name?: string;
  src?: string;
  showStatus?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  size = "md", 
  editable = false,
  userId,
  name,
  src,
  showStatus = false
}) => {
  const { user: currentUser, setUser } = useAuth();
  const { onlineUsers } = useSocket();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCurrentUser = !userId || userId === currentUser?.id;
  const effectiveUserId = userId || currentUser?.id;
  const effectiveName = name || currentUser?.name;
  const effectiveSrc = src || (isCurrentUser ? (currentUser?.profileImage || currentUser?.avatar) : undefined);
  const isOnline = effectiveUserId ? onlineUsers.has(effectiveUserId) : false;

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl"
  };

  const statusSizeClasses = {
    sm: "w-2.5 h-2.5 border-2",
    md: "w-3 h-3 border-2",
    lg: "w-4 h-4 border-2",
    xl: "w-5 h-5 border-4"
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    setUploading(true);
    try {
      const res = await api.put("/users/upload-profile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (currentUser) {
        setUser({ ...currentUser, profileImage: res.data.profileImage, avatar: res.data.profileImage });
      }
      toast.success("Profile photo updated!");
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(getErrorMessage(err, "Failed to upload profile photo"));
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (editable && !uploading && isCurrentUser) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative inline-block">
      <div 
        className={`relative group ${sizeClasses[size]} rounded-xl overflow-hidden flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold border border-slate-200 ${editable && isCurrentUser ? 'cursor-pointer' : ''}`}
        onClick={triggerFileInput}
      >
        {uploading ? (
          <Loader2 className="w-1/2 h-1/2 animate-spin text-indigo-600" />
        ) : effectiveSrc ? (
          <img 
            src={effectiveSrc} 
            alt={effectiveName} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{effectiveName?.charAt(0) || "U"}</span>
        )}

        {editable && !uploading && isCurrentUser && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-1/2 h-1/2 text-white" />
          </div>
        )}

        {isCurrentUser && (
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        )}
      </div>

      {showStatus && effectiveUserId && (
        <div 
          className={`absolute -bottom-0.5 -right-0.5 ${statusSizeClasses[size]} rounded-full border-white shadow-sm transition-colors duration-500 ${
            isOnline ? "bg-green-500" : "bg-slate-300"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
};

export default ProfileAvatar;
