// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useGlobalContext } from '../context/context'
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  BarChart,
  Settings,
} from "lucide-react";
import Logo from "../assets/logo.png"

const Sidebar = () => {
  const { sidebarOpen } = useGlobalContext();

  return (
    <div
      className={`bg-[var(--sidebar)] h-screen shadow-md fixed top-0 left-0 z-50 w-64 p-5 pt-8 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:-translate-x-full'
      }`}
    >
      {/* Brand */}
      <img src={Logo} className="w-26 h-26 mt-10 rounded-4xl" />
      {/* MENU ITEMS */}
      <nav className="space-y-4">
        <NavItem to="/" label="Dashboard" Icon={LayoutDashboard} />
        <NavItem to="/products" label="Products" Icon={Package} />
        <NavItem to="/stock-in" label="Stock-In" Icon={ArrowDownCircle} />
        <NavItem to="/stock-out" label="Stock-Out" Icon={ArrowUpCircle} />
        <NavItem to="/expenses" label="Expenses" Icon={DollarSign} />
        <NavItem to="/reports" label="Reports" Icon={BarChart} />
        <NavItem to="/settings" label="Settings" Icon={Settings} />
      </nav>
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
