import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../services/api';
import {
  Users, UserCheck, Target, Clock, CheckCircle2,
  RotateCcw, BarChart3, TrendingUp, ChevronRight, Building2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';

/* ── Colour palettes ──────────────────────────────── */
const STATUS_COLORS = {
  draft     : '#94a3b8',
  submitted : '#3b82f6',
  approved  : '#10b981',
  rework    : '#ef4444',
  completed : '#8b5cf6',
};
const UOM_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];
const DEPT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const toolTipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

/* ── Stat card ─────────────────────────────────────── */
const KpiCard = ({ label, value, sub, icon: Icon, gradient, ring }) => (
  <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-[11px] text-white/60 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

/* ── Chart card wrapper ────────────────────────────── */
const ChartCard = ({ title, subtitle, children }) => (
  <div className="card p-6">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-surface-900">{title}</h3>
      {subtitle && <p className="text-[11px] text-surface-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const EmptyChart = ({ h = 200 }) => (
  <div className={`flex items-center justify-center text-surface-300 text-sm`} style={{ height: h }}>
    No data available yet
  </div>
);

/* ══════════════════════════════════════════════════
   ADMIN DASHBOARD
   ══════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const res = await getAdminDashboard(); setStats(res.data.data); }
    catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  if (!stats) return (
    <div className="text-center py-24 text-surface-400">
      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-surface-200" />
      <p>Failed to load dashboard stats</p>
    </div>
  );

  /* ── Transform data for charts ── */
  const statusData = (stats.goalsByStatus ?? []).map(s => ({
    name : s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
    color: STATUS_COLORS[s._id] ?? '#94a3b8',
  }));

  const uomData = (stats.goalsByUom ?? []).map((u, i) => ({
    name : { min: 'Minimize', max: 'Maximize', timeline: 'Timeline', zero: 'Zero' }[u._id] ?? u._id,
    value: u.count,
    fill : UOM_COLORS[i % UOM_COLORS.length],
  }));

  const deptData = (stats.deptProgress ?? []).map((d, i) => ({
    name    : d._id ?? 'Unknown',
    score   : Math.round(d.avgScore),
    count   : d.count,
    fill    : DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const quarterData = (stats.quarterProgress ?? []).map(q => ({
    name : `${q._id.quarter} ${q._id.year}`,
    score: Math.round(q.avgScore),
    count: q.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">HR Executive Dashboard</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Organization-wide performance and goal tracking overview
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link to="/admin/users"     className="btn-secondary text-xs gap-1.5"><Users className="w-3.5 h-3.5" />Manage Users</Link>
          <Link to="/admin/all-goals" className="btn-secondary text-xs gap-1.5"><Target className="w-3.5 h-3.5" />All Goals</Link>
          <Link to="/admin/audit-logs" className="btn-secondary text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Audit Logs</Link>
        </div>
      </div>

      {/* ── 8 KPI cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Employees"     value={stats.totalEmployees}    icon={Users}       gradient="from-indigo-500 to-indigo-700" />
        <KpiCard label="Total Managers"      value={stats.totalManagers}     icon={UserCheck}   gradient="from-violet-500 to-violet-700" />
        <KpiCard label="Total Goals"         value={stats.totalGoals}        icon={Target}      gradient="from-blue-500 to-blue-700" />
        <KpiCard label="Approved Sheets"     value={stats.approvedGoals}     icon={CheckCircle2} gradient="from-emerald-500 to-emerald-700" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Submitted Sheets"    value={stats.submittedGoals}    icon={Clock}       gradient="from-amber-500 to-amber-600" />
        <KpiCard label="Pending Approvals"   value={stats.pendingApprovals}  icon={Building2}   gradient="from-orange-500 to-orange-600" />
        <KpiCard label="Rework Sent"         value={stats.reworkGoals}       icon={RotateCcw}   gradient="from-red-500 to-red-700" />
        <KpiCard label="Avg Org Progress"    value={`${stats.avgProgress}%`} icon={TrendingUp}  gradient="from-teal-500 to-teal-700" sub="based on check-ins" />
      </div>

      {/* ── Row 1: Status pie + UOM bar ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Goal Status Distribution */}
        <ChartCard title="Goal Status Distribution" subtitle="Breakdown of all goals by approval status">
          {statusData.length === 0 ? <EmptyChart /> : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={statusData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                  >
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={toolTipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 min-w-[120px]">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-surface-700">{d.name}</span>
                    <span className="ml-auto text-xs font-bold text-surface-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* UOM Type Distribution */}
        <ChartCard title="UOM Type Distribution" subtitle="How employees measure their goals">
          {uomData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={uomData} margin={{ top: 5, right: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={toolTipStyle} />
                <Bar dataKey="value" name="Goals" radius={[6, 6, 0, 0]} barSize={40}>
                  {uomData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Department bar + Quarter line ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Department-wise Completion Bar Chart */}
        <ChartCard title="Department-wise Avg Progress" subtitle="Average achievement score by department">
          {deptData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={toolTipStyle} formatter={(v) => [`${v}%`, 'Avg Score']} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
                  {deptData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Quarter-wise Progress Line Chart */}
        <ChartCard title="Quarter-wise Progress Trend" subtitle="Average progress score across quarters">
          {quarterData.length < 1 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={quarterData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={toolTipStyle} formatter={(v) => [`${v}%`, 'Avg Score']} />
                <Line
                  type="monotone" dataKey="score" stroke="#6366f1"
                  strokeWidth={2.5} dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Quick links ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/users',      icon: Users,     label: 'Manage Users',  sub: 'Create, assign managers, change roles', color: 'bg-indigo-50 border-indigo-100', ic: 'text-indigo-600' },
          { to: '/admin/all-goals',  icon: Target,    label: 'All Goals',     sub: 'View, filter, and unlock locked goals', color: 'bg-emerald-50 border-emerald-100', ic: 'text-emerald-600' },
          { to: '/admin/audit-logs', icon: BarChart3, label: 'Audit Logs',   sub: 'Track all system actions and changes',  color: 'bg-purple-50 border-purple-100', ic: 'text-purple-600' },
        ].map(({ to, icon: Icon, label, sub, color, ic }) => (
          <Link key={to} to={to} className={`card border p-5 ${color} hover:shadow-md transition-all flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-surface-900">{label}</p>
              <p className="text-xs text-surface-400 mt-0.5">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
