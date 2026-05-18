import { useState, useEffect, useCallback } from 'react';
import { getAdminGoals, unlockGoal } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Target, Search, Lock, Unlock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AllGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ approvalStatus: 'all', department: 'all' });
  const [unlocking, setUnlocking] = useState(null); // ID of goal being unlocked

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.approvalStatus !== 'all') params.approvalStatus = filters.approvalStatus;
      if (filters.department !== 'all') params.department = filters.department;
      
      const res = await getAdminGoals(params);
      setGoals(res.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleUnlock = async (goal) => {
    if (!window.confirm(`Are you sure you want to unlock "${goal.title}"? It will be sent back to draft status.`)) return;
    setUnlocking(goal._id);
    try {
      await unlockGoal(goal._id);
      toast.success('Goal unlocked successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock goal');
    }
    setUnlocking(null);
  };

  const departments = [...new Set(goals.map(g => g.user?.department).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">All Organization Goals</h1>
          <p className="text-sm text-surface-400 mt-0.5">View and manage all goals across departments</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface-50 px-3 py-2 rounded-xl border border-surface-200 focus-within:border-primary-400 transition-colors">
          <Search className="w-4 h-4 text-surface-400" />
          <input 
            type="text" 
            placeholder="Search goals..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            disabled
            title="Search filtering coming soon"
          />
        </div>
        
        <div className="flex gap-3">
          <select 
            className="select-field py-2"
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select 
            className="select-field py-2"
            value={filters.approvalStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, approvalStatus: e.target.value }))}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted (Pending)</option>
            <option value="approved">Approved</option>
            <option value="rework">Rework</option>
          </select>
        </div>
      </div>

      {/* ── Goals Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
              <Target className="w-8 h-8 text-surface-300" />
            </div>
            <p className="text-sm font-semibold text-surface-700">No goals found</p>
            <p className="text-xs text-surface-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/70 border-b border-surface-100">
                  {['Employee', 'Goal Title', 'Dept', 'Weightage', 'Status', 'Locked', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {g.user?.firstName?.[0]}{g.user?.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-surface-900 whitespace-nowrap">{g.user?.firstName} {g.user?.lastName}</p>
                          <p className="text-[10px] text-surface-400 truncate">{g.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 max-w-[200px]">
                      <p className="text-xs font-semibold text-surface-900 truncate">{g.title}</p>
                      <p className="text-[10px] text-surface-400 truncate">Target: {g.targetValue || '—'}</p>
                    </td>
                    
                    <td className="py-3 px-4 text-xs text-surface-600">
                      {g.user?.department || '—'}
                    </td>
                    
                    <td className="py-3 px-4 text-sm font-bold text-surface-800">
                      {g.weightage}%
                    </td>
                    
                    <td className="py-3 px-4">
                      <StatusBadge status={g.approvalStatus} />
                    </td>
                    
                    <td className="py-3 px-4">
                      {g.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="text-[10px] text-surface-400 italic">Unlocked</span>
                      )}
                    </td>
                    
                    <td className="py-3 px-4">
                      {g.isLocked && g.approvalStatus === 'approved' && (
                        <button
                          onClick={() => handleUnlock(g)}
                          disabled={unlocking === g._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50"
                        >
                          {unlocking === g._id ? (
                            <span className="w-3 h-3 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                          Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllGoals;
