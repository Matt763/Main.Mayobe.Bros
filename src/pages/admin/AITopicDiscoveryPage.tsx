import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Compass, RefreshCw, Key, Eye, EyeOff, AlertCircle,
  Bookmark, Calendar, Loader2, ChevronDown, BookOpen,
} from 'lucide-react';
import { useAIDiscovery } from './ai-discovery/useAIDiscovery';
import TopicCard from './ai-discovery/TopicCard';
import WorkflowPanel from './ai-discovery/WorkflowPanel';
import CalendarView from './ai-discovery/CalendarView';
import {
  DiscoveredTopic, ArticleOutline, KeywordData, SeoMeta,
  InternalLinksResult, CalendarEntry, SavedTopic,
} from './ai-discovery/types';

const CATEGORIES = [
  'All', 'Technology', 'Business', 'Education', 'Gaming',
  'Lifestyle', 'News', 'Health', 'Finance', 'Entertainment',
];

type ActiveTab = 'discover' | 'saved' | 'calendar';

export default function AITopicDiscoveryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');

  const [topics, setTopics] = useState<DiscoveredTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<DiscoveredTopic | null>(null);
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);

  const [outline, setOutline] = useState<ArticleOutline | null>(null);
  const [keywords, setKeywords] = useState<KeywordData | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [internalLinks, setInternalLinks] = useState<InternalLinksResult | null>(null);
  const [seoMeta, setSeoMeta] = useState<SeoMeta | null>(null);
  const [existingPostTitles, setExistingPostTitles] = useState<string[]>([]);

  const ai = useAIDiscovery(apiKey);

  useEffect(() => {
    if (apiKey) localStorage.setItem('openai_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!user) return;
    loadSavedTopics();
    loadCalendar();
    loadExistingPosts();
  }, [user]);

  const loadExistingPosts = async () => {
    const { data } = await supabase.from('posts').select('title').eq('status', 'published').order('created_at', { ascending: false }).limit(50);
    if (data) setExistingPostTitles(data.map(p => p.title));
  };

  const loadSavedTopics = async () => {
    if (!user) return;
    const { data } = await supabase.from('saved_topics').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
    if (data) setSavedTopics(data as SavedTopic[]);
  };

  const loadCalendar = async () => {
    if (!user) return;
    const { data } = await supabase.from('content_calendar').select('*').eq('created_by', user.id).order('scheduled_date', { ascending: true, nullsFirst: false });
    if (data) setCalendarEntries(data as CalendarEntry[]);
  };

  const handleDiscover = async () => {
    const category = selectedCategory === 'All' ? undefined : selectedCategory;
    const result = await ai.discoverTopics(category);
    if (result) setTopics(result);
  };

  const handleSelectTopic = (topic: DiscoveredTopic) => {
    setSelectedTopic(topic);
    setOutline(null);
    setKeywords(null);
    setDraft(null);
    setInternalLinks(null);
    setSeoMeta(null);
  };

  const handleSaveTopic = async (topic: DiscoveredTopic) => {
    if (!user) return;
    const alreadySaved = savedTopics.some(t => t.title === topic.title);
    if (alreadySaved) return;
    const { data } = await supabase.from('saved_topics').insert({
      title: topic.title,
      angle: topic.angle,
      interest_level: topic.interestLevel,
      search_volume: topic.estimatedSearchVolume,
      difficulty: topic.difficulty,
      primary_keyword: topic.primaryKeyword,
      keywords: topic.keywords,
      category: topic.category,
      why_it_works: topic.whyItWorks,
      created_by: user.id,
    }).select().single();
    if (data) setSavedTopics(prev => [data as SavedTopic, ...prev]);
  };

  const handleDeleteSavedTopic = async (id: string) => {
    await supabase.from('saved_topics').delete().eq('id', id);
    setSavedTopics(prev => prev.filter(t => t.id !== id));
  };

  const handleGenerateOutline = async () => {
    if (!selectedTopic) return;
    const kws = keywords ? [...keywords.primary, ...keywords.secondary] : selectedTopic.keywords;
    const result = await ai.generateOutline(selectedTopic.title, selectedTopic.category, kws);
    if (result) setOutline(result);
  };

  const handleGenerateKeywords = async () => {
    if (!selectedTopic) return;
    const result = await ai.suggestKeywords(selectedTopic.title, selectedTopic.category);
    if (result) setKeywords(result);
  };

  const handleGenerateDraft = async () => {
    if (!selectedTopic) return;
    const kws = keywords ? [...keywords.primary, ...keywords.secondary] : selectedTopic.keywords;
    let result: string | null;
    if (outline) {
      const outlineStr = JSON.stringify(outline.sections.map(s => s.heading));
      result = await ai.generateDraft(selectedTopic.title, outlineStr, kws);
    } else {
      result = await ai.generateFullDraft(selectedTopic.title, selectedTopic.category, kws);
    }
    if (result) setDraft(result);
  };

  const handleGenerateLinks = async () => {
    if (!selectedTopic) return;
    const outlineStr = outline ? outline.sections.map(s => s.heading).join(', ') : '';
    const result = await ai.suggestInternalLinks(selectedTopic.title, outlineStr, existingPostTitles);
    if (result) setInternalLinks(result);
  };

  const handleGenerateSeoMeta = async () => {
    if (!selectedTopic) return;
    const kws = keywords ? [...keywords.primary, ...keywords.secondary] : selectedTopic.keywords;
    const outlineStr = outline ? outline.sections.map(s => s.heading).join(', ') : '';
    const result = await ai.generateSeoMeta(selectedTopic.title, selectedTopic.category, kws, outlineStr);
    if (result) setSeoMeta(result);
  };

  const handleSendToEditor = () => {
    const params = new URLSearchParams();
    if (selectedTopic) params.set('title', selectedTopic.title);
    if (draft) params.set('draft', draft);
    if (seoMeta) {
      params.set('metaTitle', seoMeta.metaTitle);
      params.set('metaDescription', seoMeta.metaDescription);
      params.set('slug', seoMeta.slug);
    }
    if (keywords) {
      params.set('keywords', [...keywords.primary, ...keywords.secondary].join(','));
    }
    navigate(`/admin/posts/new?${params.toString()}`);
  };

  const handleAddCalendarEntry = async (entry: Omit<CalendarEntry, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { data } = await supabase.from('content_calendar').insert({ ...entry, created_by: user.id }).select().single();
    if (data) setCalendarEntries(prev => [...prev, data as CalendarEntry]);
  };

  const handleDeleteCalendarEntry = async (id: string) => {
    await supabase.from('content_calendar').delete().eq('id', id);
    setCalendarEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateCalendarStatus = async (id: string, status: CalendarEntry['status']) => {
    await supabase.from('content_calendar').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setCalendarEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const handleAddToCalendar = async (topic: DiscoveredTopic) => {
    await handleAddCalendarEntry({
      title: topic.title,
      topic: topic.title,
      category: topic.category,
      scheduled_date: null,
      status: 'draft',
      notes: topic.angle,
      keywords: topic.keywords,
      outline: null,
      meta: null,
      post_id: null,
    });
    setActiveTab('calendar');
  };

  const isKeyConfigured = apiKey.length > 10;

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Top bar */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                <Compass size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">AI Topic Discovery</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Discover high-traffic content opportunities</p>
              </div>
            </div>

            {/* API Key */}
            <div className="flex items-center gap-2">
              {!isKeyConfigured && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle size={11} /> API key required
                </span>
              )}
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-... OpenAI key"
                  className="w-44 sm:w-52 pl-7 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
                <Key size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {([
              { key: 'discover', label: 'Discover Topics', icon: Compass, count: topics.length },
              { key: 'saved', label: 'Saved', icon: Bookmark, count: savedTopics.length },
              { key: 'calendar', label: 'Calendar', icon: Calendar, count: calendarEntries.length },
            ] as const).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error bar */}
        {ai.error && (
          <div className="flex-shrink-0 mx-4 sm:mx-6 mt-3 px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
            <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{ai.error}</p>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">

          {/* DISCOVER TAB */}
          {activeTab === 'discover' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Topic list */}
              <div className={`flex flex-col overflow-hidden transition-all ${selectedTopic ? 'w-0 sm:w-80 lg:w-96 xl:w-[420px]' : 'w-full'}`}>
                {/* Controls */}
                <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleDiscover}
                    disabled={!isKeyConfigured || !!ai.loadingAction}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    {ai.loadingAction === 'discover_topics' ? (
                      <><Loader2 size={14} className="animate-spin" /> Discovering topics...</>
                    ) : (
                      <><RefreshCw size={14} /> Discover {selectedCategory !== 'All' ? selectedCategory : ''} Topics</>
                    )}
                  </button>
                </div>

                {/* Topic grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {topics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center mb-4">
                        <Compass size={26} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ready to discover</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
                        Select a category and click Discover Topics to get AI-powered suggestions
                      </p>
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${selectedTopic ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}>
                      {topics.map((topic, i) => (
                        <TopicCard
                          key={i}
                          topic={topic}
                          isSaved={savedTopics.some(s => s.title === topic.title)}
                          onSave={() => handleSaveTopic(topic)}
                          onSelect={() => handleSelectTopic(topic)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Workflow panel */}
              {selectedTopic && (
                <div className="flex-1 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
                  <WorkflowPanel
                    topic={selectedTopic}
                    onBack={() => setSelectedTopic(null)}
                    loadingAction={ai.loadingAction}
                    outline={outline}
                    keywords={keywords}
                    draft={draft}
                    internalLinks={internalLinks}
                    seoMeta={seoMeta}
                    onGenerateOutline={handleGenerateOutline}
                    onGenerateKeywords={handleGenerateKeywords}
                    onGenerateDraft={handleGenerateDraft}
                    onGenerateLinks={handleGenerateLinks}
                    onGenerateSeoMeta={handleGenerateSeoMeta}
                    onSendToEditor={handleSendToEditor}
                  />
                </div>
              )}
            </div>
          )}

          {/* SAVED TAB */}
          {activeTab === 'saved' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {savedTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center mb-4">
                    <Bookmark size={26} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No saved topics yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Bookmark topics from the Discover tab to save them here</p>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{savedTopics.length} Saved Topic{savedTopics.length !== 1 ? 's' : ''}</h3>
                  </div>
                  {savedTopics.map(t => (
                    <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t.title}</h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              t.interest_level === 'Trending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                              t.interest_level === 'High' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>{t.interest_level}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{t.angle}</p>
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-[11px] text-gray-400"><span className="font-medium text-gray-600 dark:text-gray-300">Keyword:</span> {t.primary_keyword}</span>
                            <span className="text-[11px] text-gray-400"><span className="font-medium text-gray-600 dark:text-gray-300">Volume:</span> {t.search_volume}</span>
                            <span className="text-[11px] text-gray-400"><span className="font-medium text-gray-600 dark:text-gray-300">Difficulty:</span> {t.difficulty}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {t.keywords.map((kw, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg">{kw}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              handleSelectTopic({
                                title: t.title, angle: t.angle,
                                interestLevel: t.interest_level as DiscoveredTopic['interestLevel'],
                                estimatedSearchVolume: t.search_volume as DiscoveredTopic['estimatedSearchVolume'],
                                difficulty: t.difficulty as DiscoveredTopic['difficulty'],
                                primaryKeyword: t.primary_keyword,
                                keywords: t.keywords, category: t.category,
                                whyItWorks: t.why_it_works,
                              });
                              setActiveTab('discover');
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                          >
                            <BookOpen size={11} /> Plan
                          </button>
                          <button
                            onClick={() => handleAddToCalendar({
                              title: t.title, angle: t.angle,
                              interestLevel: t.interest_level as DiscoveredTopic['interestLevel'],
                              estimatedSearchVolume: t.search_volume as DiscoveredTopic['estimatedSearchVolume'],
                              difficulty: t.difficulty as DiscoveredTopic['difficulty'],
                              primaryKeyword: t.primary_keyword,
                              keywords: t.keywords, category: t.category,
                              whyItWorks: t.why_it_works,
                            })}
                            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Calendar size={11} /> Schedule
                          </button>
                          <button
                            onClick={() => handleDeleteSavedTopic(t.id)}
                            className="flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
                          >
                            <ChevronDown size={12} className="rotate-90" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-3xl mx-auto">
                <CalendarView
                  entries={calendarEntries}
                  onAdd={handleAddCalendarEntry}
                  onDelete={handleDeleteCalendarEntry}
                  onUpdateStatus={handleUpdateCalendarStatus}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
