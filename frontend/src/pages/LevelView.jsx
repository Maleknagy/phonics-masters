import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../supabaseClient';
import { 
  FaChevronDown, FaGamepad, FaShapes, FaSlidersH, FaCut, FaSearch, FaHammer, FaTh, 
  FaHeadphones, FaMicrophone, FaMicrophoneAlt, FaQuoteRight, FaBookOpen, FaMagic, FaSyncAlt, FaArrowLeft, FaStar, FaStream
} from 'react-icons/fa';

const LEVEL_TITLES = { 
  1: "Short Vowel Sounds", 
  2: "Long Vowel Sounds (Magic e)", 
  3: "Beginning Consonant Blends", 
  4: "Ending Consonant Blends" 
};

const UNIT_TAGLINES = {
  1: [
    "Short /a/ Sound", 
    "Short /e/ Sound", 
    "Short /i/ Sound", 
    "Short /o/ Sound", 
    "Short /u/ Sound"
  ],
  2: [
    "Long /a/ Sound (Magic e)", 
    "Long /i/ Sound (Magic e)", 
    "Long /o/ Sound (Magic e)", 
    "Long /u/ Sound (Magic e)", 
    "Long /u/ Sound (Magic e)"
  ],
  3: [
    "\"L\" Blends: bl, cl, fl, gl, pl, sl", 
    "\"R\" Blends: br, cr, fr, gr, pr, tr, dr", 
    "\"S\" Blends: sm, sn, sp, st, sk, sc, sw", 
    "Digraphs: sh, ch, th, wh, ph", 
    "Other Blends: spl, spr, str, scr, squ, shr, thr"
  ],
  4: [
    "Ending Blends: -nt, -nd, -nk, -ng, -ld, -nt", 
    "Ending Blends: -lp, -lf, -lk, -ft, -ct, -mp", 
    "Ending Blends: -st, -sp, -sk, -sh, -nch", 
    "Ending Blends: -k, -ck, -ch, -tch", 
    "Ending Blends: -ble, -ple, -cle, -kle, -gle, -dle"
  ]
};

