import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-1 ${className}`}
      title="Go back"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-bold">Back</span>
    </button>
  );
};

export default BackButton;
