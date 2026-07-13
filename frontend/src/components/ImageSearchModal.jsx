import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, UploadCloud, Image as ImageIcon, Sparkles, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ImageSearchModal = ({ onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [tags, setTags] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResults([]);
    setTags(null);
  };

  const handleSearch = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await axios.post("/api/ai/search/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.success) {
        setResults(res.data.results);
        setTags(res.data.tags);
        toast.success("AI search complete! Found matching stays.");
      } else {
        toast.error("AI image analysis returned unsuccessful status.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "AI Image Search failed. Please verify API configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" style={{ zIndex: 9999 }}>
      <div 
        className="w-full max-w-4xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900 flex flex-col overflow-hidden"
        style={{ maxHeight: '80vh' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 text-brand-rose">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">AI Image Search</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-1">
          
          {/* Left panel: Uploader & Preview */}
          <div className="flex flex-col gap-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center relative transition-all flex-shrink-0 ${
                dragActive 
                  ? 'border-brand-rose bg-rose-50/10' 
                  : selectedFile 
                    ? 'border-slate-100 bg-slate-50/20' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850/50 dark:hover:bg-slate-850'
              }`}
              style={{ height: '170px' }}
            >
              {previewUrl ? (
                <div className="w-full h-full relative flex items-center justify-center rounded-xl overflow-hidden group">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    <label className="rounded-full bg-white text-slate-800 px-4 py-2 text-xs font-bold shadow-md cursor-pointer hover:bg-slate-100">
                      Change File
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-3.5 cursor-pointer w-full h-full justify-center">
                  <UploadCloud className="h-10 w-10 text-slate-400 stroke-[1.5]" />
                  <div className="flex flex-col gap-1 text-slate-500">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Drag & Drop stay image here</span>
                    <span className="text-[10px] text-slate-400">or click to browse local files</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {selectedFile && (
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full rounded-2xl bg-brand-rose py-3 text-xs font-bold text-white shadow-md hover:bg-brand-rose/90 transition-colors disabled:bg-brand-rose/50 cursor-pointer border-none"
              >
                {loading ? 'Analyzing Interior Styles...' : 'Find Visually Similar Properties'}
              </button>
            )}

            {/* AI parsed tags summary */}
            {tags && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4.5 dark:border-slate-800 dark:bg-slate-850/30 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-brand-rose" />
                  <span>AI Analysis Results</span>
                </span>
                
                <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                  <span className="bg-rose-50 text-brand-rose px-2.5 py-1 rounded-full dark:bg-rose-950/20">{tags.style || 'Modern'} Style</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full dark:bg-indigo-950/20">{tags.propertyType || 'Villa'} Stay</span>
                  {tags.dominantColors?.map((c, i) => (
                    <span key={i} className="bg-slate-100 text-slate-650 px-2.5 py-1 rounded-full dark:bg-slate-800 dark:text-slate-350">{c} Color</span>
                  ))}
                </div>

                {tags.amenities && (
                  <div className="flex flex-col gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amenities matches:</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-relaxed truncate">{tags.amenities.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Similar stays results grid */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched Stays ({results.length})</span>

            {loading ? (
              <div className="flex flex-col gap-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-50 animate-pulse dark:bg-slate-850" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col gap-3.5 overflow-y-auto pr-0.5" style={{ maxHeight: '40vh' }}>
                {results.map((l) => (
                  <Link 
                    key={l._id} 
                    to={`/listings/${l._id}`}
                    onClick={onClose}
                    className="flex items-center gap-3.5 rounded-2xl border border-slate-100 p-2.5 hover:shadow-md transition-shadow bg-white hover:bg-slate-50/20 text-decoration-none dark:border-slate-800 dark:bg-slate-850/50"
                  >
                    <img 
                      src={l.image?.url || (l.images && l.images[0]?.url) || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=80&q=80"}
                      className="h-16 w-20 rounded-xl object-cover border border-slate-100" 
                      alt="" 
                    />
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-extrabold text-slate-800 truncate dark:text-slate-150">{l.title}</span>
                      <span className="text-[10px] font-bold text-slate-400 truncate">{l.location}, {l.country}</span>
                      <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">₹{l.price?.toLocaleString()} / night</span>
                    </div>

                    {/* Similarity score badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full dark:bg-emerald-950/20 dark:text-emerald-400">
                        {l.similarity}% match
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center gap-3 bg-slate-50/30 rounded-2xl border border-slate-100 dark:bg-slate-850/20 dark:border-slate-800">
                <ImageIcon className="h-10 w-10 text-slate-200 dark:text-slate-700 stroke-[1.5]" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matching stays loaded</span>
                <span className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
                  Upload an image representing your vacation choice style (e.g. cozy room, beach house, castle) and trigger AI Search.
                </span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ImageSearchModal;
