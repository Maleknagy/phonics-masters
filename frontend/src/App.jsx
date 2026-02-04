import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadUserFromStorage } from './redux/slices/authSlice'; 
import { fireRandomCelebration } from './utils/confetti'; 

// Pages
import LandingPage from './pages/LandingPage'; // NEW ENTRY POINT
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LevelView from './pages/LevelView'; 
import UnitMenu from './pages/UnitMenu'; 
import Profile from './pages/Profile';
import Progress from './pages/Progress'; 
import TeacherDashboard from './pages/TeacherDashboard'; 
import ResetPassword from './pages/ResetPassword'; 

// Games
import SightWordGlow from "./components/activities/SightWordGlow"; 
import SnapshotStars from "./components/activities/SnapshotStars"; 
import SightWordPop from "./components/activities/SightWordPop"; 
import PhonicsFusion from "./components/activities/PhonicsFusion";
import SegmentationGame from "./components/activities/SegmentationGame"; 
import WordSliderGame from "./components/activities/WordSliderGame"; 
import WordHunter from "./components/activities/WordHunter";
import WordSpy from "./components/activities/WordSpy"; 
import PhonicsBuilder from "./components/activities/PhonicsBuilder"; 
import WordGrid from "./components/activities/WordGrid";
import SentenceStream from "./components/activities/SentenceStream";
import WordByWord from "./components/activities/WordByWord";
import SentenceReader from "./components/activities/SentenceReader"; 
import SentenceBuilder from "./components/activities/SentenceBuilder"; 
import StoryReader from "./components/activities/StoryReader";
import StoryRecorder from "./components/activities/StoryRecorder";

import PrivateRoute from './components/PrivateRoute';
import Loading from './components/Loading';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fireRandomCelebration();
      }, 15000); 

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (isLoading) return <Loading />;

  return (
    <Routes>
      {/* LANDING & AUTH */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* CORE APP */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/progress/:studentId?" element={<PrivateRoute><Progress /></PrivateRoute>} />
      <Route path="/level/:levelId" element={<PrivateRoute><LevelView /></PrivateRoute>} />
      <Route path="/unit/:unitId" element={<PrivateRoute><UnitMenu /></PrivateRoute>} /> 
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      
      {/* TEACHER TOOLS */}
      <Route path="/teacher-dashboard" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
      <Route path="/teacher/student/:studentId/level/:levelId" element={<PrivateRoute role="teacher"><LevelView /></PrivateRoute>} />
      
      {/* GAMES */}
      <Route path="/unit/:unitId/game/sight-word-glow" element={<PrivateRoute><SightWordGlow /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/snapshot-stars" element={<PrivateRoute><SnapshotStars /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/sight-word-pop" element={<PrivateRoute><SightWordPop /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/fusion" element={<PrivateRoute><PhonicsFusion /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/segmentation" element={<PrivateRoute><SegmentationGame /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/word-slider" element={<PrivateRoute><WordSliderGame /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/word-hunter" element={<PrivateRoute><WordHunter /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/word-spy" element={<PrivateRoute><WordSpy /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/phonics-builder" element={<PrivateRoute><PhonicsBuilder /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/grid" element={<PrivateRoute><WordGrid /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/sentence-stream" element={<PrivateRoute><SentenceStream /></PrivateRoute>} /> 
      <Route path="/unit/:unitId/game/word-by-word" element={<PrivateRoute><WordByWord /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/sentence-reader" element={<PrivateRoute><SentenceReader /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/sentence-builder" element={<PrivateRoute><SentenceBuilder /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/story" element={<PrivateRoute><StoryReader /></PrivateRoute>} />
      <Route path="/unit/:unitId/game/story-recorder" element={<PrivateRoute><StoryRecorder /></PrivateRoute>} />

      {/* FALLBACKS */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;