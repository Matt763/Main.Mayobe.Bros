import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Save, ExternalLink, Twitter, Globe, Linkedin, Facebook } from 'lucide-react';

interface ProfileForm {
  display_name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  twitter_url: string;
  linkedin_url: string;
  facebook_url: string;
  website_url: string;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AuthorProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    display_name: '',
    slug: '',
    bio: '',
    avatar_url: '',
    twitter_url: '',
    linkedin_url: '',
    facebook_url: '',
    website_url: '',
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('author_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setProfileId(data.id);
      setForm({
        display_name: data.display_name || '',
        slug: data.slug || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        twitter_url: data.twitter_url || '',
        linkedin_url: data.linkedin_url || '',
        facebook_url: data.facebook_url || '',
        website_url: data.website_url || '',
      });
      setSlugEdited(true);
    } else {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Author';
      setForm(prev => ({
        ...prev,
        display_name: displayName,
        slug: slugify(displayName),
      }));
    }
    setLoading(false);
  };

  const handleDisplayNameChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      display_name: val,
      slug: slugEdited ? prev.slug : slugify(val),
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.display_name.trim() || !form.slug.trim()) {
      setToast({ message: 'Display name and slug are required', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        display_name: form.display_name,
        slug: form.slug,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
        twitter_url: form.twitter_url || null,
        linkedin_url: form.linkedin_url || null,
        facebook_url: form.facebook_url || null,
        website_url: form.website_url || null,
        is_active: true,
        role: user.role || 'staff',
      };

      if (profileId) {
        await supabase.from('author_profiles').update(payload).eq('id', profileId);
      } else {
        const { data } = await supabase.from('author_profiles').insert(payload).select().maybeSingle();
        if (data) setProfileId(data.id);
      }
      setToast({ message: 'Profile saved successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = form.slug ? `/author/${form.slug}` : null;

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <User size={28} className="text-blue-600" />
              Author Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Your public writer profile visible to readers</p>
          </div>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <ExternalLink size={14} />
              View Profile
            </a>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Basic Info</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={e => handleDisplayNameChange(e.target.value)}
                  placeholder="Your public name"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Profile URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm whitespace-nowrap">/author/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => { setForm(prev => ({ ...prev, slug: slugify(e.target.value) })); setSlugEdited(true); }}
                    placeholder="your-name"
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  />
                </div>
                {form.slug && (
                  <p className="text-xs text-gray-400 mt-1">Public URL: mayobebros.com/author/{form.slug}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell readers about yourself..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.bio.length} characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={e => setForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {form.avatar_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={form.avatar_url} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Avatar preview</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Social Links</h3>

              {[
                { key: 'twitter_url', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/yourhandle' },
                { key: 'linkedin_url', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/yourprofile' },
                { key: 'facebook_url', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourprofile' },
                { key: 'website_url', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Icon size={14} /> {label}
                  </label>
                  <input
                    type="url"
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <ExternalLink size={16} />
                  Preview
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
