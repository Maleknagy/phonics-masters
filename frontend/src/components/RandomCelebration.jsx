import React, { useEffect } from 'react';
// CHANGE: renamed fireRandomConfetti to fireRandomCelebration
import { fireRandomCelebration } from '../utils/confetti'; 

const RandomCelebration = ({ frequency = 0.3 }) => {
  useEffect(() => {
    const shouldCelebrate = Math.random() < frequency;

    if (shouldCelebrate) {
      const timer = setTimeout(() => {
        // CHANGE: renamed function call here too
        fireRandomCelebration(); 
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [frequency]);

  return null; 
};

export default RandomCelebration;