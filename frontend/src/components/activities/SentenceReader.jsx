import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaArrowLeft, FaStar, FaCheck, FaSpinner, FaFingerprint } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient'; // Matches your export

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const SentenceReader = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSentenceWords, setCurrentSentenceWords] = useState([]); 
  const [score, setScore] = useState(0);
  const [micState, setMicState] = useState('IDLE'); 
  const [feedback, setFeedback] = useState("Ready to Read?");
  const [showWin, setShowWin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const recognizerRef = useRef(null);
  const accumulatedWordsRef = useRef([]); 
  const isLockedRef = useRef(false);
  const scoreRef = useRef(0);
  const dataLoadedRef = useRef(false);

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    return () => {
        if (recognizerRef.current) { try { recognizerRef.current.close(); } catch(e){} }
        if (dataLoadedRef.current && scoreRef.current > 0) {
            saveProgress(unitId, 'sentence_reader', scoreRef.current, scoreRef.current);
        }
    };
  }, [unitId]);

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
                const clean = data.map(item => {
                    let filename = (item.content || "").toLowerCase().replace(/['’›]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                    return { id: item.id, content: item.content ? item.content.trim() : "", imageUrl: `${supabaseUrl}/storage/v1/object/public/assets/${filename}.png` };
                });
                if (isMounted) {
                    setSentences(clean); dataLoadedRef.current = true;
                    const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'sentence_reader').maybeSingle();
                    if (pData && pData.progress_percent > 0 && pData.progress_percent < 100) {
                        const idx = Math.floor((pData.progress_percent / 100) * clean.length);
                        setCurrentIndex(idx); setScore(pData.progress_percent); prepareSentenceDisplay(clean[idx].content);
                    } else { prepareSentenceDisplay(clean[0].content); }
                }
            }
        } catch (err) { console.error(err); } finally { if (isMounted) setIsLoading(false); }
    }
    loadData();
    return () => { isMounted = false; };
  }, [unitId]);

  const prepareSentenceDisplay = (text) => {
    const wordObjects = text.split(' ').map(w => ({ display: w, clean: w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").toLowerCase(), status: 'neutral' }));
    setCurrentSentenceWords(wordObjects);
  };

  const handleMicDown = () => {
    if (isLockedRef.current || !sentences[currentIndex]) return;
    setMicState('LISTENING');
    setFeedback("Listening...");
    setCurrentSentenceWords(prev => prev.map(w => ({ ...w, status: 'neutral' })));
    accumulatedWordsRef.current = []; 

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, SpeechSDK.AudioConfig.fromDefaultMicrophoneInput());
    recognizerRef.current = recognizer;
    const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(sentences[currentIndex].content, SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark, SpeechSDK.PronunciationAssessmentGranularity.Word, true);
    pronConfig.applyTo(recognizer);
    recognizer.startContinuousRecognitionAsync();
    recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const json = JSON.parse(e.result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult));
            if (json.NBest && json.NBest.length > 0) { accumulatedWordsRef.current = [...accumulatedWordsRef.current, ...json.NBest[0].Words]; }
        }
    };
  };

  const handleMicUp = () => {
    if (micState === 'SUCCESS' || isLockedRef.current) return;
    setMicState('PROCESSING');
    setTimeout(() => { if (recognizerRef.current) { recognizerRef.current.stopContinuousRecognitionAsync(() => { recognizerRef.current.close(); finalizeCheck(); }); } }, 1000); 
  };

  const finalizeCheck = () => {
    const heard = [...accumulatedWordsRef.current];
    const newWordState = [...currentSentenceWords];
    let correctCount = 0;
    newWordState.forEach((target) => {
        const matchIndex = heard.findIndex(hw => hw.Word.toLowerCase() === target.clean);
        if (matchIndex !== -1) { target.status = 'correct'; correctCount++; heard.splice(matchIndex, 1); } else { target.status = 'error'; }
    });
    setCurrentSentenceWords(newWordState);
    if (correctCount / newWordState.length > 0.70) { handleSuccess(); } 
    else { 
        setMicState('ERROR'); new Audio('/audio/wrong.mp3').play().catch(()=>{});
        setTimeout(() => { setMicState('IDLE'); setFeedback("Try Reading Again"); }, 1500);
    }
  };

  const handleSuccess = async () => {
    isLockedRef.current = true; setMicState('SUCCESS'); new Audio('/audio/correct.mp3').play().catch(()=>{});
    const points = 100 / sentences.length;
    const newScore = Math.min(100, Math.round(score + points));
    setScore(newScore);
    setTimeout(async () => {
        if (currentIndex < sentences.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx); prepareSentenceDisplay(sentences[nextIdx].content);
            setMicState('IDLE'); setFeedback("Read the next one!"); isLockedRef.current = false;
        } else {
            setScore(100); await saveProgress(unitId, 'sentence_reader', 100, 100); setShowWin(true);
        }
    }, 2000);
  };

  if (isLoading) return <div className="min-h-screen bg-purple-500 flex items-center justify-center text-white font-black text-2xl animate-pulse">READING...</div>;

  if (showWin) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 flex flex-col items-center justify-center text-white p-4">
        <FaStar size={100} className="text-yellow-400 mb-4 animate-bounce drop-shadow-lg" />
        <h1 className="text-5xl font-black uppercase tracking-tighter">Reading Master!</h1>
        <button onClick={() => navigate(-1)} className="mt-8 bg-white text-purple-600 px-10 py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#7c3aed] active:translate-y-1 active:shadow-none transition-all uppercase">Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-indigo-600 font-sans text-white select-none overflow-hidden">
      
      {/* UNIFIED HEADER PATTERN */}
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-purple-600 shadow-[0_5px_0_#c084fc] active:translate-y-1 active:shadow-none transition-all"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest mt-2">{Math.round(score)}% Complete</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-[0_6px_0_#d97706] flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700 animate-pulse" size={24} />
          <span className="text-2xl font-black text-yellow-900">{Math.round(score)}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col items-center p-6">
        <motion.div key={sentences[currentIndex]?.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-4 rounded-[3rem] shadow-2xl mb-10 flex items-center justify-center border-b-[12px] border-slate-200">
            {sentences[currentIndex]?.imageUrl ? (
                <img src={sentences[currentIndex].imageUrl} alt="Clue" className="h-[250px] md:h-[400px] w-auto rounded-3xl object-contain"/>
            ) : ( <div className="h-64 w-64 bg-gray-100 rounded-3xl flex items-center justify-center text-8xl">🖼️</div> )}
        </motion.div>

        <div className="bg-white/95 text-slate-800 p-10 rounded-[2.5rem] shadow-2xl mb-10 text-center w-full min-h-[160px] flex flex-wrap items-center justify-center gap-x-4 gap-y-3 border-b-[12px] border-slate-200">
            {currentSentenceWords.map((wordObj, i) => (
                <motion.span key={i} animate={{ color: wordObj.status === 'correct' ? '#16a34a' : wordObj.status === 'error' ? '#dc2626' : '#1e293b' }}
                    className="text-4xl md:text-6xl font-black leading-tight italic">
                    {wordObj.display}
                </motion.span>
            ))}
        </div>

        <h3 className="mb-8 text-2xl font-black drop-shadow-md uppercase tracking-tighter italic">{feedback}</h3>

        <button onMouseDown={handleMicDown} onMouseUp={handleMicUp} onTouchStart={(e)=>{e.preventDefault(); handleMicDown()}} onTouchEnd={(e)=>{e.preventDefault(); handleMicUp()}}
            className={`w-36 h-36 rounded-full flex items-center justify-center text-7xl shadow-2xl transition-all active:scale-95 border-4 border-white
                ${micState === 'LISTENING' ? 'bg-blue-500 animate-pulse' : micState === 'PROCESSING' ? 'bg-yellow-400' : micState === 'SUCCESS' ? 'bg-green-500' : 'bg-white text-purple-600'}`}>
            {micState === 'LISTENING' ? <FaMicrophone /> : micState === 'PROCESSING' ? <FaSpinner className="animate-spin"/> : micState === 'SUCCESS' ? <FaCheck /> : <FaFingerprint />}
        </button>
      </div>
    </div>
  );
};

export default SentenceReader;