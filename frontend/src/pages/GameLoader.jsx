import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
// Import your components...

const GameLoader = () => {
  const { unitId, gameType } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 bg-white shadow-md flex items-center z-50">
        <button onClick={() => navigate(-1)} className="p-2 text-xl text-gray-600">
          <FaArrowLeft />
        </button>
        <h1 className="ml-4 text-xl font-bold capitalize">{gameType.replace('_', ' ')}</h1>
      </div>
      <div className="flex-1 overflow-auto">
        {/* Your switch statement to render games goes here */}
      </div>
    </div>
  );
};