import { useState, useEffect, useCallback } from 'react';
import { logAchievement, getMyAchievements } from '../services/api';
import {
  Plus, X, Target, TrendingUp, CheckCircle2, Clock,
  ChevronDown, Info, BarChart2, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Constants ──────────────────────────────────── */
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const CURRENT_YEAR = new Date().getFullYear();

const UOM_LABELS = {
  min:      'Minimize',
  max:      'Maximize',
  timeline: 'Timeline',
  zero:     'Zero',
};

const UOM_HELP = {
  min:      'Enter the actual numeric value achieved (lower is better).',
  max:      'Enter the actual numeric value achieved (higher is better).',
  zero:     'Enter 0 if zero incidents occurred, or the actual count.',
  timeline: 'Enter the date you completed/delivered this goal (YYYY-MM-DD).',
};

/* ── Score ring ─────────────────────────────────── */
const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
};

/* ── Progress status badge ──────────────────────── */
const ProgressBadge = ({ status }) => {
  const map = {
    'Completed':   'bg-emerald-100 text-emerald-700 border-emerald-200',
    'On Track':    'bg-primary-50 text-primary-700 border-primary-200',
    'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[status] ?? map['Not Started']}`}>
      {status}
    </span>
  );
};

/* ══════════════════════════════════════════════════
   EMPLOYEE CHECK-INS PAGE
   ══════════════════════════════════════════════════ */
