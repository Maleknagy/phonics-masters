import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaArrowLeft, FaChartLine, FaCheckCircle, FaChalkboardTeacher } from 'react-icons/fa';
import { db as supabase } from '../supabaseClient';

const LEVEL_THEMES = {
  1: { primary: 'from-blue-600 to-indigo-600', accent: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  2: { primary: 'from-purple-600 to-fuchsia-600', accent: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  3: { primary: 'from-emerald-600 to-teal-600', accent: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  4: { primary: 'from-orange-500 to-rose-500', accent: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' }
};

const UNIT_TAGLINES = {
  1: ["Short /a/ Sound", "Short /e/ Sound", "Short /i/ Sound", "Short /o/ Sound", "Short /u/ Sound"],
  2: ["Long /a/ Sound (Magic e)", "Long /i/ Sound (Magic e)", "Long /o/ Sound (Magic e)", "Long /u/ Sound (Magic e)", "Long /u/ Sound (Magic e)"],
  3: [
    "'L' Blends: bl, cl, fl, gl, pl, sl", 
    "'R' Blends: br, cr, fr, gr, pr, tr, dr", 
    "'S' Blends: sm, sn, sp, st, sk, sc, sw", 
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

const Progress = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [activeLevel, setActiveLevel] = useState(1);
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [dbUnits, setDbUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = LEVEL_THEMES[activeLevel] || LEVEL_THEMES[1];

  const GAMES_MAP = [
    { name: 'Sight Word Glow', slug: 'sight-word-glow' }, { name: 'Snapshot Stars', slug: 'snapshot-stars' },
    { name: 'Sight Word Pop', slug: 'sight-word-pop' }, { name: 'Phonics Fusion', slug: 'fusion' },
    { name: 'Word Ninja', slug: 'segmentation' }, { name: 'Word Slider', slug: 'word-slider' },
    { name: 'Word Hunter', slug: 'word-hunter' }, { name: 'Word Spy', slug: 'word-spy' },
    { name: 'Phonics Builder', slug: 'phonics-builder' }, { name: 'Word Grid', slug: 'grid' },
    { name: 'Word Matter', slug: 'word-matter' }, { name: 'Word by Word', slug: 'word-by-word' },
    { name: 'Sentence Reader', slug: 'sentence-reader' }, { name: 'Sentence Builder', slug: 'sentence-builder' },
    { name: 'Story Time', slug: 'story' }, { name: 'Story Star', slug: 'story-recorder' }
  ];

  useEffect(() => { fetchAllData(); }, [studentId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) return;

      const [unitsRes, progressRes] = await Promise.all([
        supabase.from('units').select('*').order('unit_number'),
        supabase.from('user_progress').select('*').eq('user_id', targetId)
      ]);

      setDbUnits(unitsRes.data || []);
      setUserProgress(progressRes.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getUnitsForLevel = () => {
    return dbUnits.filter(u => Number(u.level_id) === activeLevel).map((u, index) => {
      const unitGames = userProgress.filter(p => p.unit_id === u.id);
      const unitScore = unitGames.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0);
      const avg = Math.min(Math.round(unitScore / 16), 100);
      return { ...u, progress: avg, games: unitGames, tagline: UNIT_TAGLINES[activeLevel]?.[index] || u.title };
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white font-black text-indigo-500 italic text-xs">SYNCING...</div>;

  return (
    <div className={`min-h-screen ${theme.accent} p-4 md:p-6 font-sans select-none pb-10 transition-colors duration-500`}>
      <div className="max-w-[1400px] mx-auto">
        
        {/* SPECTATOR BANNER */}
        {studentId && (
          <div className="mb-6 bg-white p-3 rounded-2xl flex items-center justify-between shadow-sm border border-orange-200">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md"><FaChalkboardTeacher size={18} /></div>
                <div>
                  <span className="font-black uppercase text-[8px] tracking-widest text-orange-600 block leading-none">Spectator Mode</span>
                  <span className="text-slate-500 font-bold text-[10px] italic">Viewing Student Progress Report</span>
                </div>
             </div>
             <button onClick={() => navigate('/teacher-dashboard')} className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-lg font-black text-[9px] uppercase border border-orange-100">Exit View</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-400 font-bold text-[8px] tracking-widest uppercase hover:text-indigo-600 transition-all"><FaArrowLeft /> BACK</button>
          <div className={`bg-white shadow-sm border ${theme.border} px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 ${theme.text}`}><FaChartLine /> SUMMARY</div>
        </div>

        <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl flex gap-1.5 mb-8 border border-slate-200 max-w-sm mx-auto shadow-sm">
          {[1, 2, 3, 4].map((num) => (
            <button key={num} onClick={() => { setActiveLevel(num); setExpandedUnit(null); }} className={`flex-1 py-2 rounded-xl font-black text-[9px] transition-all ${activeLevel === num ? `bg-gradient-to-br ${theme.primary} text-white shadow-md` : 'text-slate-400 hover:text-slate-600'}`}>LVL {num}</button>
          ))}
        </div>

        <div className="text-center mb-10">
           <h1 className={`text-4xl md:text-5xl font-black tracking-tight uppercase italic leading-none mb-2 bg-gradient-to-br ${theme.primary} bg-clip-text text-transparent`}>
             {activeLevel === 1 ? "Short Vowel Sounds" : activeLevel === 2 ? "Long Vowel Sounds (Magic e)" : activeLevel === 3 ? "Beginning Blends" : "Ending Blends"}
           </h1>
           <p className={`text-[7px] font-black uppercase tracking-[0.4em] ${theme.text} opacity-60`}>Adventure Progress Tracker</p>
        </div>

        <div className="space-y-3 max-w-5xl mx-auto">
          {getUnitsForLevel().map((unit) => {
            const isExpanded = expandedUnit === unit.id;
            const isComplete = unit.progress === 100;
            return (
              <div key={unit.id} className={`rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'bg-white border-transparent shadow-xl scale-[1.01]' : 'bg-white/70 border-white shadow-sm'}`}>
                <button onClick={() => setExpandedUnit(isExpanded ? null : unit.id)} className="w-full p-4 flex flex-col gap-3">
                  <div className="w-full flex justify-between items-center text-left">
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded-md font-black text-[7px] uppercase tracking-tighter ${isExpanded ? `bg-gradient-to-br ${theme.primary} text-white` : 'bg-slate-100 text-slate-500'}`}>U{unit.unit_number}</span>
                      <h3 className={`text-[13px] font-black uppercase italic leading-none tracking-tight ${isExpanded ? 'text-slate-900' : 'text-slate-600'}`}>{unit.tagline}</h3>
                      {isComplete && <FaCheckCircle className="text-emerald-500" size={14} />}
                    </div>
                    <FaChevronDown className={`transition-transform duration-500 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-slate-300'}`} size={10} />
                  </div>

                  {/* HIGH CONTRAST UNIT PROGRESS BAR */}
                  <div className="flex items-center gap-3 w-full pr-1">
                    <div className="flex-1 h-2 bg-indigo-950/10 rounded-full border border-slate-100 p-[1px] overflow-hidden shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${unit.progress}%` }} className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : `bg-gradient-to-r ${theme.primary}`}`} />
                    </div>
                    <span className={`text-[9px] font-black italic min-w-[25px] ${isComplete ? 'text-emerald-600' : 'text-slate-600'}`}>{unit.progress}%</span>
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        {GAMES_MAP.map((game, i) => {
                          const gameProgRow = unit.games.find(g => g.game_type.toLowerCase().trim().replace(/_/g, '-') === game.slug);
                          const prog = gameProgRow?.progress_percent || 0;
                          const gameComplete = prog === 100;
                          return (
                            <div key={i} className={`p-3 rounded-xl border transition-all flex flex-col justify-center min-h-[60px] ${gameComplete ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-50 shadow-sm'}`}>
                              <h4 className={`font-bold text-[11px] mb-2 leading-tight tracking-tight ${gameComplete ? 'text-emerald-700' : 'text-slate-800'}`}>{game.name}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-50 rounded-full border border-slate-100 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${prog}%` }} className={`h-full ${gameComplete ? 'bg-emerald-400' : `bg-gradient-to-r ${theme.primary} opacity-60`}`} /></div>
                                <span className={`text-[8px] font-black italic ${gameComplete ? 'text-emerald-600' : 'text-slate-600'}`}>{prog}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Progress;