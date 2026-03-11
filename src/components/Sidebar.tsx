import React from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  User, 
  Settings, 
  LogOut, 
  ChevronLeft,
  LayoutDashboard,
  Calendar
} from "lucide-react";
import { useLayout } from "../context/LayoutContext.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { motion, AnimatePresence } from "framer-motion";
import ProfileAvatar from "./ProfileAvatar.tsx";

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useLayout();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const classId = location.pathname.includes("/class/") ? location.pathname.split("/")[2] : null;

  const navItems = [
    { name: "Home", icon: Home, path: "/dashboard" },
    ...(classId ? [{ name: "Stream", icon: LayoutDashboard, path: `/class/${classId}/stream` }] : []),
    { name: "Enrolled", icon: BookOpen, path: "/enrolled" },
    { name: "Calendar", icon: Calendar, path: "/calendar" },
    { name: "Profile", icon: User, path: "/profile" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const handleBack = () => {
    navigate("/dashboard");
    closeSidebar();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    closeSidebar();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : -240,
          boxShadow: isSidebarOpen ? "20px 0 50px -12px rgb(0 0 0 / 0.1)" : "none"
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full w-[240px] bg-white border-r border-slate-200 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link 
            to="/dashboard" 
            onClick={closeSidebar}
            className="flex items-center gap-3 group"
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">EduStream</span>
          </Link>
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 mx-2 mt-4 mb-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <ProfileAvatar size="md" showStatus={true} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) closeSidebar();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${isActive 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
