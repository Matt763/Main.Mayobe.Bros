import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck, KeyRound, Loader2, AlertCircle, CheckCircle2, Lock, Mail, X, Eye, EyeOff, Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Status = {
  id: string;
  email: string | null;
  name: string;
  hasPassword: boolean;
  isOAuthOnly: boolean;
  isAdminAccount: boolean;
  passwordManagementAvailable: boolean;
};

async function authedFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(path, { ...init, headers, credentials: 'include' });
}

export default function AccountPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<'idle' | 'sent' | 'verifying' | 'done'>('idle');
  const [purpose, setPurpose] = useState<'change' | 'set'>('change');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Account & Security · Mayobe Bros';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    authedFetch('/api/account/status')
      .then(r => r.json())
      .then((data: Status) => {
        if (cancelled) return;
        setStatus(data);
        setPurpose(data.hasPassword ? 'change' : 'set');
      })
      .catch(err => {
        console.error('[Account] status error', err);
        if (!cancelled) setError('Failed to load account status.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const passwordRules = useMemo(() => ({
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirm,
  }), [newPassword, confirm]);
  const passwordOk = passwordRules.length && passwordRules.match;

  const startCode = async () => {
    setError(null); setInfo(null); setBusy(true);
    try {
      const res = await authedFetch('/api/account/password/start', {
        method: 'POST',
        body: JSON.stringify({ purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send code');
      setStage('sent');
      setInfo(`Code sent to ${data.sentTo || 'your email'}. It expires in 15 minutes.`);
    } catch (e: any) {
      setError(e?.message || 'Could not send code');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError(null); setBusy(true);
    try {
      const res = await authedFetch('/api/account/password/verify', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          newPassword,
          ...(purpose === 'change' ? { currentPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Verification failed');
      setStage('done');
      setInfo('Password updated. A confirmation email has been sent.');
      setCurrentPassword(''); setNewPassword(''); setConfirm(''); setCode('');
      // Refresh status
      const ns = await authedFetch('/api/account/status').then(r => r.json());
      setStatus(ns);
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStage('idle'); setError(null); setInfo(null); setCode('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!status) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Could not load account info.</p>;
  }

  if (status.isAdminAccount) {
    return (
      <div className="max-w-2xl">
        <Header status={status} />
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5 flex items-start gap-3">
          <Info size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">Reader password management is not available for staff accounts.</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              You're signed in with a Mayobe Bros staff account. Manage your credentials through the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Header status={status} />

      {/* Profile */}
      <Section title="Profile" icon={Mail}>
        <Field label="Email">
          <input
            type="email"
            value={status.email || ''}
            readOnly
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200"
          />
        </Field>
        <Field label="Display name">
          <input
            type="text"
            value={status.name}
            readOnly
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200"
          />
        </Field>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          To update your name or email, please contact support.
        </p>
      </Section>

      {/* Password */}
      <Section
        title={status.hasPassword ? 'Change password' : 'Set a password'}
        description={status.hasPassword
          ? 'For your security, we send a one-time verification code by email before any password change.'
          : 'You signed in with a third-party provider. Set a password to also use email + password sign-in.'}
        icon={KeyRound}
      >
        {/* Step 1: form */}
        {stage === 'idle' && (
          <div className="space-y-4">
            {status.hasPassword && (
              <Field label="Current password">
                <PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showCurrent} setShow={setShowCurrent} placeholder="Your current password" autoComplete="current-password" />
              </Field>
            )}
            <Field label="New password">
              <PasswordInput value={newPassword} onChange={setNewPassword} show={showNew} setShow={setShowNew} placeholder="At least 8 characters" autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <PasswordInput value={confirm} onChange={setConfirm} show={showNew} setShow={setShowNew} placeholder="Repeat new password" autoComplete="new-password" />
            </Field>

            <ul className="grid grid-cols-2 gap-1.5 text-xs">
              <Rule ok={passwordRules.length}>At least 8 characters</Rule>
              <Rule ok={passwordRules.match}>Passwords match</Rule>
              <Rule ok={passwordRules.upper} optional>Includes uppercase</Rule>
              <Rule ok={passwordRules.digit} optional>Includes a number</Rule>
            </ul>

            <button
              type="button"
              onClick={startCode}
              disabled={!passwordOk || busy || (status.hasPassword && !currentPassword)}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold shadow-sm transition-all"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              {busy ? 'Sending…' : 'Send verification code'}
            </button>
          </div>
        )}

        {/* Step 2: enter code */}
        {(stage === 'sent' || stage === 'verifying') && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Enter the 5-character verification code we just emailed to <strong>{status.email}</strong>.
            </p>
            <CodeInput value={code} onChange={setCode} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={verify}
                disabled={code.replace(/\s/g, '').length < 5 || busy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                {busy ? 'Verifying…' : 'Verify & update password'}
              </button>
              <button type="button" onClick={startCode} disabled={busy}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                Resend code
              </button>
              <button type="button" onClick={reset}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                Cancel
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-4 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">Password updated</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                A confirmation email has been sent. If you didn't make this change, click the security link in that email immediately.
              </p>
              <button type="button" onClick={reset} className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 underline">
                Make another change
              </button>
            </div>
          </div>
        )}

        {info && stage !== 'done' && (
          <div className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            {info}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button>
          </div>
        )}
      </Section>
    </div>
  );
}

function Header({ status }: { status: Status }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 mb-1">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <Lock size={18} />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Account &amp; Security</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password and account security.</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{status.email}</p>
    </div>
  );
}

function Section({ title, description, icon: Icon, children }: { title: string; description?: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

function PasswordInput({ value, onChange, show, setShow, placeholder, autoComplete }: {
  value: string; onChange: (v: string) => void; show: boolean; setShow: (v: boolean) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-11 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Rule({ ok, optional, children }: { ok: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600 dark:text-emerald-400' : optional ? 'text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
      <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${ok ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
        {ok && <CheckCircle2 size={10} />}
      </span>
      {children}{optional && !ok && <span className="text-[10px] uppercase tracking-wider opacity-70">optional</span>}
    </li>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      maxLength={5}
      onChange={e => onChange(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5))}
      placeholder="K7M3P"
      autoComplete="one-time-code"
      className="w-full sm:w-56 bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-[0.7em] text-gray-900 dark:text-white focus:outline-none uppercase"
    />
  );
}
