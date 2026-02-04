import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaCheck, FaSearchPlus } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient'; 

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co'; 

const getLetterStyle = (char) => {
  if (!char) return { backgroundColor: 'rgba(248, 250, 252, 1)' }; 
  const colors = {
    a: 'rgba(254, 226, 226, 0.6)', b: 'rgba(255, 237, 213, 0.6)',
    c: 'rgba(254, 249, 195, 0.6)', d: 'rgba(220, 252, 231, 0.6)',
    e: 'rgba(207, 250, 254, 0.6)', f: 'rgba(224, 242, 254, 0.6)',
    g: 'rgba(238, 242, 255, 0.6)', h: 'rgba(245, 243, 255, 0.6)',
    i: 'rgba(250, 232, 255, 0.6)', j: 'rgba(251, 224, 252, 0.6)',
    k: 'rgba(254, 226, 226, 0.7)', l: 'rgba(220, 252, 231, 0.7)',
    m: 'rgba(254, 243, 199, 0.7)', n: 'rgba(236, 252, 203, 0.7)',
    o: 'rgba(204, 251, 241, 0.7)', p: 'rgba(219, 234, 254, 0.6)',
    q: 'rgba(233, 213, 255, 0.7)', r: 'rgba(255, 228, 230, 0.7)',
    s: 'rgba(241, 245, 249, 0.8)', t: 'rgba(255, 251, 235, 0.7)',
    u: 'rgba(236, 254, 255, 0.7)', v: 'rgba(240, 253, 244, 0.7)',
    w: 'rgba(255, 241, 242, 0.7)', x: 'rgba(248, 250, 252, 0.7)',
    y: 'rgba(255, 247, 237, 0.7)', z: 'rgba(254, 242, 242, 0.7)',
  };
  return { backgroundColor: colors[char.toLowerCase()] || 'rgba(248, 250, 252, 1)' };
};

