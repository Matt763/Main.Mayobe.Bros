import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';

type Mode = 'signin' | 'signup' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  redirectMessage?: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin', redirectMessage }: AuthModalProps) {
  const { signInEmail, signUpEmail, signInGoogle } = useUserAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [secretCode, setSecretCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'code' | 'password' | 'done'>('code');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setName('');
      setEmail('');
      setPassword('');
      setError('');
      setSuccess('');
      setShowPassword(false);
      setSecretCode('');
      setNewPassword('');
      setResetStep('code');
      setVerifiedEmail('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        const { error: err } = await signUpEmail(email, password, name.trim());
        if (err) { setError(err); } else {
          setSuccess('Account created! Please check your email to confirm, then sign in.');
          setMode('signin');
          setPassword('');
        }
      } else {
        const { error: err } = await signInEmail(email, password);
        if (err) {
          setError(err.includes('Invalid') ? 'Incorrect email or password.' : err);
        } else {
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: err } = await signInGoogle();
    if (err) { setError(err); setGoogleLoading(false); }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/secret-codes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode: secretCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid secret code');
      } else {
        setVerifiedEmail(data.email);
        setResetStep('password');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/secret-codes/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode: secretCode.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setResetStep('done');
      }
    } catch {
      setError('Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 pt-8 pb-12">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
              <X size={16} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-1">Reset Password</h2>
            <p className="text-blue-100 text-sm">Use your Mayobe Bros Secret Code</p>
          </div>

          <div className="-mt-6 mx-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {resetStep === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <KeyRound size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter the secret code from your account to verify your identity.</p>
                </div>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. MB-A9X4P8T2 or S-A7XK2"
                    value={secretCode}
                    onChange={e => { setSecretCode(e.target.value); setError(''); }}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono tracking-wider"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify Code'}
                </button>
              </form>
            )}

            {resetStep === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified as <strong className="text-gray-900 dark:text-white">{verifiedEmail}</strong></p>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            )}

            {resetStep === 'done' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Password Reset</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your password has been changed. You can now sign in with your new password.</p>
                <button onClick={() => { setMode('signin'); setResetStep('code'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                  Go to Sign In
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-4 text-center">
            <button
              onClick={() => { setMode('signin'); setError(''); setResetStep('code'); }}
              className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 mx-auto"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 pt-8 pb-12">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={16} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-blue-100 text-sm">
            {redirectMessage || (mode === 'signin'
              ? 'Sign in to access full articles'
              : 'Join to unlock all content')}
          </p>
        </div>

        <div className="-mt-6 mx-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-200 text-sm disabled:opacity-60 mb-4"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 mb-4">
              <AlertCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Create password (min 6 chars)' : 'Password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="px-6 py-4 text-center">
          {mode === 'signin' ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
