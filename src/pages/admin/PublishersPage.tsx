import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import {
  Users, Plus, Trash2, Crown, Shield, PenLine,
  Mail, Eye, EyeOff, RefreshCw, Search, AlertCircle,
  CheckCircle2, Lock,
} from 'lucide-react';

interface AdminUserRecord {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'ceo' | 'admin' | 'publisher';
  hired_by: string | null;
  is_active: boolean;
  created_at: string;
}

const MAX_ADMINS = 3;

const ROLE_META = {
  ceo: {
    label: 'CEO',
    icon: Crown,
    pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    border: 'border-l-amber-400',
    avatar: 'from-amber-500 to-orange-500',
    desc: 'Full platform access. Approves admin posts before publishing. Only one — Mclean Mbaga.',
    perms: ['Publish posts instantly', 'Approve / reject admin posts', 'Hire & fire admins', 'Hire publishers', 'Manage all settings', 'Access iTango AI panel'],
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    border: 'border-l-blue-500',
    avatar: 'from-blue-500 to-blue-700',
    desc: 'Senior team member. Manages content & subscribers. Max 3 across the team.',
    perms: ['Write & submit posts for CEO approval', 'Manage comments, reviews, pages', 'Hire publishers', 'Manage newsletter subscribers', 'View analytics'],
  },
  publisher: {
    label: 'Publisher',
    icon: PenLine,
    pill: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    border: 'border-l-green-500',
    avatar: 'from-green-500 to-emerald-600',
    desc: 'Content creators hired by CEO or Admins. Unlimited slots available.',
    perms: ['Write & submit posts for approval', 'Manage own labels', 'Upload media', 'View own post stats'],
  },
};

