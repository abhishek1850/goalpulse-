import { useState, useEffect, useCallback } from 'react';
import { getSharedGoals, createSharedGoal, getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Target, Search, Plus, X, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const THRUST_AREAS = [
  'Revenue Growth', 'Cost Optimisation', 'Customer Success',
  'Product Quality', 'Innovation', 'Learning & Development',
  'Team Collaboration', 'Process Improvement', 'Security & Compliance',
  'Performance Engineering', 'Leadership', 'Other',
];

const CreateSharedGoalModal = ({ onClose, onCreated, employees }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', thrustArea: '', uomType: 'max',
    targetValue: '', deadline: '', department: user?.department || '',
    primaryOwner: '', assignedEmployees: []
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const toggleEmployee = (empId) => {
    setForm(prev => {
      const isSelected = prev.assignedEmployees.includes(empId);
      return {
        ...prev,
        assignedEmployees: isSelected
          ? prev.assignedEmployees.filter(id => id !== empId)
          : [...prev.assignedEmployees, empId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.primaryOwner) return toast.error('Primary owner is required');
    if (form.assignedEmployees.length === 0) return toast.error('Assign at least one employee');
    if (!form.assignedEmployees.includes(form.primaryOwner)) {
      form.assignedEmployees.push(form.primaryOwner);
    }
    
    setSaving(true);
    try {
      await createSharedGoal(form);
      toast.success('Shared Goal created and distributed successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shared goal');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-surface-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-surface-900">Create Shared Goal (KPI)</h3>
            <p className="text-xs text-surface-400 mt-0.5">Push a locked goal definition to multiple employees</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Goal Title *</label>
              <input type="text" className="input-field" value={form.title} onChange={set('title')} required maxLength={150} />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Department *</label>
              <input type="text" className="input-field" value={form.department} onChange={set('department')} required />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Description</label>
            <textarea className="input-field resize-none" rows={2} value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Thrust Area *</label>
              <input type="text" list="thrust-areas" className="input-field" value={form.thrustArea} onChange={set('thrustArea')} required />
              <datalist id="thrust-areas">{THRUST_AREAS.map(t => <option key={t} value={t} />)}</datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">UOM Type *</label>
              <select className="select-field" value={form.uomType} onChange={set('uomType')} required>
                <option value="max">Maximize</option>
                <option value="min">Minimize</option>
                <option value="timeline">Timeline</option>
                <option value="zero">Zero</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Deadline *</label>
              <input type="date" className="input-field" value={form.deadline} onChange={set('deadline')} min={new Date().toISOString().split('T')[0]} required />
            </div>
          </div>

          {form.uomType !== 'zero' && (
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Target Value *</label>
              <input type="text" className="input-field" value={form.targetValue} onChange={set('targetValue')} required />
            </div>
          )}

          <div className="border-t border-surface-100 pt-4 mt-2">
            <h4 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Assignment & Distribution</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Primary Owner * (Achievement syncs from them)</label>
                <select className="select-field" value={form.primaryOwner} onChange={set('primaryOwner')} required>
                  <option value="">Select Primary Owner...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName} ({emp.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Distribute To ({form.assignedEmployees.length} selected)</label>
                <div className="max-h-40 overflow-y-auto border border-surface-200 rounded-xl p-2 bg-surface-50 space-y-1">
                  {employees.map(emp => (
                    <label key={emp._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                        checked={form.assignedEmployees.includes(emp._id)}
                        onChange={() => toggleEmployee(emp._id)}
                      />
                      <span className="text-xs text-surface-700 font-medium">{emp.firstName} {emp.lastName}</span>
                      {emp.department && <span className="text-[10px] text-surface-400">({emp.department})</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-surface-100">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Distributing...' : 'Create & Distribute Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const SharedGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resGoals, resUsers] = await Promise.all([
        getSharedGoals(),
        getUsers({ role: 'employee' })
      ]);
      setGoals(resGoals.data.data ?? []);
      setEmployees(resUsers.data.data ?? []);
    } catch { 
      toast.error('Failed to load shared goals');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary-600" /> Shared KPIs
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">Departmental goals distributed across multiple employees</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm gap-1.5">
            <Plus className="w-4 h-4" /> New Shared Goal
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
              <Target className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-sm font-semibold text-surface-700">No shared goals active</p>
            <p className="text-xs text-surface-400">Create a departmental KPI to distribute to your team.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/70 border-b border-surface-100">
                  {['Goal Title', 'Department', 'Primary Owner', 'Target', 'Distribution', 'Deadline'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {goals.map((g) => (
                  <tr key={g._id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-surface-900">{g.title}</p>
                      <p className="text-[10px] text-surface-400">{g.thrustArea}</p>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-surface-700">{g.department}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[9px] font-bold">
                          {g.primaryOwner?.firstName?.[0]}{g.primaryOwner?.lastName?.[0]}
                        </div>
                        <span className="text-xs font-medium text-surface-800">{g.primaryOwner?.firstName} {g.primaryOwner?.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-surface-800">{g.targetValue || '—'} <span className="text-[10px] font-normal text-surface-400">({g.uomType})</span></td>
                    <td className="py-3 px-4 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg px-2 text-center w-max">
                      {g.assignedEmployees?.length || 0} employees
                    </td>
                    <td className="py-3 px-4 text-xs text-surface-600">{new Date(g.deadline).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateSharedGoalModal 
          onClose={() => setShowCreate(false)} 
          onCreated={load} 
          employees={employees}
        />
      )}
    </div>
  );
};

export default SharedGoals;
