import { useState, useEffect, useCallback } from 'react';
import { getAdminUsers, updateUserRole, toggleUserStatus, createAdminUser, assignManager } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { UserX, UserCheck, Plus, X, Shield, ShieldAlert, Key } from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Modal for Create User ── */
const CreateUserModal = ({ onClose, onCreated, managers }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', 
    role: 'employee', department: '', designation: '', managerId: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdminUser(form);
      toast.success('User created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-surface-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-surface-900">Create New User</h3>
            <p className="text-xs text-surface-400 mt-0.5">Add a new employee, manager, or admin</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">First Name *</label>
              <input type="text" className="input-field" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Last Name</label>
              <input type="text" className="input-field" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Email Address *</label>
            <input type="email" className="input-field" value={form.email} onChange={set('email')} required />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Temporary Password *</label>
            <div className="relative">
              <input type="text" className="input-field pr-10" value={form.password} onChange={set('password')} required />
              <Key className="w-4 h-4 text-surface-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Role *</label>
              <select className="select-field" value={form.role} onChange={set('role')} required>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Department</label>
              <input type="text" className="input-field" value={form.department} onChange={set('department')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Designation</label>
              <input type="text" className="input-field" value={form.designation} onChange={set('designation')} />
            </div>
            {form.role === 'employee' && (
              <div>
                <label className="text-xs font-semibold text-surface-700 mb-1.5 block">Assign Manager</label>
                <select className="select-field" value={form.managerId} onChange={set('managerId')}>
                  <option value="">No Manager</option>
                  {managers.map(m => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Page ── */
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => { 
    try { 
      const res = await getAdminUsers(); 
      setUsers(res.data.data); 
    } catch { /* silent */ } 
    setLoading(false); 
  }, []);
  
  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (id, role) => {
    try { 
      await updateUserRole(id, { role }); 
      toast.success('Role updated'); 
      load(); 
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleManagerChange = async (id, managerId) => {
    try { 
      await assignManager(id, { managerId }); 
      toast.success('Manager assigned successfully'); 
      load(); 
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleToggle = async (id) => {
    try { 
      await toggleUserStatus(id); 
      toast.success('Status toggled'); 
      load(); 
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);
  const managersList = users.filter(u => u.role === 'manager' || u.role === 'admin');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">User Management</h1>
          <p className="text-surface-300 text-sm mt-1">Manage all users, roles, managers, and account status</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="flex gap-2">
        {['all', 'employee', 'manager', 'admin'].map((f) => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-white text-surface-700 border border-surface-200 hover:border-primary-300'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? users.length : users.filter((u) => u.role === f).length})
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50/70 border-b border-surface-100">
                  {['User', 'Department', 'Role', 'Assigned Manager', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-5 text-[11px] font-semibold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} className="border-b border-surface-50 hover:bg-surface-50/50 transition-colors">
                    
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-surface-900 truncate block">{u.firstName} {u.lastName}</span>
                          <span className="text-[10px] text-surface-400 truncate block">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-3.5 px-5 text-xs text-surface-700">
                      {u.department || '—'}
                      {u.designation && <span className="block text-[10px] text-surface-400">{u.designation}</span>}
                    </td>
                    
                    <td className="py-3.5 px-5">
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u._id, e.target.value)} 
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:ring-2 outline-none ${
                          u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          u.role === 'manager' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-surface-50 text-surface-700 border-surface-200'
                        }`}
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    
                    <td className="py-3.5 px-5">
                      {u.role === 'employee' ? (
                        <select 
                          value={u.manager?._id || ''} 
                          onChange={(e) => handleManagerChange(u._id, e.target.value)} 
                          className="text-xs px-2 py-1.5 rounded-lg border border-surface-200 bg-white max-w-[150px] outline-none focus:border-primary-400"
                        >
                          <option value="">No Manager</option>
                          {managersList.map(m => (
                            <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-surface-300 italic">Not applicable</span>
                      )}
                    </td>
                    
                    <td className="py-3.5 px-5">
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                    </td>
                    
                    <td className="py-3.5 px-5">
                      <button 
                        onClick={() => handleToggle(u._id)} 
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`} 
                        title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal 
          onClose={() => setShowCreate(false)} 
          onCreated={load} 
          managers={managersList} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
