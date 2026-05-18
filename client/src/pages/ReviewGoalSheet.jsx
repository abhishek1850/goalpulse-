import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getEmployeeGoals,
  managerEditGoal,
  approveGoalSheet,
  returnGoalSheet,
} from '../services/api';
import {
  ArrowLeft, CheckCircle2, RotateCcw, Edit3, Save, X,
  Lock, Target, Clock, AlertCircle, Info, User,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── UOM labels ─────────────────────────────────── */
const UOM_LABELS = { min: 'Minimize', max: 'Maximize', timeline: 'Timeline', zero: 'Zero' };

/* ── Approval badge ─────────────────────────────── */
const BADGE = {
  draft:     { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400',   ring: 'ring-slate-200'   },
  submitted: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200'   },
  approved:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  rework:    { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     ring: 'ring-red-200'     },
};

const ApprovalBadge = ({ status, isLocked }) => {
  if (isLocked) return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-200">
      <Lock className="w-2.5 h-2.5" /> Locked
    </span>
  );
  const c = BADGE[status] ?? BADGE.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

/* ── Inline edit cell ───────────────────────────── */
const EditableCell = ({ value, onSave, type = 'text', min, max, suffix }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  const handleSave = () => {
    onSave(val);
    setEditing(false);
  };

  if (editing) return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type={type}
        value={val}
        min={min}
        max={max}
        onChange={(e) => setVal(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-28 px-2 py-1 text-xs border-2 border-primary-400 rounded-lg outline-none focus:ring-2 focus:ring-primary-200"
      />
      {suffix && <span className="text-xs text-surface-500">{suffix}</span>}
      <button onClick={handleSave} className="p-1 rounded text-emerald-600 hover:bg-emerald-50"><Save className="w-3.5 h-3.5" /></button>
      <button onClick={() => { setVal(value); setEditing(false); }} className="p-1 rounded text-surface-400 hover:bg-surface-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <div
      className="flex items-center gap-1.5 group cursor-pointer"
      onClick={() => setEditing(true)}
    >
      <span className="text-sm text-surface-800">{value}{suffix}</span>
      <Edit3 className="w-3 h-3 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

/* ══════════════════════════════════════════════════
   REVIEW GOAL SHEET PAGE
   ══════════════════════════════════════════════════ */
const ReviewGoalSheet = () => {
  const { employeeId } = useParams();
  const navigate       = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [goals, setGoals]       = useState([]);
  const [summary, setSummary]   = useState({});
  const [loading, setLoading]   = useState(true);

  /* Confirmation modal state */
  const [modal, setModal] = useState(null); // { type: 'approve' | 'rework' }
  const [reason, setReason]   = useState('');
  const [comment, setComment] = useState('');
  const [acting, setActing]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployeeGoals(employeeId);
      setEmployee(res.data.employee);
      setGoals(res.data.goals);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load goal sheet');
      navigate('/manager/pending-approvals');
    }
    setLoading(false);
  }, [employeeId, navigate]);

  useEffect(() => { load(); }, [load]);

  /* ── Inline edit handler ── */
  const handleEdit = async (goalId, field, value) => {
    try {
      await managerEditGoal(goalId, { [field]: value });
      toast.success('Updated successfully');
      setGoals((prev) => prev.map((g) => g._id === goalId ? { ...g, [field]: value } : g));
      if (field === 'weightage') {
        setSummary((prev) => ({
          ...prev,
          totalWeight: goals.reduce((s, g) => s + (g._id === goalId ? value : g.weightage), 0),
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Edit failed');
    }
  };

  /* ── Approve ── */
  const handleApprove = async () => {
    setActing(true);
    try {
      const res = await approveGoalSheet(employeeId, { comment });
      toast.success(res.data.message);
      setModal(null);
      navigate('/manager/pending-approvals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
    setActing(false);
  };

  /* ── Return for rework ── */
  const handleRework = async () => {
    if (!reason.trim()) { toast.error('Please provide a rework reason'); return; }
    setActing(true);
    try {
      const res = await returnGoalSheet(employeeId, { reason });
      toast.success(res.data.message);
      setModal(null);
      navigate('/manager/pending-approvals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    }
    setActing(false);
  };

  /* ── Derived ── */
  const submittedGoals = goals.filter((g) => g.approvalStatus === 'submitted');
  const liveWeight     = goals.reduce((s, g) => s + g.weightage, 0);
  const canApprove     = submittedGoals.length > 0 && liveWeight === 100;

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Breadcrumb ──────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link to="/manager/pending-approvals" className="p-2 rounded-xl bg-white border border-surface-200 text-surface-600 hover:text-primary-600 hover:border-primary-300 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-surface-900">
            Review Goal Sheet — {employee?.firstName} {employee?.lastName}
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {employee?.designation} · {employee?.department}
          </p>
        </div>
      </div>

      {/* ── Summary bar ─────────────────────────── */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* Meta */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] text-surface-400 font-medium">Total Goals</p>
              <p className="text-2xl font-bold text-surface-900">{goals.length}<span className="text-sm font-normal text-surface-400"> / 8</span></p>
            </div>
            <div>
              <p className="text-[11px] text-surface-400 font-medium">Total Weightage</p>
              <p className={`text-2xl font-bold ${liveWeight === 100 ? 'text-emerald-600' : liveWeight > 100 ? 'text-red-600' : 'text-surface-900'}`}>
                {liveWeight}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-surface-400 font-medium">Pending Goals</p>
              <p className="text-2xl font-bold text-amber-600">{submittedGoals.length}</p>
            </div>
          </div>

          {/* Weightage bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-surface-400">Weightage</span>
              <span className={liveWeight === 100 ? 'text-emerald-600' : liveWeight > 100 ? 'text-red-600' : 'text-surface-700'}>
                {liveWeight}/100%
              </span>
            </div>
            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${liveWeight === 100 ? 'bg-emerald-500' : liveWeight > 100 ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${Math.min(liveWeight, 100)}%` }}
              />
            </div>
            {liveWeight !== 100 && (
              <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {liveWeight > 100 ? `Over by ${liveWeight - 100}% — adjust before approving` : `${100 - liveWeight}% remaining`}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setModal('rework')}
              disabled={submittedGoals.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                submittedGoals.length > 0
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'bg-surface-100 text-surface-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" /> Return for Rework
            </button>
            <button
              onClick={() => setModal('approve')}
              disabled={!canApprove}
              title={!canApprove ? `Total weightage must be 100% (current: ${liveWeight}%)` : ''}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                canApprove
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                  : 'bg-surface-100 text-surface-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> Approve Sheet
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline edit hint ─────────────────────── */}
      {submittedGoals.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-primary-700 bg-primary-50 border border-primary-100 px-4 py-2.5 rounded-xl">
          <Edit3 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>Tip:</strong> Click on any <em>Target Value</em> or <em>Weightage</em> cell to edit it inline before approving.
          </span>
        </div>
      )}

      {/* ── Goals table ─────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <h3 className="text-sm font-semibold text-surface-900">Goal Sheet</h3>
        </div>

        {goals.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="w-10 h-10 text-surface-200 mx-auto mb-3" />
            <p className="text-sm text-surface-400">No goals found for this employee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/60 border-b border-surface-100">
                  {['#', 'Goal Title', 'Thrust Area', 'UoM', 'Target Value', 'Deadline', 'Weightage', 'Progress', 'Status'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goals.map((g, idx) => {
                  const isSubmitted = g.approvalStatus === 'submitted';
                  return (
                    <tr key={g._id} className={`border-b border-surface-50 transition-colors ${isSubmitted ? 'hover:bg-amber-50/30' : 'hover:bg-surface-50/50'}`}>

                      <td className="py-3.5 px-4 text-sm text-surface-400 font-medium">{idx + 1}</td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="text-sm font-semibold text-surface-900 truncate">{g.title}</p>
                        {g.description && (
                          <p className="text-[11px] text-surface-400 mt-0.5 truncate">{g.description}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-xs text-surface-600 whitespace-nowrap">📌 {g.thrustArea}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                          {UOM_LABELS[g.uomType] ?? g.uomType}
                        </span>
                      </td>

                      {/* Editable: Target Value */}
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <EditableCell
                            value={g.targetValue || '—'}
                            type="text"
                            onSave={(val) => handleEdit(g._id, 'targetValue', val)}
                          />
                        ) : (
                          <span className="text-xs text-surface-600">{g.targetValue || '—'}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-xs text-surface-600 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3 text-surface-400" />
                          {g.deadline ? new Date(g.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </td>

                      {/* Editable: Weightage */}
                      <td className="py-3.5 px-4">
                        {isSubmitted ? (
                          <EditableCell
                            value={g.weightage}
                            type="number"
                            min={10}
                            max={100}
                            suffix="%"
                            onSave={(val) => handleEdit(g._id, 'weightage', Number(val))}
                          />
                        ) : (
                          <span className="text-sm font-bold text-surface-800">{g.weightage}%</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          g.progressStatus === 'Completed'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          g.progressStatus === 'On Track'   ? 'bg-primary-50 text-primary-700 border-primary-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {g.progressStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <ApprovalBadge status={g.approvalStatus} isLocked={g.isLocked} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total row */}
              <tfoot>
                <tr className="bg-surface-50/80 border-t-2 border-surface-200">
                  <td colSpan={6} className="py-3 px-4 text-xs font-semibold text-surface-600">
                    Total ({goals.length} goals)
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-bold ${liveWeight === 100 ? 'text-emerald-700' : liveWeight > 100 ? 'text-red-700' : 'text-surface-700'}`}>
                      {liveWeight}%
                    </span>
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-[11px] text-surface-400">
                    {liveWeight === 100 ? '✓ Valid — ready to approve' : liveWeight > 100 ? `⚠ Over by ${liveWeight - 100}%` : `${100 - liveWeight}% short`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          APPROVE CONFIRMATION MODAL
          ══════════════════════════════════════════ */}
      {modal === 'approve' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900">Approve Goal Sheet</h3>
                  <p className="text-xs text-surface-400">For {employee?.firstName} {employee?.lastName}</p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-3 text-xs text-emerald-800 space-y-1">
                <p>• <strong>{submittedGoals.length}</strong> goals will be set to <strong>Approved</strong></p>
                <p>• All approved goals will be <strong>locked</strong> for editing</p>
                <p>• Employee can begin tracking progress after approval</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">
                  Approval Comment <span className="text-surface-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Great work! Goals are well-aligned with team objectives."
                  className="input-field resize-none text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 btn-secondary">Cancel</button>
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {acting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Approving…</>
                    : <><CheckCircle2 className="w-4 h-4" />Confirm Approval</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          REWORK CONFIRMATION MODAL
          ══════════════════════════════════════════ */}
      {modal === 'rework' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-surface-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900">Return for Rework</h3>
                  <p className="text-xs text-surface-400">For {employee?.firstName} {employee?.lastName}</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mt-3 text-xs text-red-800 space-y-1">
                <p>• <strong>{submittedGoals.length}</strong> goals will be returned to <strong>Rework</strong> status</p>
                <p>• Goals will be unlocked for editing</p>
                <p>• Your comment will be visible to the employee</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">
                  Rework Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please clarify the target metrics for Goal #2. Weightage distribution needs to better reflect priority..."
                  className={`input-field resize-none text-sm ${!reason.trim() ? 'border-red-200' : ''}`}
                />
                {!reason.trim() && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Reason is required to return for rework
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 btn-secondary">Cancel</button>
                <button
                  onClick={handleRework}
                  disabled={acting || !reason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {acting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                    : <><RotateCcw className="w-4 h-4" />Return for Rework</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewGoalSheet;
