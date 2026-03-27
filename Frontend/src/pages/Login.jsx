import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../context/context.jsx';
import { toast } from 'react-toastify';
import SpectraLogo from '../assets/spectra.png';

const Login = () => {
  const { Login, loading } = useGlobalContext();
  const [loginMode, setLoginMode] = useState('manager');
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
    <div
      className='flex min-h-screen items-center justify-center px-4 py-10'
      style={{ backgroundImage: 'var(--gradient)' }}
    >
      <div className="glass-panel w-full max-w-md rounded-[2rem] border border-white/10 p-8 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <img src={SpectraLogo} className='h-16 w-16 object-contain' alt='Spectra' />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">
            Spectra
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Simple access to your inventory workspace.
          </p>
        </div>

        <div className="mb-6 flex rounded-full border border-[var(--border)] bg-[var(--surface)]/70 p-1">
          <button
            type="button"
            onClick={() => setLoginMode('manager')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              loginMode === 'manager'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            Manager
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('salesperson')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              loginMode === 'salesperson'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--muted)]'
            }`}
          >
            Salesperson
          </button>
        </div>

        <p className="mb-4 text-center text-sm text-[var(--muted)]">
          {loginMode === 'manager'
            ? 'Use your main workspace account.'
            : 'Use the salesperson credentials created for you.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Email or username
            </label>
            <input
              type='text'
              onChange={handleChange}
              name='email'
              value={email}
              required
              placeholder='Enter your email or username'
              className="theme-input mt-1 rounded-2xl px-4 py-3"
            />
          </div>

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
              className="theme-input mt-1 rounded-2xl px-4 py-3"
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className="theme-btn-primary mt-2 w-full rounded-2xl py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
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
