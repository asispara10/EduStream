import React, { useState, useEffect } from "react";
import { Link as LinkIcon, ExternalLink, Youtube, FileText } from "lucide-react";
import { postService } from "../../services/post.service.ts";

interface LinkPreviewProps {
  url: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url }) => {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await postService.getLinkPreview(url);
        setPreview(res.data);
      } catch (err) {
        setPreview({ title: url, url, type: 'website' });
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="mt-4 animate-pulse flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="h-2 bg-slate-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (preview?.type === 'youtube') {
    const ytId = url.includes('youtu.be') 
      ? url.split('/').pop() 
      : new URL(url).searchParams.get('v');
    
    return (
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black shadow-sm">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${ytId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"
        >
          <Youtube className="w-4 h-4" /> View on YouTube
        </a>
      </div>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-4 flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all group overflow-hidden"
    >
      {preview?.image && (
        <div className="w-full sm:w-32 h-32 sm:h-auto rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 bg-white">
          <img src={preview.image} alt={preview.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          {preview?.type === 'drive' ? (
            <FileText className="w-4 h-4 text-blue-600" />
          ) : (
            <LinkIcon className="w-4 h-4 text-indigo-600" />
          )}
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {preview?.type || 'Link'}
          </p>
        </div>
        <h5 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {preview?.title || url}
        </h5>
        {preview?.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {preview.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 truncate">
          <ExternalLink className="w-3 h-3" />
          {new URL(url).hostname}
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
