import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaStar, FaBolt, FaMicrophoneAlt, FaAward, FaLock, FaUser, 
  FaPlayCircle, FaChalkboardTeacher, FaQuestionCircle, FaUserPlus, 
  FaGamepad, FaBrain, FaWaveSquare, FaShapes, FaBullseye, FaSearch,
  FaLayerGroup, FaQuoteLeft, FaChartLine, FaStream
} from 'react-icons/fa';
import { loginUser } from '../redux/slices/authSlice';

const LandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [role, setRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, error } = useSelector((state) => state.auth || {});

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (result.meta.requestStatus === 'fulfilled') navigate('/dashboard');
  };

  const labModules = [
    { 
        title: "Speech Analysis", 
        desc: "Story Recorder lab uses AI to detect phonemes in real-time for perfect pronunciation.", 
        icon: <FaMicrophoneAlt />, 
        color: "bg-sky-500" 
    },
    { 
        title: "Visual Anchoring", 
        desc: "Snapshot Stars builds permanent visual pathways for decoding through timing-based capture.", 
        icon: <FaBrain />, 
        color: "bg-yellow-500" 
    },
    { 
        title: "Phonemic Segmentation", 
        desc: "Teaches children to break words apart into distinct sounds, a critical precursor to spelling.", 
        icon: <FaLayerGroup />, 
        color: "bg-rose-500" 
    },
    { 
        title: "Visual Scavenging", 
        desc: "Word Hunter and Word Spy train eyes to scan and identify complex phonetic patterns.", 
        icon: <FaSearch />, 
        color: "bg-emerald-500" 
    },
    { 
        title: "Syntactic Architecture", 
        desc: "The Sentence Stream module builds grammar awareness by organizing word logic.", 
        icon: <FaStream />, 
        color: "bg-indigo-500" 
    },
    { 
        title: "Morphology Lab", 
        desc: "Word Grids and Phonics Builders allow kids to physically construct words from scratch.", 
        icon: <FaShapes />, 
        color: "bg-violet-500" 
    },
    { 
        title: "Contextual Fluency", 
        desc: "Story Reader bridges the gap between decoding sounds and understanding narratives.", 
        icon: <FaQuoteLeft />, 
        color: "bg-orange-500" 
    },
    { 
        title: "Automaticity Training", 
        desc: "High-speed interaction in Sight Word Glow creates instant recognition of high-frequency words.", 
        icon: <FaBolt />, 
        color: "bg-cyan-500" 
    },
    { 
        title: "Analytics Engine", 
        desc: "Real-time Mastery Tracking provides parents with granular data on every learning milestone.", 
        icon: <FaChartLine />, 
        color: "bg-slate-700" 
    }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans overflow-x-hidden">
      
      {/* LEFT SIDE: THE RICH CURRICULUM BLUEPRINT */}
      <div className="w-full md:w-3/5 bg-white md:h-screen md:overflow-y-auto relative border-r-4 border-slate-100">
        
        {/* HERO HEADER - UPDATED TO MATCH SCREENSHOT */}
        <section className="bg-[#1e1b4b] p-8 md:p-20 text-white relative overflow-hidden">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="flex flex-col mb-12">
                    <div className="w-16 h-16 bg-[#4f46e5] rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.8)] mb-4">
                        <FaGamepad size={32} />
                    </div>
                    <div className="uppercase tracking-tighter">
                        <h1 className="text-4xl font-black leading-none">PHONICS</h1>
                        <h1 className="text-4xl font-black leading-none">MASTERS</h1>
                        <p className="text-[#4f46e5] font-bold tracking-[0.3em] text-[10px] mt-1">THE GAME LAB</p>
                    </div>
                </div>

                <h2 className="text-[5.5rem] font-black italic tracking-tighter leading-[0.8] mb-8 uppercase">
                    WHERE <span className="text-[#93c5fd]">PLAY</span><br/>
                    BECOMES <span className="text-[#facc15]">FLUENCY</span>
                </h2>

                <p className="text-slate-300 text-lg font-medium max-w-xl leading-relaxed">
                    Step inside the Phonics Masters Game Lab. We've combined cognitive science with high-energy gameplay to create an engine that masters every sound, blend, and story.
                </p>
            </motion.div>
        </section>

        {/* THE GAME LAB: BLUEPRINT GRID */}
        <section className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-10">
                <FaGamepad className="text-indigo-600 text-2xl" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">The Phonics Game Lab</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {labModules.map((mod, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 transition-all hover:shadow-xl group"
                    >
                        <div className={`w-12 h-12 ${mod.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {mod.icon}
                        </div>
                        <h5 className="font-black uppercase italic tracking-tighter text-lg text-slate-800">{mod.title}</h5>
                        <p className="text-slate-500 text-xs mt-2 leading-relaxed font-bold uppercase tracking-tight opacity-70">
                            {mod.desc}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* BOTTOM STATS BAR */}
        <section className="bg-indigo-950 p-12 text-white flex flex-wrap justify-between gap-8 items-center">
            <div>
                <div className="text-5xl font-black italic tracking-tighter text-indigo-400">100%</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Curriculum Mastery</div>
            </div>
            <div>
                <div className="text-5xl font-black italic tracking-tighter text-yellow-400">24/7</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">AI Lab Access</div>
            </div>
            <div>
                <div className="text-5xl font-black italic tracking-tighter text-emerald-400">15+</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Game Modules</div>
            </div>
        </section>
      </div>

      {/* RIGHT SIDE: THE LOGIN GADGET (Sticky) */}
      <div className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-12 bg-slate-50 relative md:sticky md:top-0 md:h-screen">
         <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
            <div className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl border-b-[12px] border-slate-200 relative">
                
                {/* ROLE TOGGLE */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                    <button onClick={() => setRole('student')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                        <FaUser size={12}/> Student
                    </button>
                    <button onClick={() => setRole('teacher')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                        <FaChalkboardTeacher size={12}/> Teacher
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{role === 'student' ? 'Master Login' : 'Teacher Hub'}</h3>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-2">{role === 'student' ? 'Ready to explore?' : 'Restricted Access'}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <FaUser className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${role === 'teacher' ? 'text-violet-400' : 'text-slate-300'}`} />
                        <input type="email" placeholder="Email Address" className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="relative">
                        <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input type="password" placeholder="Password" className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-700" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    {role === 'student' && (
                        <div className="flex justify-end px-2">
                            <Link to="/reset-password" size={10} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                <FaQuestionCircle /> Forgot Password?
                            </Link>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className={`w-full text-white py-5 rounded-2xl font-black text-lg transition-all transform active:translate-y-1 active:shadow-none uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${role === 'teacher' ? 'bg-violet-600 shadow-[0_6px_0_#4c1d95] mt-6' : 'bg-indigo-600 shadow-[0_6px_0_#3730a3]'}`}>
                        {isLoading ? 'Checking...' : (role === 'student' ? 'Jump In!' : 'Enter Hub')}
                    </button>
                </form>

                {role === 'student' && (
                    <div className="mt-8 pt-8 border-t-2 border-slate-50 text-center space-y-4">
                        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">New to Phonics Masters?</p>
                        <button onClick={() => navigate('/register')} className="w-full py-4 border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                            <FaUserPlus /> Create Explorer Account
                        </button>
                    </div>
                )}
            </div>
         </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;