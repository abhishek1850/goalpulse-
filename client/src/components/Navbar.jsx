import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Menu, ChevronDown, Home, CheckCircle2, AlertTriangle, Info, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getRoleDashboard } from '../App';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

/* Role-specific accent styles for the pill */
const ROLE_STYLES = {
  admin:    { pill: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200', dot: 'bg-purple-500', grad: 'from-purple-400 to-purple-600' },
  manager:  { pill: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200', dot: 'bg-indigo-500', grad: 'from-indigo-400 to-indigo-600' },
  employee: { pill: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500', grad: 'from-emerald-400 to-emerald-600' },
};

const ROLE_LABELS = {
  admin: 'Admin / HR',
  manager: 'Manager',
  employee: 'Employee',
};

const Navbar = ({ pageTitle, pageSubtitle, onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const [notifications, setNotifications] = useState([]);
  
  const notifRef = useRef();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Optional: Polling could be added here
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-sky-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const styles = ROLE_STYLES[user?.role] ?? ROLE_STYLES.employee;
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabel = ROLE_LABELS[user?.role] ?? 'Employee';

  return (
    <header className="
      h-16 bg-white border-b border-gray-100
      flex items-center justify-between px-4 sm:px-6
      sticky top-0 z-30
    " style={{ boxShadow: '0 1px 0 0 #f1f5f9, 0 1px 4px 0 rgba(0,0,0,0.04)' }}>

      {/* ── Left: hamburger (mobile) + page title ──── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          id="navbar-mobile-menu-btn"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page title area */}
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-gray-900 leading-tight truncate">
            {pageTitle}
          </h1>
          {pageSubtitle && (
            <p className="text-[11px] text-gray-400 leading-none mt-0.5 truncate hidden sm:block">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: search · bell · logout · avatar ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

        {/* Search bar */}
        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-2 w-44
          focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition-all">
          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search…"
            className="bg-transparent text-sm outline-none w-full placeholder-gray-400 text-gray-900"
            id="navbar-search-input"
          />
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="navbar-notifications-btn"
            className={`relative p-2 rounded-xl hover:bg-gray-100 transition-colors ${showNotifications ? 'bg-gray-100' : ''}`}
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col"
                style={{ animation: 'slideDown 0.15s ease-out', maxHeight: '400px' }}>
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        className={`p-3 rounded-xl flex gap-3 ${notif.isRead ? 'opacity-70 hover:bg-gray-50' : 'bg-indigo-50/40 hover:bg-indigo-50/80'}`}
                        onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                      >
                        <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'} truncate`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        {!notif.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Logout button — visible on md+ */}
        <button
          id="navbar-logout-btn"
          onClick={handleLogout}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600
            hover:bg-red-50 hover:text-red-700 transition-all duration-150 border border-transparent
            hover:border-red-100"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Sign Out</span>
        </button>

        {/* ── Avatar / Profile dropdown ──────────────── */}
        <div className="relative">
          <button
            id="navbar-profile-btn"
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {/* Avatar circle */}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${styles.grad} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {initials}
            </div>

            {/* Name + role */}
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-400 leading-none capitalize">{roleLabel}</p>
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown panel */}
          {showProfile && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />

              <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                style={{ animation: 'slideDown 0.15s ease-out' }}>

                {/* User header */}
                <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${styles.grad} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu actions */}
                <div className="py-1.5">
                  <button
                    id="navbar-profile-go-dashboard"
                    onClick={() => { setShowProfile(false); navigate(getRoleDashboard(user?.role)); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Home className="w-4 h-4 text-gray-400" />
                    My Dashboard
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    id="navbar-profile-logout"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
