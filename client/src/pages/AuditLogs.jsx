import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../services/api';
import { Search, Filter, ShieldAlert, Activity, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ENTITY_COLORS = {
  goal       : 'bg-blue-50 text-blue-700 border-blue-200',
  achievement: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  user       : 'bg-purple-50 text-purple-700 border-purple-200',
  system     : 'bg-slate-100 text-slate-700 border-slate-200',
};

const ACTION_LABELS = {
  // Goals
  goal_created       : 'Created Goal',
  goal_edited        : 'Edited Goal',
  goal_deleted       : 'Deleted Goal',
  goal_sheet_submitted: 'Submitted Goal Sheet',
  manager_goal_edited: 'Manager Edited Goal',
  goal_sheet_approved: 'Approved Goal Sheet',
  goal_sheet_returned: 'Returned Goal Sheet',
  goal_unlocked      : 'Unlocked Goal',
  
  // Achievements
  achievement_logged : 'Logged Achievement',
  checkin_commented  : 'Added Check-in Comment',
  
  // Users
  user_created       : 'Created User',
  manager_assigned   : 'Assigned Manager',
  user_login         : 'User Logged In',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    role: '',
    action: '',
    entityType: '',
    date: '',
  });
  
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 20 };
      if (filters.role) params.role = filters.role;
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.date) params.date = filters.date;

      const res = await getAuditLogs(params);
      setLogs(res.data.data ?? []);
      setPagination({
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total,
      });
    } catch { 
      toast.error('Failed to load audit logs');
    }
    setLoading(false);
  }, [filters, pagination.page]);

  useEffect(() => { load(); }, [load]);

  // When filters change, reset to page 1
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary-600" /> System Audit Trail
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">Immutable record of all critical actions performed in the platform</p>
        </div>
        <div className="bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          <span className="text-xs font-bold text-primary-800">{pagination.total} events recorded</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4 flex flex-wrap gap-4 items-center bg-surface-50/50">
        <div className="flex items-center gap-2 text-sm font-semibold text-surface-600 border-r border-surface-200 pr-4">
          <Filter className="w-4 h-4" /> Filters
        </div>
        
        <select 
          className="select-field py-1.5 text-xs w-auto min-w-[140px]"
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        
        <select 
          className="select-field py-1.5 text-xs w-auto min-w-[140px]"
          value={filters.entityType}
          onChange={(e) => handleFilterChange('entityType', e.target.value)}
        >
          <option value="">All Entities</option>
          <option value="goal">Goal</option>
          <option value="achievement">Achievement</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
        
        <select 
          className="select-field py-1.5 text-xs w-auto min-w-[180px]"
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
        >
          <option value="">All Actions</option>
          <optgroup label="Goals">
            <option value="goal_created">Created Goal</option>
            <option value="goal_edited">Edited Goal</option>
            <option value="goal_sheet_submitted">Submitted Goal Sheet</option>
            <option value="manager_goal_edited">Manager Edited Goal</option>
            <option value="goal_sheet_approved">Approved Goal Sheet</option>
            <option value="goal_sheet_returned">Returned Goal Sheet</option>
            <option value="goal_unlocked">Unlocked Goal</option>
          </optgroup>
          <optgroup label="Achievements">
            <option value="achievement_logged">Logged Achievement</option>
            <option value="checkin_commented">Added Check-in Comment</option>
          </optgroup>
          <optgroup label="Users">
            <option value="user_created">Created User</option>
            <option value="manager_assigned">Assigned Manager</option>
          </optgroup>
        </select>
        
        <div className="relative ml-auto">
          <input 
            type="date"
            className="input-field py-1.5 text-xs min-w-[150px]"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          />
          {filters.date && (
            <button 
              onClick={() => handleFilterChange('date', '')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <span className="text-[10px] font-bold">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Logs Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center">
            <ShieldAlert className="w-12 h-12 text-surface-200 mb-3" />
            <p className="text-sm font-semibold text-surface-700">No audit logs found for selected filters.</p>
            <p className="text-xs text-surface-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/70 border-b border-surface-100">
                  {['Date & Time', 'User', 'Role', 'Entity', 'Action', 'Description'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-surface-50/50 transition-colors">
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-700 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-surface-400" />
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 text-[9px] font-bold flex-shrink-0">
                          {log.user?.firstName?.[0]}{log.user?.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-surface-900 truncate block">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                          </p>
                          {log.user?.email && <p className="text-[10px] text-surface-400 truncate block">{log.user.email}</p>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                        {log.userRole || log.user?.role || 'System'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${ENTITY_COLORS[log.entityType] ?? ENTITY_COLORS.system}`}>
                        {log.entityType}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-surface-800 whitespace-nowrap">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 max-w-[300px]">
                      <p className="text-xs text-surface-600 truncate" title={log.description}>{log.description || '—'}</p>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-surface-100 flex items-center justify-between bg-surface-50/50">
            <span className="text-xs font-medium text-surface-500">
              Showing page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded-lg border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
