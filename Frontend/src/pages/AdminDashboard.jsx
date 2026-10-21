import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { useGlobalContext } from '../context/context';
import { formatCurrency, formatNumber } from '../utils/format';
import { LogOut } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const MetricCard = ({ label, value, detail }) => <article className="app-card p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-3xl font-semibold text-[var(--text)]">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{detail}</p></article>;

export default function AdminDashboard() {
  const { getAdminOverview, isSuperAdmin, logout } = useGlobalContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getAdminOverview().then((response) => setData(response.data)).catch((reason) => setError(reason.response?.data?.message || 'Could not load admin data.')); }, [getAdminOverview]);
  if (!isSuperAdmin) return <main className="app-card mx-auto my-10 max-w-2xl p-8"><h1 className="text-2xl font-semibold">Owner access required</h1><p className="mt-2 text-[var(--muted)]">This page is reserved for the Spectra owner account.</p></main>;
  if (error) return <main className="app-card mx-auto my-10 max-w-3xl p-8"><h1 className="text-2xl font-semibold">Admin dashboard</h1><p className="mt-3 text-rose-500">{error}</p></main>;
  if (!data) return <main className="p-8 text-[var(--muted)]">Loading owner metrics…</main>;
  const growth = data.growth || [];
  const chartOptions = { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: '#94a3b8', precision: 0 }, grid: { color: 'rgba(148,163,184,.12)' } } } };
  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6"><header className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--primary)]">Private platform owner console</p><h1 className="mt-2 text-3xl font-semibold text-[var(--text)]">Platform overview</h1><p className="mt-2 text-sm text-[var(--muted)]">Workspace growth, plan adoption, subscriptions, and platform activity.</p></div><button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface)]"><LogOut size={16}/>Sign out</button></header>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Business workspaces" value={formatNumber(data.totals.workspaces)} detail={`${formatNumber(data.totals.newWorkspacesLastSixMonths)} joined in the last six months`} /><MetricCard label="Active paid plans" value={formatNumber(data.totals.activePaidSubscriptions)} detail="Pro and Enterprise subscriptions" /><MetricCard label="Estimated monthly recurring" value={formatCurrency(data.totals.estimatedMonthlyRecurringUsd, 'USD')} detail="Based on current standard plan prices" /><MetricCard label="Sales recorded" value={formatNumber(data.totals.salesLastSixMonths)} detail="Across all workspaces in six months" /></section>
    <section className="grid gap-5 xl:grid-cols-2"><article className="app-card p-5"><h2 className="mb-5 font-semibold text-[var(--text)]">New workspaces and paid subscriptions</h2><Line data={{ labels: growth.map((item) => item.month), datasets: [{ label: 'Workspaces', data: growth.map((item) => item.newUsers), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,.14)', tension: .3 }, { label: 'Subscriptions', data: growth.map((item) => item.newSubscriptions), borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.14)', tension: .3 }] }} options={chartOptions} /></article><article className="app-card p-5"><h2 className="mb-5 font-semibold text-[var(--text)]">Plan adoption</h2><div className="mx-auto max-w-sm"><Doughnut data={{ labels: ['Free', 'Pro', 'Enterprise'], datasets: [{ data: [data.plans.free, data.plans.pro, data.plans.enterprise], backgroundColor: ['#64748b', '#38bdf8', '#a78bfa'], borderWidth: 0 }] }} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }} /></div></article></section>
    <article className="app-card p-5"><h2 className="mb-5 font-semibold text-[var(--text)]">Monthly workspace growth</h2><Bar data={{ labels: growth.map((item) => item.month), datasets: [{ label: 'New workspaces', data: growth.map((item) => item.newUsers), backgroundColor: 'rgba(56,189,248,.75)', borderRadius: 7 }] }} options={chartOptions} /></article>
  </main>;
}
