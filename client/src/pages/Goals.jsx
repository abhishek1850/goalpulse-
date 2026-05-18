import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getMyGoals, deleteGoal, submitGoalSheet,
} from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Plus, Trash2, Edit3, Send, Target, AlertCircle,
  CheckCircle2, Clock, ChevronRight, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── UOM label map ──────────────────────────────────── */
const UOM_LABELS = {
  min:      { label: 'Minimize',  color: 'text-blue-600   bg-blue-50   border-blue-200' },
  max:      { label: 'Maximize',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  timeline: { label: 'Timeline',  color: 'text-amber-600  bg-amber-50  border-amber-200' },
  zero:     { label: 'Zero',      color: 'text-purple-600 bg-purple-50 border-purple-200' },
};

/* ── Approval status -> badge config ────────────────── */
const APPROVAL_STATUS_CONFIG = {
  draft:     { label: 'Draft',     dot: 'bg-slate-400',   pill: 'bg-slate-100  text-slate-700  border-slate-200' },
  submitted: { label: 'Submitted', dot: 'bg-amber-500',   pill: 'bg-amber-50   text-amber-700  border-amber-200' },
  approved:  { label: 'Approved',  dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rework:    { label: 'Rework',    dot: 'bg-red-500',     pill: 'bg-red-50     text-red-700     border-red-200' },
};

/* ── Progress status -> badge config ────────────────── */
const PROGRESS_CONFIG = {
  'Not Started': 'bg-slate-100  text-slate-600  border-slate-200',
  'On Track':    'bg-primary-50 text-primary-700 border-primary-200',
  'Completed':   'bg-emerald-50 text-emerald-700 border-emerald-200',
};

/* ── Pill component ─────────────────────────────────── */
const Pill = ({ text, colorClass }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
    {text}
  </span>
);

/* ══════════════════════════════════════════════════════
   WEIGHTAGE HEADER BAR
   ══════════════════════════════════════════════════════ */
const WeightageBar = ({ summary, onSubmit, submitting }) => {
  const { totalGoals, maxGoals, editableWeight, canSubmit, remaining } = summary;
  const pct = Math.min((editableWeight / 100) * 100, 100);

  const barColor = editableWeight === 100
    ? 'bg-emerald-500'
    : editableWeight > 100
    ? 'bg-red-500'
    : 'bg-primary-500';

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Left: goal count + weightage meters */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Goal count */}
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-[11px] text-surface-400 font-medium">Goals</p>
              <p className="text-lg font-bold text-surface-900 leading-tight">
                {totalGoals}
                <span className="text-sm text-surface-300 font-normal"> / {maxGoals}</span>
              </p>
            </div>
          </div>

          <div className="w-px h-10 bg-surface-100" />

          {/* Weightage */}
          <div className="min-w-[220px]">
            <div className="flex justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-surface-500">Total Weightage</span>
              <span className={editableWeight === 100 ? 'text-emerald-600' : editableWeight > 100 ? 'text-red-600' : 'text-surface-700'}>
                {editableWeight} / 100%
              </span>
            </div>
            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden w-52">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] mt-1 text-surface-400">
              {editableWeight === 100
                ? '✓ Ready to submit'
                : editableWeight > 100
                ? `⚠ Over by ${editableWeight - 100}% — reduce weightage`
                : `${remaining}% remaining to allocate`}
            </p>
          </div>
        </div>

        {/* Right: Submit button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            title={!canSubmit ? `Total weightage must be exactly 100% (currently ${editableWeight}%)` : 'Submit goal sheet for manager review'}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-200
              ${canSubmit && !submitting
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                : 'bg-surface-100 text-surface-400 cursor-not-allowed'}
            `}
          >
            {submitting
              ? <><span className="w-4 h-4 border-2 border-surface-400 border-t-primary-500 rounded-full animate-spin" /> Submitting…</>
              : <><Send className="w-4 h-4" /> Submit Goal Sheet</>}
          </button>
          {!canSubmit && (
            <p className="text-[10px] text-surface-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {editableWeight === 0 ? 'No draft goals to submit' : `You need ${remaining}% more weightage to submit`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN GOALS PAGE
   ══════════════════════════════════════════════════════ */
const Goals = ({ openCreateModal }) => {
  const navigate   = useNavigate();
  const [goals, setGoals]       = useState([]);
  const [summary, setSummary]   = useState({ totalGoals: 0, maxGoals: 8, editableWeight: 0, canSubmit: false, remaining: 100 });
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]     = useState('all');
  const [deleteId, setDeleteId] = useState(null); // id being confirmed for delete

  // If parent passed openCreateModal=true, redirect to create page
  useEffect(() => {
    if (openCreateModal) navigate('/employee/create-goal');
  }, [openCreateModal, navigate]);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyGoals({});
      setGoals(res.data.data);
      setSummary(res.data.summary);
    } catch {
      toast.error('Failed to load goals');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await deleteGoal(id);
      toast.success('Goal deleted');
      setDeleteId(null);
      loadGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  /* ── Submit sheet ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitGoalSheet();
      toast.success(res.data.message);
      loadGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  /* ── Filter ── */
  const filters = ['all', 'draft', 'submitted', 'approved', 'rework'];
  const filtered = filter === 'all' ? goals : goals.filter((g) => g.approvalStatus === filter);

  const canEdit = (g) => !g.isLocked && ['draft', 'rework'].includes(g.approvalStatus);
  const canDel  = (g) => !g.isLocked && ['draft', 'rework'].includes(g.approvalStatus);

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900">My Goals</h1>
          <p className="text-sm text-surface-400 mt-0.5">Create, edit, and submit your performance goals</p>
        </div>
        <Link
          to="/employee/create-goal"
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
            transition-all duration-200 shadow-sm hover:shadow-md
            ${summary.totalGoals >= summary.maxGoals
              ? 'bg-surface-100 text-surface-400 cursor-not-allowed pointer-events-none'
              : 'bg-primary-600 text-white hover:bg-primary-700'}
          `}
        >
          <Plus className="w-4 h-4" />
          Add Goal
          {summary.totalGoals >= summary.maxGoals && (
            <span className="ml-1 text-[10px]">(Max reached)</span>
          )}
        </Link>
      </div>

      {/* ── Weightage / submit bar ───────────────── */}
      <WeightageBar summary={summary} onSubmit={handleSubmit} submitting={submitting} />

      {/* ── Rework notice ───────────────────────── */}
      {goals.some((g) => g.approvalStatus === 'rework') && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Goals returned for rework</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your manager has returned some goals. Edit them and resubmit your goal sheet.
            </p>
          </div>
        </div>
      )}

      {/* ── Filter tabs ─────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const cnt = f === 'all' ? goals.length : goals.filter((g) => g.approvalStatus === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${filter === f
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-surface-700 border border-surface-200 hover:border-primary-300 hover:text-primary-600'}
              `}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'}`}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Goals table ─────────────────────────── */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center">
              <Target className="w-8 h-8 text-surface-300" />
            </div>
            <p className="text-sm font-semibold text-surface-700">
              {filter === 'all' ? 'No goals created yet' : `No ${filter} goals`}
            </p>
            <p className="text-xs text-surface-400">
              {filter === 'all'
                ? 'Start by creating your first goal.'
                : `Switch to "All" to see all your goals.`}
            </p>
            {filter === 'all' && (
              <Link to="/employee/create-goal" className="btn-primary text-xs mt-2">
                <Plus className="w-3.5 h-3.5" /> Create First Goal
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/80 border-b border-surface-100">
                  {['#', 'Title & Thrust Area', 'UOM', 'Target / Deadline', 'Weightage', 'Progress', 'Approval', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((goal, idx) => {
                  const uom      = UOM_LABELS[goal.uomType] ?? { label: goal.uomType, color: '' };
                  const aprvConf = APPROVAL_STATUS_CONFIG[goal.approvalStatus] ?? {};
                  const progConf = PROGRESS_CONFIG[goal.progressStatus] ?? '';
                  const editable = canEdit(goal);
                  const deletable = canDel(goal);

                  return (
                    <tr key={goal._id} className="border-b border-surface-50 hover:bg-surface-50/60 transition-colors">

                      {/* # */}
                      <td className="py-3.5 px-4 text-sm text-surface-400 font-medium w-8">
                        {idx + 1}
                      </td>

                      {/* Title + Thrust Area */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="text-sm font-semibold text-surface-900 truncate">{goal.title}</p>
                        <p className="text-[11px] text-surface-400 mt-0.5 truncate">📌 {goal.thrustArea}</p>
                        {goal.managerComment && goal.approvalStatus === 'rework' && (
                          <p className="text-[11px] text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded-md truncate">
                            💬 {goal.managerComment}
                          </p>
                        )}
                      </td>

                      {/* UOM type */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${uom.color}`}>
                          {uom.label}
                        </span>
                      </td>

                      {/* Target + Deadline */}
                      <td className="py-3.5 px-4">
                        {goal.targetValue && (
                          <p className="text-xs font-medium text-surface-700">{goal.targetValue}</p>
                        )}
                        {goal.deadline && (
                          <p className="text-[11px] text-surface-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(goal.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </td>

                      {/* Weightage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${goal.weightage}%` }} />
                          </div>
                          <span className="text-sm font-bold text-surface-900">{goal.weightage}%</span>
                        </div>
                      </td>

                      {/* Progress Status */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${progConf}`}>
                          {goal.progressStatus}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${aprvConf.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${aprvConf.dot}`} />
                          {aprvConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {editable && (
                            <Link
                              to={`/employee/goals/${goal._id}/edit`}
                              className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                              title="Edit goal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {deletable && (
                            <button
                              onClick={() => setDeleteId(goal._id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Delete goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!editable && !deletable && (
                            <span className="text-[11px] text-surface-300 italic">
                              {goal.isLocked ? 'Locked' : '—'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ─────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-slide-up text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-surface-900 mb-1">Delete this goal?</h3>
            <p className="text-sm text-surface-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
