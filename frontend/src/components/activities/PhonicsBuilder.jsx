import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
// FIXED IMPORT BELOW
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const PhonicsBuilder = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [decodableWords, setDecodableWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [droppedLetters, setDroppedLetters] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [shuffledTiles, setShuffledTiles] = useState([]);
  const [remainingIndices, setRemainingIndices] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await db.auth.getUser();
        if (!user || !isMounted) return;
        const { data, error } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'decodable');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const gameData = data.map(item => ({
              id: item.id,
              word: item.content ? item.content.trim().toLowerCase() : "",
              phonemes: (item.content || "").trim().toLowerCase().split(''), 
              imageUrl: item.image ? `${supabaseUrl}/storage/v1/object/public/assets/${item.image.trim()}` : 
                        `${supabaseUrl}/storage/v1/object/public/assets/${item.content.trim().toLowerCase()}.png`
          }));

          if (isMounted) {
            setDecodableWords(gameData);
            
            const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'phonics_builder').maybeSingle();
            const startScore = pData?.progress_percent || 0;
            setScore(startScore);

            // Initialize randomized index pool
            const indices = gameData.map((_, i) => i).sort(() => Math.random() - 0.5);
            setCurrentWordIndex(indices[0]);
            setRemainingIndices(indices.slice(1));
          }
        }
      } catch (err) { console.error(err); } finally { if (isMounted) setIsLoading(false); }
    }
    loadData();
    return () => { isMounted = false; };
  }, [unitId]);

  const currentWord = decodableWords[currentWordIndex];

  useEffect(() => {
    if (currentWord) {
        const tiles = [...currentWord.phonemes].map((letter, index) => ({
            id: `${currentWord.id}-${index}-${letter}-${Math.random()}`,
            letter: letter,
            isUsed: false
        })).sort(() => Math.random() - 0.5);
        setShuffledTiles(tiles);
        setDroppedLetters(new Array(currentWord.phonemes.length).fill(null)); 
    }
  }, [currentWordIndex, decodableWords]);

  const handleAction = (letter, position, tileId) => {
    if (feedback === 'correct') return; 
    const newDropped = [...droppedLetters];
    newDropped[position] = letter;
    
    if (tileId) {
      setShuffledTiles(prev => prev.map(t => t.id === tileId ? { ...t, isUsed: true } : t));
    }

    setDroppedLetters(newDropped);
    if (newDropped.filter(l => l).length === currentWord.phonemes.length) { 
      checkAnswer(newDropped); 
    }
  };

  const handleTileClick = (tile) => {
    if (feedback === 'correct' || tile.isUsed) return;
    const firstEmptyIndex = droppedLetters.findIndex(l => l === null);
    if (firstEmptyIndex !== -1) {
      handleAction(tile.letter, firstEmptyIndex, tile.id);
    }
  };

  const pickNextWord = () => {
    if (score >= 99.9) {
      setIsComplete(true);
      return;
    }

    let nextIndices = [...remainingIndices];
    if (nextIndices.length === 0) {
      nextIndices = decodableWords.map((_, i) => i).sort(() => Math.random() - 0.5);
    }

    const nextIdx = nextIndices[0];
    setCurrentWordIndex(nextIdx);
    setRemainingIndices(nextIndices.slice(1));
    setFeedback(null);
  };

  const checkAnswer = async (dropped) => {
    const pointsPerWord = 100 / decodableWords.length;
    
    if (dropped.join('') === currentWord.phonemes.join('')) {
      setFeedback('correct');
      new Audio('/audio/correct.mp3').play().catch(()=>{});
      
      const newScore = Math.min(100, Math.round(score + pointsPerWord));
      setScore(newScore);
      await saveProgress(unitId, 'phonics_builder', newScore, newScore);

      setTimeout(() => pickNextWord(), 1500);
    } else {
      setFeedback('wrong');
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      
      const penalizedScore = Math.max(0, Math.round(score - pointsPerWord));
      setScore(penalizedScore);
      await saveProgress(unitId, 'phonics_builder', penalizedScore, penalizedScore);

      setTimeout(() => {
        setDroppedLetters(new Array(currentWord.phonemes.length).fill(null)); 
        setShuffledTiles(prev => prev.map(t => ({ ...t, isUsed: false })));
        setFeedback(null);
        pickNextWord();
      }, 1000);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-rose-500 flex items-center justify-center text-white text-2xl font-black italic animate-pulse uppercase">Syncing...</div>;

  if (isComplete) return (
    <div className="min-h-screen bg-gradient-to-br from-rose-400 to-rose-600 flex flex-col items-center justify-center text-white p-4 text-center">
        <FaStar size={100} className="text-yellow-400 mb-4 animate-bounce drop-shadow-lg"/>
        <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter italic">Master Builder!</h2>
        <button onClick={() => navigate(-1)} className="bg-white text-rose-600 px-10 py-4 rounded-2xl font-black text-xl mt-8 shadow-lg active:translate-y-1 transition-all uppercase">Back to Unit</button>
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
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
            <FaStar size={24} />
            <span className="text-2xl font-black">{Math.round(score)}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center p-4">
            <motion.div key={currentWord.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
                className="bg-white rounded-[4rem] p-8 shadow-2xl mb-8 w-[22rem] h-[22rem] md:w-[30rem] md:h-[30rem] flex items-center justify-center border-b-[16px] border-slate-200">
                <img src={currentWord.imageUrl} alt="Target" className="w-full h-full object-contain" />
            </motion.div>

            <div className="flex justify-center gap-3 md:gap-5 mb-12">
              {currentWord.phonemes.map((_, index) => (
                <DropZone key={index} position={index} letter={droppedLetters[index]} onDrop={handleAction} isCorrect={feedback === 'correct'} isWrong={feedback === 'wrong'} />
              ))}
            </div>

            <div className="flex justify-center gap-4 flex-wrap max-w-2xl">
              {shuffledTiles.map((tile) => (
                <LetterTile key={tile.id} id={tile.id} letter={tile.letter} isUsed={tile.isUsed} onClick={() => handleTileClick(tile)} />
              ))}
            </div>
        </div>
      </div>
    </DndProvider>
  );
};

const LetterTile = ({ letter, id, isUsed, onClick }) => {
  const [{ isDragging }, drag] = useDrag({ 
    type: 'letter', 
    item: { letter, id }, 
    canDrag: !isUsed,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }) 
  });
  return (
    <div ref={drag} onClick={onClick} className={`w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_10px_0_#e2e8f0] cursor-pointer active:translate-y-1 transition-all ${isDragging || isUsed ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-105'}`}>
        <span className="text-5xl font-black text-rose-600 italic lowercase">{letter}</span>
    </div>
  );
};

const DropZone = ({ letter, onDrop, position, isCorrect, isWrong }) => {
  const [{ isOver }, drop] = useDrop({ 
    accept: 'letter', 
    drop: (item) => onDrop(item.letter, position, item.id), 
    collect: (monitor) => ({ isOver: monitor.isOver() }) 
  });
  return (
    <div ref={drop} className={`w-16 h-16 md:w-24 md:h-24 border-[6px] rounded-[2rem] flex items-center justify-center transition-all duration-200 shadow-inner
      ${isCorrect ? 'bg-green-500 border-green-400' : isWrong ? 'bg-red-500 border-red-400' : isOver ? 'bg-white/30 border-white' : 'bg-black/10 border-dashed border-white/50'}`}>
      <AnimatePresence>
        {letter && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl md:text-6xl font-black text-white italic lowercase">
            {letter}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhonicsBuilder;