import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar, FaVolumeUp } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateActivityProgress } from '../../redux/slices/progressSlice';

const DictationStation = ({ unit, onBack, activityName }) => {
  const dispatch = useDispatch();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [stars, setStars] = useState(0);

  const decodableWords = unit.decodableWords || [];
  const currentWord = decodableWords[currentWordIndex];

  const playAudio = () => {
    if (currentWord?.audioUrl) {
      const audio = new Audio(currentWord.audioUrl);
      audio.play().catch(err => console.log('Audio error:', err));
    } else {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (userInput.toLowerCase().trim() === currentWord.word.toLowerCase()) {
      setScore(score + 10);
      toast.success('🎉 Correct!');
      
      setTimeout(() => {
        if (currentWordIndex < decodableWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setUserInput('');
        } else {
          completeActivity();
        }
      }, 1000);
    } else {
      toast.error(`Try again! The word was "${currentWord.word}"`);
      setUserInput('');
    }
  };

  const completeActivity = () => {
    const totalPossible = decodableWords.length * 10;
    const percentage = (score / totalPossible) * 100;
    
    let earnedStars = 0;
    if (percentage >= 90) earnedStars = 3;
    else if (percentage >= 70) earnedStars = 2;
    else if (percentage >= 50) earnedStars = 1;

    setStars(earnedStars);
    setIsComplete(true);

    dispatch(updateActivityProgress({
      unitId: unit._id,
      activityName: activityName,
      score: score,
      stars: earnedStars,
      completed: true
    }));
  };

  if (isComplete) {
    return (
      <CompletionScreen score={score} stars={stars} onBack={onBack} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender to-purple-400 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-white text-xl kid-font font-bold">
          <FaArrowLeft /> <span>Back</span>
        </button>
        <div className="bg-white rounded-full px-6 py-3 shadow-lg">
          <span className="text-2xl font-bold kid-font">Score: {score}</span>
        </div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-6 mb-8 max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl font-black kid-font text-gray-800 mb-3">
          🎤 Listen and Type! 🎤
        </h2>
        <p className="text-xl text-gray-600">
          Listen carefully and type what you hear!
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-xl mx-auto">
        {/* Audio Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={playAudio}
          className="w-48 h-48 bg-gradient-to-br from-coral to-red-400 rounded-full mx-auto mb-8 flex items-center justify-center cursor-pointer shadow-2xl"
        >
          <FaVolumeUp className="text-8xl text-white" />
        </motion.div>

        {/* Image Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center mb-6"
        >
          <img
            src={currentWord.imageUrl}
            alt="Hint"
            className="w-32 h-32 object-contain mx-auto opacity-30 blur-sm"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <p className="text-white kid-font text-sm mt-2">
            (Hint: Look at the blurred picture!)
          </p>
        </motion.div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type the word here..."
            className="w-full px-8 py-6 text-3xl text-center kid-font rounded-2xl border-4 border-white shadow-xl focus:outline-none focus:border-success"
            autoFocus
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full btn-success text-2xl kid-font"
          >
            Check Answer ✓
          </motion.button>
        </form>

        {/* Progress */}
        <div className="text-center mt-8">
          <p className="text-white text-2xl kid-font font-bold">
            Word {currentWordIndex + 1} of {decodableWords.length}
          </p>
        </div>
      </div>
    </div>
  );
};

// Completion Screen
const CompletionScreen = ({ score, stars, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-success to-green-400 flex items-center justify-center">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="bg-white rounded-3xl shadow-2xl p-12 text-center"
    >
      <div className="text-9xl mb-6">🎉</div>
      <h2 className="text-5xl font-black kid-font text-gray-800 mb-4">Excellent Listening!</h2>
      <div className="flex justify-center space-x-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <FaStar
            key={i}
            className={`text-6xl ${i < stars ? 'text-sunshineYellow' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <p className="text-3xl font-bold kid-font text-primary-600 mb-8">Score: {score}</p>
      <motion.button
        whileHover={{ scale: 1.1 }}
        onClick={onBack}
        className="btn-primary text-2xl kid-font"
      >
        Back to Activities
      </motion.button>
    </motion.div>
  </div>
);

export default DictationStation;
