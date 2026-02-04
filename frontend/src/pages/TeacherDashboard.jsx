import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db as supabase } from '../supabaseClient';
import { FaSearch, FaUserGraduate, FaChartLine, FaSignOutAlt, FaArrowLeft } from 'react-icons/fa';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name');

    if (!error) setStudents(data);
    setLoading(false);
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error("Error signing out:", err.message);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-slate-800 pb-20">
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-50 border-b-2 border-orange-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none">Classroom</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Management</p>
          </div>
        </div>

        <button 
          onClick={handleSignOut} 
          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <FaSignOutAlt size={18} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* SLIM SEARCH */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input 
            type="text"
            placeholder="Search explorers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-12 rounded-xl border-2 border-white shadow-md outline-none focus:border-orange-300 transition-all font-bold text-sm"
          />
        </div>

        {/* ULTRA COMPACT GRID */}
        {loading ? (
          <div className="text-center py-20 font-black text-orange-200 uppercase italic">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredStudents.map((student) => (
              <motion.button
                key={student.id}
                whileHover={{ y: -2, shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.97 }}
                // UPDATED: Navigates to the Progress (Report) View instead of LevelView
                onClick={() => navigate(`/progress/${student.id}`)}
                className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-left flex items-center gap-3 hover:border-orange-300 transition-all group"
              >
                {/* COMPACT AVATAR */}
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0">
                  <FaChartLine size={18} />
                </div>
                
                <div className="overflow-hidden">
                  <h3 className="font-black text-xs uppercase tracking-tight leading-none text-slate-700 truncate">
                    {student.full_name || "Explorer"}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-1">
                    {student.email}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;