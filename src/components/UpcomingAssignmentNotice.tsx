import React from "react";
import { Clock, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface UpcomingAssignmentNoticeProps {
  assignment: any;
  onClick?: () => void;
}

const UpcomingAssignmentNotice: React.FC<UpcomingAssignmentNoticeProps> = ({ assignment, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-indigo-100 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Upcoming Assignment</span>
            <span className="w-1 h-1 bg-indigo-300 rounded-full" />
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Pending
            </span>
          </div>
          <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{assignment.title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Due: {format(new Date(assignment.deadline), "MMMM d, yyyy • h:mm a")}
          </p>
        </div>
      </div>
      <div className="bg-white p-2 rounded-lg border border-indigo-100 text-indigo-600 group-hover:translate-x-1 transition-all">
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
};

export default UpcomingAssignmentNotice;
