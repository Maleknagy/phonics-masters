import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar } from 'react-icons/fa';

const GameHeader = ({ progress, score, onBack, themeColor = "bg-blue-600" }) => {
  return (
    <div className="w-full p-4 md:p-6 flex flex-col gap-2 sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b-2 border-white/20">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        
        {/* 1. BACK BUTTON: Large and squishy */}
        <button 
          onClick={onBack} 
          className="bg-white p-4 rounded-2xl text-slate-800 shadow-[0_5px_0_#cbd5e1] active:translate-y-1 active:shadow-none transition-all"
        >
          <FaArrowLeft size={20} />
        </button>

        {/* 2. PROGRESS BAR: The "pattern" for all games */}
        <div className="flex-1 px-6 md:px-12 flex flex-col items-center">
          <div className="w-full h-8 bg-black/20 rounded-full border-4 border-white/30 p-1 relative overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]"
            />
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] mt-2 drop-shadow-md">
            {Math.round(progress)}% Completed
          </span>
        </div>

        {/* 3. SCORE COIN: High contrast and rewarding */}
        <div className="bg-yellow-400 px-6 py-3 rounded-2xl shadow-[0_6px_0_#d97706] flex items-center gap-3 border-2 border-yellow-200">
          <FaStar className="text-yellow-700 animate-pulse" size={24} />
          <span className="text-2xl font-black text-yellow-900 drop-shadow-sm">
            {score}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;