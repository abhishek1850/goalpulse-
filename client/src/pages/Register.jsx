import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import { Zap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'employee', department: 'Engineering' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.user, res.data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-50 p-4">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-surface-900">GoalPulse</span>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-surface-900 mb-1 text-center">Create your account</h2>
          <p className="text-surface-300 text-center mb-6">Join your organization's performance portal</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-fn" className="label">First Name</label>
                <input id="reg-fn" className="input-field" placeholder="John" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
              </div>
              <div>
                <label htmlFor="reg-ln" className="label">Last Name</label>
                <input id="reg-ln" className="input-field" placeholder="Doe" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <input id="reg-email" type="email" className="input-field" placeholder="you@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="reg-pass" className="label">Password</label>
              <div className="relative">
                <input id="reg-pass" type={showPass ? 'text' : 'password'} className="input-field pr-11" placeholder="Min 6 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-role" className="label">Role</label>
                <select id="reg-role" className="select-field" value={form.role} onChange={(e) => update('role', e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin/HR</option>
                </select>
              </div>
              <div>
                <label htmlFor="reg-dept" className="label">Department</label>
                <select id="reg-dept" className="select-field" value={form.department} onChange={(e) => update('department', e.target.value)}>
                  {['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Design', 'Operations'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-300 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
