import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Auth
import Login    from './pages/Login';
import Register from './pages/Register';

// Pages — Shared / Employee
import EmployeeDashboard from './pages/EmployeeDashboard';
import Goals             from './pages/Goals';
import CreateGoal        from './pages/CreateGoal';
import CheckIns          from './pages/CheckIns';
import Feedback          from './pages/Feedback';

// Pages — Manager
import ManagerDashboard  from './pages/ManagerDashboard';
import PendingApprovals  from './pages/PendingApprovals';
import TeamProgress      from './pages/TeamProgress';
import TeamCheckIns      from './pages/TeamCheckIns';
import FeedbackLogs      from './pages/FeedbackLogs';
import ReviewGoalSheet   from './pages/ReviewGoalSheet';

// Pages — Admin
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers     from './pages/AdminUsers';
import AllGoals       from './pages/AllGoals';
import SharedGoals    from './pages/SharedGoals';
import AuditLogs      from './pages/AuditLogs';
import AdminReports   from './pages/AdminReports';
import AdminEscalations from './pages/AdminEscalations';

/* ── Utility: home path per role ──────────────────────── */
export const getRoleDashboard = (role) => {
  if (role === 'admin')   return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  return '/employee/dashboard';
};

/* ── App ──────────────────────────────────────────────── */
const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading GoalPulse…</p>
        </div>
      </div>
    );
  }

  const homePath = user ? getRoleDashboard(user.role) : '/login';

  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────── */}
      <Route path="/login"    element={user ? <Navigate to={homePath} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={homePath} /> : <Register />} />

      {/* ── Protected app shell ───────────────────────── */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>

        {/* ─── Employee routes ─────────────────────────── */}
        <Route
          path="employee/dashboard"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee/goals"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <Goals />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee/create-goal"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <CreateGoal />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee/goals/:id/edit"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <CreateGoal />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee/checkins"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <CheckIns />
            </ProtectedRoute>
          }
        />
        <Route
          path="employee/feedback"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'admin']}>
              <Feedback />
            </ProtectedRoute>
          }
        />

        {/* ─── Manager routes ──────────────────────────── */}
        <Route
          path="manager/dashboard"
          element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/pending-approvals"
          element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <PendingApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/team-progress"
          element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <TeamProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/checkins"
          element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <TeamCheckIns />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/feedback-logs"
          element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <FeedbackLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="manager/review/:employeeId"
          element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <ReviewGoalSheet />
            </ProtectedRoute>
          }
        />

        {/* ─── Admin routes ────────────────────────────── */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/all-goals"
          element={
            <ProtectedRoute roles={['admin']}>
              <AllGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/shared-goals"
          element={
            <ProtectedRoute roles={['admin']}>
              <SharedGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/escalations"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminEscalations />
            </ProtectedRoute>
          }
        />

        {/* ─── Redirects ───────────────────────────────── */}
        <Route index element={<Navigate to={homePath} replace />} />
        <Route path="dashboard"  element={<Navigate to={homePath} replace />} />
        <Route path="goals"      element={<Navigate to={`/${user?.role ?? 'employee'}/goals`} replace />} />
        <Route path="checkins"   element={<Navigate to={`/${user?.role ?? 'employee'}/checkins`} replace />} />
      </Route>

      {/* ── Catch-all ────────────────────────────────── */}
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
};

export default App;
