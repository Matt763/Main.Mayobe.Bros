import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import {
  Users,
  Plus,
  Trash2,
  Crown,
  Shield,
  User,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';

interface AdminUserRecord {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'ceo' | 'admin' | 'staff';
  hired_by: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS = { ceo: 'CEO', admin: 'Admin', staff: 'Staff / Publisher' };
const ROLE_COLORS = {
  ceo: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  staff: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
const ROLE_ICONS = { ceo: Crown, admin: Shield, staff: User };

export default function PublishersPage() {
  const { user } = useAuth();
  const { isCEO, isAdmin } = useRole();
  const [publishers, setPublishers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', displayName: '', password: '', role: isCEO ? 'admin' : 'staff', showPassword: false });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    loadPublishers();
  }, []);

  const loadPublishers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      setPublishers((data || []) as AdminUserRecord[]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addForm.email || !addForm.password || !addForm.displayName) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    if (addForm.password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    if (isAdmin && addForm.role !== 'staff') {
      setToast({ message: 'Admins can only hire Staff/Publishers', type: 'error' });
      return;
    }

    setAddLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.admin
        ? { data: null, error: { message: 'Use service role' } }
        : { data: null, error: { message: 'Direct signup required' } };

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

      setToast({ message: `${addForm.displayName} added as ${ROLE_LABELS[addForm.role as keyof typeof ROLE_LABELS]}`, type: 'success' });
      setShowAdd(false);
      setAddForm({ email: '', displayName: '', password: '', role: isCEO ? 'admin' : 'staff', showPassword: false });
      await loadPublishers();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to add user', type: 'error' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (record: AdminUserRecord) => {
    if (record.role === 'ceo') {
      setToast({ message: 'Cannot deactivate the CEO account', type: 'error' });
      return;
    }
    if (isAdmin && record.role === 'admin') {
      setToast({ message: 'Admins cannot deactivate other Admins', type: 'error' });
      return;
    }

    await supabase
      .from('admin_users')
      .update({ is_active: !record.is_active })
      .eq('id', record.id);

    setPublishers((prev) =>
      prev.map((p) => (p.id === record.id ? { ...p, is_active: !record.is_active } : p))
    );
    setToast({ message: `User ${!record.is_active ? 'activated' : 'deactivated'}`, type: 'success' });
  };

  const handleDelete = async (record: AdminUserRecord) => {
    if (record.role === 'ceo') {
      setToast({ message: 'Cannot remove the CEO account', type: 'error' });
      return;
    }
    if (isAdmin && record.role === 'admin') {
      setToast({ message: 'Admins cannot remove other Admins', type: 'error' });
      return;
    }

    if (!confirm(`Remove ${record.display_name} (${record.email})? They will lose CMS access.`)) return;

    await supabase.from('admin_users').delete().eq('id', record.id);
    setPublishers((prev) => prev.filter((p) => p.id !== record.id));
    setToast({ message: 'User removed', type: 'success' });
  };

  const filtered = publishers.filter(
    (p) =>
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const roleOptions = isCEO
    ? [{ value: 'admin', label: 'Admin' }, { value: 'staff', label: 'Staff / Publisher' }]
    : [{ value: 'staff', label: 'Staff / Publisher' }];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Team Management</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isCEO
                ? 'Manage Admins and Staff/Publishers. Only you can hire Admins.'
                : 'Hire and manage Staff/Publishers for content creation.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadPublishers} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Add {isCEO ? 'Member' : 'Publisher'}</span>
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
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
                  onChange={(e) => setAddForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temporary Password</label>
                <div className="relative">
                  <input
                    type={addForm.showPassword ? 'text' : 'password'}
                    value={addForm.password}
                    onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setAddForm((f) => ({ ...f, showPassword: !f.showPassword }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {addForm.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Share the email and temporary password with the new team member. They can log in at <strong>/admin/login</strong> and will only see what their role permits.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddUser}
                disabled={addLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                {addLoading ? 'Adding...' : 'Add Member'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-5 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>{search ? 'No members match your search' : 'No team members yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((record) => {
                const RoleIcon = ROLE_ICONS[record.role];
                const canManage = record.role !== 'ceo' && (isCEO || (isAdmin && record.role === 'staff'));
                return (
                  <div key={record.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {record.display_name?.[0]?.toUpperCase() || record.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{record.display_name || '—'}</p>
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
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[record.role]}`}>
                        <RoleIcon size={11} />
                        {ROLE_LABELS[record.role]}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(record)}
                            className={`p-2 rounded-lg transition-colors ${record.is_active ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                            title={record.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {record.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { role: 'ceo', label: 'CEO', desc: 'Full access. Approves Admin posts. Hires Admins & Staff.', color: 'border-amber-400', icon: Crown },
            { role: 'admin', label: 'Admin', desc: 'Manages content, subscribers, settings. Posts need CEO approval. Hires Staff.', color: 'border-blue-400', icon: Shield },
            { role: 'staff', label: 'Staff / Publisher', desc: 'Can only write posts and manage labels. Posts need CEO or Admin approval.', color: 'border-gray-300 dark:border-gray-600', icon: User },
          ].map(({ role, label, desc, color, icon: Icon }) => (
            <div key={role} className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${color} p-4 shadow-sm`}>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`}>
                <Icon size={11} />
                {label}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
