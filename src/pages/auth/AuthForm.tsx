import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useUserAuth } from '../../contexts/UserAuthContext';

interface Props {
  mode: 'signin' | 'signup';
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthForm({ mode }: Props) {
  const { signUpEmail, signInEmail, signInGoogle, publicUser } = useUserAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const nextPath = params.get('next') || '/';

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (publicUser) navigate(nextPath, { replace: true });
  }, [publicUser, nextPath, navigate]);

  const handleGoogle = async () => {
    setError('');
    const result = await signInGoogle();
    if (result?.error) setError(result.error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }
    setLoading(true);
    const result =
      mode === 'signup'
        ? await signUpEmail(email, password, displayName.trim())
        : await signInEmail(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(nextPath, { replace: true });
    }
  };

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

  const altMode = mode === 'signin' ? 'signup' : 'signin';
  const altPath = `/${altMode}${params.get('next') ? `?next=${encodeURIComponent(nextPath)}` : ''}`;

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to home
      </Link>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2">
        {mode === 'signin' ? 'Sign in' : 'Create your account'}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {mode === 'signin'
          ? 'Enter your details to continue reading.'
          : "It only takes a minute. We'll never share your email."}
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 font-semibold text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-5"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-950 px-3 text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold">
            or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <input
            ref={firstFieldRef}
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            autoComplete="name"
            className={inputClass}
          />
        )}
        <input
          ref={mode === 'signin' ? firstFieldRef : undefined}
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
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className={inputClass}
        />

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold text-sm transition-all shadow-sm hover:shadow-md"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading
            ? 'Please wait…'
            : mode === 'signin'
            ? 'Sign in'
            : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <Link
          to={altPath}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </Link>
      </p>

      {mode === 'signup' && (
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link to="/terms-of-service" className="underline hover:text-gray-600 dark:hover:text-gray-300">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy-policy" className="underline hover:text-gray-600 dark:hover:text-gray-300">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}
