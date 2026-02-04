import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar, FaPlay, FaPause } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateActivityProgress } from '../../redux/slices/progressSlice';

const KaraokeReader = ({ unit, onBack, activityName }) => {
  const dispatch = useDispatch();
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [stars, setStars] = useState(0);

  const sentences = unit.sentences || [];
  const currentSentence = sentences[currentSentenceIndex];

  useEffect(() => {
    if (isPlaying && currentWordIndex < currentSentence.text.split(' ').length) {
      const timer = setTimeout(() => {
        setCurrentWordIndex(currentWordIndex + 1);
      }, 800); // Highlight each word for 800ms

      return () => clearTimeout(timer);
    } else if (isPlaying && currentWordIndex >= currentSentence.text.split(' ').length) {
      handleSentenceComplete();
    }
  }, [isPlaying, currentWordIndex]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentWordIndex(0);
    
    if (currentSentence?.audioUrl) {
      const audio = new Audio(currentSentence.audioUrl);
      audio.play().catch(err => console.log('Audio error:', err));
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSentenceComplete = () => {
    setIsPlaying(false);
    setScore(score + 10);
    toast.success('Great reading! 🎵');

    setTimeout(() => {
      if (currentSentenceIndex < sentences.length - 1) {
        setCurrentSentenceIndex(currentSentenceIndex + 1);
        setCurrentWordIndex(0);
      } else {
        completeActivity();
      }
    }, 2000);
  };

  const completeActivity = () => {
    const totalPossible = sentences.length * 10;
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
    return <CompletionScreen score={score} stars={stars} onBack={onBack} />;
  }

  const words = currentSentence.text.split(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-softGreen to-teal-400 p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-white text-xl kid-font font-bold">
          <FaArrowLeft /> <span>Back</span>
        </button>
        <div className="bg-white rounded-full px-6 py-3 shadow-lg">
          <span className="text-2xl font-bold kid-font">Score: {score}</span>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-6 mb-8 max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl font-black kid-font text-gray-800 mb-3">
          🎵 Karaoke Reader! 🎵
        </h2>
        <p className="text-xl text-gray-600">
          Follow along and read the highlighted words!
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        {/* Sentence Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 mb-8"
        >
          <div className="text-center space-x-3 flex flex-wrap justify-center">
            {words.map((word, index) => (
              <motion.span
                key={index}
                animate={{
                  scale: index === currentWordIndex ? 1.2 : 1,
                  color: index === currentWordIndex ? '#10b981' : '#1f2937',
                }}
                className={`text-5xl kid-font font-bold inline-block mb-4 ${
                  currentSentence.wordsToHighlight?.includes(word.toLowerCase())
                    ? 'text-primary-600'
                    : 'text-gray-800'
                } ${index === currentWordIndex ? 'underline' : ''}`}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center space-x-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlay}
            disabled={isPlaying}
            className={`${
              isPlaying ? 'bg-gray-400' : 'bg-success'
            } text-white px-12 py-6 rounded-full font-bold kid-font text-2xl shadow-lg flex items-center space-x-3`}
          >
            <FaPlay /> <span>Play</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePause}
            disabled={!isPlaying}
            className={`${
              !isPlaying ? 'bg-gray-400' : 'bg-coral'
            } text-white px-12 py-6 rounded-full font-bold kid-font text-2xl shadow-lg flex items-center space-x-3`}
          >
            <FaPause /> <span>Pause</span>
          </motion.button>
        </div>

        {/* Progress */}
        <div className="text-center mt-8">
          <p className="text-white text-2xl kid-font font-bold">
            Sentence {currentSentenceIndex + 1} of {sentences.length}
          </p>
        </div>
      </div>
    </div>
  );
};

const CompletionScreen = ({ score, stars, onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-success to-green-400 flex items-center justify-center">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="bg-white rounded-3xl shadow-2xl p-12 text-center"
    >
      <div className="text-9xl mb-6">🎉</div>
      <h2 className="text-5xl font-black kid-font text-gray-800 mb-4">Amazing Reader!</h2>
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

export default KaraokeReader;
