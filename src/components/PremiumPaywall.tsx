import { useState } from 'react';
import { Lock, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';

interface PremiumPaywallProps {
  postId: string;
  postTitle: string;
  onUnlock: () => void;
}

export default function PremiumPaywall({ postId, postTitle, onUnlock }: PremiumPaywallProps) {
  const { publicUser } = useUserAuth();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'skrill' | 'mobile'>('stripe');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    if (!publicUser) {
      setError('Please sign in to unlock this article.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/premium/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: publicUser.id,
          postId,
          paymentMethod,
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => onUnlock(), 1500);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Unlocked</h3>
        <p className="text-gray-500 dark:text-gray-400">Loading the full article...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-black/80 dark:to-black pointer-events-none" style={{ top: '-200px', height: '200px' }} />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 max-w-lg mx-auto text-center shadow-xl">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-amber-600 dark:text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          PREMIUM
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Featured Content</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Unlock "{postTitle}" for just $0.99. Get instant access to this exclusive article.
        </p>

        <div className="flex gap-2 justify-center mb-6">
          {(['stripe', 'skrill', 'mobile'] as const).map(method => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                paymentMethod === method
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              {method === 'stripe' && 'Stripe'}
              {method === 'skrill' && 'Skrill'}
              {method === 'mobile' && 'Mobile Money'}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handlePurchase}
          disabled={processing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
        >
          {processing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CreditCard size={18} />
              Pay $0.99 to Unlock
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          Secure payment processed by {paymentMethod === 'stripe' ? 'Stripe' : paymentMethod === 'skrill' ? 'Skrill' : 'Mobile Money'}
        </p>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recommended Free Articles</p>
          <a href="/popular" className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-1 hover:underline">
            Browse free articles <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
