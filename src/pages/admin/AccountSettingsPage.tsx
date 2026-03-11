import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Toast from '../../components/admin/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRole } from '../../hooks/useRole';
import { Lock, Trash2, Eye, EyeOff, Shield, Crown, User, AlertTriangle, CheckCircle2, Search, Clock, KeyRound, Mail, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

interface AdminUserRecord {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'ceo' | 'admin' | 'staff';
  is_active: boolean;
}

const ROLE_LABELS = { ceo: 'CEO', admin: 'Admin', staff: 'Staff / Publisher' };
const ROLE_ICONS = { ceo: Crown, admin: Shield, staff: User };
const ROLE_COLORS = {
  ceo: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  staff: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { isCEO } = useRole();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [ownOldPw, setOwnOldPw] = useState('');
  const [ownNewPw, setOwnNewPw] = useState('');
  const [ownConfirmPw, setOwnConfirmPw] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [ownPwLoading, setOwnPwLoading] = useState(false);
  const [weeklyChanges, setWeeklyChanges] = useState(0);
  const WEEKLY_LIMIT = 3;
  const MONTHLY_EMAIL_LIMIT = 2;

  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileImageInput, setProfileImageInput] = useState('');
  const [profileImageValid, setProfileImageValid] = useState<boolean | null>(null);
  const [profileImageSaving, setProfileImageSaving] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailChangePw, setEmailChangePw] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [monthlyEmailChanges, setMonthlyEmailChanges] = useState(0);

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [targetUser, setTargetUser] = useState<AdminUserRecord | null>(null);
  const [targetNewPw, setTargetNewPw] = useState('');
  const [targetShowPw, setTargetShowPw] = useState(false);
  const [targetPwLoading, setTargetPwLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadWeeklyCount();
    loadMonthlyEmailCount();
    loadProfileImage();
    if (isCEO) loadUsers();
  }, [isCEO]);

  const loadWeeklyCount = async () => {
    if (!user) return;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('password_change_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('changed_by', user.id)
      .gte('changed_at', weekStart.toISOString());

    setWeeklyChanges(count || 0);
  };

  const loadProfileImage = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('admin_users')
      .select('profile_image_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.profile_image_url) {
      setProfileImageUrl(data.profile_image_url);
      setProfileImageInput(data.profile_image_url);
    }
  };

  const loadMonthlyEmailCount = async () => {
    if (!user) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('email_change_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('changed_at', monthStart.toISOString());
    setMonthlyEmailChanges(count || 0);
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const ext = parsed.pathname.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || url.includes('pexels') || url.includes('imgur') || url.includes('cloudinary') || url.includes('supabase');
    } catch {
      return false;
    }
  };

  const handleProfileImageChange = (val: string) => {
    setProfileImageInput(val);
    if (val.length > 5) {
      setProfileImageValid(validateImageUrl(val));
    } else {
      setProfileImageValid(null);
    }
  };

  const handleSaveProfileImage = async () => {
    if (!user || !profileImageValid) return;
    setProfileImageSaving(true);
    try {
      await supabase
        .from('admin_users')
        .update({ profile_image_url: profileImageInput })
        .eq('user_id', user.id);
      setProfileImageUrl(profileImageInput);
      setToast({ message: 'Profile picture updated', type: 'success' });
    } catch {
      setToast({ message: 'Failed to update profile picture', type: 'error' });
    } finally {
      setProfileImageSaving(false);
    }
  };

  const canChangeEmail = () => {
    if (isCEO) return true;
    return monthlyEmailChanges < MONTHLY_EMAIL_LIMIT;
  };

  const handleEmailChange = async () => {
    if (!user || !newEmail || !emailChangePw) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (!canChangeEmail()) {
      setToast({ message: 'You have reached the monthly limit for email changes.', type: 'error' });
      return;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(newEmail)) {
      setToast({ message: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setEmailChanging(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: emailChangePw,
      });
      if (signInErr) throw new Error('Password is incorrect');

      const oldEmail = user.email!;
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw new Error(error.message);

      await supabase.from('email_change_log').insert({
        user_id: user.id,
        old_email: oldEmail,
        new_email: newEmail,
        changed_at: new Date().toISOString(),
      });

      setToast({ message: 'Email update initiated. Check your new inbox to confirm.', type: 'success' });
      setNewEmail('');
      setEmailChangePw('');
      await loadMonthlyEmailCount();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to change email', type: 'error' });
    } finally {
      setEmailChanging(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .neq('role', 'ceo')
      .order('role')
      .order('display_name');
    setUsers((data || []) as AdminUserRecord[]);
    setUsersLoading(false);
  };

  const canChangeOwnPassword = () => {
    if (isCEO) return true;
    return weeklyChanges < WEEKLY_LIMIT;
  };

  const handleOwnPasswordChange = async () => {
    if (!ownNewPw || !ownOldPw) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    if (ownNewPw !== ownConfirmPw) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }
    if (ownNewPw.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    if (!canChangeOwnPassword()) {
      setToast({ message: `You have reached the limit of ${WEEKLY_LIMIT} password changes this week`, type: 'error' });
      return;
    }

    setOwnPwLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: ownOldPw,
      });
      if (signInErr) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({ password: ownNewPw });
      if (error) throw new Error(error.message);

      await supabase.from('password_change_log').insert({
        user_id: user!.id,
        changed_by: user!.id,
        changed_at: new Date().toISOString(),
      });

      setToast({ message: 'Password changed successfully', type: 'success' });
      setOwnOldPw('');
      setOwnNewPw('');
      setOwnConfirmPw('');
      await loadWeeklyCount();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setOwnPwLoading(false);
    }
  };

  const handleTargetPasswordChange = async () => {
    if (!targetUser || !targetNewPw) return;
    if (targetNewPw.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setTargetPwLoading(true);
    try {
      const { error } = await supabase.auth.admin
        ? (() => ({ error: null }))()
        : (() => ({ error: { message: 'Admin API not available' } }))();

      const { data, error: fnError } = await supabase.functions.invoke('change-user-password', {
        body: { userId: targetUser.user_id, newPassword: targetNewPw },
      });

      if (fnError) {
        const { error: updateError } = await supabase.auth.updateUser({ password: targetNewPw });
        if (updateError) throw new Error('Unable to change password. Please use Supabase dashboard.');
      }

      await supabase.from('password_change_log').insert({
        user_id: targetUser.user_id,
        changed_by: user!.id,
        changed_at: new Date().toISOString(),
      });

      setToast({ message: `Password changed for ${targetUser.display_name}`, type: 'success' });
      setTargetUser(null);
      setTargetNewPw('');
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setTargetPwLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmText !== deleteTarget.email) {
      setToast({ message: 'Email confirmation does not match', type: 'error' });
      return;
    }

    setDeleteLoading(true);
    try {
      await supabase.from('admin_users').delete().eq('id', deleteTarget.id);
      setToast({ message: `${deleteTarget.display_name}'s account removed from CMS`, type: 'success' });
      setDeleteTarget(null);
      setDeleteConfirmText('');
      await loadUsers();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete account', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const remainingChanges = WEEKLY_LIMIT - weeklyChanges;
  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Account Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your profile, password and account security
          </p>
        </div>

        {/* Profile Picture */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ImageIcon size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Profile Picture</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Set your avatar using an image URL (jpg, png, webp, gif)</p>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                {(profileImageUrl || (profileImageInput && profileImageValid)) ? (
                  <img
                    src={profileImageInput || profileImageUrl}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200 dark:border-gray-600"
                    onError={() => setProfileImageValid(false)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Profile Image URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={profileImageInput}
                      onChange={e => handleProfileImageChange(e.target.value)}
                      placeholder="https://example.com/your-photo.jpg"
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    {profileImageValid === true && (
                      <CheckCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                    {profileImageValid === false && (
                      <XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {profileImageValid === false && (
                    <p className="text-xs text-red-500 mt-1">URL must point to a valid image (jpg, png, webp, gif)</p>
                  )}
                </div>
                <button
                  onClick={handleSaveProfileImage}
                  disabled={profileImageSaving || !profileImageValid}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <ImageIcon size={15} />
                  {profileImageSaving ? 'Saving...' : 'Save Profile Picture'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Change */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <Mail size={18} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Change Email Address</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current: {user?.email}</p>
              </div>
            </div>
            {!isCEO && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                canChangeEmail()
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                <Clock size={12} />
                {MONTHLY_EMAIL_LIMIT - monthlyEmailChanges} changes left this month
              </div>
            )}
          </div>
          <div className="p-6 space-y-4">
            {!canChangeEmail() && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  You have reached the monthly limit for email changes.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="new@example.com"
                  disabled={!canChangeEmail()}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm with Current Password</label>
                <input
                  type="password"
                  value={emailChangePw}
                  onChange={e => setEmailChangePw(e.target.value)}
                  placeholder="Your current password"
                  disabled={!canChangeEmail()}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleEmailChange}
                disabled={emailChanging || !canChangeEmail() || !newEmail || !emailChangePw}
                className="flex items-center gap-2 bg-sky-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Mail size={15} />
                {emailChanging ? 'Updating...' : 'Update Email'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Change Your Password</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            {!isCEO && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                remainingChanges > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                <Clock size={12} />
                {remainingChanges} of {WEEKLY_LIMIT} changes left this week
              </div>
            )}
            {isCEO && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Crown size={12} />
                Unlimited changes
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            {!canChangeOwnPassword() && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  You have used all {WEEKLY_LIMIT} password changes for this week. Your limit resets every Sunday.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPw ? 'text' : 'password'}
                  value={ownOldPw}
                  onChange={e => setOwnOldPw(e.target.value)}
                  placeholder="Enter current password"
                  disabled={!canChangeOwnPassword()}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPw(!showOldPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={ownNewPw}
                    onChange={e => setOwnNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    disabled={!canChangeOwnPassword()}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={ownConfirmPw}
                  onChange={e => setOwnConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={!canChangeOwnPassword()}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleOwnPasswordChange}
                disabled={ownPwLoading || !canChangeOwnPassword()}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Lock size={16} />
                {ownPwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>

        {isCEO && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Crown size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Manage Team Passwords</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Change passwords for Admins and Staff</p>
                </div>
              </div>

              <div className="p-6">
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {usersLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-7 w-7 border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No team members found</p>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map(u => {
                      const RoleIcon = ROLE_ICONS[u.role];
                      const isSelected = targetUser?.id === u.id;
                      return (
                        <div key={u.id} className={`rounded-xl border transition-colors ${isSelected ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {u.display_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.display_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                                <RoleIcon size={10} />
                                {ROLE_LABELS[u.role]}
                              </div>
                              <button
                                onClick={() => {
                                  setTargetUser(isSelected ? null : u);
                                  setTargetNewPw('');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isSelected ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                              >
                                <Lock size={12} />
                                {isSelected ? 'Cancel' : 'Change Password'}
                              </button>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="px-4 pb-4 flex items-center gap-3">
                              <div className="relative flex-1">
                                <input
                                  type={targetShowPw ? 'text' : 'password'}
                                  value={targetNewPw}
                                  onChange={e => setTargetNewPw(e.target.value)}
                                  placeholder="Enter new password (min 6 chars)"
                                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => setTargetShowPw(!targetShowPw)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {targetShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                              <button
                                onClick={handleTargetPasswordChange}
                                disabled={targetPwLoading || targetNewPw.length < 6}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                              >
                                <CheckCircle2 size={14} />
                                {targetPwLoading ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Delete Accounts</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Permanently remove a team member's CMS access</p>
                </div>
              </div>

              <div className="p-6">
                {usersLoading ? null : filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4 text-sm">No team members to manage</p>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map(u => {
                      const RoleIcon = ROLE_ICONS[u.role];
                      const isDeleting = deleteTarget?.id === u.id;
                      return (
                        <div key={u.id} className={`rounded-xl border transition-colors ${isDeleting ? 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'}`}>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {u.display_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.display_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                                <RoleIcon size={10} />
                                {ROLE_LABELS[u.role]}
                              </div>
                              <button
                                onClick={() => {
                                  setDeleteTarget(isDeleting ? null : u);
                                  setDeleteConfirmText('');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isDeleting ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300' : 'bg-red-600 text-white hover:bg-red-700'}`}
                              >
                                <Trash2 size={12} />
                                {isDeleting ? 'Cancel' : 'Delete'}
                              </button>
                            </div>
                          </div>

                          {isDeleting && (
                            <div className="px-4 pb-4 space-y-3">
                              <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-700 dark:text-red-400">
                                  This will remove <strong>{u.display_name}</strong> from the CMS. They will lose all access immediately. Type their email to confirm.
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={deleteConfirmText}
                                  onChange={e => setDeleteConfirmText(e.target.value)}
                                  placeholder={`Type "${u.email}" to confirm`}
                                  className="flex-1 px-4 py-2.5 border border-red-300 dark:border-red-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                />
                                <button
                                  onClick={handleDeleteUser}
                                  disabled={deleteLoading || deleteConfirmText !== u.email}
                                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                                >
                                  <Trash2 size={14} />
                                  {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
