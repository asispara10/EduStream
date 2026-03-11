import React from "react";
import { useNotifications } from "../context/NotificationContext.tsx";
import { Bell, MessageSquare, FileText, Calendar, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatExactTimestamp } from "../utils/date.ts";
import { useNavigate } from "react-router-dom";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'assignment': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'holiday': return <Calendar className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.read === 0) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on type
    if (notification.class_id) {
      navigate(`/class/${notification.class_id}`);
    } else if (notification.type === 'assignment') {
      navigate('/enrolled');
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                Notifications
                {notifications.filter(n => n.read === 0).length > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {notifications.filter(n => n.read === 0).length}
                  </span>
                )}
              </h3>
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Mark all as read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No new notifications for you.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${notification.read === 0 ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notification.read === 0 ? 'bg-white shadow-sm' : 'bg-slate-100'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight mb-1 ${notification.read === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatExactTimestamp(notification.created_at)}
                        </p>
                      </div>
                      {notification.read === 0 && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                View all activity
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
