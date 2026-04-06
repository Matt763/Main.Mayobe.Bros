import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Space canvas: stars, comets, spider webs ─────────────────────────────────
function SpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Stars
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      spd: Math.random() * 0.018 + 0.004,
      dir: Math.random() > 0.5 ? 1 : -1,
    }));

    // Comets
    type Comet = { x: number; y: number; vx: number; vy: number; len: number; alpha: number; fire: boolean; life: number; maxLife: number };
    const comets: Comet[] = [];

    function spawnComet() {
      const fire = Math.random() > 0.5;
      const angle = Math.PI / 7 + Math.random() * (Math.PI / 9);
      const speed = 7 + Math.random() * 10;
      comets.push({
        x: Math.random() * W * 0.65,
        y: Math.random() * H * 0.35,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 90 + Math.random() * 110,
        alpha: 1, fire,
        life: 0, maxLife: 50 + Math.random() * 35,
      });
    }

    spawnComet();
    const cometInterval = setInterval(spawnComet, 30000);

    // Spider web nodes
    const webNodes = Array.from({ length: 20 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Spider web lines
      for (let i = 0; i < webNodes.length; i++) {
        const n = webNodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        for (let j = i + 1; j < webNodes.length; j++) {
          const m = webNodes[j];
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 190) {
            ctx.beginPath();
            ctx.globalAlpha = (1 - d / 190) * 0.22;
            ctx.strokeStyle = '#347c25';
            ctx.lineWidth = 0.5;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Stars
      for (const s of stars) {
        s.alpha += s.spd * s.dir;
        if (s.alpha > 1 || s.alpha < 0.12) s.dir *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.fill();
      }

      // Comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.x += c.vx; c.y += c.vy; c.life++;
        const p = c.life / c.maxLife;
        c.alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;

        const tx = c.x - c.vx * (c.len / 8);
        const ty = c.y - c.vy * (c.len / 8);

        if (c.fire) {
          const g = ctx.createLinearGradient(tx, ty, c.x, c.y);
          g.addColorStop(0, `rgba(255,60,10,0)`);
          g.addColorStop(0.5, `rgba(255,130,20,${c.alpha * 0.7})`);
          g.addColorStop(1, `rgba(255,250,160,${c.alpha})`);
          ctx.strokeStyle = g; ctx.lineWidth = 2.5;
        } else {
          const g = ctx.createLinearGradient(tx, ty, c.x, c.y);
          g.addColorStop(0, 'rgba(180,220,255,0)');
          g.addColorStop(1, `rgba(255,255,255,${c.alpha})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        }
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(c.x, c.y); ctx.stroke();

        // Head glow
        const hg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.fire ? 7 : 3);
        hg.addColorStop(0, c.fire ? `rgba(255,190,60,${c.alpha})` : `rgba(255,255,255,${c.alpha})`);
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.fire ? 7 : 3, 0, Math.PI * 2); ctx.fill();

        if (c.life >= c.maxLife) comets.splice(i, 1);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(cometInterval);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── 3D Earth globe (CSS-based) ───────────────────────────────────────────────
function EarthGlobe() {
  const utcH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  const isDay = utcH >= 6 && utcH < 18;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      {/* Outer atmosphere glow */}
      <div style={{
        width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle at 38% 35%, ${isDay ? 'rgba(80,200,100,0.06)' : 'rgba(20,50,120,0.07)'} 0%, transparent 65%)`,
        filter: 'blur(45px)', position: 'absolute',
      }} />
      {/* Globe */}
      <div style={{
        width: 400, height: 400, borderRadius: '50%',
        background: isDay
          ? 'radial-gradient(circle at 33% 28%, rgba(255,255,255,0.2) 0%, rgba(70,180,80,0.22) 18%, rgba(30,110,200,0.32) 42%, rgba(10,55,140,0.58) 68%, rgba(2,12,45,0.93) 100%)'
          : 'radial-gradient(circle at 28% 26%, rgba(255,255,255,0.03) 0%, rgba(14,38,80,0.28) 28%, rgba(5,18,55,0.65) 58%, rgba(1,4,18,0.94) 100%)',
        boxShadow: isDay
          ? '0 0 90px rgba(60,160,200,0.13), inset -35px -25px 65px rgba(0,15,70,0.55)'
          : '0 0 65px rgba(25,55,120,0.18), inset -45px -35px 85px rgba(0,0,15,0.85)',
        position: 'relative', overflow: 'hidden',
        animation: 'earthSpin 70s linear infinite',
      }}>
        {/* Continent patches */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `
            radial-gradient(ellipse 65px 42px at 28% 42%, rgba(70,155,65,0.16) 0%, transparent 70%),
            radial-gradient(ellipse 95px 58px at 64% 54%, rgba(55,145,50,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 48px 32px at 18% 68%, rgba(65,140,58,0.11) 0%, transparent 70%),
            radial-gradient(ellipse 72px 46px at 82% 32%, rgba(60,150,60,0.1) 0%, transparent 70%)
          `,
        }} />
        {/* Sunlight glare */}
        {isDay && <div style={{
          position: 'absolute', top: '7%', left: '18%', width: '32%', height: '22%', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 75%)',
        }} />}
        {/* Night city lights */}
        {!isDay && <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `
            radial-gradient(3px 3px at 34% 43%, rgba(255,225,130,0.65) 0%, transparent 100%),
            radial-gradient(2px 2px at 63% 37%, rgba(255,225,130,0.55) 0%, transparent 100%),
            radial-gradient(4px 4px at 47% 62%, rgba(255,225,130,0.45) 0%, transparent 100%),
            radial-gradient(2px 2px at 23% 57%, rgba(255,225,130,0.55) 0%, transparent 100%),
            radial-gradient(3px 3px at 74% 52%, rgba(255,225,130,0.45) 0%, transparent 100%)
          `,
        }} />}
        {/* Atmosphere ring */}
        <div style={{
          position: 'absolute', inset: '-4px', borderRadius: '50%',
          border: `2px solid ${isDay ? 'rgba(180,230,255,0.1)' : 'rgba(70,110,200,0.07)'}`,
        }} />
      </div>
      {/* Moon (night only) */}
      {!isDay && (
        <div style={{
          position: 'absolute', top: 'calc(50% - 270px)', left: 'calc(50% + 220px)',
          width: 52, height: 52, borderRadius: '50%',
          background: 'radial-gradient(circle at 33% 33%, rgba(255,255,220,0.92) 0%, rgba(200,200,175,0.72) 60%, rgba(140,140,115,0.5) 100%)',
          boxShadow: '0 0 22px rgba(255,255,200,0.28)',
          animation: 'moonFloat 8s ease-in-out infinite',
        }} />
      )}
    </div>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/admin/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || 'Invalid email or password');
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <>
      <style>{`
        @keyframes earthSpin {
          from { filter: hue-rotate(0deg); }
          to   { filter: hue-rotate(2deg); }
        }
        @keyframes moonFloat {
          0%,100% { transform: translateY(0px) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes cardGlow {
          0%,100% { box-shadow: 0 0 45px rgba(52,124,37,0.12), 0 30px 65px rgba(0,0,0,0.65); }
          50%      { box-shadow: 0 0 70px rgba(52,124,37,0.22), 0 30px 65px rgba(0,0,0,0.65); }
        }
        @keyframes logoFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes scanline {
          from { top: -4px; }
          to   { top: 100vh; }
        }
        .itango-input::placeholder { color: #334155; }
        .itango-input:focus { outline: none; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #071209 0%, #000407 40%, #000000 100%)' }}
      >
        <SpaceCanvas />
        <EarthGlobe />

        {/* Horizontal scan line */}
        <div className="fixed inset-x-0 pointer-events-none overflow-hidden" style={{ top: 0, bottom: 0, zIndex: 2 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(52,124,37,0.07) 50%, transparent 100%)',
            animation: 'scanline 9s linear infinite',
          }} />
        </div>

        {/* Card */}
        <div
          className="relative z-10 w-full max-w-md"
          style={{
            background: 'linear-gradient(155deg, rgba(7,18,10,0.94) 0%, rgba(4,10,24,0.96) 100%)',
            border: '1px solid rgba(52,124,37,0.28)',
            borderRadius: '24px',
            backdropFilter: 'blur(28px)',
            animation: 'cardGlow 4.5s ease-in-out infinite',
          }}
        >
          {/* Top gradient accent bar */}
          <div style={{
            height: '2px', borderRadius: '24px 24px 0 0',
            background: 'linear-gradient(90deg, transparent, #347c25, #4ade80, #347c25, transparent)',
          }} />

          <div className="px-8 pt-7 pb-8">
            {/* Branding */}
            <div className="text-center mb-7">
              <div style={{ animation: 'logoFloat 3.5s ease-in-out infinite', display: 'inline-block', marginBottom: '14px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(52,124,37,0.18), rgba(74,222,128,0.08))',
                  border: '1px solid rgba(52,124,37,0.32)',
                  borderRadius: '18px', padding: '12px',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src="/mayobebroslogo copy copy.png" alt="Mayobe Bros"
                    style={{ height: '52px' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                iTango AI Agent
              </h1>
              <p style={{ fontSize: '13px', color: '#347c25', fontWeight: 600 }}>Mayobe Bros — Secure Admin Access</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginTop: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#4ade8099', textTransform: 'uppercase' }}>
                  Encrypted Connection Active
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: '18px', padding: '12px 14px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                color: '#fca5a5', fontSize: '13px',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#347c25', pointerEvents: 'none' }} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="your@email.com"
                    className="itango-input"
                    style={{
                      width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
                      borderRadius: '12px', fontSize: '13px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,124,37,0.22)',
                      color: '#e2e8f0', boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.55)'; e.currentTarget.style.background = 'rgba(52,124,37,0.07)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.22)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#347c25', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required placeholder="••••••••••"
                    className="itango-input"
                    style={{
                      width: '100%', paddingLeft: '40px', paddingRight: '44px', paddingTop: '12px', paddingBottom: '12px',
                      borderRadius: '12px', fontSize: '13px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(52,124,37,0.22)',
                      color: '#e2e8f0', boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.55)'; e.currentTarget.style.background = 'rgba(52,124,37,0.07)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(52,124,37,0.22)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.03em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  border: 'none', cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                  background: loading || !email || !password
                    ? 'rgba(52,124,37,0.25)'
                    : 'linear-gradient(135deg, #2d6b1f 0%, #347c25 50%, #22c55e 100%)',
                  color: loading || !email || !password ? 'rgba(74,222,128,0.4)' : 'white',
                  boxShadow: loading || !email || !password ? 'none' : '0 4px 22px rgba(52,124,37,0.32)',
                  transition: 'all 0.2s',
                  marginTop: '4px',
                }}
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Authenticating…</>
                  : <><Lock size={14} /> Access iTango System</>
                }
              </button>
            </form>

            {/* Footer */}
            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(52,124,37,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#1e293b' }}>Mayobe Bros CMS v3.0</span>
              <a href="/" style={{ fontSize: '10px', color: '#334155', textDecoration: 'none' }}>← Back to Site</a>
              <span style={{ fontSize: '10px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#347c25', display: 'inline-block' }} />
                iTango AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
