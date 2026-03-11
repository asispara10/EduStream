import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.tsx";
import TopNavbar from "../components/TopNavbar.tsx";
import { useLayout } from "../context/LayoutContext.tsx";
import { motion } from "framer-motion";

const DashboardLayout = () => {
  const { isSidebarOpen, isMobile } = useLayout();

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavbar />
      <Sidebar />
      
      {/* Main Content Wrapper */}
      <motion.main
        initial={false}
        animate={{ 
          x: isSidebarOpen && !isMobile ? 240 : 0,
          width: isSidebarOpen && !isMobile ? "calc(100% - 240px)" : "100%"
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="pt-16 min-h-screen overflow-x-hidden"
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
