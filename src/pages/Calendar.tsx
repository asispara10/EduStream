import React, { useState, useEffect } from "react";
import api from "../api/axios.ts";
import { Calendar as CalendarIcon, Clock, FileText, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const Calendar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const nepalTimeStr = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu"
      });
      const newDate = new Date(nepalTimeStr);
      setCurrentTime(newDate);
      
      setViewDate(prev => {
        if (prev.getTime() === currentTime.getTime()) {
          return newDate;
        }
        return prev;
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    const fetchDeadlines = async () => {
      try {
        const res = await api.get("/assignments/all");
        setDeadlines(res.data.assignments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlines();
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const currentYear = currentTime.getFullYear();
  const currentMonth = currentTime.getMonth();
  const currentDay = currentTime.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-3">
            <CalendarIcon className="w-10 h-10 text-indigo-600" />
            Calendar
          </h1>
          <p className="text-slate-500 font-medium">Plan your schedule and track deadlines</p>
        </div>
        <div className="flex items-center gap-4 bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Current Time (NPT)</p>
            <p className="text-lg font-bold text-indigo-900">{formatTime(currentTime)}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </h2>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors border border-slate-200">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors border border-slate-200">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center">
              {days.map((d, i) => {
                const isToday = d === currentDay && month === currentMonth && year === currentYear;
                
                let bgColor = "";
                let textColor = "text-slate-700";
                let status = null;

                if (d) {
                  const dayStart = new Date(year, month, d, 0, 0, 0).getTime();
                  const dayEnd = new Date(year, month, d, 23, 59, 59).getTime();
                  
                  const dayAssignments = deadlines.filter(ass => {
                    const deadline = new Date(ass.deadline).getTime();
                    return deadline >= dayStart && deadline <= dayEnd;
                  });

                  if (dayAssignments.length > 0) {
                    const now = currentTime.getTime();
                    const hasUpcoming = dayAssignments.some(ass => new Date(ass.deadline).getTime() > now);
                    status = hasUpcoming ? "upcoming" : "passed";
                  }
                }

                if (isToday) {
                  bgColor = "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 scale-105";
                } else if (status === "upcoming") {
                  bgColor = "bg-red-500 text-white font-bold shadow-sm shadow-red-100";
                } else if (status === "passed") {
                  bgColor = "bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-100";
                } else if (d !== null) {
                  bgColor = "text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer";
                }

                return (
                  <div 
                    key={'day-' + i} 
                    className={`
                      text-sm py-3 rounded-xl flex items-center justify-center aspect-square transition-all
                      ${d === null ? "" : "font-medium"}
                      ${bgColor}
                    `}
                    title={status ? `${status === 'upcoming' ? 'Assignment Due' : 'Assignment Passed'}` : undefined}
                  >
                    {d || ""}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upcoming Deadlines</h2>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
              {deadlines.length}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={'loading-' + i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : deadlines.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No upcoming deadlines</h3>
              <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {deadlines.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-3 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {item.class_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-600">
                      Due {new Date(item.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      new Date(item.deadline).getTime() - new Date().getTime() < 86400000 
                        ? 'bg-red-50 text-red-600' 
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {new Date(item.deadline).getTime() - new Date().getTime() < 86400000 ? 'Urgent' : 'Upcoming'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Calendar;
