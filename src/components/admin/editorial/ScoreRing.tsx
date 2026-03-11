interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function ScoreRing({ score, size = 'md', label }: Props) {
  const dims = { sm: 52, md: 72, lg: 96 };
  const strokes = { sm: 5, md: 6, lg: 8 };
  const dim = dims[size];
  const stroke = strokes[size];
  const r = (dim - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100 dark:text-gray-800" />
          <circle
            cx={dim / 2} cy={dim / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black leading-none ${textSize}`} style={{ color }}>{score}</span>
        </div>
      </div>
      {label && <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium text-center leading-tight">{label}</span>}
    </div>
  );
}
