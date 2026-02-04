import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateActivityProgress } from '../../redux/slices/progressSlice';

const SyllableNinja = ({ unit, onBack, activityName }) => {
  const dispatch = useDispatch();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [stars, setStars] = useState(0);

  const tasks = unit.segmentingTasks || [];
  const currentTask = tasks[currentIndex];

  const handleLetterClick = (position) => {
    if (selectedPositions.includes(position)) {
      setSelectedPositions(selectedPositions.filter(p => p !== position));
    } else {
      setSelectedPositions([...selectedPositions, position]);
    }
  };

  const handleCheck = () => {
    // Simple check: count should match segments - 1 (for split points)
    const expectedSplits = currentTask.segments.length - 1;
    
    if (selectedPositions.length === expectedSplits) {
      setScore(score + 10);
      toast.success('Great job! ⚔️');
      
      setTimeout(() => {
        if (currentIndex < tasks.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelectedPositions([]);
        } else {
          completeActivity();
        }
      }, 1000);
    } else {
      toast.error('Try again! 🤔');
      setSelectedPositions([]);
    }
  };

  const completeActivity = () => {
    const totalPossible = tasks.length * 10;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral to-orange-400 p-6">
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
          ⚔️ Slice the Syllables! ⚔️
        </h2>
        <p className="text-xl text-gray-600">
          Click between letters to split the word into syllables!
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center items-center mb-8">
          {currentTask.fullWord.split('').map((letter, index) => (
            <React.Fragment key={index}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-xl"
              >
                <span className="text-4xl font-black kid-font text-white">{letter}</span>
              </motion.div>
              
              {index < currentTask.fullWord.length - 1 && (
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleLetterClick(index)}
                  className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center ${
                    selectedPositions.includes(index)
                      ? 'bg-success text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-3xl font-bold">⚔️</span>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCheck}
          className="btn-success text-2xl kid-font"
        >
          Check Answer ✓
        </motion.button>
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
      <h2 className="text-5xl font-black kid-font text-gray-800 mb-4">Ninja Skills!</h2>
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

export default SyllableNinja;
