import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaVolumeUp, FaCheckCircle, FaChevronRight, FaLock, FaImage, FaSpinner } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const StoryReader = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  
  const [stories, setStories] = useState([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [gameState, setGameState] = useState('LOADING'); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [imgError, setImgError] = useState(null);

  const synthesizerRef = useRef(null);
  const STORAGE_BASE = `https://mbmswkltiqepwcynwgfr.supabase.co/storage/v1/object/public/assets/`;

  useEffect(() => {
    async function loadStories() {
      try {
        const { data: { user } } = await db.auth.getUser();
        const { data: content } = await db.from('course_content')
          .select('*')
          .eq('unit_id', unitId)
          .eq('category', 'story');
        
        if (content && content.length > 0) {
          setStories(content);
          const { data: pData } = await db.from('user_progress').select('*').eq('user_id', user.id).eq('unit_id', unitId);
          if (pData) {
            const gameProg = pData.find(p => p.game_type === 'story');
            setPoints(gameProg?.progress_percent || 0);
          }
          setGameState('READING');
        } else { setGameState('ERROR'); }
      } catch (err) { setGameState('ERROR'); }
    }
    loadStories();
    return () => { if (synthesizerRef.current) synthesizerRef.current.close(); };
  }, [unitId]);

  const story = stories[currentStoryIndex];
  const clean = (str) => !str ? "" : str.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').trim();
  const lines = story ? story.content.split('<br>').map(clean).filter(l => l !== "") : [];

  const getImageUrl = (imageName) => {
    if (!imageName) return "";
    let cleanName = imageName.replace(/['"]+/g, '').replace(/,/g, '.').trim();
    return `${STORAGE_BASE}${encodeURIComponent(cleanName)}`;
  };

  // --- AZURE SPEECH ENGINE ---
  const speakAzure = async (text) => {
    if (isSpeaking) return;
    setIsSpeaking(true);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      import.meta.env.VITE_AZURE_KEY, 
      import.meta.env.VITE_AZURE_REGION
    );
    
    // Child-friendly, slow, clear voice
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="en-US-JennyNeural">
          <prosody rate="0.65" pitch="+10%">
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
        setHasListened(true);
        synthesizer.close();
      },
      error => {
        setIsSpeaking(false);
        setHasListened(true); // Fallback to allow progress
        synthesizer.close();
      }
    );
  };

  if (gameState === 'LOADING') return <div className="h-screen bg-white flex items-center justify-center font-black text-orange-500 animate-pulse">SYNCING STORY...</div>;

  return (
    <div className="h-screen bg-orange-50 font-sans text-slate-800 flex flex-col overflow-hidden">
      
      {/* COMPACT HEADER */}
      <div className="w-full p-2 px-4 flex items-center justify-between bg-white shadow-sm z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-orange-500 transition-colors"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-6">
           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${points}%` }} className="h-full bg-orange-400" />
           </div>
        </div>
        <div className="flex items-center gap-2 text-orange-600 font-black">
          <FaStar size={16}/> <span>{points}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'FINISHED' ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[3rem] shadow-xl text-center border-b-8 border-slate-200">
               <FaCheckCircle className="text-green-500 text-7xl mb-4 mx-auto" />
               <h2 className="text-3xl font-black uppercase italic mb-6">Chapter Complete!</h2>
               <button onClick={() => navigate(-1)} className="bg-orange-500 text-white px-10 py-4 rounded-2xl text-xl font-black uppercase shadow-lg active:translate-y-1">Claim Rewards</button>
            </motion.div>
          ) : (
            <div className="w-full max-w-2xl flex flex-col items-center h-full max-h-[85vh]">
              
              {/* IMAGE CONTAINER - Auto-fits image content */}
              <div className="inline-block bg-white p-2 rounded-[2rem] shadow-md border-2 border-white mb-4 overflow-hidden flex-shrink">
                 <img 
                  key={story?.image}
                  src={getImageUrl(story?.image)} 
                  alt="" 
                  className="max-h-[30vh] w-auto object-contain rounded-[1.5rem]"
                  onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
                 />
                 {imgError && <FaImage className="text-slate-200 text-5xl m-8" />}
              </div>

              {/* STORY CARD - Adjusted for No-Scroll */}
              <div className="bg-white w-full p-6 md:p-8 rounded-[3rem] shadow-lg border-b-[10px] border-slate-200 flex flex-col overflow-hidden">
                  <h2 className="text-orange-500 font-black italic text-xl mb-4 text-center uppercase tracking-tight">
                      {clean(story?.title)}
                  </h2>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 px-2 mb-4 scrollbar-hide">
                      {lines.map((line, idx) => (
                          <motion.p 
                              key={`${currentStoryIndex}-${idx}`}
                              animate={{ 
                                opacity: idx === currentLineIndex ? 1 : 0.1, 
                                scale: idx === currentLineIndex ? 1.02 : 1,
                                color: idx === currentLineIndex ? "#1e293b" : "#94a3b8"
                              }}
                              transition={{ duration: 0.4 }}
                              className="text-lg md:text-xl font-bold leading-tight"
                          >
                              {line}
                          </motion.p>
                      ))}
                  </div>

                  {/* CONTROLS */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-3xl">
                      <button 
                        onClick={() => speakAzure(lines[currentLineIndex])} 
                        disabled={isSpeaking}
                        className={`p-4 rounded-2xl shadow-md active:scale-95 flex items-center gap-3 transition-all ${isSpeaking ? 'bg-orange-100 text-orange-400' : 'bg-slate-800 text-white'}`}
                      >
                          {isSpeaking ? <FaSpinner className="animate-spin" size={24} /> : <FaVolumeUp size={24} />}
                          <span className="font-black uppercase text-xs tracking-widest hidden sm:inline">Listen</span>
                      </button>

                      <button 
                          onClick={() => {
                              if (currentLineIndex < lines.length - 1) {
                                  setCurrentLineIndex(prev => prev + 1);
                                  setHasListened(false);
                              } else {
                                  const nextPts = Math.min(100, points + 10);
                                  setPoints(nextPts);
                                  saveProgress(unitId, 'story', nextPts, nextPts);
                                  if (nextPts >= 100) setGameState('FINISHED');
                                  else { 
                                    setCurrentStoryIndex(p => (p + 1) % stories.length); 
                                    setCurrentLineIndex(0); 
                                    setHasListened(false); 
                                  }
                              }
                          }}
                          disabled={!hasListened || isSpeaking}
                          className={`px-8 py-4 rounded-2xl font-black uppercase flex items-center gap-3 transition-all text-lg ${hasListened && !isSpeaking ? 'bg-orange-500 text-white shadow-[0_5px_0_#c2410c] active:translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                          {!hasListened && <FaLock size={14} />}
                          {currentLineIndex === lines.length - 1 ? "Finish" : "Next"}
                          <FaChevronRight />
                      </button>
                  </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoryReader;