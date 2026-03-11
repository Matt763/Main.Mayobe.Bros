import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { supabase } from '../../lib/supabase';
import { Monitor, Plus, Save, Trash2, Eye, Code, ToggleLeft, ToggleRight, Copy, CheckCircle2 } from 'lucide-react';

interface AdSetting {
  id: string;
  placement: string;
  name: string;
  ad_code: string;
  is_active: boolean;
  created_at: string;
}

const PLACEMENT_LABELS: Record<string, { label: string; desc: string }> = {
  header: { label: 'Header Banner', desc: 'Full-width banner at the top of every page' },
  body_top: { label: 'Body Top', desc: 'Below the header, before main content' },
  in_article: { label: 'Inside Article', desc: 'Injected mid-article for maximum visibility' },
  sidebar: { label: 'Sidebar', desc: 'Right sidebar on desktop views' },
  body_bottom: { label: 'Body Bottom', desc: 'After main content, before footer' },
  footer: { label: 'Footer', desc: 'Inside the site footer' },
};

const ADSENSE_TEMPLATE = (publisherId: string, slotId: string) =>
  `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}" crossorigin="anonymous"></script>\n<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="${publisherId}"\n  data-ad-slot="${slotId}"\n  data-ad-format="auto"\n  data-full-width-responsive="true"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;

const BANNER_TEMPLATE = (imageUrl: string, linkUrl: string, altText: string) =>
  `<a href="${linkUrl}" target="_blank" rel="noopener sponsored">\n  <img src="${imageUrl}" alt="${altText}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />\n</a>`;

export default function AdManagementPage() {
  const [ads, setAds] = useState<AdSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPlacement, setNewPlacement] = useState('header');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState<'adsense' | 'banner' | null>(null);
  const [tplPublisherId, setTplPublisherId] = useState('ca-pub-XXXXXXXXXX');
  const [tplSlotId, setTplSlotId] = useState('1234567890');
  const [tplImageUrl, setTplImageUrl] = useState('https://example.com/banner.jpg');
  const [tplLinkUrl, setTplLinkUrl] = useState('https://example.com');
  const [tplAlt, setTplAlt] = useState('Advertisement');
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadAds(); }, []);

  const loadAds = async () => {
    setLoading(true);
    const { data } = await supabase.from('ad_settings').select('*').order('created_at', { ascending: false });
    setAds((data as AdSetting[]) || []);
    setLoading(false);
  };

  const handleToggle = async (ad: AdSetting) => {
    await supabase.from('ad_settings').update({ is_active: !ad.is_active }).eq('id', ad.id);
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a));
    setToast({ message: `Ad ${!ad.is_active ? 'enabled' : 'disabled'}`, type: 'success' });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('ad_settings')
      .update({ name: editName, ad_code: editCode })
      .eq('id', editingId);
    if (error) {
      setToast({ message: 'Failed to save', type: 'error' });
    } else {
      setAds(prev => prev.map(a => a.id === editingId ? { ...a, name: editName, ad_code: editCode } : a));
      setEditingId(null);
      setToast({ message: 'Ad updated', type: 'success' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('ad_settings').delete().eq('id', id);
    setAds(prev => prev.filter(a => a.id !== id));
    setToast({ message: 'Ad deleted', type: 'success' });
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      setToast({ message: 'Name and code are required', type: 'error' });
      return;
    }
    const { data, error } = await supabase.from('ad_settings').insert({
      placement: newPlacement,
      name: newName,
      ad_code: newCode,
      is_active: true,
    }).select().maybeSingle();
    if (error) {
      setToast({ message: 'Failed to create ad', type: 'error' });
    } else {
      setAds(prev => [data as AdSetting, ...prev]);
      setShowNewForm(false);
      setNewName(''); setNewCode('');
      setToast({ message: 'Ad slot created', type: 'success' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generatedAdsenseCode = ADSENSE_TEMPLATE(tplPublisherId, tplSlotId);
  const generatedBannerCode = BANNER_TEMPLATE(tplImageUrl, tplLinkUrl, tplAlt);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Monitor size={28} className="text-blue-600" />
              Ad Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage advertisement placements across the site</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplate(showTemplate ? null : 'adsense')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              <Code size={16} />
              Templates
            </button>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              New Ad Slot
            </button>
          </div>
        </div>

        {showTemplate && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setShowTemplate('adsense')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showTemplate === 'adsense' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                Google AdSense
              </button>
              <button
                onClick={() => setShowTemplate('banner')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showTemplate === 'banner' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                Banner Ad
              </button>
            </div>

            {showTemplate === 'adsense' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Publisher ID</label>
                  <input value={tplPublisherId} onChange={e => setTplPublisherId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Ad Slot ID</label>
                  <input value={tplSlotId} onChange={e => setTplSlotId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Image URL</label>
                  <input value={tplImageUrl} onChange={e => setTplImageUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Link URL</label>
                  <input value={tplLinkUrl} onChange={e => setTplLinkUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Alt Text</label>
                  <input value={tplAlt} onChange={e => setTplAlt(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            )}

            <div className="relative">
              <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {showTemplate === 'adsense' ? generatedAdsenseCode : generatedBannerCode}
              </pre>
              <button
                onClick={() => copyToClipboard(showTemplate === 'adsense' ? generatedAdsenseCode : generatedBannerCode)}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <button
              onClick={() => {
                setNewCode(showTemplate === 'adsense' ? generatedAdsenseCode : generatedBannerCode);
                setShowTemplate(null);
                setShowNewForm(true);
              }}
              className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Use this code in a new ad slot
            </button>
          </div>
        )}

        {showNewForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" /> New Ad Slot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Placement</label>
                <select value={newPlacement} onChange={e => setNewPlacement(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {Object.entries(PLACEMENT_LABELS).map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Ad Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Header AdSense 728x90" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Ad Code</label>
              <textarea value={newCode} onChange={e => setNewCode(e.target.value)} rows={5} placeholder="Paste your ad code here..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Save size={15} /> Create Ad Slot
              </button>
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-3/4" />
              </div>
            ))
          ) : ads.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Monitor size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No ad slots configured yet.</p>
              <p className="text-sm mt-1">Click "New Ad Slot" to add your first advertisement.</p>
            </div>
          ) : (
            ads.map(ad => (
              <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {PLACEMENT_LABELS[ad.placement]?.label || ad.placement}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ad.is_active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{ad.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {PLACEMENT_LABELS[ad.placement]?.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(ad)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                      title={ad.is_active ? 'Disable' : 'Enable'}
                    >
                      {ad.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => {
                        setPreviewId(previewId === ad.id ? null : ad.id);
                        setEditingId(null);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                      title="Preview code"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(ad.id);
                        setEditName(ad.name);
                        setEditCode(ad.ad_code);
                        setPreviewId(null);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                      title="Edit"
                    >
                      <Code size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-gray-400 dark:text-gray-500"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {previewId === ad.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Ad Code Preview</p>
                    <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {ad.ad_code}
                    </pre>
                  </div>
                )}

                {editingId === ad.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4 space-y-3">
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ad name" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <textarea value={editCode} onChange={e => setEditCode(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        <Save size={15} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