export default function PublishersPage() {
  const { user } = useAuth();
  const { isCEO, isAdmin } = useRole();
  const [members, setMembers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '', displayName: '', password: '',
    role: isCEO ? 'admin' : 'publisher',
    showPassword: false,
  });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      setMembers((data || []) as AdminUserRecord[]);
    } finally {
      setLoading(false);
    }
  };

  const adminCount = members.filter(m => m.role === 'admin').length;
  const publisherCount = members.filter(m => m.role === 'publisher').length;
  const adminSlotsLeft = MAX_ADMINS - adminCount;

  const handleAddMember = async () => {
    if (!addForm.email || !addForm.password || !addForm.displayName) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (addForm.password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    if (isAdmin && addForm.role !== 'publisher') {
      setToast({ message: 'Admins can only hire Publishers', type: 'error' });
      return;
    }
    if (addForm.role === 'admin' && adminCount >= MAX_ADMINS) {
      setToast({ message: `Admin limit reached (${MAX_ADMINS} max). Remove an admin first to add a new one.`, type: 'error' });
      return;
    }

    setAddLoading(true);
    try {
      const { data: signUpData, error: suErr } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: { data: { display_name: addForm.displayName } },
      });
      if (suErr) throw new Error(suErr.message);
      if (!signUpData.user) throw new Error('User creation failed');

      const { error: insertError } = await supabase.from('admin_users').insert({
        user_id: signUpData.user.id,
        email: addForm.email.toLowerCase(),
        display_name: addForm.displayName,
        role: addForm.role,
        hired_by: user?.id || null,
        is_active: true,
      });
      if (insertError) throw new Error(insertError.message);

      const roleLabel = ROLE_META[addForm.role as keyof typeof ROLE_META]?.label;
      setToast({ message: `${addForm.displayName} added as ${roleLabel}`, type: 'success' });
      setShowAdd(false);
      setAddForm({ email: '', displayName: '', password: '', role: isCEO ? 'admin' : 'publisher', showPassword: false });
      await loadMembers();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to add member', type: 'error' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (record: AdminUserRecord) => {
    if (record.role === 'ceo') {
      setToast({ message: 'The CEO account cannot be deactivated', type: 'error' });
      return;
    }
    if (isAdmin && record.role === 'admin') {
      setToast({ message: 'Admins cannot deactivate other Admins', type: 'error' });
      return;
    }
    await supabase.from('admin_users').update({ is_active: !record.is_active }).eq('id', record.id);
    setMembers(prev => prev.map(m => m.id === record.id ? { ...m, is_active: !m.is_active } : m));
    setToast({ message: `${record.display_name} ${!record.is_active ? 'activated' : 'deactivated'}`, type: 'success' });
  };

  const handleDelete = async (record: AdminUserRecord) => {
    if (record.role === 'ceo') {
      setToast({ message: 'The CEO account cannot be removed', type: 'error' });
      return;
    }
    if (isAdmin && record.role === 'admin') {
      setToast({ message: 'Admins cannot remove other Admins', type: 'error' });
      return;
    }
    if (!confirm(`Remove ${record.display_name} (${record.email})?\n\nThey will immediately lose access to the CMS.`)) return;
    await supabase.from('admin_users').delete().eq('id', record.id);
    setMembers(prev => prev.filter(m => m.id !== record.id));
    setToast({ message: `${record.display_name} removed from the team`, type: 'success' });
  };

  const filtered = members.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const roleOptions = isCEO
    ? [
        { value: 'admin', label: `Admin (${adminSlotsLeft} slot${adminSlotsLeft === 1 ? '' : 's'} left)`, disabled: adminSlotsLeft <= 0 },
        { value: 'publisher', label: 'Publisher (unlimited)' },
      ]
    : [{ value: 'publisher', label: 'Publisher' }];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Team Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isCEO
                ? 'You have full control. Hire up to 3 Admins and unlimited Publishers.'
                : 'Hire and manage Publishers for content creation.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadMembers} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-blue-900 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              <span>Add {isCEO ? 'Member' : 'Publisher'}</span>
            </button>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Crown size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">1</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-500 font-medium">CEO — Mclean Mbaga</p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Shield size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {adminCount}
                <span className="text-sm font-normal text-blue-400 dark:text-blue-500"> / {MAX_ADMINS}</span>
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-500 font-medium">
                Admins · {adminSlotsLeft} slot{adminSlotsLeft === 1 ? '' : 's'} remaining
              </p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <PenLine size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{publisherCount}</p>
              <p className="text-xs text-green-600/70 dark:text-green-500 font-medium">Publishers · Unlimited</p>
            </div>
          </div>
        </div>

        {/* ── Add Form ── */}
        {showAdd && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" />
              Add New {isCEO ? 'Team Member' : 'Publisher'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={addForm.displayName}
                  onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temporary Password</label>
                <div className="relative">
                  <input
                    type={addForm.showPassword ? 'text' : 'password'}
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button type="button" onClick={() => setAddForm(f => ({ ...f, showPassword: !f.showPassword }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {addForm.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {roleOptions.map(r => (
                    <option key={r.value} value={r.value} disabled={'disabled' in r && r.disabled}>{r.label}</option>
                  ))}
                </select>
                {addForm.role === 'admin' && adminSlotsLeft <= 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Lock size={11} /> All 3 admin slots are filled. Remove an admin first.</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
              <AlertCircle size={15} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Share the email and temporary password with the new member. They can sign in at <strong>/admin/login</strong> and will only see what their role permits.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddMember} disabled={addLoading || (addForm.role === 'admin' && adminSlotsLeft <= 0)}
                className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-blue-900 text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold">
                <Plus size={15} />
                {addLoading ? 'Adding...' : 'Add Member'}
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Members Table ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? 'No members match your search' : 'No team members yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(record => {
                const meta = ROLE_META[record.role] || ROLE_META.publisher;
                const RoleIcon = meta.icon;
                const canManage = record.role !== 'ceo' && (isCEO || (isAdmin && record.role === 'publisher'));
                return (
                  <div key={record.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${meta.avatar} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {record.display_name?.[0]?.toUpperCase() || record.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{record.display_name || '—'}</p>
                          {record.role === 'ceo' && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              FOUNDER
                            </span>
                          )}
                          {!record.is_active && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full font-medium">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Mail size={11} />
                          {record.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.pill}`}>
                        <RoleIcon size={11} />
                        {meta.label}
                      </div>
                      {canManage ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(record)}
                            className={`p-2 rounded-lg transition-colors ${record.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                            title={record.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {record.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove from team"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-[68px]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Role Hierarchy Cards ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Role Hierarchy & Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['ceo', 'admin', 'publisher'] as const).map(roleKey => {
              const meta = ROLE_META[roleKey];
              const Icon = meta.icon;
              return (
                <div key={roleKey} className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${meta.border} border border-gray-200 dark:border-gray-700 p-5 shadow-sm`}>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${meta.pill}`}>
                    <Icon size={11} />
                    {meta.label}
                    {roleKey === 'admin' && (
                      <span className="ml-1 text-[10px] opacity-70">max {MAX_ADMINS}</span>
                    )}
                    {roleKey === 'publisher' && (
                      <span className="ml-1 text-[10px] opacity-70">unlimited</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{meta.desc}</p>
                  <ul className="space-y-1.5">
                    {meta.perms.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
