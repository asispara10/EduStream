import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios.ts";

const SidebarCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const updateDate = () => {
      const nepalTimeStr = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu"
      });
      const newDate = new Date(nepalTimeStr);
      setCurrentDate(newDate);
      
      // Only set view date on initial load
      setViewDate(prev => {
        if (prev.getTime() === currentDate.getTime()) {
          return newDate;
        }
        return prev;
      });
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute

    const fetchAssignments = async () => {
      try {
        const res = await api.get("/assignments/all");
        setAssignments(res.data.assignments || []);
      } catch (err) {
        console.error("Failed to fetch assignments for calendar:", err);
      }
    };

    fetchAssignments();
    return () => clearInterval(interval);
  }, []);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

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

  const getDayStatus = (day: number) => {
    if (!day) return null;
    
    const dayDate = new Date(year, month, day);
    const dayStart = new Date(year, month, day, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month, day, 23, 59, 59).getTime();

    // Find assignments due on this day
    const dayAssignments = assignments.filter(ass => {
      const deadline = new Date(ass.deadline).getTime();
      return deadline >= dayStart && deadline <= dayEnd;
    });

    if (dayAssignments.length === 0) return null;

    // Check if any assignment on this day is still upcoming
    const now = currentDate.getTime();
    const hasUpcoming = dayAssignments.some(ass => new Date(ass.deadline).getTime() > now);
    
    return hasUpcoming ? "upcoming" : "passed";
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-2 mx-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-slate-900">
          📅 {monthNames[month]} {year}
        </span>
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => {
          const isToday = d === currentDay && month === currentMonth && year === currentYear;
          const status = d ? getDayStatus(d) : null;
          
          let bgColor = "";
          let textColor = "text-slate-700";
          
          if (isToday) {
            bgColor = "bg-indigo-600";
            textColor = "text-white font-bold shadow-sm shadow-indigo-200";
          } else if (status === "upcoming") {
            bgColor = "bg-red-500";
            textColor = "text-white font-bold";
          } else if (status === "passed") {
            bgColor = "bg-emerald-500";
            textColor = "text-white font-bold";
          } else if (d !== null) {
            bgColor = "hover:bg-slate-200";
          }

          return (
            <div 
              key={`day-${i}`} 
              className={`
                text-xs py-1 rounded-full flex items-center justify-center aspect-square transition-all
                ${d === null ? "" : "font-medium"}
                ${bgColor} ${textColor}
                ${d !== null ? "cursor-default" : ""}
              `}
              title={status ? `${status === 'upcoming' ? 'Assignment Due' : 'Assignment Passed'}` : undefined}
            >
              {d || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarCalendar;
