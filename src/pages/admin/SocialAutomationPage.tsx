import { useState, useEffect } from 'react';
import { Share2, Plus, Trash2, Save, Link as LinkIcon, Hash, Type, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  api_key: string;
  api_secret: string;
  access_token: string;
  is_connected: boolean;
}

interface SocialPost {
  id: string;
  post_id: string;
  platform: string;
  headline: string;
  caption: string;
  hashtags: string;
  article_link: string;
  status: string;
  posts?: { title: string; slug: string };
}

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { value: 'twitter', label: 'Twitter / X', color: 'bg-gray-900 dark:bg-gray-700' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { value: 'pinterest', label: 'Pinterest', color: 'bg-red-600' },
  { value: 'telegram', label: 'Telegram', color: 'bg-sky-500' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' },
];

export default function SocialAutomationPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [tab, setTab] = useState<'accounts' | 'posts'>('accounts');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [editPlatform, setEditPlatform] = useState('facebook');
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editSecret, setEditSecret] = useState('');
  const [editToken, setEditToken] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [accRes, postsRes] = await Promise.all([
        fetch('/api/social/accounts'),
        fetch('/api/social/posts'),
      ]);
      setAccounts(await accRes.json());
      setSocialPosts(await postsRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const saveAccount = async () => {
    setSaving('account');
    try {
      await fetch('/api/social/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editPlatform,
          account_name: editName,
          api_key: editKey,
          api_secret: editSecret,
          access_token: editToken,
        }),
      });
      setShowForm(false);
      setEditName(''); setEditKey(''); setEditSecret(''); setEditToken('');
      loadData();
    } catch {} finally { setSaving(null); }
  };

  const deleteAccount = async (id: string) => {
    await fetch(`/api/social/accounts/${id}`, { method: 'DELETE' });
    loadData();
  };

  const updatePostStatus = async (id: string, status: string) => {
    await fetch(`/api/social/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadData();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Share2 size={24} className="text-blue-600" />
              Social Media Automation
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect accounts and manage automated social sharing</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['accounts', 'posts'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t === 'accounts' ? 'Connected Accounts' : 'Social Posts'}
            </button>
          ))}
        </div>

        {tab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Plus size={16} />
                Connect Account
              </button>
            </div>

            {showForm && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
                    <select
                      value={editPlatform}
                      onChange={e => setEditPlatform(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="@yourhandle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                    <input
                      type="password"
                      value={editKey}
                      onChange={e => setEditKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Secret</label>
                    <input
                      type="password"
                      value={editSecret}
                      onChange={e => setEditSecret(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token</label>
                    <input
                      type="password"
                      value={editToken}
                      onChange={e => setEditToken(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                  <button
                    onClick={saveAccount}
                    disabled={saving === 'account'}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save size={16} />
                    {saving === 'account' ? 'Saving...' : 'Save Account'}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Share2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No social media accounts connected</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Connect Account" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(acc => {
                  const platform = PLATFORMS.find(p => p.value === acc.platform);
                  return (
                    <div key={acc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${platform?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center text-white`}>
                            <Share2 size={18} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{platform?.label || acc.platform}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{acc.account_name || 'Not named'}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteAccount(acc.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        acc.is_connected
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {acc.is_connected ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {acc.is_connected ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'posts' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading social posts...</div>
            ) : socialPosts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No social media posts generated yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Posts will appear here when articles are published</p>
              </div>
            ) : (
              <div className="space-y-3">
                {socialPosts.map(sp => {
                  const platform = PLATFORMS.find(p => p.value === sp.platform);
                  return (
                    <div key={sp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${platform?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                            <Share2 size={14} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{sp.headline || sp.posts?.title || 'Untitled'}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{platform?.label}</p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          sp.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          sp.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {sp.status}
                        </div>
                      </div>
                      {sp.caption && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{sp.caption}</p>
                      )}
                      {sp.hashtags && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-3">
                          <Hash size={12} /> {sp.hashtags}
                        </div>
                      )}
                      {sp.status === 'draft' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updatePostStatus(sp.id, 'approved')}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updatePostStatus(sp.id, 'published')}
                            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Publish Now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
