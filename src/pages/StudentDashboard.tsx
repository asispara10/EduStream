import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { classService } from "../services/api.service.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { useSocket } from "../context/SocketContext.tsx";
import { Plus, Users, BookOpen, ArrowRight, Video } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getErrorMessage } from "../utils/error.ts";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { activeLiveClasses } = useSocket();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const fetchClasses = async () => {
    try {
      const res = await classService.getClasses();
      setClasses(res.data.classes);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to fetch classes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classService.joinClass(joinCode);
      setShowModal(false);
      setJoinCode("");
      fetchClasses();
      toast.success("Joined class successfully!");
    } catch (err: any) {
      toast.error(getErrorMessage(err, "Failed to join class"));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Enrolled</h1>
          <p className="text-slate-500 mt-1">Access your classrooms and learning materials</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Join Class
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={`skeleton-${i}`} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No classes yet</h3>
          <p className="text-slate-500 mt-1">Ask your teacher for a class code to join</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                to={`/class/${c.id}`}
                className="block bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all overflow-hidden group"
              >
                <div className="h-32 bg-indigo-600 p-6 relative">
                  {activeLiveClasses.has(c.id) ? (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg shadow-red-500/50">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider">
                        {c.code}
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-white text-[9px] font-medium">
                        {c.teacher_name}
                      </div>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white truncate pr-16">{c.name}</h3>
                  <p className="text-indigo-100 text-sm font-medium mt-1">{c.subject}</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Upcoming</p>
                      <p className="text-xs text-slate-600 font-medium">
                        {c.upcoming_assignment || "No upcoming assignments"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        <span>Classroom</span>
                      </div>
                      <div className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Enter <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Join a Class</h2>
            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Class Code</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-2xl font-mono tracking-widest"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="text-xs text-slate-500 mt-2">Enter the 6-character code provided by your teacher.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
                >
                  Join Class
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
