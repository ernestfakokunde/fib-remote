// src/components/TopBarNav.jsx
import { NavLink } from "react-router-dom";
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
} from "lucide-react";

const TopBarNav = () => {
  const { permissions } = useGlobalContext();

  return (
    <div className="absolute top-16 right-4 bg-[var(--sidebar)] shadow-md rounded-md p-4 lg:hidden">
      <nav className="space-y-2">
        <NavItem to="/" label="Dashboard" Icon={LayoutDashboard} />
        <NavItem to="/products" label="Products" Icon={Package} />
        <NavItem to="/stock-in" label="Stock-In" Icon={ArrowDownCircle} />
        <NavItem to="/stock-out" label="Stock-Out" Icon={ArrowUpCircle} />
        {permissions.canAccessExpenses ? <NavItem to="/expenses" label="Expenses" Icon={DollarSign} /> : null}
        {permissions.canAccessReports ? <NavItem to="/reports" label="Reports" Icon={BarChart} /> : null}
        <NavItem to="/profile" label="Profile" Icon={UserRound} />
        {permissions.canAccessSettings ? <NavItem to="/team" label="Team" Icon={Users} /> : null}
        {permissions.canAccessSettings ? <NavItem to="/settings" label="Settings" Icon={Settings} /> : null}
        {permissions.canViewPremium ? <NavItem to="/premium" label="Premium" Icon={Zap} /> : null}
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
import { useGlobalContext } from "../context/context";
