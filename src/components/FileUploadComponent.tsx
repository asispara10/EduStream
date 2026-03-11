import React, { useState, useRef } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, Link as LinkIcon, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadComponentProps {
  onFilesChange: (files: any[]) => void;
  files: any[];
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({ onFilesChange, files }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).map((file: File) => ({
      name: file.name,
      type: file.type.includes('image') ? 'image' : 'pdf',
      url: URL.createObjectURL(file), // Placeholder for real upload
      size: file.size
    }));

    onFilesChange([...files, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    const newLink = {
      name: linkName || linkUrl,
      type: 'link',
      url: linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    };

    onFilesChange([...files, newLink]);
    setLinkUrl("");
    setLinkName("");
    setShowLinkInput(false);
  };

  const removeFile = (idx: number) => {
    const newFiles = [...files];
    newFiles.splice(idx, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {files.map((file, idx) => (
            <motion.div 
              key={`${file.name}-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl group"
            >
              {file.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> : 
               file.type === 'link' ? <LinkIcon className="w-3.5 h-3.5 text-indigo-600" /> : 
               <FileText className="w-3.5 h-3.5 text-indigo-600" />}
              <span className="text-xs font-bold text-indigo-700 truncate max-w-[120px]">{file.name}</span>
              <button 
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                <X className="w-3 h-3 text-indigo-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-bold text-slate-600"
          >
            <Paperclip className="w-3.5 h-3.5" /> Attach File
          </button>
          <button 
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-bold text-slate-600"
          >
            <LinkIcon className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple 
      />

      <AnimatePresence>
        {showLinkInput && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Link Name (Optional)" 
                  value={linkName}
                  onChange={e => setLinkName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <input 
                  type="text" 
                  placeholder="URL (e.g. google.com)" 
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowLinkInput(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleAddLink}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadComponent;
