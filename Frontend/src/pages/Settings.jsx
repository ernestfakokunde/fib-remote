import React, { useState } from 'react';
import { useGlobalContext } from '../context/context';
import { toast } from 'react-toastify';

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

  const handleSignOut = () => {
    logout();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Settings</h2>
        <p className="text-sm text-gray-500 mb-4">
          Manage your basic account information.
        </p>

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              disabled
            />
          </div>
          <div className="md:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Update Password</h2>
        <p className="text-sm text-gray-500 mb-4">
          Change your account password.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign Out</h2>
          <p className="text-sm text-gray-500">
            Sign out of your account on this device.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm"
        >
          Sign Out
        </button>
      </section>

        <section className='p-6 font-sans'>
          <p>This website is an open Source project developed and managed by @Ayodele</p>
          <p className='mt-2 font-semibold'>contact developer: ernest.dev10@gmail.com </p>
           </section>
  
    </div>
  );
};

export default Settings;
