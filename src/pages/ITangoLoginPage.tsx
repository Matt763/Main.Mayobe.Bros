import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ITANGO_AUTH_KEY = 'itango-session-v1';
const CEO_EMAILS = ['mclean@mayobebros.com', 'mcleanit@mayobebros.com'];

export default function ITangoLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already authenticated for iTango, skip login
  useEffect(() => {
    const session = sessionStorage.getItem(ITANGO_AUTH_KEY);
    if (session) {
      try {
        const { exp } = JSON.parse(session);
        if (Date.now() < exp) { navigate('/itango', { replace: true }); return; }
      } catch {}
    }
    sessionStorage.removeItem(ITANGO_AUTH_KEY);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

      if (authErr || !data.user) {
        setError(authErr?.message || 'Invalid credentials');
        setLoading(false); return;
      }

      // Only CEO emails can access iTango
      const userEmail = (data.user.email || '').toLowerCase();
      const isCEO = CEO_EMAILS.includes(userEmail);
      if (!isCEO) {
        await supabase.auth.signOut();
        setError('Access denied. iTango AI Editor is restricted to authorized CEO accounts only.');
        setLoading(false); return;
      }

      // Grant iTango session (8 hours) — store access_token so API calls can auth
      const session = {
        email: userEmail,
        exp: Date.now() + 8 * 60 * 60 * 1000,
        uid: data.user.id,
        token: data.session?.access_token || '',
      };
      sessionStorage.setItem(ITANGO_AUTH_KEY, JSON.stringify(session));
      navigate('/itango', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const disabled = loading || !email || !password;

  return (
    <>
      <style>{`
        @keyframes itangoOrb1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(60px, -80px) scale(1.08); }
          66%       { transform: translate(-40px, 50px) scale(0.95); }
        }
        @keyframes itangoOrb2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%       { transform: translate(-70px, 60px) scale(1.1); }
          70%       { transform: translate(50px, -40px) scale(0.93); }
        }
        @keyframes itangoOrb3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50%       { transform: translate(40px, 70px) scale(1.05); }
        }
        @keyframes itangoOrb4 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          45%       { transform: translate(-50px, -60px) scale(1.12); }
          80%       { transform: translate(30px, 40px) scale(0.96); }
        }
        @keyframes itangoScan {
          from { top: -4px; }
          to   { top: 100vh; }
        }
        @keyframes itangoCardGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(52,124,37,0.1), 0 24px 60px rgba(0,0,0,0.7); }
          50%       { box-shadow: 0 0 70px rgba(52,124,37,0.2), 0 24px 60px rgba(0,0,0,0.7); }
        }
        @keyframes itangoRingPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.06); }
        }
        @keyframes itangoPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .itango-input { box-sizing: border-box; }
        .itango-input::placeholder { color: rgba(74,222,128,0.18); font-family: 'Courier New', monospace; }
        .itango-input:focus { outline: none; }
        .itango-btn { transition: all 0.2s; }
        .itango-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(52,124,37,0.45) !important;
        }
        .itango-footer-link { transition: color 0.15s; }
        .itango-footer-link:hover { color: #4ade80 !important; }
      `}</style>

      {/* Root */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '32px 16px',
        background: '#0a0a0f',
      }}>

        {/* ── Animated gradient orbs ─────────────────────────────────────────── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {/* Orb 1 — top-left green */}
          <div style={{
            position: 'absolute',
            top: '-10%', left: '-8%',
            width: '55vw', height: '55vw',
            maxWidth: '700px', maxHeight: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52,124,37,0.18) 0%, rgba(52,124,37,0.06) 45%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'itangoOrb1 22s ease-in-out infinite',
          }} />
          {/* Orb 2 — bottom-right teal */}
          <div style={{
            position: 'absolute',
            bottom: '-15%', right: '-10%',
            width: '60vw', height: '60vw',
            maxWidth: '750px', maxHeight: '750px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 50%, transparent 70%)',
            filter: 'blur(70px)',
            animation: 'itangoOrb2 28s ease-in-out infinite',
          }} />
          {/* Orb 3 — center-right dark emerald */}
          <div style={{
            position: 'absolute',
            top: '30%', right: '5%',
            width: '35vw', height: '35vw',
            maxWidth: '450px', maxHeight: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 65%)',
            filter: 'blur(50px)',
            animation: 'itangoOrb3 18s ease-in-out infinite',
          }} />
          {/* Orb 4 — top-right subtle */}
          <div style={{
            position: 'absolute',
            top: '5%', right: '20%',
            width: '28vw', height: '28vw',
            maxWidth: '380px', maxHeight: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52,124,37,0.09) 0%, transparent 70%)',
            filter: 'blur(55px)',
            animation: 'itangoOrb4 32s ease-in-out infinite',
          }} />
        </div>

        {/* ── Dot-grid overlay ───────────────────────────────────────────────── */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: 'radial-gradient(rgba(52,124,37,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }} />

        {/* ── Scan line ──────────────────────────────────────────────────────── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(74,222,128,0.07) 30%, rgba(74,222,128,0.14) 50%, rgba(74,222,128,0.07) 70%, transparent 100%)',
            animation: 'itangoScan 12s linear infinite',
          }} />
        </div>

        {/* ── Login card ─────────────────────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '400px',
          background: 'linear-gradient(160deg, rgba(10,14,10,0.96) 0%, rgba(6,8,18,0.98) 100%)',
          border: '1px solid rgba(52,124,37,0.28)',
          borderRadius: '24px',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          animation: 'itangoCardGlow 6s ease-in-out infinite',
        }}>
          {/* Top accent line */}
          <div style={{
            height: '2px',
            borderRadius: '24px 24px 0 0',
            background: 'linear-gradient(90deg, transparent 0%, rgba(52,124,37,0.5) 20%, #4ade80 50%, rgba(52,124,37,0.5) 80%, transparent 100%)',
          }} />

          <div style={{ padding: '32px 28px 28px' }}>

            {/* ── Logo area ──────────────────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              {/* Pulsing ring behind logo */}
              <div style={{ display: 'inline-block', position: 'relative', marginBottom: '18px' }}>
                <div style={{
                  position: 'absolute', inset: '-10px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)',
                  animation: 'itangoRingPulse 3s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: '-4px',
                  borderRadius: '22px',
                  border: '1px solid rgba(74,222,128,0.18)',
                  animation: 'itangoRingPulse 3s ease-in-out infinite',
                }} />
                {/* Logo box */}
                <div style={{
                  position: 'relative',
                  background: 'rgba(52,124,37,0.1)',
                  border: '1px solid rgba(52,124,37,0.3)',
                  borderRadius: '18px',
                  padding: '14px 20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <img
                    src="/mayobebroslogo copy copy.png"
                    alt="Mayobe Bros"
                    style={{ height: '40px' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '13px', fontWeight: 900, color: '#4ade80',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      fontFamily: "'Courier New', monospace",
                    }}>iTango</span>
                    <span style={{
                      fontSize: '9px', color: 'rgba(52,124,37,0.7)',
                      letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                      fontFamily: "'Courier New', monospace",
                    }}>AI Engine</span>
                  </div>
                </div>
              </div>

              <h1 style={{
                fontSize: '22px', fontWeight: 800, color: '#f1f5f9',
                letterSpacing: '-0.03em', margin: '0 0 6px',
                lineHeight: 1.2,
              }}>
                iTango AI Editor
              </h1>
              <p style={{
                fontSize: '12px', color: 'rgba(52,124,37,0.8)', fontWeight: 600,
                margin: '0 0 14px',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.04em',
              }}>
                Mayobe Bros — CEO Access Required
              </p>

              {/* Security badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '5px 13px', borderRadius: '20px',
                background: 'rgba(52,124,37,0.06)',
                border: '1px solid rgba(52,124,37,0.16)',
              }}>
                <Shield size={10} style={{ color: '#4ade80' }} />
                <span style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em',
                  color: 'rgba(74,222,128,0.55)', textTransform: 'uppercase',
                  fontFamily: "'Courier New', monospace",
                }}>
                  Secure · Encrypted · Monitored
                </span>
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 6px rgba(74,222,128,0.8)',
                  animation: 'itangoPulse 2s infinite',
                }} />
              </div>
            </div>

            {/* ── Error ──────────────────────────────────────────────────────── */}
            {error && (
              <div style={{
                marginBottom: '18px', padding: '11px 14px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                color: '#fca5a5', fontSize: '12px', lineHeight: '1.5',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px', color: '#f87171' }} />
                {error}
              </div>
            )}

            {/* ── Form ───────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '0.14em', color: 'rgba(52,124,37,0.7)',
                  textTransform: 'uppercase', marginBottom: '8px',
                  fontFamily: "'Courier New', monospace",
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'rgba(52,124,37,0.6)',
                    pointerEvents: 'none',
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="ceo@mayobebros.com"
                    className="itango-input"
                    style={{
                      width: '100%',
                      paddingLeft: '40px', paddingRight: '14px',
                      paddingTop: '13px', paddingBottom: '13px',
                      borderRadius: '12px', fontSize: '13px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(52,124,37,0.18)',
                      color: '#e2e8f0',
                      fontFamily: "'Courier New', monospace",
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)';
                      e.currentTarget.style.background = 'rgba(52,124,37,0.06)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.06)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(52,124,37,0.18)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block', fontSize: '9px', fontWeight: 700,
                  letterSpacing: '0.14em', color: 'rgba(52,124,37,0.7)',
                  textTransform: 'uppercase', marginBottom: '8px',
                  fontFamily: "'Courier New', monospace",
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'rgba(52,124,37,0.6)',
                    pointerEvents: 'none',
                  }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="itango-input"
                    style={{
                      width: '100%',
                      paddingLeft: '40px', paddingRight: '44px',
                      paddingTop: '13px', paddingBottom: '13px',
                      borderRadius: '12px', fontSize: '13px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(52,124,37,0.18)',
                      color: '#e2e8f0',
                      fontFamily: "'Courier New', monospace",
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)';
                      e.currentTarget.style.background = 'rgba(52,124,37,0.06)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.06)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(52,124,37,0.18)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '13px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: 'rgba(52,124,37,0.5)',
                      padding: 0, transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4ade80'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(52,124,37,0.5)'; }}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={disabled}
                className="itango-btn"
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                  border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  background: disabled
                    ? 'rgba(52,124,37,0.15)'
                    : 'linear-gradient(135deg, #1a5210 0%, #2d7a1f 40%, #22c55e 100%)',
                  color: disabled ? 'rgba(74,222,128,0.3)' : '#fff',
                  boxShadow: disabled ? 'none' : '0 4px 20px rgba(52,124,37,0.3)',
                  fontFamily: "'Courier New', monospace",
                  textTransform: 'uppercase' as const,
                }}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Authenticating…</>
                  : <><Lock size={13} /> Enter iTango System</>
                }
              </button>
            </form>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <div style={{
              marginTop: '22px', paddingTop: '16px',
              borderTop: '1px solid rgba(52,124,37,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <a
                href="/admin/dashboard"
                className="itango-footer-link"
                style={{
                  fontSize: '10px', color: 'rgba(52,124,37,0.45)',
                  textDecoration: 'none',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                Back to CMS
              </a>
              <span style={{
                fontSize: '10px', color: 'rgba(52,124,37,0.25)',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.08em',
              }}>
                CEO access only
              </span>
              <a
                href="/"
                className="itango-footer-link"
                style={{
                  fontSize: '10px', color: 'rgba(52,124,37,0.45)',
                  textDecoration: 'none',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                Visit Site
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
