import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaStar, FaMicrophone, FaCheckCircle, FaChevronRight, FaLock, FaStop, FaTimesCircle, FaImage } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient';

const StoryRecorder = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  
  const [stories, setStories] = useState([]);
  const [totalLinesCount, setTotalLinesCount] = useState(0);
  const [pointsPerLine, setPointsPerLine] = useState(0);
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [gameState, setGameState] = useState('LOADING'); 
  const [isListening, setIsListening] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [transcript, setTranscript] = useState(""); 
  const [mistakes, setMistakes] = useState([]);
  const [imgError, setImgError] = useState(false);

  const recognitionRef = useRef(null);
  const PROJECT_ID = "mbmswkltiqepwcynwgfr"; 
  const STORAGE_BASE = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/assets/`;

  useEffect(() => {
    async function initGame() {
      try {
        const { data: { user } } = await db.auth.getUser();
        const { data: content } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'story');
        
        if (content && content.length > 0) {
          let totalLines = 0;
          content.forEach(story => {
            const linesInStory = story.content.split('<br>').filter(l => l.trim() !== "").length;
            totalLines += linesInStory;
          });

          setTotalLinesCount(totalLines);
          setPointsPerLine(100 / totalLines);
          setStories(content);

          const { data: pData } = await db.from('user_progress').select('*').eq('user_id', user.id).eq('unit_id', unitId);
          if (pData) {
            const gameProg = pData.find(p => p.game_type === 'story-recorder');
            setPoints(Math.min(100, gameProg?.progress_percent || 0));
          }
          setGameState('READING');
        } else { setGameState('ERROR'); }
      } catch (err) { setGameState('ERROR'); }
    }
    initGame();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => { setIsListening(true); setHasPassed(false); setMistakes([]); };
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript.toLowerCase());
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [unitId]);

  const story = stories[currentStoryIndex];
  const clean = (str) => str?.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').trim() || "";
  const lines = story ? story.content.split('<br>').map(clean).filter(l => l !== "") : [];

  const evaluateReading = () => {
    if (recognitionRef.current) recognitionRef.current.stop();

    const targetLine = lines[currentLineIndex].toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    const spokenWords = transcript.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").split(' ');
    const targetWords = targetLine.split(' ');

    const missed = targetWords.filter(word => !spokenWords.includes(word));
    
    if (missed.length <= Math.floor(targetWords.length * 0.25)) {
      setHasPassed(true);
      setMistakes([]);
      const newPts = Math.min(100, points + pointsPerLine);
      setPoints(newPts);
      saveProgress(unitId, 'story-recorder', Math.round(newPts), Math.round(newPts));
      new Audio('/audio/correct.mp3').play().catch(()=>{});
    } else {
      setMistakes(missed);
      setHasPassed(false);
      const newPts = Math.max(0, points - pointsPerLine);
      setPoints(newPts);
      saveProgress(unitId, 'story-recorder', Math.round(newPts), Math.round(newPts));
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) evaluateReading();
    else { setTranscript(""); setMistakes([]); recognitionRef.current.start(); }
  };

  const handleNextLine = () => {
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(p => p + 1);
      setHasPassed(false); setTranscript(""); setMistakes([]);
    } else {
      if (points >= 99.9) {
        setGameState('FINISHED');
      } else {
        const nextStoryIdx = (currentStoryIndex + 1) % stories.length;
        setCurrentStoryIndex(nextStoryIdx);
        setCurrentLineIndex(0);
        setHasPassed(false); setTranscript(""); setMistakes([]); setImgError(false);
      }
    }
  };

  if (gameState === 'LOADING') return <div className="h-screen bg-slate-900 flex items-center justify-center text-white text-2xl font-black italic">LOADING...</div>;

  return (
    <div className="h-screen bg-indigo-50 font-sans text-slate-800 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="w-full p-2 px-4 flex items-center justify-between bg-white shadow-sm z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-6">
           <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${points}%` }} className="h-full bg-indigo-500 shadow-inner" />
           </div>
        </div>
        <div className="flex items-center gap-2 text-indigo-600 font-black">
          <FaStar size={16}/> <span>{Math.round(points)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'FINISHED' ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-[3rem] shadow-xl text-center border-b-8 border-slate-200">
               <FaCheckCircle className="text-green-500 text-7xl mb-4 mx-auto" />
               <h2 className="text-3xl font-black uppercase italic mb-6">Story Star!</h2>
               <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-xl font-black uppercase shadow-lg active:translate-y-1">Claim Stars</button>
            </motion.div>
          ) : (
            <div className="w-full max-w-2xl flex flex-col items-center h-full max-h-[85vh]">
              
              {/* IMAGE AREA - Auto-fits image content */}
              <div className="inline-block bg-white p-2 rounded-[2rem] shadow-md border-2 border-white mb-4 overflow-hidden flex-shrink">
                 <img 
                  key={story?.image}
                  src={`${STORAGE_BASE}${encodeURIComponent(story?.image.replace(/,/g, '.'))}?t=${new Date().getTime()}`} 
                  alt="" 
                  className="max-h-[25vh] w-auto object-contain rounded-[1.5rem]"
                  onError={(e) => { e.target.style.display = 'none'; setImgError(true); }}
                 />
                 {imgError && <FaImage className="text-slate-200 text-5xl m-8" />}
              </div>

              {/* STORY CARD */}
              <div className="bg-white w-full p-6 md:p-8 rounded-[3rem] shadow-lg border-b-[10px] border-slate-200 flex flex-col overflow-hidden">
                  
                  {/* ENLARGED GRADIENT TITLE */}
                  <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-center mb-4 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent drop-shadow-sm">
                      {clean(story?.title)}
                  </h2>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 px-2 mb-4 scrollbar-hide">
                      {lines.map((line, idx) => (
                          <motion.p 
                              key={`${currentStoryIndex}-${idx}`}
                              animate={{ 
                                opacity: idx === currentLineIndex ? 1 : 0.1, 
                                scale: idx === currentLineIndex ? 1.02 : 1,
                                color: idx === currentLineIndex ? (hasPassed ? "#16a34a" : mistakes.length > 0 ? "#ef4444" : "#1e293b") : "#94a3b8"
                              }}
                              className="text-lg md:text-xl font-bold leading-tight text-center"
                          >
                              {line}
                          </motion.p>
                      ))}
                  </div>

                  {/* FEEDBACK OVERLAY */}
                  <div className="h-14 flex items-center justify-center mb-2">
                    <AnimatePresence mode="wait">
                      {mistakes.length > 0 && !isListening && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-black text-xs uppercase flex flex-wrap justify-center gap-1">
                          Try again: {mistakes.join(", ")}
                        </motion.div>
                      )}
                      {isListening && (
                        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-indigo-400 font-black italic text-sm">
                          "{transcript || "Listening..."}"
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CONTROLS */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-3xl">
                      <button 
                        onClick={toggleMic} 
                        className={`p-4 rounded-2xl shadow-md active:scale-95 transition-all ${isListening ? 'bg-red-500 animate-pulse' : hasPassed ? 'bg-green-500' : 'bg-indigo-600'} text-white`}
                      >
                          {isListening ? <FaStop size={24} /> : hasPassed ? <FaCheckCircle size={24} /> : <FaMicrophone size={24} />}
                      </button>

                      <button 
                          onClick={handleNextLine}
                          disabled={!hasPassed}
                          className={`px-8 py-4 rounded-2xl font-black uppercase flex items-center gap-3 transition-all text-lg ${hasPassed ? 'bg-orange-500 text-white shadow-[0_5px_0_#c2410c] active:translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                          {!hasPassed && <FaLock size={14} />}
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

export default StoryRecorder;