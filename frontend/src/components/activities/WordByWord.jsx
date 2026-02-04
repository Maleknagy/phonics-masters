import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaArrowLeft, FaStar, FaStop } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient'; // Updated import

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const WordByWord = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [sentences, setSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [targetWordIndex, setTargetWordIndex] = useState(0); 
  const [wordStates, setWordStates] = useState([]); 
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState("Ready to Read?");
  const [showWin, setShowWin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const recognizerRef = useRef(null);
  const scoreRef = useRef(0);
  const dataLoadedRef = useRef(false);

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    return () => {
        stopListening(); 
        if (dataLoadedRef.current && scoreRef.current > 0) saveProgress(unitId, 'word_by_word', scoreRef.current, scoreRef.current);
    };
  }, [unitId]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
        setIsLoading(true);
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user || !isMounted) return;
            const { data } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'sentence'); 
            if (data && data.length > 0) {
                const clean = data.map(item => {
                    let fn = (item.content || "").toLowerCase().replace(/['’›]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                    return { id: item.id, content: item.content.trim(), imageUrl: `${supabaseUrl}/storage/v1/object/public/assets/${fn}.png` };
                });
                if (isMounted) {
                    setSentences(clean); dataLoadedRef.current = true;
                    const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'word_by_word').maybeSingle();
                    if (pData && pData.progress_percent > 0) {
                        setCurrentSentenceIndex(Math.floor((pData.progress_percent / 100) * clean.length));
                        setScore(pData.progress_percent); scoreRef.current = pData.progress_percent;
                        prepareSentence(clean[currentSentenceIndex].content);
                    } else { prepareSentence(clean[0].content); }
                }
            }
        } catch (err) { console.error(err); } finally { if (isMounted) setIsLoading(false); }
    }
    loadData();
  }, [unitId]);

  const prepareSentence = (text) => {
    const words = text.split(' ');
    setWordStates(words.map(w => ({ display: w, clean: w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").toLowerCase(), status: 'pending' })));
    setTargetWordIndex(0); setFeedback("Read the first word");
  };

  const startListening = () => {
    setIsListening(true); setFeedback("Listening...");
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, SpeechSDK.AudioConfig.fromDefaultMicrophoneInput());
    recognizerRef.current = recognizer;
    const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(sentences[currentSentenceIndex].content, SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark, SpeechSDK.PronunciationAssessmentGranularity.Phoneme, true);
    pronConfig.applyTo(recognizer);
    recognizer.startContinuousRecognitionAsync();
    recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const json = JSON.parse(e.result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult));
            if (json.NBest && json.NBest.length > 0) {
                const heardWords = json.NBest[0].Words;
                setTargetWordIndex(prev => {
                    if (prev >= wordStates.length) return prev;
                    if (heardWords.some(hw => hw.Word.toLowerCase() === wordStates[prev].clean)) {
                        setWordStates(ws => { const ns = [...ws]; ns[prev].status = 'done'; return ns; });
                        if (prev + 1 >= wordStates.length) { handleSentenceComplete(); return prev + 1; }
                        return prev + 1; 
                    }
                    return prev;
                });
            }
        }
    };
  };

  const stopListening = () => { setIsListening(false); if (recognizerRef.current) { recognizerRef.current.stopContinuousRecognitionAsync(() => { recognizerRef.current.close(); recognizerRef.current = null; }); } };

  const handleSentenceComplete = () => {
    stopListening(); const points = 100 / sentences.length;
    const newScore = Math.min(100, Math.round(score + points));
    setScore(newScore);
    setTimeout(async () => {
        if (currentSentenceIndex < sentences.length - 1) {
            setCurrentSentenceIndex(prev => prev + 1); prepareSentence(sentences[currentSentenceIndex + 1].content);
        } else { setScore(100); await saveProgress(unitId, 'word_by_word', 100, 100); setShowWin(true); }
    }, 1500);
  };

  if (isLoading) return <div className="min-h-screen bg-green-500 flex items-center justify-center text-white text-2xl font-black animate-pulse">READING...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 font-sans select-none overflow-hidden text-white">
      
      {/* UNIFIED HEADER PATTERN */}
      <div className="w-full p-6 flex items-center justify-between sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-emerald-600 shadow-[0_5px_0_#6ee7b7] active:translate-y-1 active:shadow-none transition-all"><FaArrowLeft size={20}/></button>
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

      {showWin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <motion.div initial={{scale:0}} animate={{scale:1}} className="bg-white text-slate-900 p-12 rounded-[3rem] text-center shadow-2xl border-b-[12px] border-slate-200">
            <FaStar className="text-8xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-4xl font-black uppercase text-emerald-600">Reading Master!</h1>
            <button onClick={() => navigate(-1)} className="mt-8 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl w-full uppercase shadow-[0_8px_0_#065f46]">Finish</button>
          </motion.div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl p-6">
        <motion.div key={sentences[currentSentenceIndex].id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-4 rounded-[3rem] shadow-2xl mb-12 flex items-center justify-center border-b-[12px] border-slate-200">
            {sentences[currentSentenceIndex].imageUrl ? (
                <img src={sentences[currentSentenceIndex].imageUrl} className="h-[250px] md:h-[400px] w-auto rounded-[2rem] object-contain" />
            ) : ( <div className="h-64 w-64 bg-slate-50 rounded-[2rem] flex items-center justify-center text-8xl shadow-inner">🖼️</div> )}
        </motion.div>

        <div className="bg-white/95 text-slate-800 rounded-[3rem] p-10 shadow-2xl w-full text-center min-h-[140px] flex flex-wrap justify-center items-center gap-6 mb-12 border-b-[12px] border-slate-200">
            {wordStates.map((word, i) => (
                <motion.span key={i} animate={{ scale: i === targetWordIndex ? 1.25 : 1, opacity: (word.status === 'done' || i === targetWordIndex) ? 1 : 0.3 }}
                    className={`text-4xl md:text-6xl font-black italic tracking-tighter ${word.status === 'done' ? 'text-green-600' : i === targetWordIndex ? 'text-blue-600 underline decoration-yellow-400 decoration-8' : 'text-slate-300'}`}>
                    {word.display}
                </motion.span>
            ))}
        </div>

        <h3 className="mb-8 text-2xl font-black uppercase tracking-tighter italic drop-shadow-md">{feedback}</h3>

        <button onClick={() => isListening ? stopListening() : startListening()} className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-2xl transition-all active:scale-95 border-4 border-white ${isListening ? 'bg-red-500' : 'bg-white text-emerald-600'}`}>
            {isListening ? <FaStop /> : <FaMicrophone className="animate-bounce" />}
        </button>
      </div>
    </div>
  );
};

export default WordByWord;