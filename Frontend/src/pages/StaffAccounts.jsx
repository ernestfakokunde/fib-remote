import React, { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, ShieldPlus, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context';

const StaffAccounts = () => {
  const { createSalesperson, getSalespeople, user } = useGlobalContext();
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [form, setForm] = useState({ username: '', email: '' });

  const fetchSalespeople = useCallback(async () => {
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
  }, [getSalespeople]);

  useEffect(() => { fetchSalespeople(); }, [fetchSalespeople]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.username.trim() || !form.email.trim()) return toast.error('Username and email are required');
    try {
      setSaving(true);
      const res = await createSalesperson({ username: form.username.trim(), email: form.email.trim() });
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
    } finally { setSaving(false); }
  };

  const copyPassword = async () => {
    if (!generatedCredentials?.password) return;
    try { await navigator.clipboard.writeText(generatedCredentials.password); toast.success('Generated password copied'); }
    catch { toast.error('Could not copy password'); }
  };

  const atLimit = user?.teamLimit !== null && user?.teamLimit !== undefined && user.currentTeamCount >= user.teamLimit;

  return <main className="w-full space-y-5 py-5 sm:py-7">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Workspace</p><h1 className="app-page-title text-[var(--text)]">Team</h1><p className="app-page-copy mt-1">Manage staff access and share sign in details with your team.</p></div>
      <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted)]"><Users size={15} className="text-[var(--primary)]"/><span><strong className="font-semibold text-[var(--text)]">{user?.currentTeamCount ?? 0}</strong> / {user?.teamLimit ?? 'Unlimited'} team members</span></div>
    </header>

    <div className="grid gap-4 xl:grid-cols-2">
      <section className="app-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]"><ShieldPlus size={18}/></span><div><h2 className="text-sm font-semibold text-[var(--text)]">Add a salesperson</h2><p className="mt-0.5 text-xs text-[var(--muted)]">Create an account with sales and stock access.</p></div></div>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--muted)]">Username<input required type="text" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} className="theme-input app-control mt-1.5 px-3 text-sm" placeholder="e.g. shopfloor_joy"/></label>
          <label className="text-xs font-medium text-[var(--muted)]">Email<input required type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="theme-input app-control mt-1.5 px-3 text-sm" placeholder="staff@company.com"/></label>
          <div className="sm:col-span-2"><button type="submit" disabled={saving || atLimit} className="app-control inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-white transition hover:brightness-105 disabled:opacity-50"><Users size={14}/>{saving ? 'Creating…' : atLimit ? 'Team limit reached' : 'Create salesperson'}</button></div>
        </form>
      </section>

      <section className="app-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/10 text-violet-500"><KeyRound size={17}/></span><div><h2 className="text-sm font-semibold text-[var(--text)]">Sign in details</h2><p className="mt-0.5 text-xs text-[var(--muted)]">Copy the generated password when an account is created.</p></div></div>
        {generatedCredentials ? <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Username</p><p className="mt-1 truncate text-xs font-semibold text-[var(--text)]">{generatedCredentials.username}</p></div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Email</p><p className="mt-1 truncate text-xs font-semibold text-[var(--text)]">{generatedCredentials.email}</p></div>
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 sm:col-span-2"><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">Temporary password</p><p className="mt-1 break-all font-mono text-xs font-medium text-[var(--text)]">{generatedCredentials.password}</p></div><button type="button" onClick={copyPassword} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] px-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--primary-soft)]"><Copy size={13}/>Copy</button></div>
          <p className="text-[11px] text-[var(--muted)] sm:col-span-2">Share this password securely. It is shown here only after account creation.</p>
        </div> : <div className="flex min-h-24 items-center rounded-lg border border-dashed border-[var(--border)] px-4 text-xs text-[var(--muted)]">New account credentials will appear here.</div>}
      </section>
    </div>

    <section className="app-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-5"><div><h2 className="text-sm font-semibold text-[var(--text)]">Salespeople</h2><p className="mt-0.5 text-xs text-[var(--muted)]">Accounts in this manager workspace.</p></div><span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">{salespeople.length} members</span></div>
      {loading ? <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">Loading team members…</p> : salespeople.length === 0 ? <p className="px-4 py-10 text-center text-xs text-[var(--muted)]">No salesperson accounts yet.</p> : <div className="overflow-x-auto"><table className="app-table min-w-[440px]"><thead><tr><th>Team member</th><th>Email</th><th>Role</th></tr></thead><tbody>{salespeople.map((person) => <tr key={person._id || person.id || person.email}><td><span className="inline-flex items-center gap-2 font-medium text-[var(--text)]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--primary-soft)] text-[10px] font-bold uppercase text-[var(--primary)]">{(person.username || person.email || 'S').slice(0, 1)}</span>{person.username}</span></td><td className="text-[var(--muted)]">{person.email}</td><td><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-[var(--success)]">Salesperson</span></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
};

export default StaffAccounts;
