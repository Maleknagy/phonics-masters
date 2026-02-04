import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const SentenceBuilder = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [droppedWords, setDroppedWords] = useState([]);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [remainingPool, setRemainingPool] = useState([]);

  const scoreRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await db.auth.getUser();
        if (!user || !isMounted) return;
        const { data, error } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'sentence');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const gameData = data.map(item => {
            const rawText = item.content ? item.content.trim() : "";
            // Keep original casing for grammar but strip punctuation for the tiles
            const words = rawText.replace(/[.!?]/g, '').split(' '); 
            
            // FIX: Generate clean filename to match Supabase Storage
            const fileName = rawText.toLowerCase()
              .replace(/['’›]/g, "")
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "");

            return { 
              id: item.id, 
              fullText: rawText, 
              words: words, 
              imageUrl: `${supabaseUrl}/storage/v1/object/public/assets/${fileName}.png` 
            };
          });

          if (isMounted) {
            setSentences(gameData);
            const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'sentence_builder').maybeSingle();
            
            const startScore = pData?.progress_percent || 0;
            setScore(startScore);

            // Logic: Create randomized pool
            const indices = gameData.map((_, i) => i).sort(() => Math.random() - 0.5);
            setCurrentIndex(indices[0]);
            setRemainingPool(indices.slice(1));
          }
        }
      } catch (err) { console.error(err); } finally { if (isMounted) setIsLoading(false); }
    }
    loadData();
    return () => { isMounted = false; };
  }, [unitId]);

  const currentSentence = sentences[currentIndex];

  useEffect(() => {
    if (currentSentence) {
      const words = currentSentence.words.map((word, idx) => ({
        id: `${currentSentence.id}-${currentIndex}-${idx}-${word}-${Math.random()}`,
        text: word
      })).sort(() => Math.random() - 0.5);
      setShuffledWords(words);
      setDroppedWords(new Array(currentSentence.words.length).fill(null));
    }
  }, [currentIndex, sentences]);

  const handleWordClick = (wordObj) => {
    if (feedback) return;
    const firstEmptyIndex = droppedWords.findIndex(w => w === null);
    if (firstEmptyIndex !== -1) {
      const newDropped = [...droppedWords];
      newDropped[firstEmptyIndex] = wordObj;
      setDroppedWords(newDropped);
      if (newDropped.filter(w => w !== null).length === currentSentence.words.length) { 
        checkAnswer(newDropped); 
      }
    }
  };

  const handleRemoveWord = (index) => {
    if (feedback) return;
    const newDropped = [...droppedWords];
    newDropped[index] = null;
    setDroppedWords(newDropped);
  };

  const moveToNext = () => {
    if (score >= 99.9) {
      setIsComplete(true);
      return;
    }

    let nextPool = [...remainingPool];
    // RULE: If run out of images before 100%, repeat randomly
    if (nextPool.length === 0) {
      nextPool = sentences.map((_, i) => i).sort(() => Math.random() - 0.5);
    }
    
    setCurrentIndex(nextPool[0]);
    setRemainingPool(nextPool.slice(1));
    setFeedback(null);
  };

  const checkAnswer = async (finalWords) => {
    const userAnswer = finalWords.map(w => w.text).join(' ');
    const targetAnswer = currentSentence.words.join(' ');
    const pointsPerSentence = 100 / sentences.length;

    if (userAnswer === targetAnswer) {
      setFeedback('correct');
      new Audio('/audio/correct.mp3').play().catch(()=>{});
      
      const newScore = Math.min(100, Math.round(score + pointsPerSentence));
      setScore(newScore);
      // IMMEDIATE SAVE RULE
      await saveProgress(unitId, 'sentence_builder', newScore, newScore);

      setTimeout(() => moveToNext(), 1500);
    } else {
      setFeedback('wrong');
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      
      // RULE: Incorrect answers deduct points equal to earned points
      const penalizedScore = Math.max(0, Math.round(score - pointsPerSentence));
      setScore(penalizedScore);
      await saveProgress(unitId, 'sentence_builder', penalizedScore, penalizedScore);

      setTimeout(() => {
        setDroppedWords(new Array(currentSentence.words.length).fill(null));
        setFeedback(null);
        // Shuffle current word again or move to next to prevent frustration
        moveToNext();
      }, 1200);
    }
  };

  const availableWords = shuffledWords.filter(sw => !droppedWords.some(dw => dw && dw.id === sw.id));

  if (isLoading) return <div className="min-h-screen bg-sky-500 flex items-center justify-center text-white font-black text-2xl animate-pulse">BUILDING...</div>;

  if (isComplete) return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex flex-col items-center justify-center text-white p-4">
        <FaStar size={100} className="text-yellow-300 mb-4 animate-bounce" />
        <h2 className="text-5xl font-black mb-2 uppercase italic">Sentence Master!</h2>
        <button onClick={() => navigate(-1)} className="bg-white text-green-600 px-12 py-4 rounded-2xl font-black text-xl mt-8 shadow-lg active:translate-y-1 transition-all uppercase">Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-blue-500 font-sans select-none overflow-hidden pb-12">
      
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-blue-600 shadow-sm active:translate-y-1 transition-all"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
           </div>
           <span className="text-[10px] font-black uppercase text-white mt-2 tracking-widest">{Math.round(score)}% Mastery</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700" size={24} />
          <span className="text-2xl font-black text-yellow-900">{Math.round(score)}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col items-center p-6">
        {/* ENLARGED IMAGE CONTAINER */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={currentSentence.id} 
            className="bg-white p-8 rounded-[4rem] shadow-2xl mb-10 border-b-[16px] border-slate-200 w-full max-w-xl aspect-video flex items-center justify-center">
            <img src={currentSentence.imageUrl} alt="Clue" className="w-full h-full object-contain" onError={(e) => e.target.style.opacity='0.2'} />
        </motion.div>

        {/* CONSTRUCTION SLOTS */}
        <div className="w-full bg-white/10 rounded-[3rem] p-10 backdrop-blur-sm border-4 border-dashed border-white/20 mb-12 flex flex-wrap justify-center gap-4 items-center min-h-[140px]">
            {new Array(currentSentence.words.length).fill(null).map((_, index) => (
              <Slot key={index} word={droppedWords[index]} onClick={() => handleRemoveWord(index)} feedback={feedback} />
            ))}
            <span className="text-7xl font-black text-white/50 mt-4 leading-none">.</span>
        </div>

        {/* SHUFFLED WORD TILES (Grammar respect) */}
        <div className="flex flex-wrap justify-center gap-5 max-w-4xl">
            {availableWords.map((item) => (
              <WordButton key={item.id} text={item.text} onClick={() => handleWordClick(item)} />
            ))}
        </div>
      </div>
    </div>
  );
};

const WordButton = ({ text, onClick }) => (
  <motion.button layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClick}
    className="bg-white text-sky-600 px-8 py-5 rounded-3xl font-black text-3xl shadow-[0_10px_0_#e2e8f0] border-2 border-slate-100 active:translate-y-1 active:shadow-none transition-all"
  >
    {text}
  </motion.button>
);

const Slot = ({ word, onClick, feedback }) => (
  <div onClick={word ? onClick : undefined} 
    className={`min-w-[120px] h-20 border-[6px] rounded-3xl flex items-center justify-center px-8 transition-all
    ${feedback === 'correct' ? 'bg-green-500 border-green-400' : 
      feedback === 'wrong' ? 'bg-red-500 border-red-400 animate-shake' : 
      word ? 'bg-white border-sky-400 cursor-pointer shadow-lg' : 'bg-black/10 border-dashed border-white/30'}`}>
    {word && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={`font-black text-3xl italic ${feedback ? 'text-white' : 'text-slate-800'}`}>{word.text}</motion.span>}
  </div>
);

export default SentenceBuilder;