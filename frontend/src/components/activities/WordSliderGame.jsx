import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { FaArrowLeft, FaStar, FaVolumeUp, FaCheck, FaSpinner } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const ITEM_HEIGHT = 90;
const VIEWPORT_HEIGHT = 220;
const CENTER_OFFSET = (VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2;

const LEVEL_BLENDS = {
  3: {
    1: ["bl", "cl", "fl", "gl", "pl", "sl"],
    2: ["br", "cr", "fr", "gr", "pr", "tr", "dr"],
    3: ["sm", "sn", "sp", "st", "sk", "sc", "sw"],
    4: ["sh", "ch", "th", "wh", "ph"],
    5: ["spl", "spr", "str", "scr", "squ", "shr", "thr"]
  },
  4: {
    1: ["nt", "nd", "nk", "ng", "ld"],
    2: ["lp", "lf", "lk", "ft", "ct", "mp"],
    3: ["st", "sp", "sk", "sh", "nch"],
    4: ["k", "ke", "ck", "sh", "ch", "tch"],
    5: ["ble", "ple", "cle", "kle", "gle", "dle"]
  }
};

const L1_2_CONSONANTS = ["b", "c", "d", "f", "g", "h", "j", "l", "m", "n", "p", "r", "s", "t", "v", "w", "y", "z"];
const ALL_L3_BLENDS = Object.values(LEVEL_BLENDS[3]).flat();
const ALL_L4_BLENDS = Object.values(LEVEL_BLENDS[4]).flat();

const WordSliderGame = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const controls = useAnimation();
  const y = useMotionValue(0);

  const [wordQueue, setWordQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0);
  const [score, setScore] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showWin, setShowWin] = useState(false);
  const [gameProgress, setGameProgress] = useState(0);
  const [unitDetails, setUnitDetails] = useState({ level_id: 1, unit_number: 1 });

  const synthesizerRef = useRef(null);

  // Fisher-Yates Shuffle
  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const { data: uData } = await db.from('units').select('level_id, unit_number').eq('id', unitId).single();
        if (uData) setUnitDetails(uData);

        const { data: wordsData } = await db.from('course_content').select('*').eq('unit_id', unitId).in('category', ['decodable', 'word']);
        if (wordsData && wordsData.length > 0) { 
          setWordQueue(shuffleArray([...wordsData])); 
        }
        setIsLoading(false);
    }
    loadData();
    return () => { if (synthesizerRef.current) synthesizerRef.current.close(); };
  }, [unitId]);

  useEffect(() => {
    if (wordQueue[currentIndex] && unitDetails) {
        const word = wordQueue[currentIndex].content.toLowerCase().trim();
        const level = unitDetails.level_id;
        const unitNum = unitDetails.unit_number;

        let correctPart, fixedPart, sourcePool, mode;

        if (level <= 3) {
          mode = 'PREFIX';
          const vowelIdx = word.search(/[aeiouy]/);
          correctPart = word.slice(0, vowelIdx);
          fixedPart = word.slice(vowelIdx);
          sourcePool = level < 3 ? L1_2_CONSONANTS : [...new Set([...LEVEL_BLENDS[3][unitNum], ...ALL_L3_BLENDS])];
        } else {
          mode = 'SUFFIX';
          const foundSuffix = ALL_L4_BLENDS
            .sort((a, b) => b.length - a.length)
            .find(b => word.endsWith(b));
          
          correctPart = foundSuffix || "";
          fixedPart = word.substring(0, word.length - correctPart.length);
          sourcePool = [...new Set([...(LEVEL_BLENDS[4][unitNum] || []), ...ALL_L4_BLENDS])];
        }

        const candidates = sourcePool.filter(s => s.toLowerCase() !== correctPart.toLowerCase());
        const shuffledCandidates = shuffleArray([...candidates]);
        const finalChoices = shuffleArray([correctPart, ...shuffledCandidates.slice(0, 5)]);
        
        setCurrentPuzzle({ 
          target: word, 
          fixed: fixedPart.toLowerCase(), 
          sliderParts: finalChoices.map(s => s.toLowerCase()),
          mode: mode
        });
        
        y.set(0); 
        setCurrentChoiceIndex(0); 
        controls.set({ y: 0 });
        setGameProgress(Math.round((currentIndex / wordQueue.length) * 100));
    }
  }, [currentIndex, wordQueue, unitDetails]);

  const speakAzure = (text) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural"><prosody rate="0.75">${text}</prosody></voice></speak>`;
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizerRef.current = synthesizer;
    synthesizer.speakSsmlAsync(ssml, () => { setIsSpeaking(false); synthesizer.close(); }, () => { setIsSpeaking(false); synthesizer.close(); });
  };

  const handleDragEnd = (_, info) => {
    const itemsSwiped = Math.round(info.offset.y / ITEM_HEIGHT);
    let newIdx = Math.max(0, Math.min(currentChoiceIndex - itemsSwiped, currentPuzzle.sliderParts.length - 1));
    setCurrentChoiceIndex(newIdx); 
    controls.start({ y: -newIdx * ITEM_HEIGHT });
  };

  const checkAnswer = async () => {
    const currentSlider = currentPuzzle.sliderParts[currentChoiceIndex];
    const constructedWord = currentPuzzle.mode === 'PREFIX' ? currentSlider + currentPuzzle.fixed : currentPuzzle.fixed + currentSlider;

    if (constructedWord === currentPuzzle.target) {
        setFeedback('correct'); 
        new Audio('/audio/correct.mp3').play().catch(()=>{});
        
        const newScore = score + 4;
        const newProgress = Math.round(((currentIndex + 1) / wordQueue.length) * 100);
        
        setScore(newScore);
        
        // --- RULE: SAVE IMMEDIATELY ON EVERY CORRECT ANSWER ---
        await saveProgress(unitId, 'word-slider', newScore, newProgress);

        setTimeout(() => { 
          if (currentIndex < wordQueue.length - 1) { 
            setCurrentIndex(prev => prev + 1); 
            setFeedback(null); 
          } else { 
            setShowWin(true); 
          } 
        }, 1500);
    } else {
        setFeedback('wrong'); 
        new Audio('/audio/wrong.mp3').play().catch(()=>{});
        setScore(prev => Math.max(0, prev - 2)); 
        setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-teal-600 flex items-center justify-center text-white text-2xl font-black animate-pulse uppercase italic tracking-tighter">Syncing...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-emerald-600 font-sans select-none overflow-hidden text-white">
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-teal-600 shadow-sm active:translate-y-1 transition-all">
          <FaArrowLeft size={20}/>
        </button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${gameProgress}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest mt-2">{gameProgress}% Mastery</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700" size={24} />
          <span className="text-2xl font-black text-yellow-900">{score}</span>
        </div>
      </div>

      {!isPlaying ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0.8}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl border-b-[12px] border-slate-200">
            <h1 className="text-4xl font-black mb-4 uppercase text-teal-600 italic tracking-tighter">Word Slider</h1>
            <button onClick={() => setIsPlaying(true)} className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_#065f46] active:translate-y-1 uppercase tracking-widest">Start Game</button>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl p-6 mx-auto">
          <button onClick={() => speakAzure(currentPuzzle?.target)} disabled={isSpeaking} className={`mb-12 p-8 rounded-full shadow-2xl border-4 border-white/30 transition-all active:scale-95 ${isSpeaking ? 'bg-yellow-400 animate-pulse' : 'bg-white/20'}`}>
            {isSpeaking ? <FaSpinner className="animate-spin text-white" size={48} /> : <FaVolumeUp size={48} />}
          </button>

          <div className="flex items-center gap-4 mb-20">
            {currentPuzzle?.mode === 'PREFIX' ? (
              <>
                <div className="w-44 h-[220px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border-b-[12px] border-slate-200">
                  <motion.div drag="y" dragConstraints={{ top: -(currentPuzzle.sliderParts.length - 1) * ITEM_HEIGHT, bottom: 0 }} dragElastic={0.1} onDragEnd={handleDragEnd} animate={controls} style={{ y, top: `${CENTER_OFFSET}px` }} className="absolute w-full">
                    {currentPuzzle.sliderParts.map((part, i) => (
                      <div key={`${currentIndex}-${i}`} className="flex items-center justify-center text-7xl font-black text-blue-600 italic lowercase tracking-tighter" style={{ height: `${ITEM_HEIGHT}px` }}>{part}</div>
                    ))}
                  </motion.div>
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center"><div className="w-full bg-white/70" style={{ height: `${CENTER_OFFSET}px` }} /><div className="w-full border-y-4 border-blue-100/50" style={{ height: `${ITEM_HEIGHT}px` }} /><div className="w-full bg-white/70 flex-1" /></div>
                </div>
                <div className="text-7xl font-black text-white bg-black/20 px-8 py-10 rounded-[2.5rem] border-4 border-white/20 italic tracking-tighter lowercase min-w-[140px] flex items-center justify-center shadow-inner">{currentPuzzle.fixed}</div>
              </>
            ) : (
              <>
                <div className="text-7xl font-black text-white bg-black/20 px-8 py-10 rounded-[2.5rem] border-4 border-white/20 italic tracking-tighter lowercase min-w-[140px] flex items-center justify-center shadow-inner">{currentPuzzle.fixed}</div>
                <div className="w-44 h-[220px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative border-b-[12px] border-slate-200">
                  <motion.div drag="y" dragConstraints={{ top: -(currentPuzzle.sliderParts.length - 1) * ITEM_HEIGHT, bottom: 0 }} dragElastic={0.1} onDragEnd={handleDragEnd} animate={controls} style={{ y, top: `${CENTER_OFFSET}px` }} className="absolute w-full">
                    {currentPuzzle.sliderParts.map((part, i) => (
                      <div key={`${currentIndex}-${i}`} className="flex items-center justify-center text-7xl font-black text-blue-600 italic lowercase tracking-tighter" style={{ height: `${ITEM_HEIGHT}px` }}>{part}</div>
                    ))}
                  </motion.div>
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center"><div className="w-full bg-white/70" style={{ height: `${CENTER_OFFSET}px` }} /><div className="w-full border-y-4 border-blue-100/50" style={{ height: `${ITEM_HEIGHT}px` }} /><div className="w-full bg-white/70 flex-1" /></div>
                </div>
              </>
            )}
          </div>

          <button onClick={checkAnswer} className={`px-20 py-6 rounded-2xl font-black text-4xl shadow-2xl transition-all active:translate-y-2 uppercase italic border-2 border-white/20 ${feedback === 'correct' ? 'bg-green-500 shadow-[0_8px_0_#15803d]' : feedback === 'wrong' ? 'bg-red-500 shadow-[0_8px_0_#b91c1c]' : 'bg-yellow-400 text-yellow-900 shadow-sm'}`}>
                {feedback === 'correct' ? 'Nice!' : feedback === 'wrong' ? 'Oops!' : 'Check'}
          </button>
        </div>
      )}

      {showWin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center shadow-2xl border-b-[12px] border-slate-200">
            <FaStar className="text-8xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-teal-600 tracking-tighter italic">Slider Master!</h1>
            <button onClick={() => navigate(-1)} className="mt-8 bg-teal-600 text-white py-5 rounded-2xl font-black text-xl w-full uppercase shadow-lg">Finish</button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WordSliderGame;