import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';

/* ── Page title map ────────────────────────────────────── */
const PAGE_TITLES = {
  // Employee
  '/employee/dashboard':   { title: 'Dashboard',           subtitle: 'Your performance overview' },
  '/employee/goals':       { title: 'My Goals',            subtitle: 'Track and manage your goals' },
  '/employee/create-goal': { title: 'Create Goal',         subtitle: 'Set a new performance goal' },
  '/employee/checkins':    { title: 'Quarterly Check-ins', subtitle: 'Log your quarterly achievements' },
  '/employee/feedback':    { title: 'Feedback',            subtitle: 'View feedback from your manager' },

  // Manager
  '/manager/dashboard':          { title: 'Dashboard',         subtitle: 'Team performance overview' },
  '/manager/pending-approvals':  { title: 'Pending Approvals', subtitle: 'Review and approve submitted goals' },
  '/manager/team-progress':      { title: 'Team Progress',     subtitle: "Track your team's goal progress" },
  '/manager/checkins':           { title: 'Check-ins',         subtitle: 'Review quarterly check-ins from your team' },
  '/manager/feedback-logs':      { title: 'Feedback Logs',     subtitle: 'All feedback given to team members' },

  // Admin
  '/admin/dashboard':    { title: 'Dashboard',           subtitle: 'Organization-wide performance overview' },
  '/admin/users':        { title: 'User Management',     subtitle: 'Manage employees, managers, and admins' },
  '/admin/goals':        { title: 'All Goals',           subtitle: 'View goals across all departments' },
  '/admin/shared-goals': { title: 'Shared Goals',        subtitle: 'Goals shared across teams' },
  '/admin/audit-logs':   { title: 'Audit Logs',          subtitle: 'Full system activity trail' },
  '/admin/reports':      { title: 'Reports & Analytics', subtitle: 'Performance insights and exports' },
  '/admin/escalations':  { title: 'Escalation Center',   subtitle: 'Rule-based escalations for pending tasks' },
};

/* ── Layout ─────────────────────────────────────────────── */
const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const pageInfo = PAGE_TITLES[location.pathname] ?? { title: 'GoalPulse', subtitle: '' };
  const sidebarWidth = collapsed ? 70 : 256;

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Mobile overlay ─────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop sidebar ─────────────────────────── */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* ── Mobile sidebar drawer ───────────────────── */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 z-40
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} />
      </div>

      {/* ── Main area ───────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out main-area"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* Remove left margin on mobile */}
        <style>{`@media (max-width: 1023px) { .main-area { margin-left: 0 !important; } }`}</style>

        {/* Top Navbar */}
        <Navbar
          pageTitle={pageInfo.title}
          pageSubtitle={pageInfo.subtitle}
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
        />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-gray-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} GoalPulse · HR Performance Portal · All rights reserved
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
