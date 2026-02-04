import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaArrowLeft, FaStar, FaVolumeUp, FaCheck, FaTimes, FaSpinner, FaFingerprint } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient'; // Matches your export

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co'; 

const PHONETIC_MAP = {
    "a": "a", "b": "buh", "c": "kuh", "d": "duh", "e": "eh",
    "f": "fff", "g": "guh", "h": "huh", "i": "ih", "j": "juh",
    "k": "kuh", "l": "lll", "m": "mmm", "n": "nnn", "o": "o",
    "p": "puh", "qu": "kwuh", "r": "rrr", "s": "sss", "t": "tuh",
    "u": "uh", "v": "vvv", "w": "wuh", "x": "ks", "y": "yuh", "z": "zzz"
};

const PhonicsFusion = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [wordList, setWordList] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState('LISTENING'); 
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("Listen closely...");
  const [highlightPart, setHighlightPart] = useState(0); 
  const [micState, setMicState] = useState('IDLE'); 

  const scoreRef = useRef(0);
  const isLockedRef = useRef(false);
  const recognizerRef = useRef(null);
  const bestScoreRef = useRef(0);
  const dataFetchedRef = useRef(false);
  const playedIndicesRef = useRef(new Set()); 

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    return () => {
        if (recognizerRef.current) { try { recognizerRef.current.close(); } catch(e){} }
        if (wordList.length > 0 && scoreRef.current > 0) {
            saveProgress(unitId, 'phonics_fusion', scoreRef.current, scoreRef.current);
        }
    };
  }, [wordList.length, unitId]);

  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;
    async function loadData() {
        setIsLoading(true);
        const { data: { user } } = await db.auth.getUser();
        if (!user) { setIsLoading(false); return; }
        const { data, error } = await db.from('course_content').select('*').eq('unit_id', unitId).in('category', ['decodable', 'word']);
        if (error || !data || data.length === 0) { setIsLoading(false); return; }
        const processed = data.map(item => {
            const w = item.content.toLowerCase().trim();
            const match = w.match(/[aeiouy]/);
            const splitIndex = match ? match.index : 1; 
            return { word: w, image: item.image, part1: w.slice(0, splitIndex), part2: w.slice(splitIndex) };
        });
        setWordList(processed);
        const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'phonics_fusion').maybeSingle();
        if (pData && pData.progress_percent > 0 && pData.progress_percent < 100) {
            const startIdx = Math.floor((pData.progress_percent / 100) * processed.length);
            setWordIndex(startIdx); setScore(pData.progress_percent); scoreRef.current = pData.progress_percent;
        }
        setIsLoading(false);
    }
    loadData();
  }, [unitId]);

  const currentWord = wordList[wordIndex];
  const imageUrl = currentWord ? `${supabaseUrl}/storage/v1/object/public/assets/${currentWord.image || currentWord.word + '.png'}` : '';

  const speakWithAzure = (text, isPhonetic = false) => {
    return new Promise((resolve) => {
        const spokenText = isPhonetic && PHONETIC_MAP[text] ? PHONETIC_MAP[text] : text;
        const u = new SpeechSynthesisUtterance(spokenText); 
        u.lang = 'en-US'; u.onend = resolve;
        window.speechSynthesis.speak(u);
    });
  };

  const playPartAudio = (text) => {
    return new Promise((resolve) => {
        const audio = new Audio(`${supabaseUrl}/storage/v1/object/public/audio/${text.toLowerCase().trim()}.mp3`);
        audio.oncanplaythrough = () => audio.play().then(() => audio.onended = resolve).catch(() => speakWithAzure(text, true).then(resolve));
        audio.onerror = () => speakWithAzure(text, true).then(resolve);
    });
  };

  const startFusionSequence = async (targetItem) => {
      if (playedIndicesRef.current.has(wordIndex)) return;
      playedIndicesRef.current.add(wordIndex);
      isLockedRef.current = true;
      setFeedback("Listen...");
      setHighlightPart(1);
      await playPartAudio(targetItem.part1);
      setHighlightPart(2);
      await playPartAudio(targetItem.part2);
      setHighlightPart(0);
      isLockedRef.current = false;
      setFeedback(`Say: "${targetItem.word}"`);
  };

  useEffect(() => {
      if (currentWord && gameState !== 'WON') { setTimeout(() => startFusionSequence(currentWord), 100); }
  }, [wordIndex, currentWord]); 

  const handleMicDown = () => {
    if (isLockedRef.current) return;
    setMicState('LISTENING');
    bestScoreRef.current = 0; 
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, SpeechSDK.AudioConfig.fromDefaultMicrophoneInput());
    recognizerRef.current = recognizer;
    const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(currentWord.word, SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark, SpeechSDK.PronunciationAssessmentGranularity.Phoneme, true);
    pronConfig.applyTo(recognizer);
    recognizer.startContinuousRecognitionAsync();
    recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const result = SpeechSDK.PronunciationAssessmentResult.fromResult(e.result);
            bestScoreRef.current = Math.max(bestScoreRef.current, result.accuracyScore || 0);
        }
    };
  };

  const handleMicUp = () => {
    if (micState === 'SUCCESS' || isLockedRef.current) return;
    if (recognizerRef.current) { recognizerRef.current.stopContinuousRecognitionAsync(() => { recognizerRef.current.close(); finalizeCheck(); }); }
  };

  const finalizeCheck = () => {
    if (bestScoreRef.current >= 50) handleSuccess();
    else {
        setMicState('ERROR'); new Audio('/audio/wrong.mp3').play().catch(()=>{});
        setTimeout(() => setMicState('IDLE'), 1000);
    }
  };

  const handleSuccess = async () => {
    isLockedRef.current = true;
    setMicState('SUCCESS'); new Audio('/audio/correct.mp3').play().catch(()=>{});
    const pointsPerWord = 100 / wordList.length;
    const newScore = Math.min(100, Math.round(score + pointsPerWord));
    setScore(newScore);
    setTimeout(async () => {
        if (wordIndex < wordList.length - 1) { setWordIndex(prev => prev + 1); setMicState('IDLE'); isLockedRef.current = false; }
        else { setScore(100); await saveProgress(unitId, 'phonics_fusion', 100, 100); setGameState('WON'); }
    }, 2000); 
  };

  if (isLoading) return <div className="min-h-screen bg-indigo-500 flex items-center justify-center text-white text-2xl font-black italic animate-pulse">Mixing Sounds...</div>;

  if (gameState === 'WON') {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center">
        <FaStar className="text-8xl text-yellow-400 mb-4 animate-bounce drop-shadow-lg" />
        <h1 className="text-5xl font-black text-indigo-800 uppercase tracking-tighter">Fusion Master!</h1>
        <button onClick={() => navigate(-1)} className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#3730a3] active:translate-y-1 active:shadow-none transition-all">Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-indigo-600 flex flex-col items-center relative font-sans text-white select-none">
      
      {/* UNIFIED HEADER PATTERN */}
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-indigo-600 shadow-[0_5px_0_#818cf8] active:translate-y-1 active:shadow-none transition-all"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
           </div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2">{Math.round(score)}% Complete</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-[0_6px_0_#d97706] flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700 animate-pulse" size={24} />
          <span className="text-2xl font-black text-yellow-900">{Math.round(score)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-4 rounded-[3rem] shadow-2xl mb-12 w-80 h-80 flex items-center justify-center relative border-b-[12px] border-slate-200">
             {imageUrl ? <img src={imageUrl} alt="Clue" className="w-full h-full object-contain" /> : <span className="text-9xl">🖼️</span>}
        </motion.div>

        <div className="flex items-center gap-6 mb-16">
            <div className={`text-7xl font-black px-8 py-5 rounded-3xl transition-all duration-300 italic ${highlightPart === 1 ? 'bg-yellow-400 text-indigo-900 scale-110 shadow-[0_0_30px_#facc15]' : 'bg-black/20 text-white border-2 border-white/20'}`}>{currentWord.part1}</div>
            <div className="text-5xl font-black opacity-30">+</div>
            <div className={`text-7xl font-black px-8 py-5 rounded-3xl transition-all duration-300 italic ${highlightPart === 2 ? 'bg-yellow-400 text-indigo-900 scale-110 shadow-[0_0_30px_#facc15]' : 'bg-black/20 text-white border-2 border-white/20'}`}>{currentWord.part2}</div>
        </div>

        <h2 className="text-3xl font-black text-white mb-10 h-8 drop-shadow-md italic uppercase tracking-tighter">{feedback}</h2>

        <div className="flex items-center gap-8">
            <button onClick={() => startFusionSequence(currentWord)} disabled={isLockedRef.current} className="w-24 h-24 rounded-3xl flex items-center justify-center text-white bg-white/20 hover:bg-white/40 shadow-xl transition active:scale-95 border-b-4 border-black/20"><FaVolumeUp size={36} /></button>
            <button
                onMouseDown={handleMicDown} onMouseUp={handleMicUp}
                onTouchStart={(e) => { e.preventDefault(); handleMicDown(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleMicUp(); }}
                className={`w-36 h-36 rounded-full flex items-center justify-center text-7xl shadow-2xl transition-all active:scale-95 border-4 border-white
                    ${micState === 'LISTENING' ? 'bg-blue-500' : micState === 'SUCCESS' ? 'bg-green-500' : 'bg-white text-indigo-600'}`}
            >
                {micState === 'LISTENING' ? <FaMicrophone className="animate-bounce" /> : micState === 'PROCESSING' ? <FaSpinner className="animate-spin" /> : micState === 'SUCCESS' ? <FaCheck /> : <FaFingerprint />}
            </button>
            <div className="w-24"></div>
        </div>
      </div>
    </div>
  );
};

export default PhonicsFusion;