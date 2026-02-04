import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaMicrophone, FaVolumeUp, FaLightbulb, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const SightWordGlow = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [activeLetters, setActiveLetters] = useState([]);
  const [gameState, setGameState] = useState('LOADING'); 
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const synthesizerRef = useRef(null);
  const recognitionRef = useRef(null);
  const TARGET_SCORE = 100;

  useEffect(() => {
    async function initGame() {
      try {
        const { data: { user } } = await db.auth.getUser();
        const { data } = await db.from('course_content').select('content').eq('unit_id', unitId).eq('category', 'sight_word');
        
        if (data && data.length > 0) {
          const baseWords = data.map(w => w.content.toLowerCase().trim()).filter(w => w !== "");
          
          let enduranceList = [];
          while (enduranceList.length < 40) {
            const shuffledSet = [...baseWords].sort(() => Math.random() - 0.5);
            enduranceList = [...enduranceList, ...shuffledSet];
          }

          const { data: pData } = await db.from('user_progress').select('*').eq('user_id', user.id).eq('unit_id', unitId);
          let startPoints = 0;
          if (pData) {
            const gameProg = pData.find(p => p.game_type === 'sight-word-glow' || p.game_type === 'sight_word_glow');
            startPoints = gameProg?.points || gameProg?.progress_percent || 0;
          }

          setWords(enduranceList);
          setPoints(startPoints);
          setGameState('SPELLING');
          
          // REMOVED: Auto-speech trigger on init
        } else {
          setGameState('ERROR');
        }
      } catch (err) { setGameState('ERROR'); }
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

    return () => {
      if (synthesizerRef.current) synthesizerRef.current.close();
    };
  }, [unitId]);

  const speakAzure = (text) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      import.meta.env.VITE_AZURE_KEY, 
      import.meta.env.VITE_AZURE_REGION
    );

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="en-US-JennyNeural">
          <prosody rate="0.75">
            ${text}
          </prosody>
        </voice>
      </speak>`;

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizerRef.current = synthesizer;

    synthesizer.speakSsmlAsync(
      ssml,
      result => {
        setIsSpeaking(false);
        synthesizer.close();
      },
      error => {
        setIsSpeaking(false);
        synthesizer.close();
      }
    );
  };

  const currentWord = words[currentIndex] || "";

  const handleLetterTap = (index) => {
    if (gameState !== 'SPELLING') return;
    if (index === activeLetters.length) {
      const newActive = [...activeLetters, index];
      setActiveLetters(newActive);
      if (newActive.length === currentWord.length) {
        setTimeout(() => setGameState('SPEAKING'), 500);
      }
    } else if (!activeLetters.includes(index)) {
      setFeedback('wrong-letter');
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      setTimeout(() => setFeedback(null), 400);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening || gameState !== 'SPEAKING') return;
    try { recognitionRef.current.start(); } catch (e) { recognitionRef.current.stop(); }
  };

  const handleSpeechResult = (spokenWord) => {
    const target = currentWord.toLowerCase().trim();
    if (spokenWord.includes(target) || target.includes(spokenWord)) {
      new Audio('/audio/correct.mp3').play().catch(()=>{});
      setFeedback('correct');
      setGameState('FEEDBACK');
      setPoints(prev => {
        const next = prev + 3;
        saveProgress(unitId, 'sight-word-glow', Math.min(100, next), next);
        return next;
      });
      setTimeout(() => {
        if (points + 3 >= TARGET_SCORE) {
          setGameState('FINISHED');
          return;
        }
        setFeedback(null);
        setActiveLetters([]);
        setCurrentIndex(prev => prev + 1);
        setGameState('SPELLING');
        // REMOVED: Auto-speech trigger on next word
      }, 1200);
    } else {
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      setFeedback('wrong-speech');
      setPoints(prev => Math.max(0, prev - 3)); 
      setTimeout(() => { 
        setFeedback(null); 
        setGameState('SPEAKING');
      }, 1200);
    }
  };

  if (gameState === 'LOADING') return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-3xl font-black italic">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] relative font-sans text-white select-none flex flex-col items-center">
      
      {/* HEADER HUD */}
      <div className="w-full p-6 flex items-center justify-between bg-white/5 backdrop-blur-md sticky top-0 z-[100]">
        <button onClick={() => navigate(-1)} className="bg-white/10 p-4 rounded-2xl active:scale-95 transition-transform"><FaArrowLeft /></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/40 rounded-full border-4 border-white/10 p-1 relative overflow-hidden">
              <motion.div animate={{ width: `${Math.min(100, points)}%` }} className="h-full bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee]" />
           </div>
           <span className="text-[10px] font-black uppercase mt-2 text-cyan-300">Goal: 100 Stars</span>
        </div>
        <div className="bg-indigo-600 px-6 py-3 rounded-2xl flex items-center gap-3 border-b-4 border-indigo-900 shadow-xl min-w-[110px] justify-center">
          <FaStar className="text-yellow-400" /> <span className="text-2xl font-black">{points}</span>
        </div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="mt-8 mb-4 bg-white/10 px-8 py-3 rounded-full border border-white/20 flex items-center gap-3">
        <FaLightbulb className="text-yellow-400 animate-pulse" />
        <p className="text-lg font-black uppercase tracking-widest italic">
            {gameState === 'FINISHED' ? "Victory!" : 
             gameState === 'SPELLING' ? "1. Click the letters!" : 
             gameState === 'SPEAKING' ? "2. Click mic to say the word!" : "Processing..."}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center mt-20">
        {gameState === 'FINISHED' ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[4rem] flex flex-col items-center shadow-2xl">
             <FaCheckCircle className="text-green-500 text-9xl mb-6" />
             <h2 className="text-slate-800 text-4xl font-black uppercase mb-8">100 Stars!</h2>
             <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-12 py-6 rounded-[2rem] text-2xl font-black uppercase">Finish</button>
          </motion.div>
        ) : (
          <>
            {/* WORD DISPLAY */}
            <div className="flex gap-4 mb-20 flex-wrap justify-center">
              {currentWord.split("").map((letter, index) => (
                <motion.div
                  key={`${currentIndex}-${index}`}
                  onClick={() => handleLetterTap(index)}
                  animate={
                    feedback === 'wrong-letter' && index === activeLetters.length ? { x: [-5, 5, -5, 5, 0] } : 
                    activeLetters.includes(index) ? { color: "#22d3ee", textShadow: "0 0 25px #22d3ee", scale: 1.15 } : 
                    { color: "#334155", scale: 1 }
                  }
                  className="text-9xl font-black lowercase cursor-pointer select-none"
                >
                  {letter}
                </motion.div>
              ))}
            </div>

            {/* ACTION AREA - USER MUST CLICK FOR SOUND */}
            <div className="h-48 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {gameState === 'SPELLING' && (
                        <motion.button 
                          key="speaker" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          onClick={() => speakAzure(currentWord)}
                          disabled={isSpeaking}
                          className={`p-10 rounded-full border-b-8 shadow-xl transition-all ${isSpeaking ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700 border-slate-900'}`}
                        >
                            {isSpeaking ? <FaSpinner className="animate-spin" size={48} /> : <FaVolumeUp size={48} />}
                        </motion.button>
                    )}
                    {gameState === 'SPEAKING' && (
                        <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                            <motion.button 
                              onClick={startListening}
                              className={`p-10 rounded-full border-b-8 shadow-2xl transition-all ${isListening ? 'bg-red-500 border-red-800 animate-pulse' : 'bg-green-500 border-green-800'}`}
                            >
                                <FaMicrophone size={56} />
                            </motion.button>
                            <p className="mt-4 font-black uppercase text-xs tracking-widest text-green-400">Tap mic and read!</p>
                        </motion.div>
                    )}
                    {feedback && feedback !== 'wrong-letter' && (
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

export default SightWordGlow;