const LevelView = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ units: [], progress: {} });
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  const games = [
    { name: 'Sight Glow', icon: <FaMagic />, color: 'bg-indigo-500', path: 'sight-word-glow' },
    { name: 'Snapshot', icon: <FaSyncAlt />, color: 'bg-blue-600', path: 'snapshot-stars' },
    { name: 'Word Pop', icon: <FaGamepad />, color: 'bg-purple-500', path: 'sight-word-pop' },
    { name: 'Fusion', icon: <FaShapes />, color: 'bg-indigo-400', path: 'fusion' },
    { name: 'Ninja', icon: <FaCut />, color: 'bg-orange-500', path: 'segmentation' },
    { name: 'Slider', icon: <FaSlidersH />, color: 'bg-teal-600', path: 'word-slider' },
    { name: 'Hunter', icon: <FaSearch />, color: 'bg-amber-500', path: 'word-hunter' },
    { name: 'Word Spy', icon: <FaSearch />, color: 'bg-violet-600', path: 'word-spy' },
    { name: 'Builder', icon: <FaHammer />, color: 'bg-pink-500', path: 'phonics-builder' },
    { name: 'Grid', icon: <FaTh />, color: 'bg-rose-500', path: 'grid' },
    { name: 'Sentence Stream', icon: <FaStream />, color: 'bg-emerald-500', path: 'sentence-stream' },
    { name: 'Mic Check', icon: <FaMicrophone />, color: 'bg-cyan-500', path: 'word-by-word' },
    { name: 'Sentence Reader', icon: <FaMicrophoneAlt />, color: 'bg-blue-500', path: 'sentence-reader' },
    { name: 'Sentence Builder', icon: <FaQuoteRight />, color: 'bg-sky-500', path: 'sentence-builder' },
    { name: 'Story Time', icon: <FaBookOpen />, color: 'bg-yellow-500', path: 'story' },
    { name: 'Story Star', icon: <FaMicrophone />, color: 'bg-indigo-600', path: 'story-recorder' }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await db.auth.getUser();
        const [unitsRes, progRes] = await Promise.all([
          db.from('units').select('*').eq('level_id', levelId).order('unit_number'),
          db.from('user_progress').select('*').eq('user_id', user.id)
        ]);
        
        const progMap = {};
        progRes.data?.forEach(p => {
          if (!progMap[p.unit_id]) progMap[p.unit_id] = {};
          const normalizedKey = p.game_type.toLowerCase().trim().replace(/_/g, '-');
          progMap[p.unit_id][normalizedKey] = p.progress_percent;
        });

        setData({ units: unitsRes.data || [], progress: progMap });
        if (unitsRes.data?.length > 0) setExpandedUnit(unitsRes.data[0].id);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetchData();
  }, [levelId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-5xl text-blue-500 mb-4"><FaSyncAlt /></motion.div>
      <p className="font-black text-slate-400 uppercase tracking-tighter italic">Mapping Adventure...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      {/* HEADER HUD */}
      <div className="bg-white p-6 sticky top-0 z-50 border-b-4 border-slate-200 shadow-sm flex items-center justify-between">
        <button onClick={() => navigate('/dashboard')} className="p-4 bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-all"><FaArrowLeft /></button>
        <div className="text-center px-4">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic leading-none tracking-tighter">
                {LEVEL_TITLES[levelId] || `Level ${levelId}`}
            </h1>
        </div>
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg text-yellow-900"><FaStar size={24}/></div>
      </div>

      <div className="max-w-2xl mx-auto p-6 relative">
        {/* THE ADVENTURE PATH LINE */}
        <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-slate-200 -translate-x-1/2 rounded-full hidden md:block" />

        <div className="space-y-12 relative">
          {data.units.map((unit, index) => {
            const unitProg = data.progress[unit.id] || {};
            const unitTotal = Object.values(unitProg).reduce((a, b) => a + b, 0);
            const unitPercent = Math.min(Math.round(unitTotal / 16), 100);
            const isExpanded = expandedUnit === unit.id;
            const tagline = UNIT_TAGLINES[levelId]?.[index] || unit.title;

            return (
              <motion.div 
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col ${index % 2 === 0 ? 'md:items-start' : 'md:items-end'} transition-all`}
              >
                <div className={`w-full md:w-[95%] bg-white rounded-[3rem] shadow-xl overflow-hidden border-b-[12px] ${isExpanded ? 'border-indigo-700' : 'border-slate-200'}`}>
                  {/* UNIT TAB */}
                  <button 
                    onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                    className={`w-full p-8 flex items-center justify-between transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-3xl flex-shrink-0 flex items-center justify-center text-xl md:text-2xl font-black shadow-inner ${isExpanded ? 'bg-indigo-800' : 'bg-slate-100 text-slate-400'}`}>
                            {unit.unit_number}
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter leading-tight">
                                {tagline}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-20 md:w-24 h-2 bg-black/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${unitPercent}%` }}
                                        className="h-full bg-yellow-400" 
                                    />
                                </div>
                                <span className={`text-[10px] font-black ${isExpanded ? 'text-white/60' : 'text-slate-400'}`}>{unitPercent}%</span>
                            </div>
                        </div>
                    </div>
                    <FaChevronDown className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : 'opacity-20'}`} />
                  </button>

                  {/* GAME GRID */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
                      >
                        {games.map((game) => {
                          const gameProgress = data.progress[unit.id]?.[game.path] || 0;
                          return (
                            <button 
                              key={game.path}
                              onClick={() => navigate(`/unit/${unit.id}/game/${game.path}`)}
                              className="bg-white p-4 rounded-[2rem] shadow-sm border-b-4 border-slate-200 flex flex-col items-center gap-2 active:scale-90 transition-all hover:border-indigo-400 group"
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:rotate-12 ${game.color}`}>
                                {game.icon}
                              </div>
                              <span className="text-[9px] font-black uppercase text-slate-500 text-center leading-tight tracking-tight">{game.name}</span>
                              
                              {/* MINI GAME BAR */}
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${gameProgress}%` }}
                                  className="h-full bg-green-500"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelView;