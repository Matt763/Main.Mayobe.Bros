import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, PartyPopper, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'bottom' | 'right' | 'left' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Welcome to Your Dashboard',
    description: 'This is your command center. View site stats, recent posts, comments, and quick actions all in one place.',
    position: 'bottom',
  },
  {
    target: '[data-tour="posts"]',
    title: 'Create & Manage Posts',
    description: 'Write articles, manage drafts, publish content, and track views. Use the rich text editor with AI assistance.',
    position: 'right',
  },
  {
    target: '[data-tour="media"]',
    title: 'Media Library',
    description: 'Upload and manage images for your posts. Supports drag-and-drop and Pexels stock photo integration.',
    position: 'right',
  },
  {
    target: '[data-tour="settings"]',
    title: 'Site Settings',
    description: 'Configure your site name, SEO defaults, social links, and appearance. Customize everything from here.',
    position: 'right',
  },
  {
    target: '[data-tour="analytics"]',
    title: 'Analytics Dashboard',
    description: 'Track page views, visitor locations, devices, and real-time traffic. Monitor your growth over time.',
    position: 'right',
  },
  {
    target: '[data-tour="ai"]',
    title: 'AI-Powered Tools',
    description: 'Use AI to generate content, discover topics, analyze competitors, and optimize SEO. Your AI publishing assistant.',
    position: 'right',
  },
];

const TOUR_KEY = 'mayobebros-tour-completed';

function ConfettiPiece({ delay }: { delay: number }) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 8;
  const duration = 2 + Math.random() * 2;
  const rotation = Math.random() * 360;

  return (
    <div
      className="absolute animate-confetti-fall"
      style={{
        left: `${left}%`,
        top: '-10px',
        width: `${size}px`,
        height: `${size * 0.6}px`,
        backgroundColor: color,
        borderRadius: '2px',
        transform: `rotate(${rotation}deg)`,
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateSpotlight = useCallback(() => {
    if (!active || showCelebration) return;
    const currentStep = TOUR_STEPS[step];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.target);
    if (el) {
      setSpotlightRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setSpotlightRect(null);
    }
  }, [step, active, showCelebration]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setActive(false);
    }, 6000);
  }, []);

  const skip = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setActive(false);
  }, []);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      completeTour();
    }
  }, [step, completeTour]);

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  if (!active) return null;

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 40} />
          ))}
        </div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center animate-bounce-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
            <PartyPopper size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to Mayobe Bros Publishing!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Your publishing journey starts today. Keep creating and never give up.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-blue-600 dark:text-blue-400">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Let's build something amazing</span>
            <Sparkles size={16} />
          </div>
        </div>
      </div>
    );
  }

  const currentStep = TOUR_STEPS[step];
  const tooltipStyle: React.CSSProperties = {};

  if (spotlightRect) {
    const gap = 16;
    switch (currentStep.position) {
      case 'bottom':
        tooltipStyle.top = spotlightRect.bottom + gap;
        tooltipStyle.left = Math.max(16, spotlightRect.left);
        break;
      case 'right':
        tooltipStyle.top = spotlightRect.top;
        tooltipStyle.left = spotlightRect.right + gap;
        break;
      case 'left':
        tooltipStyle.top = spotlightRect.top;
        tooltipStyle.right = window.innerWidth - spotlightRect.left + gap;
        break;
      case 'top':
        tooltipStyle.bottom = window.innerHeight - spotlightRect.top + gap;
        tooltipStyle.left = spotlightRect.left;
        break;
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - 8}
                y={spotlightRect.top - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={skip}
        />
      </svg>

      {spotlightRect && (
        <div
          className="absolute rounded-xl border-2 border-blue-500 pointer-events-none"
          style={{
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
            boxShadow: '0 0 0 4px rgba(59,130,246,0.3)',
          }}
        />
      )}

      <div
        className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-80 p-5 border border-gray-200 dark:border-gray-700"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Step {step + 1} of {TOUR_STEPS.length}
          </span>
          <button
            onClick={skip}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
          {currentStep.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {currentStep.description}
        </p>
        <div className="flex items-center justify-between mt-5">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-blue-600' : i < step ? 'bg-blue-300' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              {step < TOUR_STEPS.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
        <button
          onClick={skip}
          className="w-full text-center text-xs text-gray-400 dark:text-gray-500 mt-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Skip tour
        </button>
      </div>
    </div>
  );
}
