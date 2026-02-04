import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaMicrophone, FaLightbulb, FaCheckCircle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const SnapshotStars = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  
  const [words, setWords] = useState([]);
  const [points, setPoints] = useState(0); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState('LOADING'); 
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const recognitionRef = useRef(null);
  const TARGET_SCORE = 100;

  useEffect(() => {
    async function initGame() {
      try {
        const { data: { user } } = await db.auth.getUser();
        const { data: content } = await db.from('course_content')
          .select('content')
          .eq('unit_id', unitId)
          .eq('category', 'sight_word');
        
        if (content && content.length > 0) {
          const baseWords = content.map(w => w.content.toLowerCase().trim()).filter(w => w !== "");
          
          let enduranceList = [];
          while (enduranceList.length < 40) {
            const shuffledSet = [...baseWords].sort(() => Math.random() - 0.5);
            enduranceList = [...enduranceList, ...shuffledSet];
          }

          const { data: pData } = await db.from('user_progress').select('*').eq('user_id', user.id).eq('unit_id', unitId);
          let startPoints = 0;
          if (pData) {
            const gameProg = pData.find(p => p.game_type === 'snapshot-stars' || p.game_type === 'snapshot_stars');
            startPoints = gameProg?.points || gameProg?.progress_percent || 0;
          }

          setWords(enduranceList);
          // Clamp initial points just in case the DB has a value over 100
          setPoints(Math.min(TARGET_SCORE, startPoints)); 
          setGameState('IDLE');
        } else {
          setGameState('ERROR');
        }
      } catch (err) { 
        setGameState('ERROR');
      }
    }
    initGame();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        handleSpeechResult(transcript);
      };
    }
  }, [unitId]);

  const currentWord = words[currentIndex] || "";

  const handleFlip = () => {
    if (gameState !== 'IDLE' || !currentWord) return;
    setGameState('FLIPPED');
    setTimeout(() => { setGameState('IDLE'); }, 700);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening || gameState !== 'IDLE') return;
    try { recognitionRef.current.start(); } catch (e) { recognitionRef.current.stop(); }
  };

  const handleSpeechResult = (spokenWord) => {
    const target = currentWord.toLowerCase().trim();
    
    if (spokenWord.includes(target) || target.includes(spokenWord)) {
      new Audio('/audio/correct.mp3').play().catch(()=>{});
      setFeedback('correct');
      setGameState('FEEDBACK');
      
      // FIX: Apply Math.min to prevent points exceeding 100
      setPoints(prevPoints => {
        const newPoints = Math.min(TARGET_SCORE, prevPoints + 3);
        saveProgress(unitId, 'snapshot-stars', newPoints, newPoints);
        return newPoints;
      });
      
      setTimeout(() => {
        setFeedback(null);
        setCurrentIndex(prev => prev + 1);
        setGameState('IDLE');
      }, 1000);
    } else {
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      setFeedback('wrong');
      setGameState('FEEDBACK');
      
      // Also clamp the bottom end to 0 for safety
      setPoints(prev => Math.max(0, prev - 3)); 
      
      setTimeout(() => { 
        setFeedback(null); 
        setGameState('IDLE');
      }, 1000);
    }
  };

  // Victory check
  useEffect(() => {
    if (points >= TARGET_SCORE && gameState !== 'LOADING') {
      setGameState('FINISHED');
    }
  }, [points]);

  if (gameState === 'LOADING') return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-3xl font-black italic">LOADING...</div>;
  if (gameState === 'ERROR') return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-3xl font-black">NO SIGHT WORDS FOUND!</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 relative font-sans text-white select-none flex flex-col items-center">
      
      <div className="w-full p-6 flex items-center justify-between bg-white/5 backdrop-blur-md sticky top-0 z-[100]">
        <button onClick={() => navigate(-1)} className="bg-white/10 p-4 rounded-2xl active:scale-95 border-b-4 border-white/5"><FaArrowLeft /></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/40 rounded-full border-4 border-white/10 p-1 relative overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(points / TARGET_SCORE) * 100}%` }} 
                className="h-full bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
              />
           </div>
           <span className="text-[10px] font-black uppercase mt-2 text-amber-300 italic tracking-widest">Target Score: 100</span>
        </div>
        <div className="bg-amber-500 px-6 py-3 rounded-2xl flex items-center gap-3 border-b-4 border-amber-800 shadow-xl min-w-[110px] justify-center text-amber-950">
          <FaStar /> <span className="text-2xl font-black">{points}</span>
        </div>
      </div>

      <div className="mt-8 mb-4 bg-white/10 px-8 py-3 rounded-full border border-white/20 flex items-center gap-3 shadow-lg">
        <FaLightbulb className="text-yellow-400 animate-pulse" />
        <p className="text-lg font-black uppercase tracking-widest italic text-center">
            {gameState === 'FINISHED' ? "Victory!" : gameState === 'FLIPPED' ? "Snapshot!" : feedback ? "Checking..." : isListening ? "Speak now!" : "1. Tap the Card!"}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center perspective-[2000px]">
        {gameState === 'FINISHED' ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[4rem] flex flex-col items-center shadow-2xl">
             <FaCheckCircle className="text-green-500 text-9xl mb-6" />
             <h2 className="text-slate-800 text-5xl font-black uppercase mb-8 text-center leading-tight italic">Snapshot Master!</h2>
             <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-2xl font-black uppercase shadow-[0_10px_0_#4338ca] active:translate-y-2 transition-all">
                Finish Game
             </button>
          </motion.div>
        ) : (
          <>
            <div key={currentIndex} className="relative w-80 h-[28rem] cursor-pointer" onClick={handleFlip}>
              <motion.div className="w-full h-full relative" animate={{ rotateY: gameState === 'FLIPPED' ? 180 : 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0 bg-white rounded-[4rem] shadow-2xl flex items-center justify-center border-slate-200" style={{ backfaceVisibility: "hidden" }}>
                    <div className="text-[10rem] drop-shadow-xl animate-pulse text-slate-800 italic font-black">✨</div>
                </div>
                <div className="absolute inset-0 bg-indigo-600 rounded-[4rem] shadow-2xl flex items-center justify-center border-indigo-900" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <span className="text-white text-7xl font-black italic lowercase text-center px-4 leading-tight drop-shadow-lg">
                      {currentWord}
                    </span>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 flex flex-col items-center h-48">
                <AnimatePresence mode="wait">
                    {gameState === 'IDLE' && (
                        <motion.div key="mic-btn" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                            <motion.button onClick={startListening} className={`p-10 rounded-full shadow-2xl border-b-8 ${isListening ? 'bg-red-500 border-red-800 animate-pulse shadow-[0_0_20px_#ef4444]' : 'bg-green-500 border-green-800 shadow-[0_0_20px_#22c55e]'}`}>
                                <FaMicrophone size={56} className="text-white" />
                            </motion.button>
                            <p className="mt-4 font-black uppercase text-xs tracking-widest text-green-400">Say the word!</p>
                        </motion.div>
                    )}
                    {feedback && (
                        <motion.div key="fdbk" initial={{ scale: 0 }} animate={{ scale: 1.2 }} exit={{ scale: 0 }}>
                            <p className={`text-6xl font-black uppercase italic tracking-tighter ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                {feedback === 'correct' ? "+3 STARS!" : "-3 STARS"}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SnapshotStars;