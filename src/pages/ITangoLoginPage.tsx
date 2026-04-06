import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ITANGO_AUTH_KEY = 'itango-session-v1';
const CEO_EMAILS = ['mclean@mayobebros.com', 'mcleanit@mayobebros.com'];

// ─── Space canvas: stars, fire comets, spider web ────────────────────────────
function SpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    // Stars
    const stars = Array.from({ length: 320 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.2,
      a: Math.random() * 0.7 + 0.3,
      da: (Math.random() * 0.015 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
    }));

    // Comets
    type Comet = { x: number; y: number; vx: number; vy: number; len: number; a: number; fire: boolean; t: number; max: number };
    const comets: Comet[] = [];
    function spawnComet() {
      const fire = Math.random() > 0.45;
      const ang = Math.PI / 7 + Math.random() * (Math.PI / 9);
      const spd = 7 + Math.random() * 11;
      comets.push({ x: Math.random() * W * 0.6, y: Math.random() * H * 0.38, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, len: 85 + Math.random() * 115, a: 1, fire, t: 0, max: 50 + Math.random() * 38 });
    }
    spawnComet();
    const ci = setInterval(spawnComet, 30000);

    // Web nodes
    const nodes = Array.from({ length: 22 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Web
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 185) {
            ctx.beginPath();
            ctx.globalAlpha = (1 - d / 185) * 0.18;
            ctx.strokeStyle = '#347c25';
            ctx.lineWidth = 0.5;
            ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Stars
      for (const s of stars) {
        s.a += s.da;
        if (s.a > 1 || s.a < 0.12) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`; ctx.fill();
      }

      // Comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.x += c.vx; c.y += c.vy; c.t++;
        const p = c.t / c.max;
        c.a = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        const tx = c.x - c.vx * (c.len / 8), ty = c.y - c.vy * (c.len / 8);

        if (c.fire) {
          const g = ctx.createLinearGradient(tx, ty, c.x, c.y);
          g.addColorStop(0, `rgba(255,50,5,0)`);
          g.addColorStop(0.4, `rgba(255,120,15,${c.a * 0.7})`);
          g.addColorStop(1, `rgba(255,248,150,${c.a})`);
          ctx.strokeStyle = g; ctx.lineWidth = 2.8;
        } else {
          const g = ctx.createLinearGradient(tx, ty, c.x, c.y);
          g.addColorStop(0, 'rgba(160,210,255,0)');
          g.addColorStop(1, `rgba(255,255,255,${c.a})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        }
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(c.x, c.y); ctx.stroke();

        // Head
        const hg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.fire ? 8 : 3.5);
        hg.addColorStop(0, c.fire ? `rgba(255,200,50,${c.a})` : `rgba(255,255,255,${c.a})`);
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.fire ? 8 : 3.5, 0, Math.PI * 2); ctx.fill();

        if (c.t >= c.max) comets.splice(i, 1);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); clearInterval(ci); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Earth globe ──────────────────────────────────────────────────────────────
