import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getManagerDashboard } from '../services/api';
import {
  Users, Clock, CheckCircle2, RotateCcw, TrendingUp,
  ChevronRight, AlertCircle, Target,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/* ── Gradient stat card ─────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, gradient, text }) => (
  <div className={`card p-5 bg-gradient-to-br ${gradient} border-0`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${text} opacity-70`}>{label}</p>
        <p className={`text-3xl font-bold mt-1 ${text}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${text} opacity-60`}>{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
    </div>
  </div>
);

const ManagerDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getManagerDashboard();
      setData(res.data.data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  const d = data ?? {};
  const chartData = (d.members ?? []).map((m) => ({
    name: `${m.firstName} ${m.lastName?.[0]}.`,
    goals: 0, // placeholder; extended later
  }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Manager Dashboard</h1>
          <p className="text-sm text-surface-400 mt-0.5">Oversee your team's goal sheets and performance</p>
        </div>
        <Link to="/manager/pending-approvals" className="btn-primary text-sm gap-1.5">
          <Clock className="w-4 h-4" />
          Review Pending Sheets
          {d.pendingApprovals > 0 && (
            <span className="ml-1 bg-white/25 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {d.pendingApprovals}
            </span>
          )}
        </Link>
      </div>

      {/* ── Alert if pending ────────────────────── */}
      {d.pendingApprovals > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {d.pendingApprovals} goal sheet{d.pendingApprovals > 1 ? 's' : ''} awaiting your review
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Employees are waiting for approval to begin tracking progress.
            </p>
          </div>
          <Link to="/manager/pending-approvals" className="text-xs font-semibold text-amber-800 hover:underline whitespace-nowrap">
            Review now →
          </Link>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Team Members"     value={d.teamMembers ?? 0}      icon={Users}       gradient="from-primary-500 to-primary-700"  text="text-white" />
        <StatCard label="Pending Approvals" value={d.pendingApprovals ?? 0} icon={Clock}       gradient="from-amber-500 to-amber-600"      text="text-white" sub="goal sheets" />
        <StatCard label="Approved Sheets"  value={d.approvedSheets ?? 0}   icon={CheckCircle2} gradient="from-emerald-500 to-emerald-700"  text="text-white" />
        <StatCard label="Rework Sent"      value={d.reworkSent ?? 0}       icon={RotateCcw}   gradient="from-red-500 to-red-700"          text="text-white" />
        <StatCard label="Avg. Progress"    value={`${d.avgProgress ?? 0}%`} icon={TrendingUp}  gradient="from-purple-500 to-purple-700"   text="text-white" sub="across team" />
      </div>

      {/* ── Team members list ────────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900">Your Team</h3>
          <span className="text-xs text-surface-400">{(d.members ?? []).length} members</span>
        </div>
        {(d.members ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-surface-200 mx-auto mb-3" />
            <p className="text-sm text-surface-400">No team members assigned yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-50">
            {(d.members ?? []).map((m) => (
              <div key={m._id} className="px-6 py-3.5 flex items-center justify-between hover:bg-surface-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-surface-400">{m.designation} · {m.department}</p>
                  </div>
                </div>
                <Link
                  to={`/manager/review/${m._id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  View Sheet <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent pending submissions ───────────── */}
      {(d.recentGoals ?? []).length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900">Recent Pending Submissions</h3>
            <Link to="/manager/pending-approvals" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/60 border-b border-surface-100">
                  {['Employee', 'Goal', 'Thrust Area', 'Weightage', 'Action'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(d.recentGoals ?? []).map((g) => (
                  <tr key={g._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-surface-900 whitespace-nowrap">
                      {g.user?.firstName} {g.user?.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm text-surface-700 max-w-[200px] truncate">{g.title}</td>
                    <td className="py-3 px-4 text-xs text-surface-500">{g.thrustArea}</td>
                    <td className="py-3 px-4 text-sm font-bold text-surface-800">{g.weightage}%</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/manager/review/${g.user?._id}`}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
