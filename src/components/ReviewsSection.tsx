import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified?: boolean;
  created_at: string;
}

function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ReviewsSection() {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [displayedReviews, setDisplayedReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ user_name: '', rating: 5, comment: '' });
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const tokenRef = useRef(generateToken());
  const lastSubmitRef = useRef<number>(0);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuth =
    location.pathname === '/signin' || location.pathname === '/signup';
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isJobs = location.pathname === '/jobs' || location.pathname.startsWith('/jobs/');
  const isUpgrade = location.pathname === '/upgrade' || location.pathname.startsWith('/upgrade/');
  const hidden = isAdmin || isAuth || isDashboard || isJobs || isUpgrade;

  useEffect(() => {
    if (!hidden) loadReviews();
  }, [hidden]);

  useEffect(() => {
    if (allReviews.length > 0) {
      shuffleReviews();
      const interval = setInterval(shuffleReviews, 8000);
      return () => clearInterval(interval);
    }
  }, [allReviews]);

  const loadReviews = async () => {
    const data = await api.reviews.list({ status: 'approved', limit: 20 });
    const normalized = (data || []).map((r: any) => ({
      id: r.id,
      user_name: r.author || r.user_name || '',
      rating: r.rating || 5,
      comment: r.content || r.comment || '',
      is_verified: r.is_verified || r.isVerified || false,
      created_at: r.createdAt || r.created_at || '',
    }));
    setAllReviews(normalized);
  };

  const shuffleReviews = () => {
    const shuffled = [...allReviews].sort(() => Math.random() - 0.5);
    setDisplayedReviews(shuffled.slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (honeypot) return;

    const now = Date.now();
    const cooldown = 60_000;
    if (now - lastSubmitRef.current < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastSubmitRef.current)) / 1000);
      setErrorMsg(`Please wait ${wait} seconds before submitting again.`);
      return;
    }

    if (!formData.user_name.trim() || !formData.comment.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (formData.comment.trim().length < 10) {
      setErrorMsg('Review is too short. Please write at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.reviews.create({
        author: formData.user_name.trim(),
        content: formData.comment.trim(),
        rating: formData.rating,
        status: 'pending',
        idempotencyToken: tokenRef.current,
      });

      lastSubmitRef.current = Date.now();
      tokenRef.current = generateToken();

      setIsSubmitted(true);
      setFormData({ user_name: '', rating: 5, comment: '' });
      setTimeout(() => {
        setIsSubmitted(false);
        setShowForm(false);
      }, 5000);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('wait') || msg.includes('429')) {
        setErrorMsg('Please wait a moment before submitting again.');
      } else if (msg.includes('Duplicate') || msg.includes('409')) {
        setErrorMsg('Duplicate submission detected.');
      } else {
        setErrorMsg('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));

  if (hidden) return null;

  return (
    <section className="bg-white dark:bg-gray-900 py-16 transition-colors">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">What Our Readers Say</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors">
            Join thousands of satisfied readers who trust Mayobe Bros for quality content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg dark:hover:shadow-2xl transition-all transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {review.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white transition-colors">{review.user_name}</h4>
                    {review.is_verified && (
                      <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex gap-1 mt-1">{renderStars(review.rating)}</div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed transition-colors">{review.comment}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 transition-colors">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors font-semibold"
            >
              Write a Review
            </button>
          ) : (
            <div className="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-8 transition-colors">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle size={64} className="text-green-500 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Asante sana!</h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors font-medium">Tunashukuru kwa review yako.</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm transition-colors">
                    Review yako imewasilishwa kwa ajili ya ukaguzi. Baada ya kuidhinishwa na timu yetu, itaonekana hapa kwenye sehemu ya "What Our Readers Say".
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 transition-colors">Share Your Experience</h3>

                  {errorMsg && (
                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                      <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />

                    <div>
                      <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="user_name"
                        required
                        maxLength={100}
                        value={formData.user_name}
                        onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className="focus:outline-none"
                          >
                            <Star
                              size={32}
                              className={star <= formData.rating ? 'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                        Your Review
                      </label>
                      <textarea
                        id="comment"
                        required
                        rows={4}
                        maxLength={2000}
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none transition-colors"
                        placeholder="Share your thoughts about Mayobe Bros..."
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{formData.comment.length}/2000</p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); setErrorMsg(''); }}
                        className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
