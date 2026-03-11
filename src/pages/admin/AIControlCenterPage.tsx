import { useState, useEffect } from 'react';
import { Settings, Zap, Bot, Share2, TrendingUp, Calendar, Search, BarChart3, Shield, ToggleLeft, ToggleRight, Globe, Layers, Power } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

interface AISetting {
  id: string;
  feature_key: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
}

const FEATURE_META: Record<string, { label: string; description: string; icon: any; color: string }> = {
  ai_blogging: {
    label: 'AI Auto Blogging',
    description: 'Automatically generate full articles (1200-2000 words) from titles, keywords, and trending topics.',
    icon: Bot,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  social_automation: {
    label: 'Social Media Automation',
    description: 'Auto-share published posts to Facebook, Twitter, LinkedIn, Pinterest, and Telegram.',
    icon: Share2,
    color: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400',
  },
  trending_detection: {
    label: 'Trending Topics Detection',
    description: 'Continuously analyze Google Trends, news, and social media for trending topics.',
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  auto_scheduling: {
    label: 'Auto Blog Scheduling',
    description: 'Automatically schedule generated articles for optimal publishing times (peak traffic hours).',
    icon: Calendar,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  ai_topic_discovery: {
    label: 'AI Topic Discovery',
    description: 'AI suggests article topics based on content gaps, search trends, and audience interest.',
    icon: Search,
    color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  ai_editorial_review: {
    label: 'AI Editorial Review',
    description: 'Automated content quality checks, readability scoring, SEO analysis, and headline optimization.',
    icon: Shield,
    color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400',
  },
  ai_keyword_research: {
    label: 'AI Keyword Research Lab',
    description: 'Search volume estimation, keyword difficulty, long-tail keywords, and search intent analysis.',
    icon: BarChart3,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  },
  ai_competitor_analysis: {
    label: 'AI Competitor Analysis',
    description: 'Analyze competitor websites to find content gaps and suggest high-performing article ideas.',
    icon: Zap,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  },
  google_discover: {
    label: 'Google Discover Optimization',
    description: 'Optimize articles for Google Discover with structured data, image requirements, and E-E-A-T signals.',
    icon: Globe,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  content_clustering: {
    label: 'Content Clustering',
    description: 'Build topical authority through pillar content and interlinked supporting articles.',
    icon: Layers,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
};

export default function AIControlCenterPage() {
  const [settings, setSettings] = useState<AISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/social/ai-engine');
      setSettings(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, currentState: boolean) => {
    setToggling(featureKey);
    try {
      await fetch(`/api/social/ai-engine/${featureKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !currentState }),
      });
      setSettings(prev =>
        prev.map(s => s.feature_key === featureKey ? { ...s, is_enabled: !currentState } : s)
      );
    } catch {} finally {
      setToggling(null);
    }
  };

  const enabledCount = settings.filter(s => s.is_enabled).length;
  const allEnabled = settings.length > 0 && enabledCount === settings.length;

  const toggleAll = async (enable: boolean) => {
    setToggling('__all__');
    try {
      await Promise.all(
        settings
          .filter(s => s.is_enabled !== enable)
          .map(s =>
            fetch(`/api/social/ai-engine/${s.feature_key}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ is_enabled: enable }),
            })
          )
      );
      setSettings(prev => prev.map(s => ({ ...s, is_enabled: enable })));
    } catch {} finally {
      setToggling(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings size={24} className="text-blue-600" />
            AI Engine Control Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enable or disable automation features. All systems remain under CEO supervision.
          </p>
        </div>

        <div className={`rounded-xl border p-5 mb-6 flex items-center justify-between ${
          allEnabled
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              allEnabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              <Power size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Master Switch</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {allEnabled ? 'All features are active' : `${enabledCount} of ${settings.length} features enabled`}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleAll(!allEnabled)}
            disabled={toggling === '__all__'}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              allEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {toggling === '__all__' ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-4" />
            ) : allEnabled ? 'Disable All' : 'Enable All'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{settings.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Features</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Enabled</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{settings.length - enabledCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Disabled</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">CEO</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Control Level</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {settings.map(setting => {
              const meta = FEATURE_META[setting.feature_key] || {
                label: setting.feature_key,
                description: '',
                icon: Zap,
                color: 'text-gray-600 bg-gray-100',
              };
              const Icon = meta.icon;
              const isToggling = toggling === setting.feature_key;

              return (
                <div
                  key={setting.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-5 transition-all ${
                    setting.is_enabled
                      ? 'border-green-200 dark:border-green-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{meta.label}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{meta.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFeature(setting.feature_key, setting.is_enabled)}
                      disabled={isToggling}
                      className="flex-shrink-0 transition-all"
                    >
                      {isToggling ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : setting.is_enabled ? (
                        <ToggleRight size={36} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={36} className="text-gray-300 dark:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
