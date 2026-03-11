import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen, FileText, MessageSquare, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.ts";
import { motion, AnimatePresence } from "framer-motion";

const SearchDropdown = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${query}`);
      setResults(res.data);
      setIsOpen(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type: string, id: number, classId?: number) => {
    setIsOpen(false);
    setQuery("");
    if (type === "class") {
      navigate(`/class/${id}`);
    } else if (classId) {
      navigate(`/class/${classId}`);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative flex items-center bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search classes, assignments..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent border-none outline-none text-sm text-slate-600 w-full"
        />
        {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
        {query && !loading && (
          <button onClick={() => setQuery("")}>
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] max-h-[400px] overflow-y-auto"
          >
            {/* Classes */}
            {results.classes?.length > 0 && (
              <div className="p-2">
                <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classes</h4>
                {results.classes.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => handleResultClick("class", c.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-left"
                  >
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.subject} • {c.section}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Assignments */}
            {results.assignments?.length > 0 && (
              <div className="p-2 border-t border-slate-100">
                <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignments</h4>
                {results.assignments.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => handleResultClick("assignment", a.id, a.class_id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-left"
                  >
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.title}</p>
                      <p className="text-[10px] text-slate-500">In {a.class_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Announcements */}
            {results.announcements?.length > 0 && (
              <div className="p-2 border-t border-slate-100">
                <h4 className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Announcements</h4>
                {results.announcements.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => handleResultClick("announcement", a.id, a.class_id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-left"
                  >
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.title || "Announcement"}</p>
                      <p className="text-[10px] text-slate-500">In {a.class_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.classes?.length === 0 && results.assignments?.length === 0 && results.announcements?.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No results found for "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchDropdown;
