import { createElement } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, CircleDollarSign, ChartNoAxesCombined, ReceiptText, UserRound, Users, Settings, Zap } from 'lucide-react';
import { useGlobalContext } from '../context/context';
import BrandLogo from './BrandLogo';

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, permissions, user } = useGlobalContext();
  const groups = [
    { title: 'Inventory', links: [
      { to: '/', label: 'Overview', Icon: LayoutDashboard },
      { to: '/products', label: 'Products', Icon: Package },
      { to: '/stock-in', label: 'Stock in', Icon: ArrowDownToLine },
      { to: '/stock-out', label: 'Stock out', Icon: ArrowUpFromLine },
    ] },
    { title: 'Finance', links: [
      { to: '/sales', label: 'Sales', Icon: CircleDollarSign },
      ...(permissions.canAccessExpenses ? [{ to: '/expenses', label: 'Expenses', Icon: ReceiptText }] : []),
      ...(permissions.canAccessReports ? [{ to: '/reports', label: 'Reports', Icon: ChartNoAxesCombined }] : []),
    ] },
    { title: 'Account', links: [
      { to: '/profile', label: 'Profile', Icon: UserRound },
      ...(permissions.canAccessSettings ? [{ to: '/team', label: 'Team', Icon: Users }] : []),
      ...(permissions.canViewPremium ? [{ to: '/premium', label: 'Plan', Icon: Zap }] : []),
    ] },
  ];
  const renderLink = ({ to, label, Icon }) => <NavLink key={to} to={to} end={to === '/'} onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }} className={({ isActive }) => `group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 ${isActive ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}`}>{createElement(Icon, { size: 17, strokeWidth: 1.8 })}{label}</NavLink>;
  const mobileLinks = groups.flatMap((group) => group.links).filter((item) => ['/', '/products', '/sales'].includes(item.to));

  return <>
    {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={toggleSidebar} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-3.5 py-4 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <a href="/" aria-label="Spectra Inventory home" className="mb-7 px-2.5 text-[var(--text)]"><BrandLogo markClassName="h-8 w-8" wordmarkClassName="text-xs" /></a>
      <nav className="flex-1 space-y-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{groups.map((group)=><section key={group.title}><h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.13em] text-[var(--muted)]">{group.title}</h2><div className="space-y-0.5">{group.links.map(renderLink)}</div></section>)}</nav>
      <div className="border-t border-[var(--border)] pt-3"><div className="space-y-0.5">{permissions.canAccessSettings && renderLink({ to: '/settings', label: 'Settings', Icon: Settings })}</div><div className="mt-3 flex items-center gap-2.5 rounded-lg bg-[var(--surface)] px-2.5 py-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">{(user?.username || user?.email || 'U').slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{user?.username || user?.name || 'Your account'}</span><span className="block truncate text-[10px] text-[var(--muted)]">{user?.email || 'Spectra workspace'}</span></span></div></div>
    </aside>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-[var(--border)] bg-[var(--card)] px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 lg:hidden">{mobileLinks.map(({to,label,Icon})=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex min-w-16 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium ${isActive?'text-[var(--primary)]':'text-[var(--muted)]'}`}>{createElement(Icon,{size:18})}{label}</NavLink>)}</nav>
  </>;
};

export default Sidebar;
