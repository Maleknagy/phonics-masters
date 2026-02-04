import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaMicrophone, FaArrowLeft, FaStar, FaCut, FaCheck, FaVolumeUp, FaSpinner, FaFingerprint } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { saveProgress } from '../../utils/progressManager';
import { db } from '../../supabaseClient'; 

const SegmentationGame = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();

  const [wordList, setWordList] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState('CHOPPING'); 
  const [speakStep, setSpeakStep] = useState(0); 
  const [score, setScore] = useState(0);
  const [wrongChop, setWrongChop] = useState(false);
  const [micState, setMicState] = useState('IDLE'); 

  const recognizerRef = useRef(null);

  useEffect(() => {
    async function loadData() {
        setIsLoading(true);
        try {
            const { data: { user } } = await db.auth.getUser();
            if (!user) return;
            const { data } = await db.from('course_content').select('*').eq('unit_id', unitId).eq('category', 'decodable');
            if (data && data.length > 0) {
                const processed = data.map(item => {
                    const w = item.content.toLowerCase().trim();
                    const match = w.match(/[aeiouy]/);
                    const splitIndex = match ? match.index : 1; 
                    return { word: w, splitIndex, part1: w.slice(0, splitIndex), part2: w.slice(splitIndex) };
                });
                setWordList(processed);
            }
        } catch (e) { console.error("Data Load Error:", e); }
        setIsLoading(false);
    }
    loadData();
    return () => { if (recognizerRef.current) recognizerRef.current.close(); };
  }, [unitId]);

  const currentWord = wordList[wordIndex];

  const playPartAudio = (partType) => {
    if (!currentWord) return;
    let textToSpeak = partType === 'part1' ? currentWord.part1 : currentWord.part2;
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_KEY, import.meta.env.VITE_AZURE_REGION);
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural"><prosody rate="0.75">${textToSpeak}</prosody></voice></speak>`;
    synthesizer.speakSsmlAsync(ssml, () => synthesizer.close(), () => synthesizer.close());
  };

  const handleChopAttempt = (clickedIndex) => {
    if (clickedIndex + 1 === currentWord.splitIndex) {
      new Audio('/audio/slash.mp3').play().catch(()=>{}); 
      setGameState('ANIMATING');
      setTimeout(() => {
        setGameState('SPEAKING'); 
        setSpeakStep(0); 
        playPartAudio('part1');
      }, 1000);
    } else {
      new Audio('/audio/wrong.mp3').play().catch(()=>{});
      setWrongChop(true);
      setTimeout(() => setWrongChop(false), 500);
    }
  };

  // --- REWIRED MICROPHONE LOGIC ---
  const handleMicAction = async () => {
    if (micState !== 'IDLE') return;
    
    setMicState('LISTENING');
    
    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        import.meta.env.VITE_AZURE_KEY, 
        import.meta.env.VITE_AZURE_REGION
      );
      
      // Request fresh microphone access every time
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      let referenceText = speakStep === 0 ? currentWord.part1 : speakStep === 1 ? currentWord.part2 : currentWord.word;

      const pronConfig = new SpeechSDK.PronunciationAssessmentConfig(
          referenceText, 
          SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark, 
          SpeechSDK.PronunciationAssessmentGranularity.Phoneme, 
          true
      );
      pronConfig.applyTo(recognizer);

      // Using recognizeOnceAsync to ensure a clean start/stop cycle
      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const pronResult = SpeechSDK.PronunciationAssessmentResult.fromResult(result);
            console.log("Accuracy Score:", pronResult.accuracyScore);
            
            if (pronResult.accuracyScore >= 30) { // Lowered threshold for easier fetching
              handleSuccessStep();
            } else {
              setMicState('ERROR');
              new Audio('/audio/wrong.mp3').play().catch(()=>{});
              setTimeout(() => setMicState('IDLE'), 1500);
            }
          } else {
            console.warn("Speech not recognized:", result.errorDetails);
            setMicState('IDLE');
          }
          recognizer.close();
        },
        (err) => {
          console.error("Recognizer Error:", err);
          setMicState('IDLE');
          recognizer.close();
        }
      );
    } catch (err) {
      console.error("Mic Initialization Error:", err);
      setMicState('IDLE');
    }
  };

  const handleSuccessStep = async () => {
    setMicState('SUCCESS');
    new Audio('/audio/correct.mp3').play().catch(()=>{});

    if (speakStep === 0) {
        setTimeout(() => {
            setSpeakStep(1);
            setMicState('IDLE');
            playPartAudio('part2');
        }, 1200);
    } else if (speakStep === 1) {
        setTimeout(() => {
            setSpeakStep(2);
            setMicState('IDLE');
        }, 1200);
    } else {
        const points = 100 / wordList.length;
        const newScore = Math.min(100, Math.round(score + points));
        setScore(newScore);
        await saveProgress(unitId, 'segmentation', newScore, newScore);

        setTimeout(() => {
            if (wordIndex < wordList.length - 1) {
                setWordIndex(prev => prev + 1);
                setGameState('CHOPPING');
                setMicState('IDLE');
            } else { setGameState('WON'); }
        }, 1500);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-orange-500 flex items-center justify-center text-white font-black text-2xl animate-pulse italic">PREPARING NINJA...</div>;

  if (gameState === 'WON') return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center">
        <FaStar size={100} className="text-yellow-400 mb-4 animate-bounce" />
        <h1 className="text-5xl font-black text-orange-600 uppercase italic">Ninja Master!</h1>
        <button onClick={() => navigate(-1)} className="mt-8 bg-orange-500 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_#9a3412] active:translate-y-1 transition-all uppercase">Finish</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-600 flex flex-col items-center relative font-sans text-white select-none">
      
      {/* HEADER */}
      <div className="w-full p-6 flex items-center justify-between bg-white/10 backdrop-blur-md border-b-2 border-white/20">
        <button onClick={() => navigate(-1)} className="bg-white p-4 rounded-2xl text-orange-600 shadow-sm transition-all"><FaArrowLeft size={20}/></button>
        <div className="flex-1 px-8 flex flex-col items-center">
           <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
              <motion.div animate={{ width: `${score}%` }} className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
           </div>
           <span className="text-[10px] font-black text-white uppercase tracking-widest mt-2">{Math.round(score)}% Mastery</span>
        </div>
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-yellow-200 text-yellow-900">
          <FaStar size={24} />
          <span className="text-2xl font-black">{Math.round(score)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl z-10">
        {(gameState === 'CHOPPING' || gameState === 'ANIMATING') && (
          <motion.div animate={wrongChop ? { x: [-10, 10, -10, 10, 0] } : {}} className="flex text-7xl md:text-9xl font-black">
            {currentWord.word.split('').map((char, index) => (
              <React.Fragment key={index}>
                <motion.span 
                  animate={gameState === 'ANIMATING' ? { x: index < currentWord.splitIndex ? -120 : 120, opacity: 0, rotate: index < currentWord.splitIndex ? -15 : 15 } : { x: 0 }}
                  className="bg-white text-orange-600 px-6 py-4 rounded-3xl shadow-xl mx-2 italic uppercase"
                >
                  {char}
                </motion.span>
                {index < currentWord.word.length - 1 && gameState === 'CHOPPING' && (
                  <button onClick={() => handleChopAttempt(index)} className="w-16 h-32 flex items-center justify-center transition -mx-4 group">
                    <FaCut className="text-white/40 group-hover:text-yellow-300 group-hover:scale-150 transition-all text-4xl" />
                  </button>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        )}

        {gameState === 'SPEAKING' && (
          <div className="flex flex-col items-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1.2 }} className="flex items-center gap-8 text-7xl md:text-9xl font-black mb-16 italic">
              {speakStep < 2 ? (
                <>
                  <span className={speakStep === 0 ? "text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" : "text-white/20"}>{currentWord.part1}</span>
                  <div className="w-2 h-20 bg-white/20 rotate-12 rounded-full"></div>
                  <span className={speakStep === 1 ? "text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" : "text-white/20"}>{currentWord.part2}</span>
                </>
              ) : (
                <span className="text-white bg-white/10 px-12 py-6 rounded-[3rem] border-4 border-white/20 shadow-2xl uppercase">{currentWord.word}</span>
              )}
            </motion.div>

            <div className="flex items-center gap-10">
                <button onClick={() => speakStep < 2 && playPartAudio(speakStep === 0 ? 'part1' : 'part2')} className={`w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center border-b-4 border-black/20 ${speakStep === 2 ? 'opacity-20' : 'hover:bg-white/30'}`}>
                  <FaVolumeUp size={40} />
                </button>

                {/* SIMPLE CLICK BUTTON - Fixes touch/mouse release issues */}
                <button
                    onClick={handleMicAction}
                    className={`w-36 h-36 rounded-full flex items-center justify-center text-7xl shadow-2xl transition-all active:scale-90 border-4 border-white
                        ${micState === 'LISTENING' ? 'bg-blue-500 animate-pulse' : micState === 'SUCCESS' ? 'bg-green-500' : 'bg-white text-orange-600'}`}
                >
                    {micState === 'LISTENING' ? <FaMicrophone /> : micState === 'PROCESSING' ? <FaSpinner className="animate-spin" /> : micState === 'SUCCESS' ? <FaCheck /> : <FaFingerprint />}
                </button>
            </div>
            <p className="mt-10 font-black uppercase tracking-tighter text-xl italic opacity-80">
               {micState === 'LISTENING' ? "Listening..." : "Tap the button and say the yellow part!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentationGame;