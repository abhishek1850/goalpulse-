import { useState, useEffect, useCallback } from 'react';
import { getTeamAchievements, addManagerComment } from '../services/api';
import {
  MessageSquare, X, Save, TrendingUp, Users,
  CheckCircle2, BarChart2, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const CURRENT_YEAR = new Date().getFullYear();

const UOM_LABELS = { min: 'Minimize', max: 'Maximize', timeline: 'Timeline', zero: 'Zero' };

/* ── Score pill ──────────────────────────────────── */
const ScorePill = ({ score }) => {
  const cls = score >= 80 ? 'bg-emerald-100 text-emerald-800'
            : score >= 50 ? 'bg-amber-100 text-amber-800'
            : 'bg-red-100 text-red-700';
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{score}%</span>
  );
};

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

/* ── Comment modal ───────────────────────────────── */
const CommentModal = ({ achievement, onClose, onSaved }) => {
  const [comment, setComment] = useState(achievement.managerComment ?? '');
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addManagerComment(achievement._id, { managerComment: comment });
      toast.success('Comment saved');
      onSaved(achievement._id, comment);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save comment');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-surface-100">
          <div>
            <h3 className="text-base font-bold text-surface-900">Add Check-in Comment</h3>
            <p className="text-xs text-surface-400 mt-0.5 truncate max-w-[280px]">
              {achievement.employee?.firstName} {achievement.employee?.lastName} — {achievement.goal?.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Achievement context */}
        <div className="px-6 pt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-surface-50 rounded-lg p-2.5">
            <p className="text-surface-400 mb-0.5 font-medium">Planned Target</p>
            <p className="text-surface-800 font-semibold">{achievement.plannedTarget || '—'}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-2.5">
            <p className="text-surface-400 mb-0.5 font-medium">Actual Value</p>
            <p className="text-surface-800 font-semibold">{achievement.actualValue}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-2.5">
            <p className="text-surface-400 mb-0.5 font-medium">Progress Score</p>
            <ScorePill score={achievement.progressScore ?? 0} />
          </div>
          <div className="bg-surface-50 rounded-lg p-2.5">
            <p className="text-surface-400 mb-0.5 font-medium">Status</p>
            <ProgressBadge status={achievement.progressStatus} />
          </div>
        </div>

        {achievement.employeeComment && (
          <div className="mx-6 mt-3 p-2.5 bg-primary-50 rounded-lg border border-primary-100">
            <p className="text-xs text-primary-800">
              <span className="font-semibold">Employee note:</span> {achievement.employeeComment}
            </p>
          </div>
        )}

        <div className="p-6 space-y-3">
          <label className="text-xs font-semibold text-surface-700 mb-1.5 block">
            Your Structured Check-in Comment
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="input-field resize-none text-sm"
            placeholder="Good progress on this goal. Ensure you address the performance gaps in Q3. Focus on..."
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : <><Save className="w-4 h-4" />Save Comment</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MANAGER CHECK-INS PAGE
   ══════════════════════════════════════════════════ */
const TeamCheckIns = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQ, setFilterQ] = useState('all');
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [commenting, setCommenting] = useState(null); // achievement obj for modal

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterQ !== 'all') params.quarter = filterQ;
      params.year = filterYear;
      const res = await getTeamAchievements(params);
      setAchievements(res.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [filterQ, filterYear]);

  useEffect(() => { load(); }, [load]);

  const handleCommentSaved = (id, comment) => {
    setAchievements(prev =>
      prev.map(a => a._id === id ? { ...a, managerComment: comment } : a)
    );
  };

  /* Summary */
  const totalMembers = [...new Set(achievements.map(a => a.employee?._id))].length;
  const avgScore = achievements.length
    ? Math.round(achievements.reduce((s, a) => s + (a.progressScore ?? 0), 0) / achievements.length)
    : 0;
  const commented = achievements.filter(a => a.managerComment).length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-surface-900">Team Check-ins</h1>
        <p className="text-sm text-surface-400 mt-0.5">Review quarterly achievements and add structured comments</p>
      </div>

      {/* ── Summary cards ───────────────────────── */}
      {achievements.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Employees with Check-ins', value: totalMembers,            icon: Users,       color: 'from-primary-500 to-primary-700' },
            { label: 'Avg. Progress Score',      value: `${avgScore}%`,           icon: TrendingUp,  color: 'from-emerald-500 to-emerald-700' },
            { label: 'Comments Added',           value: `${commented}/${achievements.length}`, icon: MessageSquare, color: 'from-purple-500 to-purple-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`card p-4 bg-gradient-to-br ${color} border-0 flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider leading-tight">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {['all', ...QUARTERS].map(q => (
            <button
              key={q}
              onClick={() => setFilterQ(q)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterQ === q
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-surface-700 border border-surface-200 hover:border-primary-300'
              }`}
            >
              {q === 'all' ? 'All Qtrs' : q}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            className="select-field py-1.5 text-xs pr-7 w-24"
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Achievements table ───────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : achievements.length === 0 ? (
        <div className="card py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center">
            <BarChart2 className="w-8 h-8 text-surface-300" />
          </div>
          <p className="text-sm font-semibold text-surface-700">No check-ins found</p>
          <p className="text-xs text-surface-400">
            {filterQ !== 'all' ? `No achievements recorded for ${filterQ} ${filterYear}.` : 'Your team has not logged any achievements yet.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/70 border-b border-surface-100">
                  {['Employee', 'Goal', 'Qtr', 'Planned Target', 'Actual Achievement', 'Score', 'Progress', 'Emp. Comment', 'Manager Comment', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {achievements.map((a) => (
                  <tr key={a._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">

                    {/* Employee */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {a.employee?.firstName?.[0]}{a.employee?.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-surface-900 whitespace-nowrap">{a.employee?.firstName} {a.employee?.lastName}</p>
                          <p className="text-[10px] text-surface-400 truncate">{a.employee?.department}</p>
                        </div>
                      </div>
                    </td>

                    {/* Goal */}
                    <td className="py-3.5 px-4 max-w-[160px]">
                      <p className="text-xs font-semibold text-surface-900 truncate">{a.goal?.title}</p>
                      <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full font-medium">
                        {UOM_LABELS[a.goal?.uomType] ?? a.goal?.uomType}
                      </span>
                    </td>

                    {/* Quarter */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold text-surface-700">{a.quarter}</span>
                      <p className="text-[10px] text-surface-400">{a.year}</p>
                    </td>

                    {/* Planned Target */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs text-surface-600 max-w-[100px] truncate">{a.plannedTarget || '—'}</p>
                    </td>

                    {/* Actual */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-surface-800">{a.actualValue}</p>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4">
                      <ScorePill score={a.progressScore ?? 0} />
                    </td>

                    {/* Progress status */}
                    <td className="py-3.5 px-4">
                      <ProgressBadge status={a.progressStatus} />
                    </td>

                    {/* Employee comment */}
                    <td className="py-3.5 px-4 max-w-[140px]">
                      <p className="text-xs text-surface-600 truncate">{a.employeeComment || <span className="text-surface-300 italic">—</span>}</p>
                    </td>

                    {/* Manager comment */}
                    <td className="py-3.5 px-4 max-w-[140px]">
                      {a.managerComment
                        ? <p className="text-xs text-primary-700 truncate">{a.managerComment}</p>
                        : <span className="text-[11px] text-surface-300 italic">No comment yet</span>}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setCommenting(a)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {a.managerComment ? 'Edit' : 'Add'} Comment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comment modal */}
      {commenting && (
        <CommentModal
          achievement={commenting}
          onClose={() => setCommenting(null)}
          onSaved={handleCommentSaved}
        />
      )}
    </div>
  );
};

export default TeamCheckIns;
