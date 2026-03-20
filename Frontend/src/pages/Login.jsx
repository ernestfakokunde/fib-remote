import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalContext } from '../context/context.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const Login = () => {
  const { Login, loading } = useGlobalContext();
  const navigate = useNavigate();

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
      navigate('/');
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
          {' '}
          Log back in
        </h2>
        <p className="text-[var(--muted)] text-center text-sm mb-8">
          Log in to your Inventory Pro account
        </p>

        <form className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-[var(--text)]">
              Email Address
            </label>
            <input
              type='email'
              onChange={handleChange}
              name='email'
              value={email}
              required
              placeholder='Enter your email address'
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