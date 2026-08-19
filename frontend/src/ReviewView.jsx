import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, ThumbsUp, Bug, Sparkles, Lightbulb, Plus, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const TYPE_TAGS = [
  { id: 'ALL', label: 'All Reviews' },
  { id: 'FAULT', label: '🐛 Website Faults & Bugs' },
  { id: 'POSITIVE', label: '⭐ Good Feedback & Praise' },
  { id: 'SUGGESTION', label: '💡 Feature Suggestions' }
];

function ReviewView({ user, token, onOpenAuth, showToast }) {
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, faultCount: 0, positiveCount: 0, suggestionCount: 0, avgRating: 4.8 });
  const [loading, setLoading] = useState(false);

  // Submit Modal State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [subType, setSubType] = useState('POSITIVE');
  const [subRating, setSubRating] = useState(5);
  const [subTitle, setSubTitle] = useState('');
  const [subComment, setSubComment] = useState('');
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [selectedType]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (searchQuery) params.append('query', searchQuery);

      const res = await axios.get(`http://localhost:3000/api/reviews?${params.toString()}`);
      setReviews(res.data.reviews || []);
      if (res.data.stats) setStats(res.data.stats);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (reviewId) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/reviews/${reviewId}/upvote`);
      if (res.data) {
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, upvotes: res.data.upvotes } : r));
        showToast('Upvoted feedback! 👍');
      }
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      setIsSubmitOpen(false);
      onOpenAuth();
      return;
    }

    if (!subTitle.trim() || !subComment.trim()) {
      showToast('Please provide a title and detailed comment.');
      return;
    }

    setSubLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        'http://localhost:3000/api/reviews',
        {
          type: subType,
          rating: subRating,
          title: subTitle,
          comment: subComment
        },
        { headers }
      );

      if (res.data) {
        showToast('Feedback submitted! Thank you for helping us improve ❤️');
        setIsSubmitOpen(false);
        setSubTitle('');
        setSubComment('');
        fetchReviews();
      }
    } catch (err) {
      console.error("Submit feedback error:", err);
      showToast(err.response?.data?.error || 'Failed to submit feedback.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#100507] to-red-950/60 p-6 md:p-10 border border-red-900/30">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-extrabold uppercase border border-red-600/30 mb-3">
            <MessageSquare size={14} /> Community Reviews & Website Feedback
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
            Share Your Experience & Report Website Issues
          </h1>
          <p className="text-slate-400 text-sm">
            Help us improve our distributed scraper platform by giving positive feedback, reporting website faults/bugs, or suggesting new features.
          </p>
        </div>
      </div>

      {/* Stats Summary & Submit Button Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Rating Score Card */}
        <div className="bg-[#08080c] border border-slate-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Community Rating</div>
            <div className="text-2xl font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>{stats.avgRating}</span>
              <div className="flex text-red-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-red-500 text-red-500" />
                ))}
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-bold">{stats.totalCount} Reviews</span>
        </div>

        {/* Good Feedback Stats */}
        <div className="bg-[#08080c] border border-slate-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Good Feedback</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{stats.positiveCount}</div>
          </div>
          <Sparkles size={24} className="text-emerald-500 opacity-60" />
        </div>

        {/* Website Faults Reported Stats */}
        <div className="bg-[#08080c] border border-slate-900 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faults Reported</div>
            <div className="text-2xl font-black text-red-500 mt-0.5">{stats.faultCount}</div>
          </div>
          <Bug size={24} className="text-red-500 opacity-60" />
        </div>

        {/* Submit Review CTA */}
        <button
          onClick={() => {
            if (!user) {
              onOpenAuth();
              return;
            }
            setIsSubmitOpen(true);
          }}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl p-5 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all"
        >
          <Plus size={20} />
          Submit Feedback / Report
        </button>

      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-900">
        {TYPE_TAGS.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedType(t.id)}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
              selectedType === t.id
                ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev._id}
            className="bg-[#08080c] border border-slate-900 rounded-3xl p-6 hover:border-red-900/60 transition-all space-y-4"
          >
            {/* Header: User Avatar, Type Pill, Upvote Button */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-700 to-black border border-red-500/40 flex items-center justify-center font-black text-white text-sm shrink-0">
                  {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>{rev.userName}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </h4>

                  {/* Type Badge */}
                  <div className="mt-1 inline-flex">
                    {rev.type === 'FAULT' && (
                      <span className="text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 px-2.5 py-0.5 rounded-md border border-red-600/30 flex items-center gap-1">
                        <Bug size={12} /> Website Fault Report
                      </span>
                    )}
                    {rev.type === 'POSITIVE' && (
                      <span className="text-[10px] font-extrabold uppercase bg-emerald-600/20 text-emerald-400 px-2.5 py-0.5 rounded-md border border-emerald-600/30 flex items-center gap-1">
                        <Sparkles size={12} /> Good Feedback
                      </span>
                    )}
                    {rev.type === 'SUGGESTION' && (
                      <span className="text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                        <Lightbulb size={12} /> Feature Suggestion
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating & Upvote Button */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex text-red-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-red-500 text-red-500" />
                  ))}
                </div>

                <button
                  onClick={() => handleUpvote(rev._id)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ThumbsUp size={14} className="text-red-500" />
                  <span>Helpful ({rev.upvotes})</span>
                </button>
              </div>
            </div>

            {/* Title & Body */}
            <div>
              <h3 className="font-extrabold text-base text-white mb-1.5">{rev.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{rev.comment}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-900 rounded-3xl bg-slate-950/40">
          <MessageSquare size={48} className="text-slate-800 mb-3" />
          <h3 className="text-base font-bold text-slate-400 mb-1">No Reviews Found</h3>
          <p className="text-xs text-slate-600 max-w-sm text-center">
            Be the first to submit feedback or report a website issue using the button above!
          </p>
        </div>
      )}

      {/* Submit Feedback Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
            
            <button
              onClick={() => setIsSubmitOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 px-2.5 py-1 rounded-md border border-red-600/30">
                Community Feedback
              </span>
              <h3 className="text-xl font-black text-white mt-2">Submit Website Feedback / Fault</h3>
              <p className="text-xs text-slate-400">Tell us what you love or what issue you encountered on our platform.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              
              {/* Type Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Feedback Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubType('POSITIVE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      subType === 'POSITIVE'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⭐ Good Feedback
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubType('FAULT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      subType === 'FAULT'
                        ? 'bg-red-600/20 border-red-500 text-red-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    🐛 Website Fault
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubType('SUGGESTION')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      subType === 'SUGGESTION'
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    💡 Suggestion
                  </button>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Star Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSubRating(star)}
                      className="p-1 text-red-500 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={24}
                        className={star <= subRating ? "fill-red-500 text-red-500" : "text-slate-700"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Subject / Summary Title
                </label>
                <input
                  type="text"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="e.g. Saved ₹3,000 on laptop OR Scraping issue on Flipkart..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Detailed Feedback / Fault Report
                </label>
                <textarea
                  rows={4}
                  value={subComment}
                  onChange={(e) => setSubComment(e.target.value)}
                  placeholder="Describe your feedback, what feature you loved, or exact steps to reproduce any website fault..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={subLoading}
                className="w-full mt-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-2"
              >
                {subLoading ? <Loader2 size={18} className="animate-spin" /> : 'Publish Feedback'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default ReviewView;
