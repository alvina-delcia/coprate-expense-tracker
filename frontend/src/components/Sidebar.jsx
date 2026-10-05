import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  BarChart3,
  User,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Nav items are scoped to routes that actually exist in the app today.
// (Employees, Reports, Budgets, Audit Log, Settings arrive in later phases —
// intentionally left out here rather than linking to pages that don't exist yet.)
const navItemsByRole = {
  employee: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/expenses", label: "My Expenses", icon: Receipt },
    { to: "/profile", label: "Profile", icon: User },
  ],
  manager: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/expenses", label: "All Expenses", icon: Receipt },
    { to: "/approvals", label: "Approvals", icon: CheckSquare },
    { to: "/profile", label: "Profile", icon: User },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/expenses", label: "All Expenses", icon: Receipt },
    { to: "/approvals", label: "Approvals", icon: CheckSquare },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: User },
  ],
};

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  const items = navItemsByRole[user?.role] || navItemsByRole.employee;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-navy-700 border-r border-line flex flex-col transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-line shrink-0">
          <div className="h-8 w-8 rounded-lg bg-brand-500 text-navy-700 flex items-center justify-center">
            <Wallet size={17} strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-ink-900 text-[15px] tracking-tight">
              ExpenseFlow
            </p>
            <p className="text-[10px] text-ink-400 font-medium tracking-wide uppercase">
              Enterprise Expense Management
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] transition-colors duration-150 ${
                    isActive
                      ? "bg-brand-500/12 text-ink-900 font-semibold shadow-glow"
                      : "text-ink-400 font-medium hover:bg-navy-600 hover:text-ink-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-500" />
                    )}
                    <Icon
                      size={17}
                      strokeWidth={2}
                      className={isActive ? "text-brand-500" : "text-ink-400"}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-line text-[11px] text-ink-300 shrink-0">
          ExpenseFlow &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
