import { useState, useEffect } from 'react';
import { getTeamGoals, approveGoal, returnForRework } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { CheckCircle, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TeamGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reworkModal, setReworkModal] = useState(null);
  const [reworkReason, setReworkReason] = useState('');
  const [approveComments, setApproveComments] = useState('');
  const [approveModal, setApproveModal] = useState(null);

  const load = async () => {
    try { const res = await getTeamGoals({}); setGoals(res.data.data); } catch {} setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    if (!approveModal) return;
    try { await approveGoal(approveModal._id, { comments: approveComments }); toast.success('Goal approved!'); setApproveModal(null); setApproveComments(''); load(); } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleRework = async () => {
    if (!reworkModal || !reworkReason.trim()) { toast.error('Please provide a reason'); return; }
    try { await returnForRework(reworkModal._id, { reason: reworkReason }); toast.success('Goal returned for rework'); setReworkModal(null); setReworkReason(''); load(); } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.status === filter);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Team Goals</h1>
        <p className="text-surface-300 text-sm mt-1">Review and manage your team's goal sheets</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'submitted', 'approved', 'rework', 'completed', 'draft'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-surface-700 border border-surface-200 hover:border-primary-300'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? goals.length : goals.filter((g) => g.status === f).length})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                {['Employee', 'Goal', 'Category', 'Quarter', 'Priority', 'Status', 'Progress', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-5 text-xs font-semibold text-surface-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{g.user?.firstName?.[0]}{g.user?.lastName?.[0]}</div>
                      <div><p className="text-sm font-medium text-surface-900">{g.user?.firstName} {g.user?.lastName}</p><p className="text-xs text-surface-300">{g.user?.department}</p></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-sm text-surface-700 max-w-[200px]"><p className="truncate">{g.title}</p></td>
                  <td className="py-3.5 px-5 text-sm text-surface-700 capitalize">{g.category}</td>
                  <td className="py-3.5 px-5 text-sm text-surface-700">{g.quarter} {g.year}</td>
                  <td className="py-3.5 px-5 text-sm capitalize font-medium">{g.priority}</td>
                  <td className="py-3.5 px-5"><StatusBadge status={g.status} /></td>
                  <td className="py-3.5 px-5 w-32"><ProgressBar percent={g.progressPercent} size="sm" color="auto" /></td>
                  <td className="py-3.5 px-5">
                    {g.status === 'submitted' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => { setApproveModal(g); setApproveComments(''); }} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => { setReworkModal(g); setReworkReason(''); }} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Return for rework"><RotateCcw className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-16 text-center text-surface-300 text-sm">No goals found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-surface-100">
              <h2 className="text-lg font-bold text-surface-900">Approve Goal</h2>
              <button onClick={() => setApproveModal(null)} className="p-1.5 hover:bg-surface-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-surface-700"><span className="font-semibold">{approveModal.user?.firstName}:</span> {approveModal.title}</p>
              <div><label className="label">Comments (optional)</label><textarea className="input-field h-20 resize-none" value={approveComments} onChange={(e) => setApproveComments(e.target.value)} placeholder="Add comments for the employee..." /></div>
              <div className="flex gap-3"><button onClick={handleApprove} className="btn-success flex-1">Approve & Lock</button><button onClick={() => setApproveModal(null)} className="btn-secondary">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Rework Modal */}
      {reworkModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-surface-100">
              <h2 className="text-lg font-bold text-surface-900">Return for Rework</h2>
              <button onClick={() => setReworkModal(null)} className="p-1.5 hover:bg-surface-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-surface-700"><span className="font-semibold">{reworkModal.user?.firstName}:</span> {reworkModal.title}</p>
              <div><label className="label">Reason for rework <span className="text-red-500">*</span></label><textarea className="input-field h-20 resize-none" value={reworkReason} onChange={(e) => setReworkReason(e.target.value)} placeholder="Explain what needs to be revised..." required /></div>
              <div className="flex gap-3"><button onClick={handleRework} className="btn-danger flex-1">Return for Rework</button><button onClick={() => setReworkModal(null)} className="btn-secondary">Cancel</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamGoals;
