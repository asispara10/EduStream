import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import api from "../api/axios.ts";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  BarChart3,
  Users,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ProfileAvatar from "../components/ProfileAvatar.tsx";
import { getErrorMessage } from "../utils/error.ts";

const AttendancePage = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/${classId}`);
      setAttendanceData(res.data.attendance);
    } catch (err) {
      console.error("Fetch attendance error:", err);
      toast.error(getErrorMessage(err, "Failed to load attendance history"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [classId]);

  const getDaysInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getDayStatus = (dailyRecords: any[], date: string) => {
    const record = dailyRecords.find(r => r.date === date);
    if (!record) return "none";
    return record.present ? "present" : "absent";
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl border border-slate-200 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
            <p className="text-sm text-slate-500">Track and manage class participation</p>
          </div>
        </div>
      </div>

      {user?.role === "teacher" ? (
        <div className="space-y-6">
          {/* Teacher View: List of students and their summaries */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-700">Class Average: 88%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Current Month</th>
                    <th className="px-6 py-4">Total Present</th>
                    <th className="px-6 py-4">Attendance Rate</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData
                    .filter(item => item.student.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item: any) => {
                      const currentMonthRecord = item.attendance.find((m: any) => m.month === selectedMonth);
                      const totalPresent = item.attendance.reduce((acc: number, m: any) => acc + m.total_days_present, 0);
                      
                      return (
                        <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <ProfileAvatar userId={item.student.id} name={item.student.name} size="sm" showStatus={true} />
                              <span className="font-bold text-slate-900">{item.student.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {currentMonthRecord ? `${currentMonthRecord.total_days_present} days` : "No record"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{totalPresent} days</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                  className="h-full bg-indigo-600 rounded-full" 
                                  style={{ width: '85%' }} 
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-700">85%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-indigo-600 hover:underline text-sm font-bold">View Calendar</button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student View: Calendar and Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  Attendance Calendar
                </h2>
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {attendanceData.map(m => (
                      <option key={m.month} value={m.month}>
                        {new Date(m.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: getDaysInMonth(selectedMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
                  const monthData = attendanceData.find(m => m.month === selectedMonth);
                  const status = monthData ? getDayStatus(monthData.dailyRecords, dateStr) : "none";

                  return (
                    <div 
                      key={day} 
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all ${
                        status === "present" ? "bg-green-50 border-green-100 text-green-700" :
                        status === "absent" ? "bg-red-50 border-red-100 text-red-700" :
                        "bg-slate-50 border-slate-100 text-slate-400"
                      }`}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      {status === "present" && <CheckCircle2 className="w-3 h-3 mt-1" />}
                      {status === "absent" && <XCircle className="w-3 h-3 mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
              <BarChart3 className="w-8 h-8 mb-4 opacity-50" />
              <h3 className="text-2xl font-bold mb-2">Monthly Summary</h3>
              <p className="text-indigo-100 text-sm mb-6">
                You have been present for {attendanceData.find(m => m.month === selectedMonth)?.total_days_present || 0} days this month.
              </p>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Attendance Rate</span>
                  <span>92%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Past Months</h4>
              <div className="space-y-3">
                {attendanceData.map(m => (
                  <div key={m.month} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-xl">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {new Date(m.month + "-01").toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{m.total_days_present} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
