import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Loader2, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from './AuthLayout';

type Stage = 'email' | 'code' | 'done';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Forgot Password · Mayobe Bros';
    return () => { document.title = prev; };
  }, []);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null); setInfo(null); setBusy(true);
    try {
      await fetch('/api/account/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStage('code');
      setInfo('If an account exists for that email, a code has been sent. Check your inbox (and spam).');
    } catch {
      setStage('code');
      setInfo('If an account exists for that email, a code has been sent. Check your inbox (and spam).');
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null); setBusy(true);
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); setBusy(false); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); setBusy(false); return; }
    try {
      const res = await fetch('/api/account/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim().toUpperCase(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Reset failed');
      setStage('done');
    } catch (err: any) {
      setError(err?.message || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout mode="signin">
      <div className="w-full max-w-md mx-auto px-5 sm:px-8 md:px-10 lg:px-12 py-10 md:py-14">
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
            {stage === 'done' ? 'Password reset' : 'Reset your password'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stage === 'email' && "Enter the email on your account. We'll send you a 5-character verification code."}
            {stage === 'code'  && "Enter the code we sent and choose a new password."}
            {stage === 'done'  && "Your password has been updated. Sign in to continue."}
          </p>
        </div>

        {/* Stage: email */}
        {stage === 'email' && (
          <form onSubmit={sendCode} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={busy || !email}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {busy ? 'Sending…' : 'Send verification code'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Remember your password? <Link to="/signin" className="text-blue-600 dark:text-blue-400 font-semibold">Sign in</Link>
            </p>
          </form>
        )}

        {/* Stage: code + new password */}
        {stage === 'code' && (
          <form onSubmit={reset} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Verification code</span>
              <input
                type="text"
                required
                value={code}
                maxLength={5}
                onChange={e => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5))}
                placeholder="K7M3P"
                autoComplete="one-time-code"
                className="w-full bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-[0.7em] text-gray-900 dark:text-white focus:outline-none uppercase"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">New password</span>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? 'Hide' : 'Show'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Confirm new password</span>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <button
              type="submit"
              disabled={busy || code.length < 5 || !newPassword}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {busy ? 'Resetting…' : 'Verify & set new password'}
            </button>
            <button type="button" onClick={() => sendCode()} disabled={busy} className="w-full text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Resend code
            </button>
          </form>
        )}

        {/* Stage: done */}
        {stage === 'done' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-4 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Password updated</p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                  You can now sign in with your new password. A confirmation email has been sent.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/signin')}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm">
              Continue to sign in <ArrowRight size={14} />
            </button>
          </div>
        )}

        {info && stage !== 'done' && (
          <div className="mt-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            {info}
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
