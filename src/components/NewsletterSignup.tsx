import { useState } from 'react';
import { api } from '../lib/api';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  variant?: 'inline' | 'banner' | 'sidebar';
  title?: string;
  subtitle?: string;
}

export default function NewsletterSignup({
  variant = 'inline',
  title,
  subtitle,
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      await api.newsletter.subscribe(email.trim(), 'article');
      setStatus('success');
      setEmail('');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('duplicate') || msg.includes('already')) {
        setStatus('success');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
        setStatus('error');
      }
    }
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gray-900 dark:bg-gray-950 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-5">
            <Mail size={22} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {title || 'Never miss a story'}
          </h2>
          <p className="text-gray-400 mb-7 text-sm sm:text-base">
            {subtitle || 'Get the best articles delivered straight to your inbox. No spam, ever.'}
          </p>
          {status === 'success' ? (
            <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-base">
              <CheckCircle size={20} />
              You're subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {status === 'loading' ? 'Subscribing...' : <>Subscribe <ArrowRight size={15} /></>}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-sm mt-3 flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> {errorMsg}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={18} />
          <span className="font-bold text-sm uppercase tracking-wide">Newsletter</span>
        </div>
        <h3 className="text-lg font-bold mb-1.5">{title || 'Stay in the loop'}</h3>
        <p className="text-blue-100 text-sm mb-4 leading-relaxed">
          {subtitle || 'Get fresh articles delivered to your inbox weekly.'}
        </p>
        {status === 'success' ? (
          <div className="flex items-center gap-2 text-blue-100 text-sm font-semibold">
            <CheckCircle size={16} /> Subscribed!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all disabled:opacity-60 text-sm"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-red-200 text-xs mt-2">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
          <Mail size={26} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {title || 'Enjoyed this article?'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            {subtitle || 'Subscribe to get the latest stories delivered to your inbox.'}
          </p>
        </div>
      </div>
      {status === 'success' ? (
        <div className="mt-5 flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
          <CheckCircle size={18} /> You're subscribed — thanks!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <input
            type="email"
            required
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing...' : <>Subscribe <ArrowRight size={14} /></>}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-red-500 dark:text-red-400 text-sm mt-2 flex items-center gap-1.5">
          <AlertCircle size={14} /> {errorMsg}
        </p>
      )}
    </div>
  );
}
