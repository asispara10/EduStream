import React, { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { useLayout } from "../context/LayoutContext.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { useNotifications } from "../context/NotificationContext.tsx";
import { motion } from "framer-motion";
import ProfileAvatar from "./ProfileAvatar.tsx";
import NotificationDropdown from "./NotificationDropdown.tsx";
import SearchDropdown from "./SearchDropdown.tsx";

const TopNavbar = () => {
  const { toggleSidebar, isSidebarOpen, isMobile } = useLayout();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <motion.header 
      initial={false}
      animate={{ 
        x: isSidebarOpen && !isMobile ? 240 : 0,
        width: isSidebarOpen && !isMobile ? "calc(100% - 240px)" : "100%"
      }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-6"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-indigo-600 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <SearchDropdown />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown 
            isOpen={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</p>
          </div>
          <ProfileAvatar size="md" showStatus={true} />
        </div>
      </div>
    </motion.header>
  );
};

export default TopNavbar;
