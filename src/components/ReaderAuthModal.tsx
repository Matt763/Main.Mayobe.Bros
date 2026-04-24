import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function ReaderAuthModal({ open, onClose, onSuccess }: Props) {
  const { signUpEmail, signInEmail, signInGoogle, publicUser } = useUserAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (open && publicUser) {
      onSuccess?.();
      onClose();
    }
  }, [publicUser, open]);

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    const result = await signInGoogle();
    if (result?.error) setError(result.error);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }
    setLoading(true);
    const result = mode === 'signup'
      ? await signUpEmail(email, password, displayName.trim())
      : await signInEmail(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSuccess?.();
      onClose();
    }
  };

  const switchMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  const inputClass = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {mode === 'signin'
            ? 'Sign in to react and comment on articles'
            : 'Join to like articles and get notified about new posts'}
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 px-4 font-medium text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400">or</span>
          </div>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className={inputClass}
            />
          )}
          <input
            ref={firstInputRef}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className={inputClass}
          />
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-2.5 font-semibold text-sm transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={switchMode} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
