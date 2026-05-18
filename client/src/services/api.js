import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || '/api' 
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('goalpulse_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('goalpulse_token');
      localStorage.removeItem('goalpulse_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ── Auth ──────────────────────────────────────────── */
export const loginUser    = (data)   => API.post('/auth/login', data);
export const registerUser = (data)   => API.post('/auth/register', data);
export const getMe        = ()       => API.get('/auth/me');

/* ── Goals (Employee) ──────────────────────────────── */
export const getMyGoals      = (params) => API.get('/goals', { params });
export const getGoal         = (id)     => API.get(`/goals/${id}`);
export const createGoal      = (data)   => API.post('/goals', data);
export const updateGoal      = (id, data) => API.put(`/goals/${id}`, data);
export const deleteGoal      = (id)     => API.delete(`/goals/${id}`);
export const submitGoalSheet = ()       => API.post('/goals/submit-sheet');   // submits all draft goals
export const updateProgress  = (id, data) => API.put(`/goals/${id}/progress`, data);

/* ── Goals (Manager via /api/goals) ──────────────── */
export const getTeamGoals    = (params)   => API.get('/goals/team', { params });
export const approveGoal     = (id, data) => API.put(`/goals/${id}/approve`, data);
export const returnForRework = (id, data) => API.put(`/goals/${id}/rework`, data);

/* ── Manager workflow (/api/manager) ─────────────── */
export const getManagerDashboard    = ()                    => API.get('/manager');
export const getManagerTeamGoals    = (params)              => API.get('/manager/team-goals', { params });
export const getEmployeeGoals       = (employeeId)          => API.get(`/manager/employee/${employeeId}/goals`);
export const managerEditGoal        = (goalId, data)        => API.put(`/manager/goals/${goalId}/edit`, data);
export const approveGoalSheet       = (employeeId, data)    => API.put(`/manager/employee/${employeeId}/approve-sheet`, data);
export const returnGoalSheet        = (employeeId, data)    => API.put(`/manager/employee/${employeeId}/return-sheet`, data);

/* ── Check-ins (legacy) ────────────────────────────── */
export const getMyCheckIns   = (params)   => API.get('/checkins', { params });
export const createCheckIn   = (data)     => API.post('/checkins', data);
export const getTeamCheckIns = (params)   => API.get('/checkins/team', { params });
export const reviewCheckIn   = (id, data) => API.put(`/checkins/${id}/review`, data);

/* ── Achievements (/api/achievements) ──────────────── */
export const logAchievement      = (data)     => API.post('/achievements', data);
export const getMyAchievements   = (params)   => API.get('/achievements', { params });
export const getTeamAchievements = (params)   => API.get('/achievements/team', { params });
export const addManagerComment   = (id, data) => API.put(`/achievements/${id}/comment`, data);

/* ── Users ─────────────────────────────────────────── */
export const getUsers    = (params) => API.get('/users', { params });
export const getManagers = ()       => API.get('/users/managers');

/* ── Admin ─────────────────────────────────────────── */
export const getAdminDashboard = ()           => API.get('/admin/dashboard');
export const getAdminGoals     = (params)     => API.get('/admin/goals', { params });
export const getAdminUsers     = ()           => API.get('/admin/users');
export const createAdminUser   = (data)       => API.post('/admin/users', data);
export const updateUserRole    = (id, data)   => API.put(`/admin/users/${id}/role`, data);
export const assignManager     = (id, data)   => API.put(`/admin/users/${id}/assign-manager`, data);
export const toggleUserStatus  = (id)         => API.put(`/admin/users/${id}/toggle-status`);
export const unlockGoal        = (goalId)     => API.put(`/admin/goals/${goalId}/unlock`);
export const getAuditLogs      = (params)     => API.get('/admin/audit-logs', { params });

/* ── Reports ────────────────────────────────────────── */
export const getAchievementReport = (params) => API.get('/reports/achievements', { params });
export const exportAchievementReportCsv = (params) => {
  return API.get('/reports/achievements/export-csv', {
    params,
    responseType: 'blob'
  });
};

/* ── Notifications & Escalations ────────────────────── */
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/mark-all-read');

export const getEscalations = () => API.get('/escalations');
export const triggerNotification = (data) => API.post('/escalations/notify', data);

/* ── Shared Goals ───────────────────────────────────── */
export const getSharedGoals    = (params)     => API.get('/shared-goals', { params });
export const createSharedGoal  = (data)       => API.post('/shared-goals', data);

export default API;
