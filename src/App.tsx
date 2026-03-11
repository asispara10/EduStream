import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { LayoutProvider } from "./context/LayoutContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Stream from "./pages/Stream.tsx";
import StreamPage from "./pages/StreamPage.tsx";
import TeacherDashboard from "./pages/TeacherDashboard.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import Calendar from "./pages/Calendar.tsx";
import Enrolled from "./pages/Enrolled.tsx";
import Settings from "./pages/Settings.tsx";
import ClassDetail from "./pages/ClassDetail.tsx";
import AttendancePage from "./pages/AttendancePage.tsx";
import LiveClassPage from "./pages/LiveClassPage.tsx";
import { useAuth } from "./context/AuthContext.tsx";

import Profile from "./pages/Profile.tsx";

const DashboardRouter = () => {
  const { user } = useAuth();
  return user?.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />;
};

export default function App() {
  console.log("App component rendering...");
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <Router>
            <LayoutProvider>
              <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="/dashboard" element={<DashboardRouter />} />
                    <Route path="/stream" element={<Stream />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/enrolled" element={<Enrolled />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/class/:id" element={<ClassDetail />} />
                    <Route path="/class/:id/stream" element={<StreamPage />} />
                    <Route path="/class/:classId/attendance" element={<AttendancePage />} />
                    <Route path="/class/:classId/live" element={<LiveClassPage />} />
                  </Route>

                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </LayoutProvider>
          </Router>
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
