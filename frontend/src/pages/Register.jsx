import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';


// ✅ Move Field component OUTSIDE
const Field = ({ label, type = 'text', placeholder, error, value, onChange }) => (
  <div>
    <label className="label text-surface-300">{label}</label>
    <input
      type={type}
      className={`input bg-surface-800 border-surface-700 text-white placeholder:text-surface-500 focus:border-brand-500 ${error ? 'input-error' : ''}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);


const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      navigate(user.role === 'manager' ? '/manager' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validate = () => {
    const e = {};

    if (!form.name || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';

    if (!form.email)
      e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Invalid email';

    if (!form.password || form.password.length < 6)
      e.password = 'Password must be at least 6 characters';

    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const { confirmPassword, ...payload } = form;

    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome aboard.');

      const role = result.payload.user.role;
      navigate(role === 'manager' ? '/manager' : '/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">

        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-700 text-white">
            Reimburse<span className="text-brand-400">Pro</span>
          </span>
        </div>

        <h2 className="font-display text-3xl font-700 text-white mb-2">
          Create account
        </h2>
        <p className="text-surface-400 mb-8">
          Join your team on ReimbursePro
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          <Field
            label="Full Name"
            placeholder="John Doe"
            error={errors.name}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Field
            label="Work Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <div>
            <label className="label text-surface-300">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {['employee', 'manager'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 rounded-xl text-sm font-600 border transition-all capitalize
                  ${form.role === r
                      ? 'bg-brand-600 border-brand-600 text-white shadow-glow'
                      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-500'
                    }`}
                >
                  {r === 'employee' ? '👤 Employee' : '🏢 Manager'}
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            error={errors.password}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <Field
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            error={errors.confirmPassword}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />

          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-surface-400 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-600 transition-colors"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;