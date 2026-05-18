import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getManagerTeamGoals } from '../services/api';
import { Clock, CheckCircle2, RotateCcw, ChevronRight, Users, Target } from 'lucide-react';

const STATUS_CONFIG = {
  submitted: { label: 'Pending Review', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-200'   },
  approved:  { label: 'Approved',       bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-200' },
  rework:    { label: 'Rework',         bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     ring: 'ring-red-200'     },
  draft:     { label: 'Draft',          bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400',   ring: 'ring-slate-200'   },
  mixed:     { label: 'Mixed',          bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  ring: 'ring-purple-200'  },
};

const SheetStatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${c.bg} ${c.text} ${c.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const FILTERS = [
  { key: 'all',       label: 'All Sheets' },
  { key: 'submitted', label: 'Pending Review' },
  { key: 'approved',  label: 'Approved' },
  { key: 'rework',    label: 'Rework Sent' },
];

const PendingApprovals = () => {
  const [sheets, setSheets]   = useState([]);
  const [filter, setFilter]   = useState('submitted');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getManagerTeamGoals(params);
      setSheets(res.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-surface-900">Pending Approvals</h1>
        <p className="text-sm text-surface-400 mt-0.5">Review and act on your team's submitted goal sheets</p>
      </div>

      {/* ── Filter tabs ─────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => {
          const count = key === 'all' ? sheets.length
            : sheets.filter(s => s.sheetStatus === key || s.submittedCount > 0 && key === 'submitted').length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-surface-700 border border-surface-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Sheets list ─────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : sheets.length === 0 ? (
        <div className="card py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-surface-300" />
          </div>
          <p className="text-sm font-semibold text-surface-700">
            {filter === 'submitted' ? 'No pending approvals. Your team is up to date. 🎉' : 'No sheets match this filter'}
          </p>
          <p className="text-xs text-surface-400">
            {filter === 'submitted'
              ? 'All goal sheets have been reviewed.'
              : 'Try switching to a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet) => {
            const emp = sheet.employee;
            const pendingGoals = sheet.goals.filter(g => g.approvalStatus === 'submitted');
            return (
              <div key={emp._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-4">

                  {/* Employee info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-surface-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-surface-400">{emp.designation} · {emp.department}</p>
                    </div>
                  </div>

                  {/* Sheet meta */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-surface-900">{sheet.goals.length}</p>
                      <p className="text-[10px] text-surface-400">Goals</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${sheet.totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {sheet.totalWeight}%
                      </p>
                      <p className="text-[10px] text-surface-400">Total Weight</p>
                    </div>
                    {sheet.lastSubmittedAt && (
                      <div className="text-center">
                        <p className="text-xs font-medium text-surface-700">
                          {new Date(sheet.lastSubmittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-[10px] text-surface-400">Submitted</p>
                      </div>
                    )}
                    <SheetStatusBadge status={sheet.submittedCount > 0 ? 'submitted' : sheet.sheetStatus} />
                  </div>

                  {/* Action */}
                  <Link
                    to={`/manager/review/${emp._id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                  >
                    Review Sheet <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Goals mini-preview */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {sheet.goals.slice(0, 6).map((g) => (
                    <span key={g._id} className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                      g.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      g.approvalStatus === 'submitted' ? 'bg-amber-100 text-amber-700' :
                      g.approvalStatus === 'rework'   ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {g.title.length > 30 ? g.title.slice(0, 30) + '…' : g.title} · {g.weightage}%
                    </span>
                  ))}
                  {sheet.goals.length > 6 && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface-100 text-surface-500">
                      +{sheet.goals.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
