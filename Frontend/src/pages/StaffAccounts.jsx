import React, { useEffect, useState } from 'react';
import { Copy, KeyRound, ShieldPlus, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context';

const StaffAccounts = () => {
  const { createSalesperson, getSalespeople } = useGlobalContext();
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
  });

  const fetchSalespeople = async () => {
    try {
      setLoading(true);
      const res = await getSalespeople();
      setSalespeople(Array.isArray(res.data?.salespeople) ? res.data.salespeople : []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load salesperson accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalespeople();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      toast.error('Username and email are required');
      return;
    }

    try {
      setSaving(true);
      const res = await createSalesperson({
        username: form.username.trim(),
        email: form.email.trim(),
      });

      setGeneratedCredentials({
        username: res.data?.salesperson?.username || form.username.trim(),
        email: res.data?.salesperson?.email || form.email.trim(),
        password: res.data?.generatedPassword || '',
      });

      setForm({ username: '', email: '' });
      toast.success('Salesperson account created');
      await fetchSalespeople();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create salesperson account');
    } finally {
      setSaving(false);
    }
  };

  const copyPassword = async () => {
    if (!generatedCredentials?.password) return;

    try {
      await navigator.clipboard.writeText(generatedCredentials.password);
      toast.success('Generated password copied');
    } catch (error) {
      toast.error('Could not copy password');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-6 py-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_40%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Team Access</p>
            <h1 className="mt-4 text-3xl font-semibold text-[var(--text)]">Create salesperson sub-accounts under your manager workspace.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Salesperson accounts can record sales, update stock-in, and view products, but they cannot manage products, settings, reports, or premium changes.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm text-[var(--text)]">
            Manager-only staff management
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="glass-panel rounded-[1.75rem] border border-white/10 p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-[var(--text)]">
              <ShieldPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">Create Salesperson Account</h2>
              <p className="text-sm text-[var(--muted)]">Generate a sub-account and password from the manager dashboard.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                className="theme-input w-full rounded-xl px-3 py-3"
                placeholder="e.g. shopfloor_joy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="theme-input w-full rounded-xl px-3 py-3"
                placeholder="salesperson@company.com"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sky-500/20 disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Salesperson'}
            </button>
          </form>
        </section>

        <section className="glass-panel rounded-[1.75rem] border border-white/10 p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-[var(--text)]">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">Generated Credentials</h2>
              <p className="text-sm text-[var(--muted)]">Copy the generated password now and send it to the staff member securely.</p>
            </div>
          </div>

          {generatedCredentials ? (
            <div className="mt-6 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-sm text-[var(--muted)]">Username</p>
              <p className="mt-1 text-base font-medium text-[var(--text)]">{generatedCredentials.username}</p>
              <p className="mt-4 text-sm text-[var(--muted)]">Email</p>
              <p className="mt-1 text-base font-medium text-[var(--text)]">{generatedCredentials.email}</p>
              <p className="mt-4 text-sm text-[var(--muted)]">Generated Password</p>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <span className="break-all text-sm font-medium text-[var(--text)]">{generatedCredentials.password}</span>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-[var(--text)]"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-[var(--muted)]">
              No password generated yet. Create a salesperson account to see the generated login details here.
            </div>
          )}
        </section>
      </div>

      <section className="glass-panel rounded-[1.75rem] border border-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-[var(--text)]">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">Existing Salespeople</h2>
            <p className="text-sm text-[var(--muted)]">Everyone created under this manager workspace.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-[var(--muted)]">Loading salesperson accounts...</div>
        ) : salespeople.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-[var(--muted)]">
            No salesperson accounts yet.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {salespeople.map((person) => (
              <div key={person._id || person.id || person.email} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-medium text-[var(--text)]">{person.username}</p>
                    <p className="text-sm text-[var(--muted)]">{person.email}</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Salesperson
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StaffAccounts;
