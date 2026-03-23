import { NavLink } from 'react-router-dom';
import { useGlobalContext } from '../context/context';
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  BarChart,
  Settings,
  Zap,
  Command,
  X,
  Menu, // Added Command icon
} from 'lucide-react';
import Logo from '../assets/logo.png';

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, openPalette } = useGlobalContext();

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
      <img src={'/logo.png'} className='w-26 h-26 mt-10 rounded-4xl' />

      {/* MENU ITEMS */}
      <div className='flex-grow overflow-y-auto'>
        <nav className='space-y-4 mt-10'>
          <NavItem to='/' label='Dashboard' Icon={LayoutDashboard} />
          <NavItem to='/products' label='Products' Icon={Package} />
          <NavItem to='/stock-in' label='Stock-In' Icon={ArrowDownCircle} />
          <NavItem to='/stock-out' label='Stock-Out' Icon={ArrowUpCircle} />
          <NavItem to='/expenses' label='Expenses' Icon={DollarSign} />
          <NavItem to='/reports' label='Reports' Icon={BarChart} />
          <NavItem to='/settings' label='Settings' Icon={Settings} />
          <NavItem to='#' label='Premium' Icon={Zap} />
        </nav>
      </div>

      {/* AI Command and User */}
      <div className='mt-auto'>
        <button
          onClick={openPalette}
          className='flex items-center gap-3 p-3 rounded-xl text-[var(--text)] hover:bg-[var(--surface)] w-full'
        >
          <Command size={20} />
          <span>AI Command</span>
        </button>
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
    <Icon size={20} />
    {label}
  </NavLink>
);

export default Sidebar;
