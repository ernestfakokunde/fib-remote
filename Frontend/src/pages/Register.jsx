import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context.jsx';
import SpectraLogo from '../assets/spectra.png';

const Register = () => {
  const { Register, loading } = useGlobalContext();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { username, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    try {
      await Register({ username, email, password });
      // On success, the context will navigate, so we just clear the form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      // Error toast is handled in the context's Register function
      console.error("Registration failed:", error);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
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
            Create account
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Set up your workspace in a few details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Username
            </label>
            <input
              required
              type='text'
              name='username'
              value={username}
              onChange={handleChange}
              placeholder='Choose a username'
              className="theme-input mt-1 rounded-2xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Email address
            </label>
            <input
              type='email'
              name='email'
              required
              value={email}
              onChange={handleChange}
              placeholder='Enter your email'
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
              required
              placeholder='Create a strong password'
              value={password}
              onChange={handleChange}
              className="theme-input mt-1 rounded-2xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Confirm Password
            </label>
            <input
              type='password'
              name='confirmPassword'
              required
              minLength={8}
              placeholder='Confirm your password'
              value={confirmPassword}
              onChange={handleChange}
              className="theme-input mt-1 rounded-2xl px-4 py-3"
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className="theme-btn-primary mt-2 w-full rounded-2xl py-3 font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link to='/login' className="text-[var(--primary)] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
