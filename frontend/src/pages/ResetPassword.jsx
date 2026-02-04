import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { db as supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 border-b-[12px] border-slate-200"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FaLock size={32} />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
            Reset Password
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase mt-2 tracking-widest">
            Enter your new secure password
          </p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-bold text-center flex items-center justify-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {message.type === 'success' && <FaCheckCircle />} {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="relative">
            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-slate-50 border-4 border-slate-100 p-5 pl-14 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold" 
              placeholder="NEW PASSWORD" 
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full bg-slate-50 border-4 border-slate-100 p-5 pl-14 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold" 
              placeholder="CONFIRM PASSWORD" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-6 bg-indigo-600 border-b-8 border-indigo-800 rounded-3xl text-white font-black text-xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"} <FaArrowRight />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;