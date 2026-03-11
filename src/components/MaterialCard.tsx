import React from "react";
import { BookOpen, ExternalLink, FileText, Image as ImageIcon, Link as LinkIcon, Youtube, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { formatExactTimestamp } from "../utils/date.ts";

interface MaterialCardProps {
  material: any;
  onDelete?: (id: number) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onDelete }) => {
  const { user } = useAuth();

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'youtube': return <Youtube className="w-5 h-5 text-red-600" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default: return <BookOpen className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex items-center gap-4 group shadow-sm">
      <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-indigo-50 transition-colors">
        {getIcon(material.content_type)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 truncate">{material.title}</h4>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {material.content_type}
          </span>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {formatExactTimestamp(material.created_at)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a 
          href={material.url} 
          target="_blank" 
          rel="noreferrer"
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          title="Open Link"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        {user?.role === "teacher" && onDelete && (
          <button 
            onClick={() => onDelete(material.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Material"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MaterialCard;
