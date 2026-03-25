import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../context/context.jsx';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const Login = () => {
  const { Login, loading } = useGlobalContext();
  const [loginMode, setLoginMode] = useState('admin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      await Login({ email, password });
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.log(error);
    }
  };

  return (
    <div className='min-h-screen flex item-center justify-center bg-gradient-to-br from-[var(--bg)] to-[var(--surface)] px-4 '>
      <div className="bg-[var(--card)] shadow-xl rounded-3xl p-8 sm:p-10 max-w-md w-full border border-[var(--border)]">
        {/* Logo Placeholder */}
        <img
          src={logo}
          className='w-23 h-23 justify-center text-center flex'
          alt='Inventory Pro Logo'
        />

        <h2 className="text-2xl font-semibold text-center mt-4 text-[var(--text)]">
          Access your inventory workspace
        </h2>
        <div className="mt-5 mb-5 flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
              loginMode === 'admin'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted)]'
            }`}
          >
            Login as admin
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('salesperson')}
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
              loginMode === 'salesperson'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--muted)]'
            }`}
          >
            Login as salesperson
          </button>
        </div>
        {loginMode === 'admin' ? (
          <>
            <p className="text-[var(--muted)] text-center text-sm mb-3">
              Admin accounts have full control across products, settings, plans, and staff access.
            </p>
            <p className="text-[var(--muted)] text-center text-xs mb-8">
              Use your main workspace credentials to manage products, plans, reports, and team accounts.
            </p>
          </>
        ) : (
          <>
            <p className="text-[var(--muted)] text-center text-sm mb-3">
              Salesperson sub-accounts use credentials created by the admin.
            </p>
            <p className="text-[var(--muted)] text-center text-xs mb-8">
              Salesperson access is limited to stock-in, sales recording, and viewing products inside the assigned workspace.
            </p>
          </>
        )}

        <form className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Email or Username
            </label>
            <input
              type='text'
              onChange={handleChange}
              name='email'
              value={email}
              required
              placeholder='Enter your email or username'
              className="w-full mt-1 p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)] outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Password
            </label>
            <input
              type='password'
              minLength={8}
              name='password'
              value={password}
              onChange={handleChange}
              required
              placeholder='Enter your password'
              className="w-full mt-1 outline-none p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            type='submit'
            disabled={loading}
            className="w-full mt-2 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm mt-4 text-[var(--muted)]">
          Don't have an account?{' '}
          <Link to='/register' className="text-[var(--primary)] font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
