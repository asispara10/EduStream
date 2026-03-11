import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface NepalClockProps {
  dark?: boolean;
  glass?: boolean;
}

const NepalClock: React.FC<NepalClockProps> = ({ dark = false, glass = false }) => {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const nepalTime = now.toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
      setTime(nepalTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (glass) {
    return (
      <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-white/10">
        <Clock className="w-4 h-4 text-white" />
        <span className="tabular-nums">{time}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
      dark 
        ? "bg-white/20 backdrop-blur-md text-white border-white/10" 
        : "bg-slate-50 border-slate-200 text-slate-900"
    }`}>
      <Clock className={`w-4 h-4 ${dark ? "text-white" : "text-indigo-600"}`} />
      <span className="tabular-nums">{time}</span>
    </div>
  );
};

export default NepalClock;
