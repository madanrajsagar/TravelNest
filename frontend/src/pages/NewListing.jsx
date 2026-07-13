import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PlusCircle, Upload, ArrowLeft, Trash2, Sparkles } from 'lucide-react';

export const NewListing = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('Villa'); // Stay categories
  
  // Custom AI styling states
  const [writingStyle, setWritingStyle] = useState('Professional');
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);

  // Drag & drop file array states
  const [imageFiles, setImageFiles] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const handleGenerateDescription = async () => {
    if (!title) {
      toast.info('Please enter a Nest Title first to allow AI prompt matches.');
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await axios.post('/api/ai/generate-description', {
        title,
        type,
        location,
        price,
        style: writingStyle,
        amenities: ['WiFi', 'Pool', 'AC', 'Kitchen', 'TV']
      });
      if (res.data && res.data.success) {
        setDescription(res.data.description);
        setTitle(res.data.title || title);
        setSuggestedKeywords(res.data.keywords || []);
        toast.success('Description generated with AI successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate description with AI.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      toast.error('Please upload at least one stay image!');
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('listings[title]', title);
    formData.append('listings[description]', description);
    formData.append('listings[price]', price);
    formData.append('listings[location]', location);
    formData.append('listings[country]', country);
    formData.append('listings[type]', type);
    
    // Append files
    imageFiles.forEach((file) => {
      formData.append('listings[images]', file);
    });
    formData.append('coverIndex', coverIndex);

    try {
      const res = await axios.post('/api/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Listing created successfully!');
        navigate('/listings');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider focus:outline-none border-none bg-transparent cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to listings</span>
      </button>

      {/* Form Card Container */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-10">
        
        {/* Title Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-brand-rose">
            <PlusCircle className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl leading-none">
              Create New Listing
            </h2>
            <p className="mt-1.5 text-xs font-semibold text-slate-400">
              Publish multiple images and generate engaging details with AI
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title and Category */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Nest Title
              </label>
              <input
                type="text"
                id="title"
                placeholder="Catchy villa, penthouse title..."
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-350"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="type" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Property Type
              </label>
              <select
                id="type"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all cursor-pointer"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
                <option value="Cabin">Cabin</option>
                <option value="Castle">Castle</option>
                <option value="Farm">Farm</option>
                <option value="Boat">Boat</option>
              </select>
            </div>
          </div>

          {/* Description with AI trigger */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center pl-1 flex-wrap gap-2">
              <label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Description
              </label>
              
              <div className="flex items-center gap-2">
                <select
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="Professional">Professional Style</option>
                  <option value="Luxury">Luxury Style</option>
                  <option value="Budget">Budget Friendly</option>
                  <option value="Family">Family Friendly</option>
                  <option value="Romantic">Romantic Stay</option>
                  <option value="Adventure">Adventure Stay</option>
                  <option value="Business">Business Stay</option>
                </select>

                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generatingAI || !title}
                  className="text-[10px] font-extrabold text-brand-rose hover:text-brand-rose/80 flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full cursor-pointer disabled:opacity-50 transition-colors border-none outline-none"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{generatingAI ? 'Writing stay details...' : 'Generate with AI'}</span>
                </button>
              </div>
            </div>
            <textarea
              id="description"
              rows="5"
              placeholder="Enter a detailed description about the stay features..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-350"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            
            {/* Word & Character Counters */}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-1 pl-1">
              <span>{description.trim() ? description.trim().split(/\s+/).length : 0} words</span>
              <span>{description.length} characters</span>
            </div>

            {/* AI Suggested Keywords */}
            {suggestedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mr-1">Suggested Keywords:</span>
                {suggestedKeywords.map((kw, i) => (
                  <span key={i} className="bg-slate-50 border border-slate-100/50 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-wider">{kw}</span>
                ))}
              </div>
            )}
          </div>

          {/* Drag & Drop uploader area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Upload Listing Images
            </label>
            
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                setImageFiles((prev) => [...prev, ...files]);
              }}
              className="border-2 border-dashed border-slate-200 hover:border-brand-rose/40 transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center gap-2 relative bg-slate-50/10"
            >
              <Upload className="h-8 w-8 text-slate-300" />
              <span className="text-xs font-bold text-slate-600">Drag & drop your stay images here</span>
              <span className="text-[10px] font-semibold text-slate-400">or click to browse from device</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="images-uploader"
              />
            </div>

            {/* Thumbnail previews listing with cover select */}
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {imageFiles.map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  const isCover = idx === coverIndex;
                  return (
                    <div key={idx} className="relative aspect-video rounded-xl bg-slate-50 border border-slate-100 overflow-hidden group shadow-sm">
                      <img src={url} className="h-full w-full object-cover" alt="" />
                      
                      {isCover ? (
                        <span className="absolute top-1.5 left-1.5 bg-brand-rose text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider leading-none shadow-sm">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCoverIndex(idx)}
                          className="absolute top-1.5 left-1.5 bg-slate-900/60 hover:bg-brand-rose text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer leading-none"
                        >
                          Set Cover
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setImageFiles((prev) => prev.filter((_, i) => i !== idx));
                          if (coverIndex === idx) setCoverIndex(0);
                        }}
                        className="absolute top-1.5 right-1.5 bg-rose-600/85 hover:bg-rose-600 text-white rounded-full p-1 border-none cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing, Location and Country */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Price / Night (₹)
              </label>
              <input
                type="number"
                id="price"
                placeholder="2000"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-350"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="location" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Location / City
              </label>
              <input
                type="text"
                id="location"
                placeholder="Goa, Maharashtra"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-350"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="country" className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Country
              </label>
              <input
                type="text"
                id="country"
                placeholder="India"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/20 transition-all placeholder:text-slate-350"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-full bg-brand-rose py-3 px-8 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-brand-rose/90 hover:shadow-md disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              {submitting ? 'Creating Nest...' : 'Create Nest'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default NewListing;
