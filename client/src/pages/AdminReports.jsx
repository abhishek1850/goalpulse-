import { useState, useEffect } from 'react';
import { getAdminDashboard, getAchievementReport, exportAchievementReportCsv, getManagers } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, Search, Loader2 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Table & Filter States
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [managers, setManagers] = useState([]);
  
  const [filters, setFilters] = useState({
    department: '',
    manager: '',
    quarter: '',
    approvalStatus: '',
    progressStatus: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [dashRes, mgrRes] = await Promise.all([
          getAdminDashboard(),
          getManagers()
        ]);
        setStats(dashRes.data.data);
        setManagers(mgrRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [filters]);

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      // Clean empty filters
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await getAchievementReport(params);
      setReportData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await exportAchievementReportCsv(params);
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'goalpulse-achievement-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (!stats) return <div className="text-center py-20 text-surface-300">No data available</div>;

  const statusData = (stats.goalsByStatus || []).map((s) => ({ name: s._id?.charAt(0).toUpperCase() + s._id?.slice(1), value: s.count }));
  const catData = (stats.goalsByCategory || []).map((c) => ({ name: c._id?.charAt(0).toUpperCase() + c._id?.slice(1), goals: c.count }));
  const deptData = (stats.departmentStats || []).map((d) => ({ name: d._id, employees: d.count }));

  const completionRate = stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0;
  const approvalRate = stats.totalGoals > 0 ? Math.round(((stats.approvedGoals + stats.completedGoals) / stats.totalGoals) * 100) : 0;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1><p className="text-surface-300 text-sm mt-1">Comprehensive performance analytics and exports</p></div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'from-emerald-500 to-emerald-700' },
          { label: 'Approval Rate', value: `${approvalRate}%`, color: 'from-primary-500 to-primary-700' },
          { label: 'Active Users', value: `${stats.activeUsers}/${stats.totalUsers}`, color: 'from-cyan-500 to-cyan-700' },
          { label: 'Total Check-ins', value: stats.totalCheckins, color: 'from-purple-500 to-purple-700' },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="text-xs font-medium text-surface-300 mb-1">{kpi.label}</p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-surface-900">{kpi.value}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-semibold text-surface-900 mb-4">Goals by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-semibold text-surface-900 mb-4">Goals by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Bar dataKey="goals" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exportable Report Table */}
      <div className="card p-0 mt-8 overflow-hidden">
        <div className="p-5 border-b border-surface-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-surface-900">Achievement Report</h2>
            <p className="text-sm text-surface-300">Filter and export detailed check-in data</p>
          </div>
          <button 
            onClick={handleExport} 
            disabled={exporting || reportData.length === 0}
            className="btn btn-primary flex items-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="p-5 bg-surface-50 border-b border-surface-100 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select 
            className="input w-full"
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
          >
            <option value="">All Departments</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="General">General</option>
          </select>
          <select 
            className="input w-full"
            value={filters.manager}
            onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
          >
            <option value="">All Managers</option>
            {managers.map(m => (
              <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
            ))}
          </select>
          <select 
            className="input w-full"
            value={filters.quarter}
            onChange={(e) => setFilters(prev => ({ ...prev, quarter: e.target.value }))}
          >
            <option value="">All Quarters</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
          <select 
            className="input w-full"
            value={filters.approvalStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, approvalStatus: e.target.value }))}
          >
            <option value="">Any Approval Status</option>
            <option value="approved">Approved</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
            <option value="rework">Rework</option>
          </select>
          <select 
            className="input w-full"
            value={filters.progressStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, progressStatus: e.target.value }))}
          >
            <option value="">Any Progress Status</option>
            <option value="Not Started">Not Started</option>
            <option value="On Track">On Track</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {reportLoading ? (
            <div className="flex justify-center items-center p-12 text-surface-300">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center p-12 text-surface-400">
              No records found matching criteria
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-50/50 border-b border-surface-100 text-xs uppercase tracking-wider text-surface-400">
                  <th className="p-4 font-semibold whitespace-nowrap">Employee</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Department</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Manager</th>
                  <th className="p-4 font-semibold min-w-[200px]">Goal Title</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Thrust Area</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Quarter</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Planned</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Actual</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Score</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-50 transition-colors">
                    <td className="p-4 font-medium text-surface-900">{row.employeeName}</td>
                    <td className="p-4 text-surface-600">{row.department}</td>
                    <td className="p-4 text-surface-600">{row.managerName}</td>
                    <td className="p-4 text-surface-900 truncate max-w-xs" title={row.goalTitle}>{row.goalTitle}</td>
                    <td className="p-4 text-surface-600">
                      <span className="px-2 py-1 bg-surface-100 text-surface-600 rounded text-xs">{row.thrustArea}</span>
                    </td>
                    <td className="p-4 text-surface-600 font-medium">{row.quarter}</td>
                    <td className="p-4 text-surface-600">{row.plannedTarget}</td>
                    <td className="p-4 text-surface-600">{row.actualAchievement}</td>
                    <td className="p-4">
                      <span className={`font-semibold ${row.progressScore >= 80 ? 'text-emerald-600' : row.progressScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {row.progressScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className={`px-2 py-1 rounded-full w-fit ${
                          row.progressStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          row.progressStatus === 'On Track' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600'
                        }`}>
                          {row.progressStatus}
                        </span>
                        <span className="text-surface-400 px-1">{row.approvalStatus}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
