import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Target, PlusCircle, CalendarCheck, MessageSquare,
  Clock, Users, TrendingUp, ClipboardList, BookOpen,
  ScrollText, BarChart3, Share2,
  ChevronLeft, ChevronRight, Zap, LogOut,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Navigation config per role
   ──────────────────────────────────────────────────────── */
const NAV_CONFIG = {
  employee: {
    label: 'Employee',
    accent: '#10b981',   // emerald
    accentBg: 'rgba(16,185,129,0.12)',
    accentText: '#059669',
    pill: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    avatarGrad: 'from-emerald-400 to-emerald-600',
    logoGrad: 'from-emerald-400 to-emerald-600',
    sections: [
      {
        title: 'Main',
        items: [
          { to: '/employee/dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
          { to: '/employee/goals',       label: 'My Goals',            icon: Target },
          { to: '/employee/create-goal', label: 'Create Goal',         icon: PlusCircle },
        ],
      },
      {
        title: 'Performance',
        items: [
          { to: '/employee/checkins',  label: 'Quarterly Check-ins', icon: CalendarCheck },
          { to: '/employee/feedback',  label: 'Feedback',            icon: MessageSquare },
        ],
      },
    ],
  },

  manager: {
    label: 'Manager',
    accent: '#6366f1',   // indigo / primary
    accentBg: 'rgba(99,102,241,0.12)',
    accentText: '#4f46e5',
    pill: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30',
    avatarGrad: 'from-indigo-400 to-indigo-600',
    logoGrad: 'from-indigo-400 to-violet-600',
    sections: [
      {
        title: 'Overview',
        items: [
          { to: '/manager/dashboard',         label: 'Dashboard',         icon: LayoutDashboard },
          { to: '/manager/pending-approvals', label: 'Pending Approvals', icon: Clock, badge: true },
        ],
      },
      {
        title: 'Team',
        items: [
          { to: '/manager/team-progress',  label: 'Team Progress',  icon: TrendingUp },
          { to: '/manager/checkins',       label: 'Check-ins',      icon: ClipboardList },
          { to: '/manager/feedback-logs',  label: 'Feedback Logs',  icon: BookOpen },
        ],
      },
    ],
  },

  admin: {
    label: 'Admin / HR',
    accent: '#8b5cf6',   // purple
    accentBg: 'rgba(139,92,246,0.12)',
    accentText: '#7c3aed',
    pill: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30',
    avatarGrad: 'from-purple-400 to-purple-600',
    logoGrad: 'from-purple-400 to-purple-600',
    sections: [
      {
        title: 'Overview',
        items: [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/users',     label: 'Users',     icon: Users },
        ],
      },
      {
        title: 'Goals',
        items: [
          { to: '/admin/goals',        label: 'All Goals',    icon: Target },
          { to: '/admin/shared-goals', label: 'Shared Goals', icon: Share2 },
        ],
      },
      {
        title: 'Insights',
        items: [
          { to: '/admin/audit-logs',   label: 'Audit Logs',  icon: ScrollText },
          { to: '/admin/reports',      label: 'Reports',     icon: BarChart3 },
          { to: '/admin/escalations',  label: 'Escalations', icon: ClipboardList, badge: true },
        ],
      },
    ],
  },
};

/* ─────────────────────────────────────────────────────────
   Tooltip (shows on hover when sidebar is collapsed)
   ──────────────────────────────────────────────────────── */
const Tip = ({ label, children, show }) => (
  <div className="relative group/tip">
    {children}
    {show && (
      <div className="
        pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
        bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg
        whitespace-nowrap shadow-xl opacity-0 scale-95
        group-hover/tip:opacity-100 group-hover/tip:scale-100
        transition-all duration-150
      ">
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────
   Main Sidebar component
   ──────────────────────────────────────────────────────── */
const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const config = NAV_CONFIG[user?.role] ?? NAV_CONFIG.employee;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <aside
      className={`
        ${collapsed ? 'w-[70px]' : 'w-64'}
        h-screen flex flex-col
        fixed left-0 top-0 z-40 select-none
        transition-all duration-300 ease-in-out
      `}
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo / Brand ─────────────────────────────── */}
      <div className={`
        flex items-center h-16 flex-shrink-0
        border-b border-white/[0.06]
        ${collapsed ? 'justify-center px-0' : 'px-5'}
      `}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo icon */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${config.accent}, ${config.accent}cc)` }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>

          {/* App name + role pill */}
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-white tracking-tight leading-none">
                GoalPulse
              </p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-1 inline-block ${config.pill}`}>
                {config.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {config.sections.map((section) => (
          <div key={section.title} className="mb-1">
            {/* Section label */}
            {!collapsed ? (
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-3 pb-1.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {section.title}
              </p>
            ) : (
              <div className="h-px mx-2 my-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
            )}

            {/* Nav items */}
            {section.items.map((item) => (
              <Tip key={item.to} label={item.label} show={collapsed}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => `
                    group flex items-center gap-3 rounded-xl text-sm font-medium
                    transition-all duration-150 cursor-pointer mb-0.5
                    ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/90'
                    }
                  `}
                  style={({ isActive }) => isActive ? {
                    background: config.accentBg,
                    boxShadow: `inset 3px 0 0 ${config.accent}`,
                  } : {}}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                          ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}
                        style={isActive ? { color: config.accent } : {}}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {/* Badge for pending */}
                      {!collapsed && item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 ring-1 ring-red-500/30 leading-none">
                          •
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </Tip>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User info + actions ───────────────────────── */}
      <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* User info row (only when expanded) */}
        {!collapsed && (
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${config.accent}cc, ${config.accent})` }}
            >
              {initials}
            </div>
            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {user?.email}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Tip label="Sign Out" show={collapsed}>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
              transition-all duration-150 group
              ${collapsed ? 'justify-center' : ''}
            `}
            style={{
              color: 'rgba(255,255,255,0.4)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </Tip>

        {/* Collapse toggle */}
        <button
          id="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center h-9 transition-all duration-150"
          style={{
            color: 'rgba(255,255,255,0.25)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
