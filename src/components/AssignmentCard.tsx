import React, { useState } from "react";
import { FileText, Clock, ChevronRight, MoreVertical, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { format, isAfter, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatExactTimestamp } from "../utils/date.ts";

interface AssignmentCardProps {
  assignment: any;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, data: any) => void;
  onClick?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onDelete, onUpdate, onClick }) => {
  const { user } = useAuth();
  const [showOptions, setShowOptions] = useState(false);

  const isLate = isAfter(new Date(), parseISO(assignment.deadline));
  const deadlineDate = parseISO(assignment.deadline);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
          <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 truncate">{assignment.title}</h4>
            {assignment.total_marks && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {assignment.total_marks} pts
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest ${isLate ? "text-red-500" : "text-slate-400"}`}>
              <Clock className="w-3 h-3" />
              Due: {format(deadlineDate, "MMM d, h:mm a")}
              {isLate && " (Late)"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Posted: {formatExactTimestamp(assignment.created_at)}
            </span>
            {assignment.submissions_count !== undefined && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {assignment.submissions_count} turned in
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user?.role === "student" && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all"
          >
            Submit
          </button>
        )}
        {user?.role === "teacher" && onDelete && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-xl border border-slate-200 shadow-xl z-10 py-2"
                >
                  <button 
                    onClick={() => { setShowOptions(false); onUpdate?.(assignment.id, {}); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => { setShowOptions(false); onDelete(assignment.id); }}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

export default AssignmentCard;
