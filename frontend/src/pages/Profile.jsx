import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaStar, FaTrophy } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.progress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 p-6">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-white text-xl kid-font font-bold hover:scale-110 transition-transform"
        >
          <FaArrowLeft /> <span>Back to Dashboard</span>
        </button>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-10"
        >
          {/* Profile Header */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-32 h-32 bg-gradient-to-br from-sunshineYellow to-coral rounded-full flex items-center justify-center text-6xl mx-auto mb-4 shadow-xl"
            >
              {user?.childName?.charAt(0).toUpperCase() || '👦'}
            </motion.div>
            <h1 className="text-4xl font-black kid-font text-gray-800 mb-2">
              {user?.childName}
            </h1>
            <p className="text-gray-600 text-lg">Age: {user?.age} years old</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-sunshineYellow to-yellow-400 rounded-xl p-4 text-center">
              <FaStar className="text-3xl text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white kid-font">{user?.totalStars || 0}</p>
              <p className="text-white text-sm">Stars</p>
            </div>
            <div className="bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl p-4 text-center">
              <FaTrophy className="text-3xl text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white kid-font">{user?.totalPoints || 0}</p>
              <p className="text-white text-sm">Points</p>
            </div>
            <div className="bg-gradient-to-br from-softGreen to-green-500 rounded-xl p-4 text-center">
              <div className="text-3xl mx-auto mb-2">📚</div>
              <p className="text-2xl font-bold text-white kid-font">{stats?.totalUnitsCompleted || 0}</p>
              <p className="text-white text-sm">Completed</p>
            </div>
            <div className="bg-gradient-to-br from-coral to-red-400 rounded-xl p-4 text-center">
              <div className="text-3xl mx-auto mb-2">🔥</div>
              <p className="text-2xl font-bold text-white kid-font">{user?.currentLevel || 1}</p>
              <p className="text-white text-sm">Level</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <label className="text-gray-600 text-sm">Username</label>
              <p className="text-xl font-bold kid-font text-gray-800">{user?.username}</p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <label className="text-gray-600 text-sm">Email</label>
              <p className="text-xl font-bold kid-font text-gray-800">{user?.email}</p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <label className="text-gray-600 text-sm">Subscription Status</label>
              <p className="text-xl font-bold kid-font text-gray-800 capitalize">
                {user?.subscriptionStatus || 'Free'}
                {user?.isPremium && ' ⭐'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
