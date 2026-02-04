import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar, FaRedo, FaPlay, FaVolumeUp, FaCheck, FaCircle, FaImages } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';

// --- CONFIGURATION ---
const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibXN3a2x0aXFlcHdjeW53Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzAzNzgsImV4cCI6MjA4MzMwNjM3OH0.fVB4f7KIoDdznFgnQ9ZDjr7W4fxk2dJpmu_fStPZ6_s';
const db = createClient(supabaseUrl, supabaseKey);

// --- HELPER: SHUFFLE ARRAY ---
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const SentenceMatcher = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  // STATE
  const [rawData, setRawData] = useState([]);
  const [gridItems, setGridItems] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [matchedIds, setMatchedIds] = useState([]);  
  const [score, setScore] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wrongShake, setWrongShake] = useState(null); 
  
  // Voice Status
  const [voiceStatus, setVoiceStatus] = useState("checking");

  const progressRef = useRef(0);
  useEffect(() => { progressRef.current = currentIndex; }, [currentIndex]);

  // --- SAVE PROGRESS ---
  useEffect(() => {
    return () => {
        if (questionQueue.length > 0 && progressRef.current > 0 && progressRef.current < questionQueue.length) {
            const percent = Math.round((progressRef.current / questionQueue.length) * 100);
            saveProgress(unitId, 'word_matter', percent, 100);
        }
    };
  }, [unitId, questionQueue.length]);

  // --- INIT: Fetch Sentences ---
  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        const { data: { user } } = await db.auth.getUser();
        const userId = user ? user.id : "dev-test-user";

        // Fetch sentences
        const { data, error } = await db
            .from('course_content')
            .select('*')
            .eq('unit_id', unitId)
            .in('category', ['sentence', 'word_matter']); // Support both tags

        if (error) {
            console.error("DB Error:", error);
            setIsLoading(false);
            return;
        }

        if (data && data.length > 0) {
            // Map to standard format
            const processed = data.map(item => ({
                id: item.id,
                text: item.content,
                image: item.image
            })).filter(i => i.image); // Ensure images exist
            
            // Limit to 9 items max for a 3x3 grid
            const limited = processed.slice(0, 9);
            setRawData(limited);
            setGridItems(limited); // Static grid

            // Calculate Score Per Item
            const pointsPerItem = 100 / limited.length;

            // Resume Progress
            const { data: pData } = await db
                .from('user_progress')
                .select('progress_percent')
                .eq('user_id', userId)
                .eq('unit_id', unitId)
                .eq('game_type', 'word_matter')
                .maybeSingle();

            if (pData && pData.progress_percent > 0 && pData.progress_percent < 100) {
                const startIdx = Math.floor((pData.progress_percent / 100) * limited.length);
                // We need to simulate the "Done" state for previous items
                // This is tricky with shuffle, so for this game type, we usually restart the queue 
                // OR we just set the score and start fresh queue to keep it simple.
                setScore(startIdx * pointsPerItem);
            }
        } else {
             // Fallback
        }
        setIsLoading(false);
    }
    loadData();
  }, [unitId]);

  // Derived State
  const currentTarget = questionQueue[currentIndex];

  // --- AUDIO MANAGER (AZURE) ---
  const speakWithAzure = (text) => {
    const speechKey = import.meta.env.VITE_AZURE_KEY;
    const speechRegion = import.meta.env.VITE_AZURE_REGION;

    if (!speechKey || !speechRegion) {
        setVoiceStatus("fallback");
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; 
        window.speechSynthesis.speak(u);
        return;
    }

    try {
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural"; 

        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
        synthesizer.speakTextAsync(
            text, 
            result => {
                if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                    setVoiceStatus("azure");
                } else {
                    setVoiceStatus("fallback");
                }
                synthesizer.close();
            },
            () => {
                setVoiceStatus("fallback");
                synthesizer.close();
            }
        );
    } catch (e) {
        setVoiceStatus("fallback");
    }
  };

  const playSfx = (type) => {
    const sfx = new Audio(type === 'correct' ? '/audio/correct.mp3' : '/audio/wrong.mp3');
    sfx.play().catch(() => {});
  };

  // --- GAMEPLAY ---
  const startGame = () => {
    setScore(0);
    setCurrentIndex(0);
    setMatchedIds([]);
    setIsPlaying(true);
    setShowWin(false);
    
    // RE-SHUFFLE
    // 1. Grid stays static or shuffles once
    const newGrid = shuffleArray(rawData);
    setGridItems(newGrid);

    // 2. Questions queue is shuffled
    const newQuestions = shuffleArray(rawData);
    setQuestionQueue(newQuestions);

    // Play first sentence
    if (newQuestions.length > 0) {
        setTimeout(() => speakWithAzure(newQuestions[0].text), 1000);
    }
  };

  const handleImageClick = (item) => {
    if (!isPlaying || matchedIds.includes(item.id)) return;

    if (item.id === currentTarget.id) {
        // CORRECT
        playSfx('correct');
        setMatchedIds(prev => [...prev, item.id]);
        
        // Dynamic Scoring
        const points = 100 / questionQueue.length;
        setScore(s => s + points);

        if (currentIndex + 1 < questionQueue.length) {
            setCurrentIndex(prev => prev + 1);
            // Play next audio
            setTimeout(() => {
                speakWithAzure(questionQueue[currentIndex + 1].text);
            }, 1500);
        } else {
            // WIN
            setTimeout(async () => {
                await saveProgress(unitId, 'word_matter', 100, 100);
                setShowWin(true);
                setIsPlaying(false);
            }, 1000);
        }
    } else {
        // WRONG
        playSfx('wrong');
        setWrongShake(item.id);
        setTimeout(() => setWrongShake(null), 500);
        
        // Re-read the sentence to help them
        speakWithAzure(currentTarget.text);
    }
  };

  const repeatAudio = () => {
    if (currentTarget) speakWithAzure(currentTarget.text);
  };

  if (isLoading) return <div className="min-h-screen bg-teal-50 flex items-center justify-center text-teal-900 text-2xl">Loading Matcher...</div>;
  if (!rawData.length) return <div className="min-h-screen bg-teal-50 flex items-center justify-center text-teal-900">No content found!</div>;

  return (
    <div className="min-h-screen bg-teal-500 flex flex-col items-center relative overflow-hidden font-sans text-slate-800 select-none">
      
      {/* Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between z-20">
        <button onClick={() => navigate(-1)} className="bg-white p-3 rounded-full hover:bg-teal-100 transition shadow"><FaArrowLeft /></button>
        <div className="font-bold text-xl bg-white px-6 py-2 rounded-full shadow">Score: {Math.round(score)}</div>
      </div>

      {/* START OVERLAY */}
      {!isPlaying && !showWin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl text-center max-w-md shadow-2xl">
            <div className="text-6xl mb-4">👂</div>
            <h1 className="text-3xl font-black mb-2">Word Matter</h1>
            <p className="text-slate-500 mb-8">Listen to the sentence and tap the matching picture!</p>
            <button onClick={startGame} className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-xl w-full hover:scale-105 transition"><FaPlay className="inline mr-2" /> Start Listening</button>
          </div>
        </div>
      )}

      {/* WIN OVERLAY */}
      {showWin && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-3xl text-center max-w-md shadow-2xl">
            <FaStar className="text-6xl text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-black mb-2">Great Listening!</h1>
            <p className="text-xl mb-6 text-gray-500">Score: {Math.round(score)}</p>
            <button onClick={startGame} className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold text-xl w-full hover:scale-105 transition"><FaRedo className="inline mr-2" /> Play Again</button>
          </div>
        </div>
      )}

      {/* GAME AREA */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl z-10 px-4 pt-20 pb-8">
          
          {/* AUDIO CONTROL BAR */}
          {isPlaying && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={repeatAudio}
                className="mb-8 bg-white text-teal-700 px-8 py-4 rounded-full flex items-center gap-3 text-xl font-bold shadow-lg hover:bg-teal-50 hover:scale-105 transition active:scale-95"
              >
                  <FaVolumeUp className="text-2xl animate-pulse" />
                  <span>Listen Again</span>
              </motion.button>
          )}

          {/* GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl">
              {gridItems.map((item) => {
                  const isMatched = matchedIds.includes(item.id);
                  const isWrong = wrongShake === item.id;
                  
                  return (
                      <motion.div
                        key={item.id}
                        whileHover={!isMatched ? { scale: 1.05 } : {}}
                        whileTap={!isMatched ? { scale: 0.95 } : {}}
                        animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                        onClick={() => handleImageClick(item)}
                        className={`relative bg-white rounded-2xl border-4 shadow-md overflow-hidden cursor-pointer transition-all aspect-[4/3]
                            ${isMatched ? 'border-green-500 opacity-50 ring-4 ring-green-200 grayscale' : 'border-white hover:border-teal-300'}
                            ${isWrong ? 'border-red-500 bg-red-50' : ''}`}
                      >
                          {item.image ? (
                              <img 
                                src={`${supabaseUrl}/storage/v1/object/public/assets/${item.image}`} 
                                alt="Match option" 
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                          ) : null}
                          
                          <div className="hidden absolute inset-0 items-center justify-center text-4xl text-slate-200" 
                               style={{ display: item.image ? 'none' : 'flex' }}>
                               🖼️
                          </div>

                          {/* MATCHED BADGE */}
                          {isMatched && (
                              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-[1px]">
                                  <div className="bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-xl">
                                      <FaCheck />
                                  </div>
                              </div>
                          )}
                      </motion.div>
                  );
              })}
          </div>

           {/* Debug Voice Status */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs bg-black/10 px-3 py-1 rounded-full text-white">
            {voiceStatus === 'azure' && <><FaCircle className="text-green-400" /> Azure</>}
            {voiceStatus === 'fallback' && <><FaCircle className="text-red-400" /> Robot</>}
            </div>

      </div>
    </div>
  );
};

export default SentenceMatcher;