function Earth() {
  const h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  const day = h >= 6 && h < 18;
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      {/* Outer atmosphere halo */}
      <div style={{ width: 540, height: 540, borderRadius: '50%', background: `radial-gradient(circle at 36% 34%, ${day ? 'rgba(90,210,100,0.055)' : 'rgba(18,50,130,0.07)'} 0%, transparent 65%)`, filter: 'blur(50px)', position: 'absolute' }} />
      {/* Globe */}
      <div style={{
        width: 420, height: 420, borderRadius: '50%',
        background: day
          ? 'radial-gradient(circle at 33% 28%, rgba(255,255,255,0.2) 0%, rgba(65,175,78,0.23) 18%, rgba(28,108,198,0.32) 42%, rgba(10,52,138,0.6) 68%, rgba(2,10,42,0.94) 100%)'
          : 'radial-gradient(circle at 28% 26%, rgba(255,255,255,0.03) 0%, rgba(13,36,78,0.28) 28%, rgba(4,16,52,0.65) 58%, rgba(1,3,16,0.95) 100%)',
        boxShadow: day ? '0 0 95px rgba(55,155,195,0.12), inset -38px -26px 68px rgba(0,12,65,0.58)' : '0 0 68px rgba(22,52,120,0.17), inset -48px -38px 88px rgba(0,0,12,0.88)',
        position: 'relative', overflow: 'hidden',
        animation: 'itangoEarthSpin 90s linear infinite',
      }}>
        {/* Landmass blobs */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(ellipse 68px 44px at 28% 42%, rgba(62,148,58,0.16) 0%, transparent 70%), radial-gradient(ellipse 98px 60px at 65% 54%, rgba(52,138,48,0.13) 0%, transparent 70%), radial-gradient(ellipse 50px 34px at 18% 69%, rgba(58,132,54,0.11) 0%, transparent 70%), radial-gradient(ellipse 74px 48px at 83% 32%, rgba(56,142,56,0.1) 0%, transparent 70%)` }} />
        {/* Sunlight specular */}
        {day && <div style={{ position: 'absolute', top: '7%', left: '17%', width: '33%', height: '23%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.22) 0%, transparent 75%)' }} />}
        {/* Night city lights */}
        {!day && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(3px 3px at 34% 43%, rgba(255,228,135,0.65) 0%, transparent 100%), radial-gradient(2px 2px at 64% 37%, rgba(255,228,135,0.55) 0%, transparent 100%), radial-gradient(4px 4px at 47% 63%, rgba(255,228,135,0.45) 0%, transparent 100%), radial-gradient(2px 2px at 22% 58%, rgba(255,228,135,0.55) 0%, transparent 100%)` }} />}
        <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: `2px solid ${day ? 'rgba(175,228,255,0.1)' : 'rgba(65,108,200,0.07)'}` }} />
      </div>
      {/* Moon */}
      {!day && <div style={{ position: 'absolute', top: 'calc(50% - 268px)', left: 'calc(50% + 225px)', width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle at 32% 32%, rgba(255,255,215,0.92) 0%, rgba(198,198,172,0.72) 60%, rgba(138,138,112,0.5) 100%)', boxShadow: '0 0 20px rgba(255,255,195,0.28)', animation: 'itangoMoon 8s ease-in-out infinite' }} />}
    </div>
  );
}

// ─── Main login ───────────────────────────────────────────────────────────────
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

      // Grant iTango session (8 hours)
      const session = { email: userEmail, exp: Date.now() + 8 * 60 * 60 * 1000, uid: data.user.id };
      sessionStorage.setItem(ITANGO_AUTH_KEY, JSON.stringify(session));
      navigate('/itango', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes itangoEarthSpin {
          from { filter: brightness(1); }
          to   { filter: brightness(1.02); }
        }
        @keyframes itangoMoon {
          0%,100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes itangoCardGlow {
          0%,100% { box-shadow: 0 0 50px rgba(52,124,37,0.14), 0 32px 70px rgba(0,0,0,0.68); }
          50%      { box-shadow: 0 0 80px rgba(52,124,37,0.26), 0 32px 70px rgba(0,0,0,0.68); }
        }
        @keyframes itangoLogoFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes itangoScan {
          from { top: -4px; }
          to   { top: 100vh; }
        }
        @keyframes itangoPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        .itango-input { box-sizing: border-box; }
        .itango-input::placeholder { color: #2d3f2e; }
        .itango-input:focus { outline: none; }
        .itango-btn:hover:not(:disabled) {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }
        .itango-btn { transition: all 0.2s; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '40px 16px', background: 'radial-gradient(ellipse at 50% 0%, #061009 0%, #000407 45%, #000000 100%)' }}>
        <SpaceCanvas />
        <Earth />

        {/* Scan line */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(52,124,37,0.09), transparent)', animation: 'itangoScan 10s linear infinite' }} />
        </div>

        {/* Login card */}
        <div style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px',
          background: 'linear-gradient(158deg, rgba(6,16,8,0.95) 0%, rgba(3,8,22,0.97) 100%)',
          border: '1px solid rgba(52,124,37,0.3)',
          borderRadius: '26px',
          backdropFilter: 'blur(30px)',
          animation: 'itangoCardGlow 5s ease-in-out infinite',
        }}>
          {/* Top bar */}
          <div style={{ height: '2px', borderRadius: '26px 26px 0 0', background: 'linear-gradient(90deg, transparent 0%, #2d6b1f 20%, #4ade80 50%, #2d6b1f 80%, transparent 100%)' }} />

          <div style={{ padding: '32px 34px 30px' }}>
            {/* Branding */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'inline-block', marginBottom: '16px', animation: 'itangoLogoFloat 3.5s ease-in-out infinite' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(52,124,37,0.2), rgba(74,222,128,0.07))', border: '1px solid rgba(52,124,37,0.35)', borderRadius: '20px', padding: '13px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <img src="/mayobebroslogo copy copy.png" alt="Mayobe Bros" style={{ height: '46px' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ width: '1px', height: '38px', background: 'rgba(52,124,37,0.3)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#4ade80', letterSpacing: '0.14em', textTransform: 'uppercase' }}>iTango</span>
                    <span style={{ fontSize: '9px', color: '#347c2580', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>AI Engine</span>
                  </div>
                </div>
              </div>

              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 5px' }}>
                iTango AI Website Editor
              </h1>
              <p style={{ fontSize: '12px', color: '#347c25', fontWeight: 600, margin: '0 0 12px' }}>
                Mayobe Bros — CEO Access Required
              </p>

              {/* Security badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(52,124,37,0.08)', border: '1px solid rgba(52,124,37,0.18)' }}>
                <Shield size={11} style={{ color: '#4ade80' }} />
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#4ade8088', textTransform: 'uppercase' }}>
                  Secure • Encrypted • Monitored
                </span>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', animation: 'itangoPulse 2s infinite' }} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: '18px', padding: '11px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#fca5a5', fontSize: '12px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: '#3d5540', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#347c25', pointerEvents: 'none' }} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="ceo@mayobebros.com"
                    className="itango-input"
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '14px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,124,37,0.2)', color: '#e2e8f0' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.55)'; e.currentTarget.style.background = 'rgba(52,124,37,0.07)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: '#3d5540', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#347c25', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required placeholder="••••••••••••"
                    className="itango-input"
                    style={{ width: '100%', paddingLeft: '38px', paddingRight: '42px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,124,37,0.2)', color: '#e2e8f0' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.55)'; e.currentTarget.style.background = 'rgba(52,124,37,0.07)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d5540', padding: 0 }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="itango-btn"
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  border: 'none', cursor: loading || !email || !password ? 'not-allowed' : 'pointer', marginTop: '4px',
                  background: loading || !email || !password ? 'rgba(52,124,37,0.22)' : 'linear-gradient(135deg, #1e5c14 0%, #347c25 50%, #16a34a 100%)',
                  color: loading || !email || !password ? 'rgba(74,222,128,0.35)' : '#fff',
                  boxShadow: loading || !email || !password ? 'none' : '0 4px 24px rgba(52,124,37,0.35)',
                }}
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Authenticating…</> : <><Lock size={13} /> Enter iTango System</>}
              </button>
            </form>

            {/* Footer */}
            <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(52,124,37,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a href="/admin/dashboard" style={{ fontSize: '10px', color: '#283830', textDecoration: 'none' }}>← Back to CMS</a>
              <span style={{ fontSize: '10px', color: '#1a2e1e' }}>CEO access only</span>
              <a href="/" style={{ fontSize: '10px', color: '#283830', textDecoration: 'none' }}>Visit Site →</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