const CheckIns = () => {
  const [achievements, setAchievements] = useState([]);
  const [approvedGoals, setApprovedGoals] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterQ, setFilterQ]   = useState('all');

  /* Form state */
  const [form, setForm] = useState({
    goalId: '', quarter: 'Q2', year: CURRENT_YEAR,
    actualValue: '', progressStatus: 'On Track', employeeComment: '',
  });
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterQ !== 'all' ? { quarter: filterQ } : {};
      const res = await getMyAchievements(params);
      setAchievements(res.data.data ?? []);
      setApprovedGoals(res.data.approvedGoals ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [filterQ]);

  useEffect(() => { load(); }, [load]);

  /* When goal changes, update selectedGoal for UOM hint */
  useEffect(() => {
    const g = approvedGoals.find(g => g._id === form.goalId) ?? null;
    setSelectedGoal(g);
    setForm(prev => ({ ...prev, actualValue: '' }));
  }, [form.goalId, approvedGoals]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.goalId)      { toast.error('Please select a goal'); return; }
    if (!form.actualValue) { toast.error('Actual value is required'); return; }
    setSubmitting(true);
    try {
      await logAchievement(form);
      toast.success('Achievement logged successfully!');
      setShowForm(false);
      setForm({ goalId: '', quarter: 'Q2', year: CURRENT_YEAR, actualValue: '', progressStatus: 'On Track', employeeComment: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log achievement');
    }
    setSubmitting(false);
  };

  /* Summary stats */
  const avgScore  = achievements.length
    ? Math.round(achievements.reduce((s, a) => s + (a.progressScore ?? 0), 0) / achievements.length)
    : 0;
  const completed = achievements.filter(a => a.progressStatus === 'Completed').length;

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Quarterly Check-ins</h1>
          <p className="text-sm text-surface-400 mt-0.5">Log your actual achievements against approved goals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={approvedGoals.length === 0}
          title={approvedGoals.length === 0 ? 'No approved goals to log against' : ''}
          className="btn-primary text-sm gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Log Achievement
        </button>
      </div>

      {/* ── No approved goals notice ─────────────── */}
      {approvedGoals.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No approved goals yet</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You can only log achievements for goals that have been approved and locked by your manager.
            </p>
          </div>
        </div>
      )}

      {/* ── Stat summary ────────────────────────── */}
      {achievements.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Check-ins', value: achievements.length, icon: BarChart2, color: 'from-primary-500 to-primary-700' },
            { label: 'Avg Progress Score', value: `${avgScore}%`,  icon: TrendingUp, color: 'from-emerald-500 to-emerald-700' },
            { label: 'Goals Completed',  value: completed,          icon: CheckCircle2, color: 'from-purple-500 to-purple-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`card p-4 bg-gradient-to-br ${color} border-0 flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Quarter filter ───────────────────────── */}
      <div className="flex gap-2">
        {['all', ...QUARTERS].map(q => (
          <button
            key={q}
            onClick={() => setFilterQ(q)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterQ === q
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-surface-700 border border-surface-200 hover:border-primary-300'
            }`}
          >
            {q === 'all' ? 'All Quarters' : q}
          </button>
        ))}
      </div>

      {/* ── Achievements list ────────────────────── */}
      {achievements.length === 0 ? (
        <div className="card py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center">
            <Target className="w-8 h-8 text-surface-300" />
          </div>
          <p className="text-sm font-semibold text-surface-700">No check-ins logged yet</p>
          <p className="text-xs text-surface-400 max-w-xs">
            {filterQ !== 'all'
              ? `No achievements recorded for ${filterQ}.`
              : 'Log your first achievement against an approved goal.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((a) => (
            <div key={a._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start gap-4">

                {/* Score ring */}
                <ScoreRing score={a.progressScore ?? 0} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-surface-900 truncate">{a.goal?.title}</h3>
                    <span className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                      {UOM_LABELS[a.goal?.uomType] ?? a.goal?.uomType}
                    </span>
                    <span className="text-[11px] text-surface-400 font-medium">{a.quarter} {a.year}</span>
                    <ProgressBadge status={a.progressStatus} />
                  </div>
                  <p className="text-xs text-surface-500 mb-3">📌 {a.goal?.thrustArea}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-surface-50 rounded-lg p-2.5">
                      <p className="text-surface-400 font-medium mb-0.5">Planned Target</p>
                      <p className="text-surface-800 font-semibold">{a.plannedTarget || '—'}</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-2.5">
                      <p className="text-surface-400 font-medium mb-0.5">Actual Value</p>
                      <p className="text-surface-800 font-semibold">{a.actualValue}</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-2.5">
                      <p className="text-surface-400 font-medium mb-0.5">Progress Score</p>
                      <p className={`font-bold ${
                        a.progressScore >= 80 ? 'text-emerald-700' :
                        a.progressScore >= 50 ? 'text-amber-700'   : 'text-red-700'
                      }`}>{a.progressScore}%</p>
                    </div>
                  </div>

                  {a.employeeComment && (
                    <div className="mt-3 p-2.5 bg-primary-50 rounded-lg border border-primary-100">
                      <p className="text-xs text-primary-800">
                        <span className="font-semibold">My note:</span> {a.employeeComment}
                      </p>
                    </div>
                  )}
                  {a.managerComment && (
                    <div className="mt-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-emerald-800">
                        <span className="font-semibold">Manager:</span> {a.managerComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          LOG ACHIEVEMENT MODAL
          ══════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-surface-900">Log Achievement</h2>
                <p className="text-xs text-surface-400 mt-0.5">Record your actual progress for an approved goal</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

              {/* Goal selector */}
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">
                  Goal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="select-field pr-8 appearance-none"
                    value={form.goalId}
                    onChange={set('goalId')}
                    required
                  >
                    <option value="">Select an approved goal…</option>
                    {approvedGoals.map(g => (
                      <option key={g._id} value={g._id}>
                        {g.title} ({UOM_LABELS[g.uomType]}) — {g.weightage}%
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>
                {selectedGoal && (
                  <div className="mt-2 p-2.5 bg-primary-50 rounded-lg border border-primary-100 text-xs text-primary-800 space-y-0.5">
                    <p><span className="font-semibold">Thrust Area:</span> {selectedGoal.thrustArea}</p>
                    <p><span className="font-semibold">Planned Target:</span> {selectedGoal.targetValue || 'N/A'}</p>
                    <p><span className="font-semibold">UOM:</span> {UOM_LABELS[selectedGoal.uomType]} — {UOM_HELP[selectedGoal.uomType]}</p>
                  </div>
                )}
              </div>

              {/* Quarter & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Quarter <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select className="select-field pr-8" value={form.quarter} onChange={set('quarter')}>
                      {QUARTERS.map(q => <option key={q}>{q}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Year</label>
                  <input
                    type="number" className="input-field"
                    value={form.year}
                    min={2020} max={2099}
                    onChange={set('year')}
                  />
                </div>
              </div>

              {/* Actual Value */}
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">
                  Actual Achievement <span className="text-red-500">*</span>
                </label>
                <input
                  type={selectedGoal?.uomType === 'timeline' ? 'date' : 'text'}
                  className="input-field"
                  value={form.actualValue}
                  onChange={set('actualValue')}
                  placeholder={
                    selectedGoal?.uomType === 'min'      ? 'e.g., 150 (actual count/time)' :
                    selectedGoal?.uomType === 'max'      ? 'e.g., 620 (actual value)' :
                    selectedGoal?.uomType === 'zero'     ? '0 (if zero achieved) or actual count' :
                    selectedGoal?.uomType === 'timeline' ? 'Date delivered' :
                    'Enter your actual result'
                  }
                  required
                />
              </div>

              {/* Progress Status */}
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Progress Status <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {['Not Started', 'On Track', 'Completed'].map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setForm(prev => ({ ...prev, progressStatus: s }))}
                      className={`p-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-center ${
                        form.progressStatus === s
                          ? s === 'Completed' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : s === 'On Track'  ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-400 bg-slate-100 text-slate-700'
                          : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee Comment */}
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">
                  Comment <span className="text-surface-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  className="input-field resize-none text-sm"
                  placeholder="Describe what you accomplished, key milestones, or any context…"
                  value={form.employeeComment}
                  onChange={set('employeeComment')}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                    : <><CheckCircle2 className="w-4 h-4" />Save Achievement</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIns;
