import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit2, Check, X, Star } from 'lucide-react';
import RatingInput from './RatingInput';
import axios from 'axios';
import { toast } from 'react-toastify';

export const ReviewCard = ({ review, listingId, onDelete, onUpdate }) => {
  const { currUser } = useAuth();
  const isAuthor = currUser && currUser._id === review.author?._id;

  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [submitting, setSubmitting] = useState(false);

  const initials = review.author?.username 
    ? review.author.username.slice(0, 2).toUpperCase() 
    : 'U';

  const reviewDate = review.createdAt 
    ? new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) 
    : 'Recent';

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Comment cannot be empty!');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/listings/${listingId}/reviews/${review._id}`, {
        review: { rating, comment }
      });
      if (res.data.success) {
        toast.success('Review updated!');
        onUpdate(res.data.review);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative col-span-1 flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)] animate-in fade-in duration-300">
      
      {/* Review Author header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 font-extrabold text-xs text-slate-500 select-none">
          {initials}
        </div>
        <div>
          <h5 className="text-sm font-extrabold text-slate-900 m-0">
            @{review.author?.username || 'Anonymous'}
          </h5>
          <span className="text-[10px] font-bold text-slate-400">
            Reviewed in {reviewDate}
          </span>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="flex flex-col gap-3.5 mt-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Rating</span>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Comment</label>
            <textarea
              rows="2"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 focus:border-brand-rose focus:outline-none transition-all"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setRating(review.rating);
                setComment(review.comment);
              }}
              className="rounded-full bg-slate-50 hover:bg-slate-100/50 p-2 text-slate-500 transition-colors border border-slate-100 flex items-center justify-center cursor-pointer"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-900 hover:bg-slate-800 p-2 text-white transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
              title="Save Changes"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Stars rating visual */}
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'
                }`}
              />
            ))}
          </div>

          {/* Review content */}
          <p className="text-xs font-semibold leading-relaxed text-slate-500 mt-0.5 whitespace-pre-line">
            {review.comment}
          </p>

          {/* Actions panel */}
          {isAuthor && (
            <div className="absolute top-4 right-4 flex gap-1 animate-in fade-in duration-300">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 focus:outline-none cursor-pointer"
                title="Edit Review"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(review._id)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-50/50 hover:text-rose-600 focus:outline-none cursor-pointer"
                title="Delete Review"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};
export default ReviewCard;
Length: 3500
