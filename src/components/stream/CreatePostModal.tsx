import React, { useState, useRef } from "react";
import { X, Image as ImageIcon, Video as VideoIcon, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../../services/post.service.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../utils/error.ts";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  classId?: number;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated, classId }) => {
  const { user } = useAuth();
  const [textContent, setTextContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Video size must be less than 50MB");
        return;
      }
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !image && !video && !linkUrl.trim()) {
      toast.error("Post cannot be empty");
      return;
    }
    
    try {
      const formData = new FormData();
      let postType: 'GLOBAL_STREAM' | 'CLASS_STREAM';
      
      if (classId) {
        postType = 'CLASS_STREAM';
      } else {
        postType = 'GLOBAL_STREAM';
      }
      
      formData.append("post_type", postType);
      if (classId) {
        formData.append("classId", classId.toString());
      }
      formData.append("text_content", textContent);
      if (image) formData.append("image", image);
      if (video) formData.append("video", video);
      if (linkUrl.trim()) formData.append("link_url", linkUrl.trim());

      if (postType === 'CLASS_STREAM') {
        await postService.createClassPost(classId!.toString(), formData, {
          "Content-Type": undefined,
        });
      } else {
        await postService.createGlobalPost(formData, {
          "Content-Type": undefined,
        });
      }
      
      // Reset state
      handleClose();
      onPostCreated();
      toast.success("Post created!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create post"));
    }
  };

  const handleClose = () => {
    setTextContent("");
    setImage(null);
    setVideo(null);
    setLinkUrl("");
    setShowLinkInput(false);
    setImagePreview(null);
    setVideoPreview(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
            style={{ height: '600px', maxHeight: '90vh' }}
          >
            <div className="flex justify-between items-center p-6 pb-4 shrink-0 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Create Post
                </h2>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 flex flex-col p-6 space-y-4 min-h-0 overflow-y-auto">
                <div className="flex-1 flex flex-col min-h-[120px]">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-2 shrink-0">
                    📄 Caption
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full h-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed transition-all"
                    placeholder="Write your caption here..."
                  />
                </div>

                {/* Media Previews */}
                {(imagePreview || videoPreview || showLinkInput) && (
                  <div className="space-y-4 shrink-0">
                    {imagePreview && (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm h-48">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                        <button 
                          type="button" 
                          onClick={() => { setImage(null); setImagePreview(null); }}
                          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {videoPreview && (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm h-48">
                        <video src={videoPreview} controls className="w-full h-full object-contain" />
                        <button 
                          type="button" 
                          onClick={() => { setVideo(null); setVideoPreview(null); }}
                          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm z-10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {showLinkInput && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                          🔗 External Link
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="url"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              placeholder="Paste link here (YouTube, Drive, etc.)"
                              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden Inputs */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                ref={imageInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                ref={videoInputRef}
                onChange={handleVideoChange}
                className="hidden"
              />

              {/* Actions */}
              <div className="p-6 pt-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-slate-200 transition-all group hover:border-indigo-500 hover:bg-white hover:text-indigo-600 text-slate-500 bg-white"
                  >
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-slate-200 transition-all group hover:border-indigo-500 hover:bg-white hover:text-indigo-600 text-slate-500 bg-white"
                  >
                    <VideoIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-white text-slate-500 hover:text-indigo-600 transition-all group bg-white"
                  >
                    <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Link</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!textContent.trim() && !image && !video && !linkUrl.trim()}
                    className="disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                  >
                    Post
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
