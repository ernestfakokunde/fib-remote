import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context.jsx';
import logo from '../assets/logo.png';

const Register = () => {
  const { Register, loading } = useGlobalContext();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg)] to-[var(--surface)] px-4">
      <div className="bg-[var(--card)] shadow-xl rounded-3xl p-8 sm:p-10 max-w-md w-full border border-[var(--border)]">
        <img
          src={logo}
          className='w-23 h-23 text-center justify-center flex'
          alt='Inventory Pro Logo'
        />

        <h2 className="text-2xl font-semibold text-center mt-4 text-[var(--text)]">
          Create your admin workspace
        </h2>
        <p className="text-[var(--muted)] text-center text-sm mb-3">
          Build the main account that controls products, plans, inventory access, and staff permissions.
        </p>
        <p className="text-[var(--muted)] text-center text-xs mb-8">
          Salesperson sub-accounts are created later by the admin with generated passwords.
        </p>

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
              className="w-full outline-none mt-1 p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Email Address
            </label>
            <input
              type='email'
              name='email'
              required
              value={email}
              onChange={handleChange}
              placeholder='Enter your email'
              className="w-full outline-none mt-1 p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
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
              className="w-full mt-1 outline-none p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
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
              className="w-full mt-1 outline-none p-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className="w-full mt-2 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-[var(--muted)]">
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
