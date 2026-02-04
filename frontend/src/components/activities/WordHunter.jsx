import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar, FaSpinner, FaVolumeUp } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const generatePuzzle = (targetWord) => {
    if (!targetWord || typeof targetWord !== 'string') return null;
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const riverLength = 12;
    let river = [];
    const maxStartIndex = riverLength - targetWord.length;
    const startIndex = Math.floor(Math.random() * (maxStartIndex > 0 ? maxStartIndex : 1));
    for (let i = 0; i < riverLength; i++) {
        if (i >= startIndex && i < startIndex + targetWord.length) {
            river.push({ char: targetWord[i - startIndex].toLowerCase(), isTarget: true, id: i });
        } else {
            river.push({ char: alphabet[Math.floor(Math.random() * alphabet.length)], isTarget: false, id: i });
        }
    }
    return { river, startIndex, endIndex: startIndex + targetWord.length - 1 };
};

const WordHunter = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [wordQueue, setWordQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [puzzle, setPuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selection, setSelection] = useState([]); 
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const synthesizerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user) return;

            const { data: wordsData } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'decodable');
            
            if (wordsData && wordsData.length > 0) {
                setWordQueue(wordsData);
                const { data: pData } = await db.from('user_progress')
                    .select('progress_percent')
                    .eq('user_id', user.id)
                    .eq('unit_id', unitId)
                    .eq('game_type', 'word_hunter')
                    .maybeSingle();

                if (pData && pData.progress_percent > 0 && pData.progress_percent < 100) {
                    const savedIdx = Math.floor((pData.progress_percent / 100) * wordsData.length);
                    setCurrentIndex(savedIdx);
                    setScore(pData.progress_percent);
                }
            }
        } catch (err) {
            console.error("Load error:", err);
        } finally {
            setIsLoading(false);
        }
    }
    loadData();
    return () => { if (synthesizerRef.current) synthesizerRef.current.close(); };
  }, [unitId]);

  useEffect(() => {
    if (wordQueue.length > 0 && wordQueue[currentIndex]) {
        setPuzzle(generatePuzzle(wordQueue[currentIndex].content));
        setSelection([]); 
        setFeedback(null);
    }
  }, [currentIndex, wordQueue]);

  const speakAzure = (text) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural"><prosody rate="0.75">${text}</prosody></voice></speak>`;
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizerRef.current = synthesizer;
    synthesizer.speakSsmlAsync(ssml, () => { setIsSpeaking(false); synthesizer.close(); }, () => { setIsSpeaking(false); synthesizer.close(); });
  };

  const handlePointerDown = (index) => { 
    if (feedback === 'correct') return; 
    setIsDragging(true); 
    setSelection([index]); 
  };

  const handleGlobalMove = (e) => {
    if (!isDragging || feedback === 'correct') return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const target = document.elementFromPoint(clientX, clientY);
    const idx = target?.getAttribute('data-index');
    if (idx !== null) {
        const i = parseInt(idx);
        if (!selection.includes(i)) setSelection(prev => [...prev, i].sort((a,b) => a-b));
    }
  };

  const checkAnswer = async () => {
    if (!isDragging) return;
    setIsDragging(false);

    const selected = selection.map(idx => puzzle.river[idx].char).join("");
    const target = wordQueue[currentIndex].content.toLowerCase().trim();

    if (selected === target) {
        setFeedback('correct'); 
        speakAzure(target); 
        new Audio('/audio/correct.mp3').play().catch(()=>{});

        // Calculate and update progress state
        const pointsPerWord = 100 / wordQueue.length;
        const newScore = Math.min(100, Math.round((currentIndex + 1) * pointsPerWord));
        setScore(newScore);

        // IMMEDIATE SAVE: Triggers every time a word is found
        await saveProgress(unitId, 'word_hunter', newScore, newScore);

        setTimeout(() => {
            if (currentIndex < wordQueue.length - 1) { 
                setCurrentIndex(prev => prev + 1); 
            } else { 
                setShowWin(true); 
            }
        }, 1500);
    } else {
        setFeedback('wrong'); 
        new Audio('/audio/wrong.mp3').play().catch(()=>{});
        setTimeout(() => { setSelection([]); setFeedback(null); }, 1000);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-sky-500 flex items-center justify-center text-white text-2xl font-black animate-pulse uppercase tracking-widest italic">Syncing...</div>;

  const currentWordData = wordQueue[currentIndex];
  const filename = currentWordData?.content?.toLowerCase().replace(/['’›]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const imageUrl = `${supabaseUrl}/storage/v1/object/public/assets/${filename}.png`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-600 font-sans select-none overflow-hidden"
        onPointerUp={checkAnswer} onPointerMove={handleGlobalMove} onTouchMove={handleGlobalMove}>
      
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-sky-600 shadow-sm active:translate-y-1 transition-all"><FaArrowLeft size={20}/></button>
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
            <h1 className="text-4xl font-black mb-6 uppercase text-sky-600 italic tracking-tighter">Word Hunter</h1>
            <p className="mb-8 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Hunt for the word hidden in the river!</p>
            <button onClick={() => setIsPlaying(true)} className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_#1d4ed8] active:translate-y-1 uppercase tracking-widest">Go!</button>
          </motion.div>
        </div>
      )}

      {showWin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center shadow-2xl border-b-[12px] border-slate-200">
            <FaStar className="text-8xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-sky-600 italic tracking-tighter">Hunt Master!</h1>
            <button onClick={() => navigate(-1)} className="mt-8 bg-sky-600 text-white py-5 rounded-2xl font-black text-xl w-full uppercase shadow-lg">Finish</button>
          </motion.div>
        </div>
      )}

      {isPlaying && puzzle && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto z-10 p-6">
          <motion.div key={currentIndex} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mb-10 bg-white p-4 rounded-[3rem] shadow-2xl border-b-[12px] border-slate-200 w-72 h-72 flex items-center justify-center">
             <img src={imageUrl} className="w-full h-full object-contain" alt="Target" 
                  onError={(e) => e.target.src = "https://via.placeholder.com/200?text=?"} />
          </motion.div>

          <div className="bg-black/20 p-8 rounded-[2.5rem] flex flex-wrap justify-center gap-3 shadow-inner mb-8" style={{ touchAction: 'none' }}>
            {puzzle.river.map((tile, i) => (
                <div key={i} data-index={i} onPointerDown={() => handlePointerDown(i)}
                    className={`w-14 h-16 md:w-16 md:h-20 rounded-xl flex items-center justify-center text-4xl font-black transition-all italic border-b-8 select-none
                        ${selection.includes(i) ? (feedback === 'correct' ? "bg-green-500 border-green-700 text-white" : feedback === 'wrong' ? "bg-red-500 border-red-700 text-white" : "bg-sky-500 border-sky-700 text-white") : "bg-white text-sky-600 border-slate-200"}`}>
                    {tile.char}
                </div>
            ))}
          </div>

          <button 
            onClick={() => speakAzure(wordQueue[currentIndex].content)} 
            disabled={isSpeaking}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${isSpeaking ? 'bg-yellow-400 animate-pulse' : 'bg-white text-sky-600'}`}
          >
            {isSpeaking ? <FaSpinner className="animate-spin" size={30} /> : <FaVolumeUp size={30} />}
          </button>
          
          <p className="mt-6 font-black text-white/40 uppercase tracking-widest italic text-xs">Drag across letters to spell the word</p>
        </div>
      )}
    </div>
  );
};

export default WordHunter;