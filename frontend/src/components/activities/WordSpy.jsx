import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const supabaseUrlRef = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const WordSpy = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [allWords, setAllWords] = useState([]); 
  const [targetItem, setTargetItem] = useState(null); 
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  const [wrongSelection, setWrongSelection] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [remainingIds, setRemainingIds] = useState([]);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
          const { data: { user } } = await db.auth.getUser();
          if (!user) return;

          // Load unit words
          const { data } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'decodable'); 
          
          if (data && data.length > 0) {
              const processedWords = data.map(w => ({
                ...w,
                content: w.content.toLowerCase().trim()
              }));

              setAllWords(processedWords);

              // Load Progress
              const { data: pData } = await db.from('user_progress')
                .select('progress_percent')
                .eq('user_id', user.id)
                .eq('unit_id', unitId)
                .eq('game_type', 'word_spy')
                .maybeSingle();

              const startScore = pData?.progress_percent || 0;
              setScore(startScore);

              // Initialize remaining IDs for the shuffle loop
              const ids = processedWords.map(w => w.id);
              setRemainingIds(ids);
              setupRound(processedWords, ids);
          }
        } catch (err) {
          console.error("Load Error:", err);
        } finally {
          setIsLoading(false);
        }
    }
    loadData();
  }, [unitId]);

  const setupRound = (allData, pool) => {
    let target;
    let nextPool = [...pool];

    // INFINITE REPEAT LOGIC: If pool is empty, reset from all data
    if (nextPool.length === 0) {
      target = allData[Math.floor(Math.random() * allData.length)];
      setRemainingIds(allData.map(w => w.id).filter(id => id !== target.id));
    } else {
      const randomIndex = Math.floor(Math.random() * nextPool.length);
      const targetId = nextPool[randomIndex];
      target = allData.find(w => w.id === targetId);
      nextPool.splice(randomIndex, 1);
      setRemainingIds(nextPool);
    }

    setTargetItem(target);

    // --- GENERATE 8 CHOICES ---
    // 1. Correct choice
    const finalChoices = [target];
    
    // 2. Get incorrect options (excluding the current target)
    const incorrectCandidates = allData.filter(w => w.id !== target.id);
    
    // 3. Shuffle candidates and take 7
    const shuffledIncorrect = [...incorrectCandidates].sort(() => Math.random() - 0.5);
    const selectedIncorrect = shuffledIncorrect.slice(0, 7);
    
    finalChoices.push(...selectedIncorrect);

    // 4. Backfill from a static pool if the unit has fewer than 8 total words
    if (finalChoices.length < 8) {
        const fillers = ["cat", "dog", "sun", "bat", "map", "run", "hop", "red"].filter(f => !finalChoices.some(c => c.content === f));
        while (finalChoices.length < 8) {
            finalChoices.push({ id: Math.random(), content: fillers.shift() || "word" });
        }
    }

    setChoices(finalChoices.sort(() => Math.random() - 0.5));
    setFeedback(null);
    setWrongSelection(null);
  };

  const handleGuess = async (selectedWord) => {
    if (feedback) return;

    const pointsPerStep = 100 / allWords.length;
    const isCorrect = selectedWord === targetItem.content;

    if (isCorrect) {
        setFeedback('correct'); 
        const newScore = Math.min(100, Math.round(score + pointsPerStep));
        setScore(newScore);

        // IMMEDIATE SAVE
        await saveProgress(unitId, 'word_spy', newScore, newScore);

        setTimeout(() => {
          if (newScore >= 99.9) {
            setShowWin(true);
            setIsPlaying(false);
          } else {
            setupRound(allWords, remainingIds);
          }
        }, 1200);
    } else {
        setFeedback('wrong'); 
        setWrongSelection(selectedWord);
        new Audio('/audio/wrong.mp3').play().catch(()=>{});

        // REDUCE SCORE ON WRONG ANSWER
        const penalizedScore = Math.max(0, Math.round(score - pointsPerStep));
        setScore(penalizedScore);

        await saveProgress(unitId, 'word_spy', penalizedScore, penalizedScore);

        setTimeout(() => { 
            setFeedback(null);
            setWrongSelection(null);
            setupRound(allWords, remainingIds); // New image even on fail
        }, 1200);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-violet-500 flex items-center justify-center text-white font-black text-2xl animate-pulse uppercase italic tracking-widest">Spying...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-400 to-violet-600 font-sans select-none overflow-hidden">
      
      {/* HEADER */}
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-violet-600 shadow-sm active:translate-y-1 transition-all"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
           </div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2">{Math.round(score)}% Mastery</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700" size={24} />
          <span className="text-2xl font-black text-yellow-900">{Math.round(score)}</span>
        </div>
      </div>

      {!isPlaying && !showWin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0.8}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl border-b-[12px] border-slate-200">
            <h1 className="text-4xl font-black mb-6 uppercase text-violet-600 tracking-tighter italic">Word Spy</h1>
            <p className="mb-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Find the word that matches the picture!</p>
            <button onClick={() => setIsPlaying(true)} className="w-full bg-violet-600 text-white py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_#5b21b6] active:translate-y-1 uppercase tracking-widest">Start Mission</button>
          </motion.div>
        </div>
      )}

      {showWin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center shadow-2xl border-b-[12px] border-slate-200">
            <FaStar className="text-8xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-violet-600 tracking-tighter">Spy Master!</h1>
            <button onClick={() => navigate(-1)} className="mt-8 bg-violet-600 text-white py-5 rounded-2xl font-black text-xl w-full uppercase shadow-lg">Finish</button>
          </motion.div>
        </div>
      )}

      {isPlaying && targetItem && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto z-10 p-4">
          {/* TARGET IMAGE */}
          <motion.div key={targetItem.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-4 rounded-[3rem] shadow-2xl border-b-[12px] border-slate-200 mb-8 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center relative">
             <img 
               src={`${supabaseUrlRef}/storage/v1/object/public/assets/${targetItem.content.toLowerCase().replace(/['’›]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}.png`} 
               className="w-full h-full object-contain" 
               alt="Spy Target" 
             />
          </motion.div>
          
          {/* 8 CHOICE GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {choices.map((choice, idx) => (
                <button 
                  key={`${targetItem.id}-${idx}`} 
                  onClick={() => handleGuess(choice.content)}
                  className={`relative py-5 rounded-2xl text-2xl md:text-3xl font-black shadow-xl border-b-8 transition-all active:translate-y-2 lowercase italic 
                    ${feedback === 'correct' && choice.content === targetItem.content ? "bg-green-500 border-green-700 text-white" : 
                      feedback === 'wrong' && choice.content === wrongSelection ? "bg-red-500 border-red-700 text-white" : 
                      "bg-white text-violet-600 border-slate-200"}`}
                >
                    {choice.content}
                    
                    <AnimatePresence>
                        {feedback === 'correct' && choice.content === targetItem.content && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 text-green-200 bg-green-600 rounded-full">
                                <FaCheckCircle size={30} />
                            </motion.div>
                        )}
                        {feedback === 'wrong' && choice.content === wrongSelection && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 text-red-200 bg-red-600 rounded-full">
                                <FaTimesCircle size={30} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSpy;