import React, { useEffect, useState } from 'react';
import { useGlobalContext } from '../context/context';
import { toast } from 'react-toastify';
import { Crown, Mail, Package, ShieldCheck, UserRound } from 'lucide-react';

const Settings = () => {
  const { user, logout, updateProfile, changePassword } = useGlobalContext();
  const [profile, setProfile] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfile({
      username: user?.username || '',
      email: user?.email || '',
    });
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.username.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      setSavingProfile(true);
      await updateProfile({ username: profile.username.trim() });
      toast.success('Profile updated');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    try {
      setSavingPassword(true);
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_38%)]" />
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2 flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/10 text-[var(--text)]">
              <UserRound size={28} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Account Details</p>
              <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">{user?.username || 'User'}</h1>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-[var(--muted)]">
                <Mail size={14} />
                {user?.email || 'No email'}
              </p>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Current Plan</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold capitalize text-[var(--text)]">{user?.subscriptionPlan || 'free'}</span>
              <Crown className="text-amber-300" size={18} />
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Products</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-semibold text-[var(--text)]">
                {user?.currentProductCount ?? 0} / {user?.productLimit ?? 'Unlimited'}
              </span>
              {(user?.canCreateProduct ?? true) ? (
                <Package className="text-sky-300" size={18} />
              ) : (
                <ShieldCheck className="text-rose-300" size={18} />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl border p-6">
        <h2 className="mb-1 text-lg font-semibold text-[var(--text)]">Account Settings</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">Manage your basic account information.</p>

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Name</label>
            <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="theme-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
            <input type="email" value={profile.email} className="theme-input rounded-lg px-3 py-2 text-sm opacity-80" disabled />
          </div>
          <div className="md:col-span-2 flex justify-end mt-2">
            <button type="submit" disabled={savingProfile} className="theme-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-60">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-panel rounded-3xl border p-6">
        <h2 className="mb-1 text-lg font-semibold text-[var(--text)]">Update Password</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">Change your account password.</p>

        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Current Password</label>
            <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="theme-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">New Password</label>
            <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="theme-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Confirm New Password</label>
            <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="theme-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPassword} className="theme-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-60">
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-panel flex items-center justify-between rounded-3xl border p-6">
        <div>
          <h2 className="mb-1 text-lg font-semibold text-[var(--text)]">Sign Out</h2>
          <p className="text-sm text-[var(--muted)]">Sign out of your account on this device.</p>
        </div>
        <button onClick={logout} className="theme-btn-danger rounded-lg px-4 py-2 text-sm">
          Sign Out
        </button>
      </section>

      <section className="p-6 font-sans text-[var(--muted)]">
        <p>This website is an open Source project developed and managed by @Ayodele</p>
        <p className="mt-2 font-semibold text-[var(--text)]">contact developer: ernest.dev10@gmail.com</p>
      </section>
    </div>
  );
};

export default Settings;
