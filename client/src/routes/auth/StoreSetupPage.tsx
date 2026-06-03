import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth-store';
import { useToast } from '../../components/ui/toast/Toast';

const BUSINESS_TYPES = [
  { value: 'retail', label: 'Retail Store' },
  { value: 'wholesale', label: 'Wholesale & Distribution' },
  { value: 'apparel', label: 'Apparel & Fashion' },
  { value: 'electronics', label: 'Consumer Electronics' },
  { value: 'grocery', label: 'Grocery & Supermarket' },
  { value: 'pharmacy', label: 'Pharmacy & Medical' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'other', label: 'Other Business Type' },
];

export default function StoreSetupPage() {
  const [storeName, setStoreName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('retail');
  const [gstNumber, setGstNumber] = useState<string>('');
  const { createStore, isLoading } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName) {
      toast('Please enter a name for your store', 'error');
      return;
    }

    try {
      await createStore({
        storeName,
        businessType,
        gstNumber: gstNumber || undefined,
      });
      toast(`Congratulations! Store "${storeName}" is initialized successfully.`, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      toast(err.message || 'Failed to initialize store. Please try again.', 'error');
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
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center p-2 mb-3 shadow-[0_0_20px_rgba(5,150,105,0.4)]">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9M3 9V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V9M3 9H21M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Set Up Your Store</h2>
          <p className="text-sm text-slate-400 text-center">Initialize your primary store location to start operating</p>
        </div>

        {/* Store Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="storeName">
              Store / Business Name
            </label>
            <input
              id="storeName"
              type="text"
              placeholder="Apex Electronics"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="businessType">
              Business Category
            </label>
            <select
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type.value} value={type.value} className="bg-slate-900 text-white">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="gstNumber">
              GST / Tax Registration Number (Optional)
            </label>
            <input
              id="gstNumber"
              type="text"
              placeholder="29AAAAA1111A1Z1"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-[0_4px_14px_rgba(5,150,105,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              'Initialize Store'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