const WordGrid = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [puzzles, setPuzzles] = useState([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gridState, setGridState] = useState([]);
  const [rowStatus, setRowStatus] = useState([]); 
  const [score, setScore] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);

  const inputsRef = useRef({});
  const scoreRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
        setIsLoading(true);
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user || !isMounted) return;
            const { data } = await db.from('course_content').select('*').eq('unit_id', unitId).in('category', ['decodable', 'word']);
            if (data && data.length > 0) {
                const allWords = data.map(item => ({ ...item, content: (item.content || "").trim().toLowerCase() })).filter(w => w.content.length >= 2);
                const puzzleSets = [];
                for (let i = 0; i < allWords.length; i += 3) {
                    const chunk = allWords.slice(i, i + 3);
                    puzzleSets.push({ id: puzzleSets.length, words: chunk.map(c => c.content), images: chunk.map(c => c.image) });
                }
                if (isMounted) {
                    setPuzzles(puzzleSets);
                    const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'grid').maybeSingle();
                    if (pData && pData.progress_percent > 0) {
                        const savedLevel = Math.floor((pData.progress_percent / 100) * puzzleSets.length);
                        setLevelIndex(Math.min(savedLevel, puzzleSets.length - 1));
                        setScore(pData.progress_percent);
                    }
                }
            }
        } catch (err) { console.error("Load Error:", err); } finally { if (isMounted) setIsLoading(false); }
    }
    loadData();
    return () => {
      isMounted = false;
      if (scoreRef.current > 0) saveProgress(unitId, 'grid', scoreRef.current, scoreRef.current);
    };
  }, [unitId]);

  const currentPuzzle = puzzles[levelIndex];

  useEffect(() => {
    if (currentPuzzle) {
      setGridState(currentPuzzle.words.map(word => Array(word.length).fill("")));
      setRowStatus(Array(currentPuzzle.words.length).fill("neutral"));
    }
  }, [currentPuzzle]);

  const checkAnswers = async () => {
    let allCorrect = true;
    const newStatus = currentPuzzle.words.map((word, r) => {
        const userWord = gridState[r].join("").toLowerCase();
        if (userWord === word) return 'correct';
        allCorrect = false; return 'wrong';
    });
    setRowStatus(newStatus);

    if (allCorrect) {
        new Audio('/audio/correct.mp3').play().catch(()=>{});
        const pointsPerPuzzle = 100 / puzzles.length;
        const newScore = Math.min(100, Math.round(score + pointsPerPuzzle));
        setScore(newScore);

        // SAVE AS 'grid' TO MATCH UnitMenu path
        await saveProgress(unitId, 'grid', newScore, newScore);

        setTimeout(() => {
            if (levelIndex + 1 >= puzzles.length) { setShowWin(true); setIsPlaying(false); } 
            else { setLevelIndex(prev => prev + 1); }
        }, 1500);
    } else { new Audio('/audio/wrong.mp3').play().catch(()=>{}); }
  };

  if (isLoading) return <div className="min-h-screen bg-rose-500 flex items-center justify-center text-white text-2xl font-black animate-pulse uppercase italic">Syncing Grid...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-rose-600 font-sans select-none overflow-hidden">
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-rose-600 shadow-sm active:translate-y-1 transition-all"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-[0_0_15px_#10b981]" />
           </div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2">{Math.round(score)}% Mastery</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-yellow-200 text-yellow-900">
          <FaStar className="animate-pulse" size={24} />
          <span className="text-2xl font-black">{Math.round(score)}</span>
        </div>
      </div>

      {!isPlaying && !showWin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0.8}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl border-b-[12px] border-slate-200">
            <h1 className="text-4xl font-black mb-6 uppercase text-rose-600 italic tracking-tighter">Word Grid</h1>
            <button onClick={() => setIsPlaying(true)} className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_#be123c] active:translate-y-1 uppercase tracking-widest italic">Start mission</button>
          </motion.div>
        </div>
      )}

      {showWin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
          <motion.div initial={{scale:0}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] shadow-2xl border-b-[12px] border-slate-200">
            <FaStar className="text-8xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-rose-600 tracking-tighter italic">Grid Master!</h1>
            <button onClick={() => navigate(-1)} className="mt-8 bg-rose-600 text-white py-5 rounded-2xl font-black text-xl w-full uppercase shadow-lg">Finish</button>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {zoomedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomedImg(null)}
            className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-10 cursor-zoom-out">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }} className="bg-white p-6 rounded-[4rem] shadow-2xl max-w-2xl w-full flex items-center justify-center">
              <img src={zoomedImg} className="w-full h-auto object-contain max-h-[70vh]" alt="Zoomed" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPlaying && currentPuzzle && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto z-10 p-6">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full border-b-[12px] border-slate-200">
            <div className="flex flex-col gap-6">
              {currentPuzzle.words.map((word, rowIndex) => {
                const imgSource = `${supabaseUrl}/storage/v1/object/public/assets/${currentPuzzle.images[rowIndex] || word + '.png'}`;
                return (
                  <div key={rowIndex} className="flex items-center gap-6 md:gap-10">
                    <div onClick={() => setZoomedImg(imgSource)}
                      className={`relative group w-24 h-24 md:w-32 md:h-32 rounded-[2rem] border-4 flex items-center justify-center bg-slate-50 shadow-inner cursor-zoom-in transition-transform active:scale-95 ${rowStatus[rowIndex] === 'correct' ? 'border-green-400' : 'border-slate-100'}`}>
                      <img src={imgSource} className="w-full h-full object-contain p-2" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=?'} />
                      <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 rounded-[2rem] flex items-center justify-center transition-opacity">
                         <FaSearchPlus className="text-rose-600/40" size={24} />
                      </div>
                    </div>

                    <div className="flex gap-2 md:gap-3">
                      {word.split('').map((char, colIndex) => (
                        <input 
                          key={colIndex} 
                          ref={el => inputsRef.current[`${rowIndex}-${colIndex}`] = el} 
                          maxLength={1} 
                          value={gridState[rowIndex]?.[colIndex] || ''}
                          style={getLetterStyle(char)}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().slice(-1);
                            const newGrid = [...gridState];
                            newGrid[rowIndex][colIndex] = val;
                            setGridState(newGrid);
                            if (val && colIndex < word.length - 1) inputsRef.current[`${rowIndex}-${colIndex+1}`]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !gridState[rowIndex][colIndex] && colIndex > 0) {
                              inputsRef.current[`${rowIndex}-${colIndex-1}`]?.focus();
                            }
                          }}
                          className={`w-12 h-16 md:w-16 md:h-20 rounded-xl border-b-8 text-center text-3xl md:text-4xl font-black transition-all italic lowercase
                            ${rowStatus[rowIndex] === 'correct' ? 'text-green-600 border-green-400 !bg-green-100' : 
                              rowStatus[rowIndex] === 'wrong' ? 'text-red-600 border-red-400' : 'border-slate-200 focus:border-rose-400 focus:scale-105'}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={checkAnswers} className="mt-12 bg-rose-600 text-white py-6 rounded-2xl font-black text-2xl w-full shadow-[0_8px_0_#be123c] active:translate-y-2 transition-all uppercase tracking-widest italic">Check Puzzle</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordGrid;