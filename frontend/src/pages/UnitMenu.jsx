import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db as supabase } from '../supabaseClient';
import { 
  FaArrowLeft, FaGamepad, FaShapes, FaSlidersH, 
  FaMicrophoneAlt, FaMicrophone, FaBookOpen, FaMagic, 
  FaSearch, FaHammer, FaFont, FaSyncAlt, FaHeadphones, FaTh, FaQuoteRight, FaStream
} from 'react-icons/fa'; 

const UnitMenu = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [unitData, setUnitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masteryData, setMasteryData] = useState({});

  useEffect(() => {
    const loadUnitAndProgress = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: uData } = await supabase.from('units').select('title').eq('id', unitId).single();
        if (uData) setUnitData(uData);

        if (user) {
          const { data: pData } = await supabase
            .from('user_progress')
            .select('game_type, progress_percent')
            .eq('user_id', user.id)
            .eq('unit_id', unitId);
          
          if (pData) {
            const progressMap = pData.reduce((acc, item) => {
              acc[item.game_type] = item.progress_percent;
              return acc;
            }, {});
            setMasteryData(progressMap);
          }
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    if (unitId) loadUnitAndProgress();
  }, [unitId]);

  const games = [
    { id: '1', name: 'Sight Word Glow', icon: <FaMagic />, color: 'bg-indigo-600', path: 'sight-word-glow', type: 'sight-word-glow', tag: '1. LEARN' },
    { id: '2', name: 'Snapshot Stars', icon: <FaSyncAlt />, color: 'bg-blue-600', path: 'snapshot-stars', type: 'snapshot-stars', tag: '2. SNAPSHOT' },
    { id: '3', name: 'Sight Word Pop', icon: <FaGamepad />, color: 'bg-purple-500', path: 'sight-word-pop', type: 'sight-word-pop', tag: '3. PLAY' },
    { id: '4', name: 'Phonics Fusion', icon: <FaShapes />, color: 'bg-indigo-400', path: 'fusion', type: 'fusion' },
    { id: '5', name: 'Word Ninja', icon: <FaFont />, color: 'bg-orange-500', path: 'segmentation', type: 'segmentation' },
    { id: '6', name: 'Word Slider', icon: <FaSlidersH />, color: 'bg-teal-600', path: 'word-slider', type: 'word-slider' },
    { id: '7', name: 'Word Hunter', icon: <FaSearch />, color: 'bg-amber-500', path: 'word-hunter', type: 'word-hunter' },
    { id: '8', name: 'Word Spy', icon: <FaSearch />, color: 'bg-violet-600', path: 'word-spy', type: 'word-spy' },
    { id: '9', name: 'Phonics Builder', icon: <FaHammer />, color: 'bg-pink-500', path: 'phonics-builder', type: 'phonics-builder' },
    { id: '10', name: 'Word Grid', icon: <FaTh />, color: 'bg-rose-500', path: 'grid', type: 'word-grid' },
    { id: '11', name: 'Sentence Stream', icon: <FaStream />, color: 'bg-emerald-500', path: 'sentence-stream', type: 'sentence-stream' },
    { id: '12', name: 'Word by Word', icon: <FaMicrophone />, color: 'bg-cyan-500', path: 'word-by-word', type: 'word-by-word' },
    { id: '13', name: 'Sentence Reader', icon: <FaMicrophoneAlt />, color: 'bg-blue-500', path: 'sentence-reader', type: 'sentence-reader' },
    { id: '14', name: 'Sentence Builder', icon: <FaQuoteRight />, color: 'bg-sky-500', path: 'sentence-builder', type: 'sentence-builder' },
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-500 animate-pulse text-2xl uppercase italic">Opening Unit...</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans">
      <div className="bg-white p-6 shadow-md flex items-center gap-4 sticky top-0 z-20 border-b-4 border-slate-200">
        <button onClick={() => navigate(-1)} className="bg-slate-100 p-4 rounded-2xl text-slate-600 shadow-sm active:translate-y-1"><FaArrowLeft /></button>
        <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">{unitData?.title || `Unit ${unitId}`}</h1>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {games.map((game) => {
          const progress = masteryData[game.type] || 0;
          return (
            <motion.button key={game.id} whileTap={{ scale: 0.97 }} onClick={() => navigate(`/unit/${unitId}/game/${game.path}`)} className={`${game.color} text-white p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group border-b-[8px] border-black/20 active:border-b-0 active:translate-y-1 transition-all relative overflow-hidden`}>
              <div className="absolute bottom-0 left-0 h-2 bg-black/20 w-full">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-white/40" />
              </div>
              <div className="flex flex-col items-start text-left">
                {game.tag && <span className="absolute -top-3 left-6 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-full border-2 border-white">{game.tag}</span>}
                <div className="text-4xl mb-2 group-hover:rotate-12 transition-transform">{game.icon}</div>
                <span className="text-2xl font-black uppercase italic tracking-tighter">{game.name}</span>
                {progress > 0 && <span className="text-[10px] font-black opacity-60 uppercase">{Math.round(progress)}% Mastery</span>}
              </div>
              <FaArrowLeft className="rotate-180 opacity-30 group-hover:translate-x-2 transition-transform" size={24} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default UnitMenu;