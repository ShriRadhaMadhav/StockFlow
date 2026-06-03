import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth-store';
import { useToast } from '../../components/ui/toast/Toast';

export default function RegisterPage() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { register, isLoading } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast('Please fill in all the required fields', 'error');
      return;
    }

    if (password.length < 8) {
      toast('Password must be at least 8 characters long', 'error');
      return;
    }

    try {
      await register({ name, email, password });
      toast('Registration successful! Let\'s set up your store.', 'success');
      navigate('/store-setup');
    } catch (err: any) {
      toast(err.message || 'Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />

      {/* Main Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md p-8 m-4 rounded-2xl backdrop-blur-xl bg-slate-900/40 border border-slate-800 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L4 7L12 11L20 7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M4 7V15L12 19M20 7V15L12 19M12 11V19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M3 18C7 21 17 21 21 13" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Create Account</h2>
          <p className="text-sm text-slate-400 text-center">Join StockFlow to automate your retail operations today</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>

        {/* Login Redirect Link */}
        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
