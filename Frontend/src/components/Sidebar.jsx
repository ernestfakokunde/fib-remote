import { createElement } from 'react';
import { NavLink } from 'react-router-dom';
import { useGlobalContext } from '../context/context';
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  BarChart,
  UserRound,
  Users,
  Settings,
  Zap,
  X,
  Menu,
} from 'lucide-react';
import SpectraLogo from '../assets/spectra.png';

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, permissions } = useGlobalContext();

  return (
    <div
      className={`bg-[var(--sidebar)] h-screen fixed top-0 left-0 z-50 w-64 p-5 pt-8 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col border-r border-gray-300`}
    >
      <button
                onClick={toggleSidebar}
                className='lg:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-[var(--surface)]'
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

      {/* Brand */}
      <div className='mt-8 mb-8 flex items-center gap-3 rounded-3xl border border-white/10 bg-[var(--surface)]/80 px-3 py-3 shadow-lg backdrop-blur-xl'>
        <div className='rounded-2xl bg-white/10 p-2 ring-1 ring-white/10'>
          <img src={SpectraLogo} alt='Spectra logo' className='h-12 w-12 object-contain' />
        </div>
        <div>
          <p className='text-base font-semibold tracking-wide text-[var(--text)]'>Spectra</p>
          <p className='text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]'>Inventory Hub</p>
        </div>
      </div>

      {/* MENU ITEMS */}
      <div className='flex-grow overflow-y-auto'>
        <nav className='space-y-4 mt-10'>
          <NavItem to='/' label='Dashboard' Icon={LayoutDashboard} />
          <NavItem to='/products' label='Products' Icon={Package} />
          <NavItem to='/stock-in' label='Stock-In' Icon={ArrowDownCircle} />
          <NavItem to='/stock-out' label='Stock-Out' Icon={ArrowUpCircle} />
          {permissions.canAccessExpenses ? <NavItem to='/expenses' label='Expenses' Icon={DollarSign} /> : null}
          {permissions.canAccessReports ? <NavItem to='/reports' label='Reports' Icon={BarChart} /> : null}
          <NavItem to='/profile' label='Profile' Icon={UserRound} />
          {permissions.canAccessSettings ? <NavItem to='/team' label='Team' Icon={Users} /> : null}
          {permissions.canAccessSettings ? <NavItem to='/settings' label='Settings' Icon={Settings} /> : null}
          {permissions.canViewPremium ? <NavItem to='/premium' label='Premium' Icon={Zap} /> : null}
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ to, label, Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 p-3 rounded-xl transition ${
        isActive
          ? 'bg-[var(--surface)] text-[var(--primary)] font-semibold'
          : 'text-[var(--text)] hover:bg-[var(--surface)]'
      }`
    }
  >
    {createElement(Icon, { size: 20 })}
    {label}
  </NavLink>
);

export default Sidebar;
