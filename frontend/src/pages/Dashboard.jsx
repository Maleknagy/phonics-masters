import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaPlay, FaStar, FaGlobeAmericas, FaMountain, FaWater, 
  FaCloud, FaSignOutAlt, FaGamepad 
} from 'react-icons/fa';
import { logout } from '../redux/slices/authSlice';
import { db as supabase } from '../supabaseClient'; 
import Loading from '../components/Loading';
import RandomCelebration from '../components/RandomCelebration';

const GAMES_PER_UNIT = 16; 

const LEVEL_CONFIG = {
  1: { title: "Short Vowel Sounds", emoji: "Dolly 🐬", char: "🐬", icon: <FaWater />, color: "from-cyan-400 to-blue-600 shadow-blue-200" },
  2: { title: "Long Vowel Sounds", emoji: "Leo 🦁", char: "🦁", icon: <FaMountain />, color: "from-sky-400 to-indigo-600 shadow-indigo-200" },
  3: { title: "Beginning Blends", emoji: "Dippy 🦕", char: "🦕", icon: <FaWater />, color: "from-amber-400 to-orange-500 shadow-amber-200" },
  4: { title: "Ending Blends", emoji: "Pip 🦜", char: "🦜", icon: <FaCloud />, color: "from-purple-400 to-pink-500 shadow-pink-200" }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student');
  const [totalStars, setTotalStars] = useState(0);

  useEffect(() => {
    fetchDashboardData();      
  }, []);

  const fetchDashboardData = async () => {
    try {
        setLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          const role = currentUser.user_metadata?.role || 'student';
          setUserRole(role);
          
          const userId = currentUser.id;
          const [dbLevels, allUnits, allProgress] = await Promise.all([
              supabase.from('levels').select('*').order('id'),
              supabase.from('units').select('id, level_id'),
              supabase.from('user_progress').select('*').eq('user_id', userId)
          ]);

          if (dbLevels.data && allUnits.data) {
              const mappedLevels = dbLevels.data.map((l, index) => {
                  const levelUnits = allUnits.data.filter(u => u.level_id === l.id); 
                  let totalUnitPercentage = 0;
                  
                  if (role === 'student') {
                    levelUnits.forEach(u => {
                        const unitGames = allProgress.data?.filter(p => p.unit_id === u.id) || [];
                        const unitScoreSum = unitGames.reduce((acc, r) => acc + (r.progress_percent || 0), 0);
                        totalUnitPercentage += (unitScoreSum / GAMES_PER_UNIT);
                    });
                  }

                  return {
                      ...l,
                      level_number: index + 1,
                      completionPercentage: role === 'teacher' ? 0 : Math.round(totalUnitPercentage / (levelUnits.length || 1))
                  };
              });
              setLevels(mappedLevels);
              setTotalStars(allProgress.data?.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) || 0);
          }
        }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-indigo-50 font-black text-indigo-500 animate-pulse uppercase tracking-widest text-xs italic">Loading Safari World...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-40 overflow-x-hidden">
      <RandomCelebration frequency={0.1} />

      {/* HEADER HUD */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 p-4 border-b-4 border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#4f46e5] rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] rotate-2">
                <FaGamepad size={28} />
             </div>
             
             <div className="flex flex-col">
                <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">
                   Phonics Masters
                </h1>
                {/* Clean user name: No prefix */}
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 italic">
                   {userRole === 'teacher' ? 'Teacher Hub' : (user?.user_metadata?.childName || 'Young Master')}
                </p>
             </div>
          </div>

          <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 px-5 py-2 rounded-2xl flex items-center gap-2 text-yellow-950 border-b-4 border-yellow-700 shadow-lg">
            <FaStar className="text-white drop-shadow-md animate-pulse" />
            <div className="flex flex-col leading-none">
                <span className="text-xl font-black tabular-nums">{totalStars}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Mastery Points</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(userRole === 'teacher' ? '/teacher-dashboard' : '/progress')} 
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider border border-indigo-100 shadow-sm hover:bg-white transition-all"
            >
                {userRole === 'teacher' ? 'Admin' : 'Stats'}
            </button>
            <button onClick={handleLogout} className="p-3 text-slate-300 hover:text-red-500 transition-all"><FaSignOutAlt size={20} /></button>
          </div>
        </div>
      </header>

      {/* MAP VIEW */}
      <div className="max-w-md mx-auto px-6 py-24 relative">
        
        {/* VERTICAL MAP PATH (DASHED LINE) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
             <div className="h-full w-full border-l-4 border-dashed border-indigo-200 opacity-60" />
             <div className="absolute -bottom-10 text-indigo-200"><FaStar size={24}/></div>
        </div>

        <div className="space-y-32 relative">
          {levels.map((level, index) => {
            const config = LEVEL_CONFIG[level.level_number] || LEVEL_CONFIG[1];

            return (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`flex flex-col ${index % 2 === 0 ? 'items-start' : 'items-end'}`}
              >
                <div className="relative group">
                    <motion.button
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 4, delay: index * 0.5, ease: "easeInOut" }}
                      onClick={() => navigate(`/level/${level.id}`)}
                      className="relative w-56 h-56 transition-all duration-300 active:scale-95"
                    >
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${config.color} border-b-[12px] border-black/20 flex flex-col items-center justify-center text-white p-6 relative shadow-2xl overflow-visible`}>
                        
                        <div className="absolute -bottom-4 -right-4 text-white/10 text-8xl rotate-12 pointer-events-none">
                            {config.icon}
                        </div>

                        {/* ANIMATED ANIMAL EMOJI: BREAKS OUT */}
                        <motion.span 
                            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: index * 0.2 }}
                            whileHover={{ 
                                scale: 1.4, 
                                y: -45,
                                rotate: [0, 10, -10, 360],
                                transition: { type: "spring", stiffness: 300, damping: 12 }
                            }}
                            className="text-8xl absolute -top-14 drop-shadow-[0_25px_25px_rgba(0,0,0,0.4)] pointer-events-none z-20"
                        >
                            {config.char}
                        </motion.span>

                        <div className="mt-10 flex flex-col items-center">
                            <span className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Level {level.level_number}</span>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-center leading-none mb-4 px-4 drop-shadow-md">
                                {config.title}
                            </h2>

                            {/* PROGRESS BAR: REMOVED SHADED BACKGROUNDS */}
                            <div className="flex flex-col items-center w-full px-4">
                               <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden mb-1">
                                  <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${level.completionPercentage}%` }} 
                                      className="h-full bg-[#facc15]" 
                                  />
                               </div>
                               <span className="text-[9px] font-black uppercase italic tracking-tighter drop-shadow-sm">
                                  {level.completionPercentage}% Mastery
                               </span>
                            </div>
                        </div>
                      </div>
                    </motion.button>

                    {/* JUMP IN TAG */}
                    <motion.div 
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 3 }}
                        className={`absolute -top-16 ${index % 2 === 0 ? '-right-14' : '-left-14'} bg-white text-indigo-600 px-5 py-2.5 rounded-2xl shadow-xl font-black flex items-center gap-2 border-2 border-slate-50 text-[11px] uppercase italic z-30 pointer-events-none group-hover:bg-indigo-600 group-hover:text-white transition-colors opacity-100 scale-100`}
                    >
                        <FaPlay size={8}/> Jump In!
                    </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;