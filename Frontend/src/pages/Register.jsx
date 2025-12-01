import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGlobalContext } from '../context/context.jsx';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 sm:p-10 max-w-md w-full border border-gray-100">
        <div className="w-16 h-16 mx-auto bg-blue-500 rounded-2xl"></div>

        <h2 className="text-2xl font-semibold text-center mt-4">Create Account</h2>
        <p className="text-gray-500 text-center text-sm mb-8">
          Get started with your inventory
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input
              required
              type="text"
              name="username"
              value={username}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full outline-none mt-1 p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full outline-none mt-1 p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              minLength={8}
              name="password"
              required
              value={password}
              onChange={handleChange}
              className="w-full mt-1 outline-none p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              value={confirmPassword}
              onChange={handleChange}
              className="w-full mt-1 outline-none p-3 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#1A1A2E] text-white font-medium rounded-lg hover:bg-black transition disabled:bg-gray-400"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;