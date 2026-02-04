import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaEye, FaEyeSlash, FaRocket, FaArrowLeft } from 'react-icons/fa';
// Use the central client
import { db as supabase } from '../supabaseClient';
// Changed 'login' to 'loginUser' to match the updated slice
import { loginUser } from '../redux/slices/authSlice';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', childName: '', phone: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9+]/g, '');
    setFormData({ ...formData, phone: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            childName: formData.childName,
            phone: formData.phone,
            role: 'student',
            level: 1
          },
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (signUpError) throw signUpError;

      if (data.user && data.session === null) {
        setSuccessMsg("Check your email! 🚀 We sent a magic link to activate your account.");
      } else if (data.user && data.session) {
        // Log them in immediately if email confirmation is disabled
        await dispatch(loginUser({ email: formData.email, password: formData.password }));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 px-4 font-sans py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md border-b-[12px] border-indigo-200/50 p-10 md:p-12"
      >
        {/* BACK BUTTON */}
        <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors">
            <FaArrowLeft /> Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg rotate-6 mb-4">
            <FaRocket size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">New Master</h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-2">Start your reading journey</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-[10px] font-black uppercase text-center border border-red-100">
              ⚠️ {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 text-emerald-700 p-8 rounded-[2.5rem] mb-6 text-sm font-bold text-center border-2 border-emerald-100">
              <div className="text-4xl mb-4">📧</div>
              {successMsg}
              <button onClick={() => navigate('/')} className="mt-6 text-indigo-600 block w-full font-black uppercase text-xs tracking-widest">Done</button>
            </motion.div>
          )}
        </AnimatePresence>

        {!successMsg && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative group">
              <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                className="w-full p-4 pl-14 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 outline-none font-bold text-slate-700 transition-all" 
                placeholder="Student Name" 
                value={formData.childName} 
                onChange={(e) => setFormData({...formData, childName: e.target.value})} 
                required 
              />
            </div>

            <div className="relative group">
              <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email" 
                className="w-full p-4 pl-14 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 outline-none font-bold text-slate-700 lowercase transition-all" 
                placeholder="Parent Email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>

            <div className="relative group">
              <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                className="w-full p-4 pl-14 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 outline-none font-bold text-slate-700 transition-all" 
                placeholder="Phone Number (+)" 
                value={formData.phone} 
                onChange={handlePhoneChange} 
                required 
              />
            </div>

            <div className="relative group">
              <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full p-4 pl-14 pr-12 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 outline-none font-bold text-slate-700 transition-all" 
                placeholder="Create Password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-[0_6px_0_#3730a3] transition-all transform active:translate-y-1 active:shadow-none text-lg uppercase tracking-widest mt-4"
            >
              {loading ? 'Creating...' : 'Join Adventure!'}
            </button>
          </form>
        )}
        
        <p className="text-center mt-8 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Already a Master? <Link to="/" className="text-indigo-600 hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;