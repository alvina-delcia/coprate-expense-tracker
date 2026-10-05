import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { currency } from "../utils/format";

const roleLabel = {
  employee: "Employee",
  manager: "Manager",
  admin: "Administrator",
};

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Global search: live-queries expenses by description/category as the
  // user types (debounced), scoped by role the same way the Expenses page is.
  const runSearch = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get("/expenses", { params: { search: value, limit: 5 } });
        setResults(res.data.expenses);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    runSearch(value);
  };

  const goToExpenses = () => {
    setSearchOpen(false);
    navigate("/expenses");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-navy-700 border-b border-line flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="lg:hidden icon-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Global search */}
        <div ref={searchRef} className="relative w-full max-w-sm hidden sm:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-line bg-surface text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 focus:bg-navy-600 transition-colors"
            placeholder="Search expenses, categories..."
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={handleQueryChange}
          />

          {searchOpen && query.trim() && (
            <div className="absolute mt-2 w-full bg-card border border-line rounded-xl shadow-popover overflow-hidden animate-fadeIn">
              {searching ? (
                <div className="p-4 text-xs text-ink-400">Searching...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-xs text-ink-400">
                  No matches for "{query}"
                </div>
              ) : (
                <>
                  <ul className="max-h-72 overflow-y-auto">
                    {results.map((e) => (
                      <li key={e._id}>
                        <button
                          onClick={goToExpenses}
                          className="w-full text-left px-4 py-2.5 hover:bg-surface2 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-ink-900 font-medium truncate">
                              {e.description}
                            </p>
                            <p className="text-xs text-ink-400">
                              {e.category} · {e.user?.name}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-ink-900 shrink-0">
                            {currency(e.amount)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={goToExpenses}
                    className="w-full text-center py-2.5 text-xs font-medium text-brand-600 border-t border-line hover:bg-surface2"
                  >
                    View all results
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="icon-btn relative"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-line rounded-xl shadow-popover overflow-hidden animate-fadeIn">
              <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Notifications</p>
                <button onClick={() => setNotifOpen(false)} className="icon-btn h-6 w-6">
                  <X size={14} />
                </button>
              </div>
              <div className="p-6 text-center">
                <p className="text-sm text-ink-400">You're all caught up.</p>
                <p className="text-xs text-ink-400 mt-1">
                  Approval and status updates will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-navy-600 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-brand-500 text-navy-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="text-left hidden sm:block leading-tight">
              <p className="text-sm font-medium text-ink-900">{user?.name}</p>
              <p className="text-[11px] text-ink-400">
                {roleLabel[user?.role] || user?.role}
              </p>
            </div>
            <ChevronDown size={15} className="text-ink-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-line rounded-xl shadow-popover overflow-hidden animate-fadeIn">
              <div className="px-4 py-3 border-b border-line">
                <p className="text-sm font-medium text-ink-900 truncate">{user?.name}</p>
                <p className="text-xs text-ink-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-600 hover:bg-surface2 transition-colors"
              >
                <UserIcon size={15} /> View Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-status-rejected hover:bg-status-rejectedBg transition-colors"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
