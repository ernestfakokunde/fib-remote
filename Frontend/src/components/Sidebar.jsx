import { createElement } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle, DollarSign, BarChart, UserRound, Users, Settings, Zap } from 'lucide-react';
import { useGlobalContext } from '../context/context';
import SpectraLogo from '../assets/spectra.png';

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, permissions } = useGlobalContext();
  const items = [
    { to: '/', label: 'Overview', Icon: LayoutDashboard },
    { to: '/products', label: 'Products', Icon: Package },
    { to: '/sales', label: 'Sales', Icon: DollarSign },
    { to: '/stock-in', label: 'Stock in', Icon: ArrowDownCircle },
    { to: '/stock-out', label: 'Stock out', Icon: ArrowUpCircle },
    ...(permissions.canAccessExpenses ? [{ to: '/expenses', label: 'Expenses', Icon: DollarSign }] : []),
    ...(permissions.canAccessReports ? [{ to: '/reports', label: 'Reports', Icon: BarChart }] : []),
    { to: '/profile', label: 'Profile', Icon: UserRound },
    ...(permissions.canAccessSettings ? [{ to: '/team', label: 'Team', Icon: Users }] : []),
    ...(permissions.canAccessSettings ? [{ to: '/settings', label: 'Settings', Icon: Settings }] : []),
    ...(permissions.canViewPremium ? [{ to: '/premium', label: 'Plan', Icon: Zap }] : []),
  ];
  const navLink = ({ to, label, Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}`}>{createElement(Icon, { size: 18, strokeWidth: 1.8 })}{label}</NavLink>;

  return <>
    {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={toggleSidebar} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-5 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <a href="/" className="mb-8 flex items-center gap-3 px-2"><img src={SpectraLogo} alt="" className="h-9 w-9 object-contain"/><span><strong className="block text-sm font-semibold">Spectra</strong><small className="text-xs text-[var(--muted)]">Inventory</small></span></a>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Workspace</p>
      <nav className="flex-1 space-y-1 overflow-y-auto">{items.map(navLink)}</nav>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"><p className="text-xs font-medium">Keep stock in sync</p><p className="mt-1 text-xs text-[var(--muted)]">Record purchases and sales as they happen.</p></div>
    </aside>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-[var(--border)] bg-[var(--card)] px-1 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden">{items.filter((item) => ['/', '/products', '/sales', '/settings'].includes(item.to)).map(({ to,label,Icon }) => <NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex min-w-16 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] ${isActive?'text-[var(--primary)]':'text-[var(--muted)]'}`}>{createElement(Icon,{size:18})}{label}</NavLink>)}</nav>
  </>;
};

export default Sidebar;
