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
  const [micError, setMicError] = useState('');

  const synthesizerRef = useRef(null);
  const recognitionRef = useRef(null);
  const azureRecognizerRef = useRef(null);
  const speechSafetyTimeoutRef = useRef(null);
  const gameStateRef = useRef('LOADING');
  const TARGET_SCORE = 100;
  const hasAzureSpeechConfig = Boolean(import.meta.env.VITE_AZURE_KEY && import.meta.env.VITE_AZURE_REGION);
  const clampPoints = (value) => Math.max(0, Math.min(TARGET_SCORE, Number(value) || 0));

  const normalizeSpeech = (text = '') => text.toLowerCase().replace(/[^a-z\s'-]/g, '').trim();
  const escapeXml = (text = '') => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const clearSpeechSafetyTimeout = () => {
    if (speechSafetyTimeoutRef.current) {
      clearTimeout(speechSafetyTimeoutRef.current);
      speechSafetyTimeoutRef.current = null;
    }
  };

  const stopListeningSession = () => {
    setIsListening(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    if (azureRecognizerRef.current) {
      try { azureRecognizerRef.current.close(); } catch (e) {}
      azureRecognizerRef.current = null;
    }
  };

  const resetSpeakingState = () => {
    clearSpeechSafetyTimeout();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (synthesizerRef.current) {
      try { synthesizerRef.current.close(); } catch (e) {}
      synthesizerRef.current = null;
    }

    setIsSpeaking(false);
  };

  const speakBrowserFallback = (text) => {
    if (!text || !window.speechSynthesis) return false;

    let started = false;
    let failedOver = false;

    const failOverToAzure = () => {
      if (failedOver) return;
      failedOver = true;
      const azureStarted = speakWithAzure(text);
      if (!azureStarted) {
        clearSpeechSafetyTimeout();
        setIsSpeaking(false);
      }
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.onstart = () => {
      started = true;
    };
    utterance.onend = () => {
      clearSpeechSafetyTimeout();
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      failOverToAzure();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);

    setTimeout(() => {
      if (!started) {
        window.speechSynthesis.cancel();
        failOverToAzure();
      }
    }, 1200);

    return true;
  };

  const speakWithAzure = (text) => {
    if (!hasAzureSpeechConfig) {
      return false;
    }

    let speechConfig;
    try {
      speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_KEY,
        import.meta.env.VITE_AZURE_REGION
      );
      speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
    } catch (error) {
      return false;
    }

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="en-US-JennyNeural">
          <prosody rate="0.75">
            ${escapeXml(text)}
          </prosody>
        </voice>
      </speak>`;

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizerRef.current = synthesizer;

    synthesizer.speakSsmlAsync(
      ssml,
      () => {
        clearSpeechSafetyTimeout();
        setIsSpeaking(false);
        synthesizer.close();
        synthesizerRef.current = null;
      },
      () => {
        synthesizer.close();
        synthesizerRef.current = null;
        setIsSpeaking(false);
      }
    );

    return true;
  };

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
            startPoints = clampPoints(gameProg?.points || gameProg?.progress_percent || 0);
          }

          setWords(enduranceList);
          setPoints(clampPoints(startPoints));
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
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event?.error === 'not-allowed') {
          setMicError('Microphone permission is blocked. Enable mic access and retry.');
          return;
        }
        if (event?.error === 'aborted') return;
        recognizeWithAzureOnce();
      };
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        handleSpeechResult(transcript);
      };
    }

    return () => {
      clearSpeechSafetyTimeout();
      stopListeningSession();
      if (synthesizerRef.current) {
        try { synthesizerRef.current.close(); } catch (e) {}
      }
    };
  }, [unitId]);

  useEffect(() => {
    if (gameState !== 'SPEAKING') {
      stopListeningSession();
    }
  }, [gameState]);

  useEffect(() => {
    resetSpeakingState();
    setMicError('');
  }, [currentIndex]);

  const speakAzure = (text) => {
    if (!text || isSpeaking) return;
    resetSpeakingState();
    setIsSpeaking(true);
    speechSafetyTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 8000);

    if (window.speechSynthesis && speakBrowserFallback(text)) {
      return;
    }

    const azureStarted = speakWithAzure(text);
    if (!azureStarted) {
      clearSpeechSafetyTimeout();
      setIsSpeaking(false);
    }
  };

  const handleRestartFromZero = async () => {
    stopListeningSession();
    resetSpeakingState();
    setPoints(clampPoints(0));
    setCurrentIndex(0);
    setActiveLetters([]);
    setFeedback(null);
    setMicError('');
    setGameState('SPELLING');
    await saveProgress(unitId, 'sight-word-glow', 0, 0);
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

  const recognizeWithAzureOnce = () => {
    if (!hasAzureSpeechConfig) {
      setMicError('Microphone is unavailable in this browser.');
      return;
    }

    try {
      if (azureRecognizerRef.current) {
        try { azureRecognizerRef.current.close(); } catch (e) {}
        azureRecognizerRef.current = null;
      }

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_KEY,
        import.meta.env.VITE_AZURE_REGION
      );
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, SpeechSDK.AudioConfig.fromDefaultMicrophoneInput());
      azureRecognizerRef.current = recognizer;
      setIsListening(true);

      recognizer.recognizeOnceAsync(
        (result) => {
          if (gameStateRef.current !== 'SPEAKING') {
            recognizer.close();
            azureRecognizerRef.current = null;
            return;
          }

          setIsListening(false);
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech && result.text) {
            handleSpeechResult(result.text);
          } else {
            setMicError('No speech detected. Try again.');
          }
          recognizer.close();
          azureRecognizerRef.current = null;
        },
        () => {
          setIsListening(false);
          setMicError('Mic connection failed. Check permission and retry.');
          recognizer.close();
          azureRecognizerRef.current = null;
        }
      );
    } catch (error) {
      setIsListening(false);
      setMicError('Mic connection failed. Check permission and retry.');
    }
  };

  const startListening = async () => {
    if (isListening || gameState !== 'SPEAKING') return;

    setMicError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Microphone API is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicError('Microphone permission is blocked. Enable mic access and retry.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        try { recognitionRef.current.stop(); } catch (_) {}
        recognizeWithAzureOnce();
      }
      return;
    }

    recognizeWithAzureOnce();
  };

  const handleSpeechResult = (spokenWord) => {
    if (gameStateRef.current !== 'SPEAKING') return;

    stopListeningSession();
    const target = normalizeSpeech(currentWord);
    const spoken = normalizeSpeech(spokenWord);
    if (!spoken || !target) {
      setMicError('No speech detected. Try again.');
      return;
    }

    if (spoken.includes(target) || target.includes(spoken)) {
      new Audio('/audio/correct.mp3').play().catch(()=>{});
      setFeedback('correct');
      setIsListening(false);
      setGameState('FEEDBACK');
      const nextPoints = Math.min(100, points + 3);
      setPoints(prev => {
        const next = clampPoints(prev + 3);
        saveProgress(unitId, 'sight-word-glow', next, next);
        return next;
      });
      setTimeout(() => {
        if (nextPoints >= TARGET_SCORE) {
          setGameState('FINISHED');
          return;
        }
        setFeedback(null);
        setActiveLetters([]);
        setCurrentIndex(prev => prev + 1);
        setMicError('');
        setGameState('SPELLING');
        // REMOVED: Auto-speech trigger on next word
      }, 1200);
    } else {
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      setFeedback('wrong-speech');
      setPoints(prev => clampPoints(prev - 3)); 
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
          <FaStar className="text-yellow-400" /> <span className="text-2xl font-black">{clampPoints(points)}</span>
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
             <div className="flex items-center gap-4">
               <button onClick={handleRestartFromZero} className="bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] text-lg font-black uppercase">Reload 0</button>
               <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-8 py-5 rounded-[1.5rem] text-lg font-black uppercase">Menu</button>
             </div>
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

            {/* ACTION AREA */}
            <div className="min-h-48 flex flex-col items-center justify-center gap-5">
                <div className="flex items-center gap-8 flex-nowrap">
                  <button
                    onClick={() => speakAzure(currentWord)}
                    disabled={isSpeaking || !currentWord}
                    className={`p-8 rounded-full border-b-8 shadow-xl transition-all ${isSpeaking ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700 border-slate-900'}`}
                  >
                    {isSpeaking ? <FaSpinner className="animate-spin" size={40} /> : <FaVolumeUp size={40} />}
                  </button>

                  <button
                    onClick={startListening}
                    disabled={gameState !== 'SPEAKING' || isListening}
                    className={`p-8 rounded-full border-b-8 shadow-2xl transition-all ${isListening ? 'bg-red-500 border-red-800 animate-pulse' : gameState === 'SPEAKING' ? 'bg-green-500 border-green-800' : 'bg-slate-500 border-slate-700 opacity-60'}`}
                  >
                    <FaMicrophone size={44} />
                  </button>
                </div>

                <p className="font-black uppercase text-xs tracking-widest text-green-400">Speaker + Mic are ready</p>
                {micError && <p className="text-xs font-bold text-red-300">{micError}</p>}

                <AnimatePresence mode="wait">
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