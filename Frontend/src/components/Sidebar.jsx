// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  BarChart,
  Settings,
  Menu
} from "lucide-react";

const Sidebar = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* TOP NAV HAMBURGER (visible only on mobile) */}
      <div className="lg:hidden p-4 shadow-md flex items-start gap-4 bg-white text-black">
        <Menu size={28} className="cursor-pointer" onClick={() => setOpen(!open)} />
      </div>

      {/* SIDEBAR */}
      <div
        className={`bg-white h-screen shadow-md fixed top-0 left-0 z-50 w-64 p-5 pt-8 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="text-3xl cursor-pointer font-bold mb-4" onClick={() => setOpen(!open)}>x</div>
        <h1 className="text-xl font-bold  mb-10">Inventory Pro</h1>

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
    </>
  );
};

const NavItem = ({ to, label, Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 p-3 rounded-xl transition ${
        isActive ? "bg-blue-100 text-blue-600 font-semibold" : "hover:bg-gray-100"
      }`
    }
  >
    <Icon size={20} />
    {label}
  </NavLink>
);

export default Sidebar;
