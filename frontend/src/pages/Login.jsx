import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { login } from '../redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserGraduate, FaChalkboardTeacher, FaLock, 
  FaEnvelope, FaRocket, FaSyncAlt, FaEye, FaEyeSlash 
} from 'react-icons/fa';

// Supabase Config
const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibXN3a2x0aXFlcHdjeW53Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzAzNzgsImV4cCI6MjA4MzMwNjM3OH0.fVB4f7KIoDdznFgnQ9ZDjr7W4fxk2dJpmu_fStPZ6_s';
const supabase = createClient(supabaseUrl, supabaseKey);

const Login = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle for eye icon
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false); 
  const [successMsg, setSuccessMsg] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResend(false);
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.toLowerCase(), // Ensure email is sent as lowercase
        password 
      });

      if (error) {
        if (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('verified')) {
          setShowResend(true);
        }
        throw error;
      }

      if (data.user) {
        // Fetch role from profile table as a secondary source of truth
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = profile?.role || data.user.user_metadata?.role || 'student';
        
        dispatch(login({
          id: data.user.id,
          email: data.user.email,
          childName: data.user.user_metadata?.childName || 'Explorer',
          currentLevel: data.user.user_metadata?.level || 1,
          role: userRole
        }));
        
        navigate(userRole === 'teacher' ? '/teacher-dashboard' : '/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase(),
    });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccessMsg("Check your inbox! We've sent a new link. 🚀");
      setShowResend(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first!");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccessMsg("Reset link sent! Please check your email inbox.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 font-sans">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md border-b-[12px] border-slate-200 overflow-hidden">
        
        <div className="flex bg-slate-100 p-2 m-6 rounded-2xl gap-2">
          <button onClick={() => setActiveTab('student')} className={`flex-1 py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'student' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400'}`}><FaUserGraduate /> STUDENT</button>
          <button onClick={() => setActiveTab('teacher')} className={`flex-1 py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'teacher' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400'}`}><FaChalkboardTeacher /> TEACHER</button>
        </div>

        <div className="px-10 pb-10">
          <h1 className={`text-4xl font-black text-center italic uppercase mb-8 tracking-tighter ${activeTab === 'student' ? 'text-blue-600' : 'text-orange-600'}`}>Welcome Back!</h1>

          <AnimatePresence mode="wait">
            {error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-100 border-2 border-red-400 text-red-700 p-4 rounded-2xl mb-6 text-xs font-bold text-center">⚠️ {error}</motion.div>}
            {successMsg && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-green-100 border-2 border-green-400 text-green-700 p-4 rounded-2xl mb-6 text-xs font-bold text-center">✅ {successMsg}</motion.div>}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL ADDRESS */}
            <div className="relative">
              <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-5 pl-14 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-blue-400 focus:outline-none font-bold text-slate-700 lowercase" 
                placeholder="email address" 
                required 
              />
            </div>
            
            {/* PASSWORD WITH VISIBILITY TOGGLE */}
            <div className="relative">
              <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-5 pl-14 pr-12 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-blue-400 focus:outline-none font-bold text-slate-700" 
                placeholder="password" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full text-white font-black py-6 rounded-3xl shadow-xl transition transform active:scale-95 flex items-center justify-center gap-3 text-xl uppercase tracking-wider border-b-8 ${activeTab === 'student' ? 'bg-blue-500 border-blue-800' : 'bg-orange-500 border-orange-700'}`}
            >
              {loading ? 'WAITING...' : <>LET'S GO <FaRocket /></>}
            </button>

            <div className="flex flex-col gap-3 items-center">
              {showResend && (
                <button type="button" onClick={handleResendEmail} className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest hover:underline">
                  <FaSyncAlt /> Resend Link
                </button>
              )}
              
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-slate-400 font-bold text-xs uppercase hover:text-blue-500 transition-colors tracking-widest"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              New explorer? <Link to="/register" className="text-blue-500 hover:underline">Create Account</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;