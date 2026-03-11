import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import {
  Users,
  UserPlus,
  Trash2,
  Download,
  Search,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  ShieldOff,
  Shield,
  AlertTriangle,
  X,
  UserX,
  Globe,
  User,
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  source: string;
  confirmed_at: string | null;
  created_at: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: 'email' | 'google';
  is_banned: boolean;
  ban_reason: string | null;
  newsletter_unsubscribed: boolean;
  last_sign_in_at: string | null;
  created_at: string;
}

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

type Tab = 'subscribers' | 'users';

interface BanModalState {
  user: RegisteredUser;
  reason: string;
}

interface ConfirmModalState {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
}

function StatCard({ icon, iconBg, value, label }: { icon: React.ReactNode; iconBg: string; value: number; label: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function SubscribersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('subscribers');

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<RegisteredUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'banned'>('all');

  const [toast, setToast] = useState<ToastState | null>(null);
  const [banModal, setBanModal] = useState<BanModalState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  useEffect(() => {
    loadSubscribers();
    loadRegisteredUsers();
  }, []);

  useEffect(() => {
    let result = subscribers;
    if (subStatusFilter === 'active') result = result.filter(s => s.is_active);
    if (subStatusFilter === 'inactive') result = result.filter(s => !s.is_active);
    if (subSearch.trim()) result = result.filter(s => s.email.toLowerCase().includes(subSearch.toLowerCase()));
    setFilteredSubscribers(result);
  }, [subscribers, subSearch, subStatusFilter]);

  useEffect(() => {
    let result = registeredUsers;
    if (userStatusFilter === 'active') result = result.filter(u => !u.is_banned);
    if (userStatusFilter === 'banned') result = result.filter(u => u.is_banned);
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      result = result.filter(u => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    }
    setFilteredUsers(result);
  }, [registeredUsers, userSearch, userStatusFilter]);

  const showToast = (type: ToastState['type'], message: string) => setToast({ type, message });

  const loadSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubscribers(data || []);
    } catch {
      showToast('error', 'Failed to load subscribers');
    } finally {
      setSubscribersLoading(false);
    }
  };

  const loadRegisteredUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('registered_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRegisteredUsers(data || []);
    } catch {
      showToast('error', 'Failed to load registered users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      const email = addEmail.trim().toLowerCase();
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id, is_active')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        if (existing.is_active) throw new Error('Email already subscribed');
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true, unsubscribed_at: null, confirmed_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert({ email, is_active: true, source: 'admin', confirmed_at: new Date().toISOString() });
        if (error) throw error;
      }
      showToast('success', `${addEmail} added successfully`);
      setAddEmail('');
      setShowAddForm(false);
      loadSubscribers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add subscriber');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSubscriber = async (id: string, email: string) => {
    setDeletingSubId(id);
    try {
      const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
      if (error) throw error;
      showToast('success', `${email} removed`);
      setSubscribers(prev => prev.filter(s => s.id !== id));
    } catch {
      showToast('error', 'Failed to remove subscriber');
    } finally {
      setDeletingSubId(null);
    }
  };

  const confirmDeleteSubscriber = (id: string, email: string) => {
    setConfirmModal({
      title: 'Remove subscriber?',
      message: `Are you sure you want to remove "${email}" from the newsletter?`,
      confirmLabel: 'Remove',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      onConfirm: () => { setConfirmModal(null); handleDeleteSubscriber(id, email); },
    });
  };

  const handleToggleSubscriberActive = async (subscriber: Subscriber) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: !subscriber.is_active,
          unsubscribed_at: !subscriber.is_active ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriber.id);
      if (error) throw error;
      setSubscribers(prev =>
        prev.map(s => s.id === subscriber.id ? { ...s, is_active: !s.is_active } : s)
      );
      showToast('success', `Subscriber ${!subscriber.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      showToast('error', 'Failed to update subscriber');
    }
  };

  const handleBulkDeleteSubscribers = () => {
    const count = selectedSubs.size;
    setConfirmModal({
      title: `Delete ${count} subscribers?`,
      message: 'This will permanently remove the selected subscribers. This cannot be undone.',
      confirmLabel: `Delete ${count} subscribers`,
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase
            .from('newsletter_subscribers')
            .delete()
            .in('id', [...selectedSubs]);
          if (error) throw error;
          setSubscribers(prev => prev.filter(s => !selectedSubs.has(s.id)));
          setSelectedSubs(new Set());
          showToast('success', `${count} subscribers deleted`);
        } catch {
          showToast('error', 'Failed to delete some subscribers');
        }
      },
    });
  };

  const handleExport = () => {
    const rows = [
      ['Email', 'Status', 'Source', 'Subscribed At'],
      ...subscribers.map(s => [
        s.email,
        s.is_active ? 'Active' : 'Unsubscribed',
        s.source || 'website',
        new Date(s.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectSub = (id: string) => {
    setSelectedSubs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleSelectAllSubs = () => {
    if (selectedSubs.size === filteredSubscribers.length) setSelectedSubs(new Set());
    else setSelectedSubs(new Set(filteredSubscribers.map(s => s.id)));
  };

  const handleBanUser = async () => {
    if (!banModal) return;
    const { user, reason } = banModal;
    try {
      const { error } = await supabase
        .from('registered_users')
        .update({ is_banned: true, ban_reason: reason || null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      setRegisteredUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_banned: true, ban_reason: reason || null } : u)
      );
      setBanModal(null);
      showToast('success', `${user.email} has been banned`);
    } catch {
      showToast('error', 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (user: RegisteredUser) => {
    try {
      const { error } = await supabase
        .from('registered_users')
        .update({ is_banned: false, ban_reason: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      setRegisteredUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_banned: false, ban_reason: null } : u)
      );
      showToast('success', `${user.email} has been unbanned`);
    } catch {
      showToast('error', 'Failed to unban user');
    }
  };

  const handleRemoveUserNewsletter = async (user: RegisteredUser) => {
    try {
      await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq('email', user.email);

      await supabase
        .from('registered_users')
        .update({ newsletter_unsubscribed: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      setRegisteredUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, newsletter_unsubscribed: true } : u)
      );
      showToast('success', `Newsletter subscription removed for ${user.email}`);
      loadSubscribers();
    } catch {
      showToast('error', 'Failed to remove newsletter subscription');
    }
  };

  const confirmDeleteUser = (user: RegisteredUser) => {
    setConfirmModal({
      title: 'Delete registered user?',
      message: `This will permanently delete "${user.email}" from the registered users list. This cannot be undone.`,
      confirmLabel: 'Delete User',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const { error } = await supabase.from('registered_users').delete().eq('id', user.id);
          if (error) throw error;
          setRegisteredUsers(prev => prev.filter(u => u.id !== user.id));
          showToast('success', `${user.email} deleted`);
        } catch {
          showToast('error', 'Failed to delete user');
        }
      },
    });
  };

  const activeSubCount = subscribers.filter(s => s.is_active).length;
  const inactiveSubCount = subscribers.filter(s => !s.is_active).length;
  const activeUserCount = registeredUsers.filter(u => !u.is_banned).length;
  const bannedUserCount = registeredUsers.filter(u => u.is_banned).length;

  return (
    <AdminLayout>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Subscribers & Users</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage newsletter subscribers and registered accounts</p>
          </div>
          {activeTab === 'subscribers' && (
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <UserPlus size={16} />
                Add Subscriber
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'subscribers'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Mail size={16} />
            Newsletter ({subscribers.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users size={16} />
            Registered Users ({registeredUsers.length})
          </button>
        </div>

        {activeTab === 'subscribers' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                value={subscribers.length}
                label="Total Subscribers"
              />
              <StatCard
                icon={<CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />}
                iconBg="bg-green-100 dark:bg-green-900/30"
                value={activeSubCount}
                label="Active"
              />
              <StatCard
                icon={<XCircle size={20} className="text-red-500 dark:text-red-400" />}
                iconBg="bg-red-100 dark:bg-red-900/30"
                value={inactiveSubCount}
                label="Unsubscribed"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={subSearch}
                    onChange={e => setSubSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={subStatusFilter}
                    onChange={e => setSubStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Unsubscribed</option>
                  </select>
                  <button
                    onClick={loadSubscribers}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {selectedSubs.size > 0 && (
                <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedSubs.size} selected</span>
                  <button
                    onClick={handleBulkDeleteSubscribers}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete selected
                  </button>
                </div>
              )}

              {subscribersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="text-center py-16">
                  <Mail size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No subscribers found</p>
                  {subSearch && (
                    <button onClick={() => setSubSearch('')} className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSubs.size === filteredSubscribers.length && filteredSubscribers.length > 0}
                            onChange={toggleSelectAllSubs}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Subscribed</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredSubscribers.map(subscriber => (
                        <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedSubs.has(subscriber.id)}
                              onChange={() => toggleSelectSub(subscriber.id)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">
                                {subscriber.email[0].toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                {subscriber.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleSubscriberActive(subscriber)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                subscriber.is_active
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {subscriber.is_active
                                ? <><CheckCircle2 size={12} /> Active</>
                                : <><XCircle size={12} /> Unsubscribed</>}
                            </button>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {subscriber.source || 'website'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(subscriber.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => confirmDeleteSubscriber(subscriber.id, subscriber.email)}
                                disabled={deletingSubId === subscriber.id}
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Remove subscriber"
                              >
                                {deletingSubId === subscriber.id
                                  ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                  : <Trash2 size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredSubscribers.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredSubscribers.length} of {subscribers.length} subscribers
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                value={registeredUsers.length}
                label="Total Registered"
              />
              <StatCard
                icon={<CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />}
                iconBg="bg-green-100 dark:bg-green-900/30"
                value={activeUserCount}
                label="Active Accounts"
              />
              <StatCard
                icon={<ShieldOff size={20} className="text-red-500 dark:text-red-400" />}
                iconBg="bg-red-100 dark:bg-red-900/30"
                value={bannedUserCount}
                label="Banned"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value as 'all' | 'active' | 'banned')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Only</option>
                    <option value="banned">Banned Only</option>
                  </select>
                  <button
                    onClick={loadRegisteredUsers}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {registeredUsers.length === 0 ? 'No registered users yet' : 'No users match your search'}
                  </p>
                  {userSearch && (
                    <button onClick={() => setUserSearch('')} className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Provider</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Newsletter</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredUsers.map(user => (
                        <tr
                          key={user.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${user.is_banned ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                  {(user.name || user.email)[0].toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name || '—'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              user.provider === 'google'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {user.provider === 'google' ? <Globe size={11} /> : <User size={11} />}
                              {user.provider === 'google' ? 'Google' : 'Email'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {user.is_banned ? (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                  <ShieldOff size={11} /> Banned
                                </span>
                                {user.ban_reason && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[150px] truncate" title={user.ban_reason}>
                                    {user.ban_reason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <CheckCircle2 size={11} /> Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {user.newsletter_unsubscribed ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Removed</span>
                            ) : (
                              <span className="text-xs text-green-600 dark:text-green-400">Subscribed</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {!user.newsletter_unsubscribed && (
                                <button
                                  onClick={() => handleRemoveUserNewsletter(user)}
                                  className="p-2 text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                  title="Remove newsletter subscription"
                                >
                                  <Mail size={15} />
                                </button>
                              )}
                              {user.is_banned ? (
                                <button
                                  onClick={() => handleUnbanUser(user)}
                                  className="p-2 text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                  title="Unban user"
                                >
                                  <Shield size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanModal({ user, reason: '' })}
                                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Ban user"
                                >
                                  <ShieldOff size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => confirmDeleteUser(user)}
                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredUsers.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredUsers.length} of {registeredUsers.length} users
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Subscriber</h2>
              <button
                onClick={() => { setShowAddForm(false); setAddEmail(''); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddEmail(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {adding
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</>
                    : 'Add Subscriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <UserX size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Ban user</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Banning <span className="font-semibold text-gray-700 dark:text-gray-300">{banModal.user.email}</span> will prevent them from accessing the site.
                </p>
              </div>
              <button
                onClick={() => setBanModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason (optional)</label>
              <textarea
                value={banModal.reason}
                onChange={e => setBanModal({ ...banModal, reason: e.target.value })}
                placeholder="Describe why this user is being banned..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBanModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldOff size={16} />
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{confirmModal.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{confirmModal.message}</p>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${confirmModal.confirmClass}`}
              >
                <Trash2 size={16} />
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
