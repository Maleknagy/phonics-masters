import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVolumeUp, FaArrowLeft, FaCheckCircle, FaStar, FaSpinner } from 'react-icons/fa';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { db } from '../../supabaseClient';
import { saveProgress } from '../../utils/progressManager';
import { fireRandomCelebration } from '../../utils/confetti';

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';

const SentenceStream = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const [sentences, setSentences] = useState([]);
  const [globalPool, setGlobalPool] = useState([]); // Fallback for 8 choices
  const [currentSentence, setCurrentSentence] = useState(null);
  const [choices, setChoices] = useState([]);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [remainingIds, setRemainingIds] = useState([]);

  const synthesizerRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    loadGameData();
    return () => { if (synthesizerRef.current) synthesizerRef.current.close(); };
  }, [unitId]);

  const getImageUrl = (text) => {
    const filename = text.toLowerCase()
      .replace(/['’›]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `${supabaseUrl}/storage/v1/object/public/assets/${filename}.png`;
  };

  const loadGameData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await db.auth.getUser();
      
      // 1. Fetch current unit sentences
      const { data: unitData } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'sentence');
      
      // 2. Fetch some global sentences as "distractors" to ensure we always have 8 choices
      const { data: fallbackData } = await db.from('course_content').select('*').eq('category', 'sentence').limit(20);

      if (unitData && unitData.length > 0) {
        const mapped = unitData.map(item => ({
          id: item.id,
          text: item.content ? item.content.trim() : "",
          imageUrl: getImageUrl(item.content)
        }));

        const mappedFallback = (fallbackData || []).map(item => ({
          id: item.id,
          text: item.content ? item.content.trim() : "",
          imageUrl: getImageUrl(item.content)
        }));

        setSentences(mapped);
        setGlobalPool(mappedFallback);
        
        const { data: pData } = await db.from('user_progress').select('progress_percent').eq('user_id', user.id).eq('unit_id', unitId).eq('game_type', 'sentence-stream').maybeSingle();
        setScore(pData?.progress_percent || 0);

        const ids = mapped.map(s => s.id).sort(() => Math.random() - 0.5);
        setRemainingIds(ids.slice(1));
        setupRound(mapped, ids[0], mappedFallback);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const setupRound = (unitItems, targetId, fallbacks) => {
    const target = unitItems.find(s => s.id === targetId);
    setCurrentSentence(target);

    // Create choices: Target + 7 distractors
    let distractors = [...unitItems.filter(s => s.id !== targetId)];
    
    // If unit has less than 8 items, pull from fallbacks
    if (distractors.length < 7) {
      const additional = (fallbacks || globalPool).filter(f => f.id !== targetId && !distractors.some(d => d.id === f.id));
      distractors = [...distractors, ...additional];
    }

    const finalChoices = [target, ...distractors.slice(0, 7)].sort(() => Math.random() - 0.5);
    setChoices(finalChoices);
    setFeedback(null);

    // Auto-read audio
    setTimeout(() => speakAzure(target.text), 800);
  };

  const speakAzure = (text) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural"><prosody rate="0.75">${text}</prosody></voice></speak>`;
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizerRef.current = synthesizer;
    synthesizer.speakSsmlAsync(ssml, () => { setIsSpeaking(false); synthesizer.close(); }, () => { setIsSpeaking(false); synthesizer.close(); });
  };

  const handleGuess = async (selectedId) => {
    if (feedback || !currentSentence) return;
    const isCorrect = selectedId === currentSentence.id;
    const pointsChange = 100 / sentences.length;

    if (isCorrect) {
      setFeedback('correct');
      new Audio('/audio/correct.mp3').play().catch(()=>{});
      const newScore = Math.min(score + pointsChange, 100);
      setScore(newScore);
      await saveProgress(unitId, 'sentence-stream', newScore, newScore);

      setTimeout(() => {
        if (newScore >= 99.9) { 
          fireRandomCelebration(); 
          setShowWin(true);
        } else { nextQuestion(); }
      }, 1500);
    } else {
      setFeedback('wrong');
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      const penalizedScore = Math.max(score - pointsChange, 0);
      setScore(penalizedScore);
      await saveProgress(unitId, 'sentence-stream', penalizedScore, penalizedScore);
      setTimeout(() => nextQuestion(), 1500);
    }
  };

  const nextQuestion = () => {
    let pool = [...remainingIds];
    if (pool.length === 0) {
      pool = sentences.map(s => s.id).sort(() => Math.random() - 0.5);
    }
    const nextId = pool[0];
    setRemainingIds(pool.slice(1));
    setupRound(sentences, nextId, globalPool);
  };

  if (isLoading) return <div className="min-h-screen bg-emerald-500 flex items-center justify-center text-white font-black text-2xl animate-pulse uppercase italic">Syncing Stream...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-400 to-teal-600 p-4 md:p-8 font-sans select-none text-white overflow-hidden">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-emerald-600 shadow-sm active:translate-y-1 transition-all"><FaArrowLeft size={20} /></button>
        <div className="flex-1 mx-8 flex flex-col items-center">
          <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden">
            <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </div>
          <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{Math.round(score)}% Mastery</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-yellow-200 text-yellow-900">
          <FaStar size={24} /> <span className="text-2xl font-black">{Math.round(score)}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto text-center">
        {/* SPEAKER BUTTON */}
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => speakAzure(currentSentence?.text)} 
          disabled={isSpeaking} 
          className="bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl border-b-[12px] border-slate-200 mb-8 w-full text-emerald-600"
        >
          <div className="flex items-center gap-6 justify-center">
             <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center text-white shadow-lg ${isSpeaking ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}>
                {isSpeaking ? <FaSpinner className="animate-spin" size={30} /> : <FaVolumeUp size={30} />}
             </div>
             <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">Listen to the sentence</h2>
          </div>
        </motion.button>

        {/* 8-IMAGE GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {choices.map((choice) => (
            <motion.button 
              key={choice.id} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGuess(choice.id)} 
              className={`relative aspect-square bg-white rounded-[2.5rem] p-3 shadow-xl border-b-[8px] border-slate-200 overflow-hidden transition-all
                ${feedback === 'correct' && choice.id === currentSentence?.id ? 'ring-8 ring-green-400' : ''}
                ${feedback === 'wrong' && choice.id !== currentSentence?.id ? 'opacity-50' : ''}
              `}
            >
              <img 
                src={choice.imageUrl} 
                alt="Sentence visual" 
                className="w-full h-full object-contain"
                onError={(e) => e.target.src = "https://via.placeholder.com/200?text=?"}
              />
              <AnimatePresence>
                {feedback === 'correct' && choice.id === currentSentence?.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center text-white">
                    <FaCheckCircle size={60} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
        <p className="mt-6 font-black uppercase text-white/40 tracking-tighter italic">Tap the image that matches what you hear</p>
      </div>
    </div>
  );
};

export default SentenceStream;