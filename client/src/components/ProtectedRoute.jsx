import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Imported inline to avoid circular deps — mirrors getRoleDashboard in App.jsx
const getRoleDashboard = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'manager') return '/manager/dashboard';
  return '/employee/dashboard';
};

/**
 * ProtectedRoute
 * - Redirects to /login if not authenticated.
 * - Redirects to the user's role dashboard if they don't have one of the
 *   required roles.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-surface-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Send the user to their own dashboard instead of a 403-style blank page
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
