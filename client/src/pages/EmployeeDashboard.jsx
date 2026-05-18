import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyGoals, submitGoalSheet } from '../services/api';
import {
  Target, FileText, Send, CheckCircle2, TrendingUp, Clock,
  Plus, ChevronRight, AlertCircle, Lock, RotateCcw, Info, MessageSquare, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── UOM label map ─────────────────────────────── */
const UOM_LABELS = { min: 'Minimize', max: 'Maximize', timeline: 'Timeline', zero: 'Zero' };

/* ─── Approval status badge ─────────────────────── */
const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   ring: 'ring-slate-200' },
  submitted: { label: 'Submitted', bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500',    ring: 'ring-blue-200' },
  approved:  { label: 'Approved',  bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  rework:    { label: 'Rework',    bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     ring: 'ring-red-200' },
};

const ApprovalBadge = ({ status, isLocked }) => {
  if (isLocked) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200">
      <Lock className="w-2.5 h-2.5" /> Locked
    </span>
  );
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

/* ─── Stat card ─────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, gradient, textColor }) => (
  <div className={`card p-5 bg-gradient-to-br ${gradient} border-0`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${textColor} opacity-70`}>{label}</p>
        <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${textColor} opacity-60`}>{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${textColor}`} />
      </div>
    </div>
  </div>
);

/* ─── Workflow step ──────────────────────────────── */
const Step = ({ label, icon: Icon, active, done, last }) => (
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <div className={`
      flex flex-col items-center gap-1 flex-1 min-w-0
    `}>
      <div className={`
        w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
        ${done  ? 'bg-emerald-500 border-emerald-500 text-white' :
          active ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' :
                   'bg-white border-surface-200 text-surface-400'}
      `}>
        <Icon className="w-4 h-4" />
      </div>
      <p className={`text-[10px] font-semibold text-center leading-tight ${
        done ? 'text-emerald-600' : active ? 'text-primary-700' : 'text-surface-400'
      }`}>{label}</p>
    </div>
    {!last && (
      <div className={`h-0.5 w-full mt-[-12px] ${done ? 'bg-emerald-400' : 'bg-surface-200'}`} />
    )}
  </div>
);

/* ══════════════════════════════════════════════════
   EMPLOYEE DASHBOARD
   ══════════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals]       = useState([]);
  const [summary, setSummary]   = useState({ totalGoals: 0, maxGoals: 8, editableWeight: 0, canSubmit: false, remaining: 100 });
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyGoals({});
      setGoals(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Computed stats ── */
  const totalGoals   = goals.length;
  const draftGoals   = goals.filter(g => g.approvalStatus === 'draft').length;
  const submittedGoals = goals.filter(g => g.approvalStatus === 'submitted').length;
  const approvedGoals  = goals.filter(g => g.approvalStatus === 'approved').length;
  const reworkGoals    = goals.filter(g => g.approvalStatus === 'rework').length;
  const pendingAction  = submittedGoals; // awaiting manager decision

  const completedGoals = goals.filter(g => g.progressStatus === 'Completed').length;
  const overallProgress = approvedGoals > 0
    ? Math.round((completedGoals / approvedGoals) * 100)
    : 0;

  /* ── Workflow step detection ── */
  const hasSubmitted = submittedGoals > 0 || approvedGoals > 0 || reworkGoals > 0;
  const hasApproved  = approvedGoals > 0;
  const hasCheckin   = goals.some(g => g.progressStatus !== 'Not Started' && g.approvalStatus === 'approved');
  const hasComment   = goals.some(g => g.managerComment);

  /* ── Goal Health Score ── */
  let healthScore = 'Drafting';
  let healthColor = 'text-slate-500 bg-slate-50 border-slate-200';
  let HealthIcon = Activity;

  if (submittedGoals > 0) {
    healthScore = 'Needs Manager Attention';
    healthColor = 'text-blue-600 bg-blue-50 border-blue-200';
    HealthIcon = Clock;
  } else if (reworkGoals > 0) {
    healthScore = 'At Risk';
    healthColor = 'text-amber-600 bg-amber-50 border-amber-200';
    HealthIcon = AlertCircle;
  } else if (approvedGoals > 0 && overallProgress < 50 && hasCheckin) {
    healthScore = 'Delayed';
    healthColor = 'text-rose-600 bg-rose-50 border-rose-200';
    HealthIcon = AlertCircle;
  } else if (approvedGoals > 0 && overallProgress < 80 && hasCheckin) {
    healthScore = 'At Risk';
    healthColor = 'text-amber-600 bg-amber-50 border-amber-200';
    HealthIcon = AlertCircle;
  } else if (approvedGoals > 0) {
    healthScore = 'Healthy';
    healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    HealthIcon = CheckCircle2;
  }

  /* ── Submit sheet ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitGoalSheet();
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome banner ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Hello, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Here's your performance summary for this cycle
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${healthColor}`}>
            <HealthIcon className="w-4 h-4" />
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none mb-0.5">Health Score</p>
              <p className="text-sm font-bold leading-none">{healthScore}</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Link
              to="/employee/create-goal"
              className="btn-primary text-sm gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Goal
            </Link>
          <button
            onClick={handleSubmit}
            disabled={!summary.canSubmit || submitting}
            title={!summary.canSubmit ? `Weightage must equal 100% (currently ${summary.editableWeight}%)` : ''}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${summary.canSubmit && !submitting
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-surface-100 text-surface-400 cursor-not-allowed'}
            `}
          >
            {submitting
              ? <><span className="w-4 h-4 border-2 border-surface-300 border-t-emerald-500 rounded-full animate-spin" />Submitting…</>
              : <><Send className="w-4 h-4" />Submit Sheet</>}
          </button>
        </div>
      </div>
      </div>

      {/* ── Rework alert ─────────────────────────── */}
      {reworkGoals > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {reworkGoals} goal{reworkGoals > 1 ? 's' : ''} returned for rework
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Review manager comments, make edits, and resubmit your goal sheet.
            </p>
          </div>
          <Link to="/employee/goals" className="ml-auto text-xs font-semibold text-red-700 hover:underline whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Goals"     value={totalGoals}      icon={Target}       gradient="from-primary-500 to-primary-700"   textColor="text-white" sub={`of ${summary.maxGoals} max`} />
        <StatCard label="Draft"           value={draftGoals}      icon={FileText}     gradient="from-slate-500 to-slate-700"       textColor="text-white" />
        <StatCard label="Submitted"       value={submittedGoals}  icon={Send}         gradient="from-blue-500 to-blue-700"         textColor="text-white" />
        <StatCard label="Approved"        value={approvedGoals}   icon={CheckCircle2} gradient="from-emerald-500 to-emerald-700"   textColor="text-white" />
        <StatCard label="Progress"        value={`${overallProgress}%`} icon={TrendingUp}  gradient="from-amber-500 to-amber-600" textColor="text-white" sub="of approved goals" />
        <StatCard label="Pending Action"  value={pendingAction}   icon={Clock}        gradient="from-rose-500 to-rose-700"         textColor="text-white" sub="awaiting manager" />
      </div>

      {/* ── Weightage progress bar ───────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-surface-900">Goal Sheet Weightage</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              summary.editableWeight === 100 ? 'bg-emerald-100 text-emerald-700' :
              summary.editableWeight > 100   ? 'bg-red-100 text-red-700' :
              'bg-surface-100 text-surface-600'
            }`}>
              {summary.editableWeight} / 100%
            </span>
          </div>
          {summary.editableWeight !== 100 && (
            <p className="text-xs text-surface-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {summary.editableWeight > 100
                ? `Over by ${summary.editableWeight - 100}% — reduce weightage on a goal`
                : `You need ${summary.remaining}% more weightage to submit`}
            </p>
          )}
          {summary.editableWeight === 100 && (
            <p className="text-xs font-semibold text-emerald-600">✓ Ready to submit!</p>
          )}
        </div>
        <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              summary.editableWeight === 100 ? 'bg-emerald-500' :
              summary.editableWeight > 100   ? 'bg-red-500' : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(summary.editableWeight, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-surface-400">0%</span>
          <span className="text-[10px] text-surface-400">100%</span>
        </div>
      </div>

      {/* ── Workflow timeline ────────────────────── */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-surface-900 mb-5">Goal Sheet Workflow</h3>
        <div className="flex items-start gap-0">
          <Step label="Created"          icon={Plus}         done={totalGoals > 0}            active={draftGoals > 0 && !hasSubmitted} last={false} />
          <Step label="Submitted"        icon={Send}         done={hasSubmitted}              active={submittedGoals > 0 && !hasApproved} last={false} />
          <Step label="Reviewed"         icon={Clock}        done={hasApproved || reworkGoals > 0} active={submittedGoals > 0} last={false} />
          <Step label="Approved"         icon={CheckCircle2} done={hasApproved}               active={hasApproved && !hasCheckin} last={false} />
          <Step label="Q1 Updated"       icon={TrendingUp}   done={hasCheckin}                active={hasApproved && !hasComment} last={false} />
          <Step label="Manager Commented" icon={MessageSquare} done={hasComment}              active={false} last={true} />
        </div>
        {reworkGoals > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <RotateCcw className="w-3.5 h-3.5" />
            {reworkGoals} goal{reworkGoals > 1 ? 's' : ''} returned for rework — update and resubmit to continue
          </div>
        )}
      </div>

      {/* ── My Goal Sheet preview table ─────────── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-surface-900">My Goal Sheet</h3>
            <p className="text-xs text-surface-400 mt-0.5">
              {totalGoals} goal{totalGoals !== 1 ? 's' : ''} · Total weightage: {summary.editableWeight}%
            </p>
          </div>
          <Link to="/employee/goals" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Manage all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center">
              <Target className="w-7 h-7 text-surface-300" />
            </div>
            <p className="text-sm font-semibold text-surface-700">No goals created yet</p>
            <p className="text-xs text-surface-400">Start by creating your first goal.</p>
            <Link to="/employee/create-goal" className="btn-primary text-xs mt-1">
              <Plus className="w-3.5 h-3.5" /> Create First Goal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/60 border-b border-surface-100">
                  {['Goal Title', 'Thrust Area', 'UoM', 'Target', 'Weight', 'Approval', 'Progress'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g._id} className="border-b border-surface-50 hover:bg-surface-50/60 transition-colors">

                    {/* Title */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <p className="text-sm font-semibold text-surface-900 truncate">{g.title}</p>
                      {g.managerComment && g.approvalStatus === 'rework' && (
                        <p className="text-[11px] text-red-600 truncate mt-0.5">💬 {g.managerComment}</p>
                      )}
                    </td>

                    {/* Thrust Area */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs text-surface-600 whitespace-nowrap">📌 {g.thrustArea}</p>
                    </td>

                    {/* UoM */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                        {UOM_LABELS[g.uomType] ?? g.uomType}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs text-surface-700 max-w-[120px] truncate">
                        {g.targetValue || <span className="text-surface-300 italic">N/A</span>}
                      </p>
                    </td>

                    {/* Weightage */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${g.weightage}%` }} />
                        </div>
                        <span className="text-xs font-bold text-surface-800">{g.weightage}%</span>
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-4">
                      <ApprovalBadge status={g.approvalStatus} isLocked={g.isLocked} />
                    </td>

                    {/* Progress Status */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        g.progressStatus === 'Completed'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        g.progressStatus === 'On Track'   ? 'bg-primary-50 text-primary-700 border-primary-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {g.progressStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Total row */}
              <tfoot>
                <tr className="bg-surface-50/80 border-t-2 border-surface-200">
                  <td colSpan={4} className="py-3 px-4 text-xs font-semibold text-surface-600">
                    Total ({totalGoals} goals)
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold ${
                      summary.editableWeight === 100 ? 'text-emerald-700' :
                      summary.editableWeight > 100   ? 'text-red-700' : 'text-surface-700'
                    }`}>
                      {summary.editableWeight}%
                    </span>
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-[11px] text-surface-400">
                    {summary.editableWeight === 100
                      ? '✓ Sheet ready to submit'
                      : summary.editableWeight > 100
                      ? `⚠ Over by ${summary.editableWeight - 100}%`
                      : `${summary.remaining}% remaining`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
