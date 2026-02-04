import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaVolumeUp, FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const SightWordPop = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
    
  const [targetWord, setTargetWord] = useState(null);
  const [bubbles, setBubbles] = useState([]); 
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scoreRef = useRef(0);
  const bubbleIdCounter = useRef(0);
  const spawnerRef = useRef(null);
  const wordsRef = useRef([]);

  useEffect(() => { scoreRef.current = score; }, [score]);

  const getLevelConfig = (currentScore) => {
    if (currentScore < 30) return { spawnRate: 2200, speed: 10 };
    if (currentScore < 70) return { spawnRate: 1700, speed: 7 };
    return { spawnRate: 1200, speed: 5 };
  };

  useEffect(() => {
    async function loadData() {
        try {
            setIsLoading(true);
            const { data: { user } } = await db.auth.getUser();
            const { data } = await db.from('course_content')
                .select('content').eq('unit_id', unitId).eq('category', 'sight_word'); 

            if (data && data.length > 0) {
                const words = data.map(item => item.content);
                wordsRef.current = words;
                const { data: pData } = await db.from('user_progress').select('progress_percent')
                    .eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'sight_word').maybeSingle();
                if (pData) setScore(pData.progress_percent || 0);
            }
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    }
    loadData();
    return () => clearInterval(spawnerRef.current);
  }, [unitId]);

  useEffect(() => {
    if (isPlaying && !showWin && targetWord) {
        const config = getLevelConfig(scoreRef.current);
        spawnerRef.current = setInterval(spawnBubble, config.spawnRate);
    } else {
        clearInterval(spawnerRef.current);
    }
    return () => clearInterval(spawnerRef.current);
  }, [isPlaying, showWin, targetWord]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startGame = () => {
    setBubbles([]);
    setIsPlaying(true);
    pickNewTarget();
  };

  const pickNewTarget = () => {
    if (wordsRef.current.length === 0) return;
    const randomWord = wordsRef.current[Math.floor(Math.random() * wordsRef.current.length)];
    setTargetWord(randomWord);
    setTimeout(() => speak(randomWord), 500);
  };

  const spawnBubble = () => {
    const id = bubbleIdCounter.current++;
    const config = getLevelConfig(scoreRef.current);
    const word = Math.random() < 0.45 ? targetWord : wordsRef.current[Math.floor(Math.random() * wordsRef.current.length)];
    setBubbles(prev => [...prev, { id, word, x: Math.random() * 75 + 5, duration: config.speed, status: 'active' }]);
  };

  const handlePop = (id, bubbleWord) => {
    const isCorrect = bubbleWord === targetWord;
    
    // Play sound immediately on user gesture
    const soundPath = isCorrect ? '/audio/correct.mp3' : '/audio/wrong.mp3';
    const audio = new Audio(soundPath);
    audio.volume = 1.0;
    audio.play().catch(e => console.error("Sound blocked or missing:", e));

    setBubbles(prev => prev.map(b => b.id === id ? { ...b, status: isCorrect ? 'correct' : 'wrong' } : b));

    if (isCorrect) {
        const nextScore = Math.min(100, score + 3);
        setScore(nextScore);
        setTimeout(() => {
            setBubbles(prev => prev.filter(b => b.id !== id));
            if (nextScore >= 100) {
                setIsPlaying(false);
                setShowWin(true);
                saveProgress(unitId, 'sight_word', 100, 100);
            } else {
                pickNewTarget();
            }
        }, 400);
    } else {
        setScore(prev => Math.max(0, prev - 3));
        setTimeout(() => {
            setBubbles(prev => prev.filter(b => b.id !== id));
        }, 400);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-sky-500 flex items-center justify-center text-white text-3xl font-black italic uppercase tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 overflow-hidden relative font-sans text-white select-none">
      
      {/* UNIFIED HEADER */}
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-[100] bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-sky-600 shadow-[0_5px_0_#cbd5e1] active:translate-y-1 active:shadow-none transition-all">
          <FaArrowLeft />
        </button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
           </div>
           <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{Math.round(score)}% COMPLETE</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-[0_6px_0_#d97706] flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700 animate-pulse" />
          <span className="text-2xl font-black text-yellow-900">{score}</span>
        </div>
      </div>

      {!isPlaying && !showWin && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white text-slate-900 p-12 rounded-[3.5rem] text-center shadow-2xl border-b-[12px] border-slate-200">
            <h1 className="text-4xl font-black mb-8 uppercase text-blue-600 italic tracking-tighter">Sight Word Pop</h1>
            <button onClick={startGame} className="bg-blue-600 text-white px-16 py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_#1e3a8a] hover:scale-105 active:translate-y-1 transition-all uppercase tracking-widest">Start!</button>
          </div>
        </div>
      )}

      {isPlaying && (
        <>
            <div className="absolute top-32 w-full flex flex-col items-center z-50">
                <button onClick={() => speak(targetWord)} className="bg-white text-blue-600 p-10 rounded-full shadow-2xl border-4 border-white animate-pulse active:scale-95 transition-all">
                    <FaVolumeUp size={54} />
                </button>
            </div>

            <div className="absolute inset-0 z-10">
                <AnimatePresence>
                    {bubbles.map(b => (
                        <motion.div 
                            key={b.id} 
                            initial={{ y: "110vh", opacity: 0, scale: 0.8 }} 
                            animate={{ y: "-20vh", opacity: 1, scale: 1 }} 
                            exit={{ scale: 3, opacity: 0 }}
                            transition={{ y: { duration: b.duration, ease: "linear" }, opacity: { duration: 0.3 } }}
                            onAnimationComplete={() => setBubbles(prev => prev.filter(bubble => bubble.id !== b.id))}
                            onClick={() => b.status === 'active' && handlePop(b.id, b.word)}
                            className="absolute rounded-full cursor-pointer flex items-center justify-center group"
                            style={{ 
                                left: `${b.x}%`, width: '160px', height: '160px',
                                // 3D TRANSPARENT BUBBLE LOOK
                                background: b.status === 'correct' ? 'rgba(34, 197, 94, 0.8)' : b.status === 'wrong' ? 'rgba(239, 68, 68, 0.8)' : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 40%, rgba(100,200,255,0.2) 80%, rgba(255,255,255,0.4) 100%)',
                                boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.1), inset 10px 10px 20px rgba(255,255,255,0.5), 0 10px 30px rgba(0,0,0,0.1)',
                                border: '2px solid rgba(255,255,255,0.6)',
                                backdropFilter: 'blur(2px)',
                                touchAction: 'none'
                            }} 
                        >
                            <div className="absolute top-4 left-6 w-8 h-4 bg-white/40 rounded-full rotate-[-45deg]" /> {/* Highlight reflection */}
                            
                            {b.status === 'correct' ? (
                                <FaCheck className="text-white text-7xl drop-shadow-lg" />
                            ) : b.status === 'wrong' ? (
                                <FaTimes className="text-white text-7xl drop-shadow-lg" />
                            ) : (
                                <span className="text-blue-950 font-black text-4xl italic pointer-events-none drop-shadow-md tracking-tighter">
                                    {b.word}
                                </span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
      )}

      {showWin && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 p-6">
          <div className="bg-white text-slate-900 p-12 rounded-[3.5rem] text-center shadow-2xl border-b-[12px] border-slate-200">
            <FaStar className="text-8xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-blue-600 italic tracking-tighter">Pop Master!</h1>
            <button onClick={() => navigate(-1)} className="mt-8 bg-blue-600 text-white py-5 rounded-2xl font-black text-xl w-full shadow-lg">Next Adventure</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SightWordPop;