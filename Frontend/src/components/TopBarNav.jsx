// src/components/TopBarNav.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  BarChart,
  Settings,
} from "lucide-react";

const TopBarNav = () => {
  return (
    <div className="absolute top-16 right-4 bg-[var(--sidebar)] shadow-md rounded-md p-4 lg:hidden">
      <nav className="space-y-2">
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
      `flex items-center gap-3 p-2 rounded-md transition ${
        isActive
          ? 'bg-[var(--surface)] text-[var(--primary)] font-semibold'
          : 'text-[var(--text)] hover:bg-[var(--surface)]'
      }`
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export default TopBarNav;
