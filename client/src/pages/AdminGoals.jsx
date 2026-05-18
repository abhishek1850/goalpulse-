import { useState, useEffect } from 'react';
import { getAdminGoals } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';

const AdminGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => { try { const res = await getAdminGoals({}); setGoals(res.data.data); } catch {} setLoading(false); };
    load();
  }, []);

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.status === filter);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-surface-900">All Goals</h1><p className="text-surface-300 text-sm mt-1">Organization-wide goal overview</p></div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'submitted', 'approved', 'rework', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-surface-700 border border-surface-200'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? goals.length : goals.filter((g) => g.status === f).length})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                {['Employee', 'Goal', 'Department', 'Category', 'Quarter', 'Status', 'Progress'].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-surface-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-sm font-medium text-surface-900">{g.user?.firstName} {g.user?.lastName}</td>
                  <td className="py-3.5 px-5 text-sm text-surface-700 max-w-[200px]"><p className="truncate">{g.title}</p></td>
                  <td className="py-3.5 px-5 text-sm text-surface-700">{g.user?.department}</td>
                  <td className="py-3.5 px-5 text-sm text-surface-700 capitalize">{g.category}</td>
                  <td className="py-3.5 px-5 text-sm text-surface-700">{g.quarter} {g.year}</td>
                  <td className="py-3.5 px-5"><StatusBadge status={g.status} /></td>
                  <td className="py-3.5 px-5 w-32"><ProgressBar percent={g.progressPercent} size="sm" color="auto" /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-surface-300 text-sm">No goals found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminGoals;
