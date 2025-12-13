import React, { useState, useEffect } from 'react';
import { Student, ModuleTheme, ModuleProgress, LearningModule } from '../types';
import { getAllModules, getClassmates, updateStudent } from '../services/mockStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Lock, Play, CheckCircle, Award, Flame, Zap, Crown, Map, RefreshCcw, Rocket, Mountain, Trees, Droplets, Save, X, Settings, Gift, BookOpen, Target, GraduationCap, ShoppingBag } from 'lucide-react';
import NestView from './NestView';

interface Props {
  student: Student;
  onSelectModule: (moduleId: string) => void;
  onLogout: () => void;
  onStartPlacement: () => void;
}

const AVATAR_OPTIONS = ['🐣', '🐶', '🐱', '🐼', '🐨', '🦁', '🐸', '🦄', '🤖', '👽', '👻', '🧙‍♂️', '👸', '🦸', '🥷', '✈️', '🚀', '🏎️', '⚽', '🏀'];

const StudentPortal: React.FC<Props> = ({ student, onSelectModule, onLogout, onStartPlacement }) => {
  const classmates = getClassmates(student.id).slice(0, 5); // Top 5
  const allModules = getAllModules(); // Includes custom teacher modules
  const xpProgress = (student.xp % 500) / 500 * 100;
  
  // States
  const [showYearLevelModal, setShowYearLevelModal] = useState(!student.yearLevel);
  const [selectedYear, setSelectedYear] = useState(4);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showMascotIntro, setShowMascotIntro] = useState(false);
  const [showNest, setShowNest] = useState(false); // New Shop View State

  useEffect(() => {
    // Show Mascot Intro if placement test is not started
    if (student.placementTestStatus === 'NOT_STARTED') {
        const timer = setTimeout(() => setShowMascotIntro(true), 500);
        return () => clearTimeout(timer);
    }
  }, [student.placementTestStatus]);

  const handleSaveYearLevel = () => {
      const updated = { ...student, yearLevel: selectedYear };
      updateStudent(updated);
      setShowYearLevelModal(false);
  };

  const handleUpdateAvatar = (emoji: string) => {
      updateStudent({ ...student, avatar: emoji });
  };

  const getThemeStyles = (theme: ModuleTheme) => {
    switch(theme) {
      case ModuleTheme.FOREST: return {
          bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', 
          iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
          btn: 'bg-emerald-500 hover:bg-emerald-600'
      };
      case ModuleTheme.OCEAN: return {
          bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', 
          iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
          btn: 'bg-blue-500 hover:bg-blue-600'
      };
      case ModuleTheme.VOLCANO: return {
          bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', 
          iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
          btn: 'bg-rose-500 hover:bg-rose-600'
      };
      case ModuleTheme.DESERT: return {
          bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', 
          iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
          btn: 'bg-orange-500 hover:bg-orange-600'
      };
      case ModuleTheme.SPACE: return {
          bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', 
          iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
          btn: 'bg-indigo-500 hover:bg-indigo-600'
      };
      default: return {
          bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', 
          iconBg: 'bg-gray-100', iconColor: 'text-gray-600',
          btn: 'bg-gray-500'
      };
    }
  };

  const getIcon = (theme: ModuleTheme) => {
    switch(theme) {
      case ModuleTheme.FOREST: return <Trees size={32} />;
      case ModuleTheme.OCEAN: return <Droplets size={32} />;
      case ModuleTheme.VOLCANO: return <Flame size={32} />;
      case ModuleTheme.DESERT: return <Mountain size={32} />;
      case ModuleTheme.SPACE: return <Rocket size={32} />;
      default: return <Map size={32} />;
    }
  };

  // Render Shop
  if (showNest) {
      return <NestView student={student} onClose={() => setShowNest(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 relative">
      
      {/* YEAR LEVEL MODAL */}
      <AnimatePresence>
        {showYearLevelModal && !showMascotIntro && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-bold font-display text-center mb-4">Welcome, {student.name}! 👋</h2>
                    <p className="text-center text-gray-500 mb-6">Before we start your adventure, what year level are you in?</p>
                    <div className="grid grid-cols-4 gap-3 mb-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(y => (
                            <button 
                                key={y} 
                                onClick={() => setSelectedYear(y)}
                                className={`py-3 rounded-xl font-bold text-lg border-2 transition-all ${selectedYear === y ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleSaveYearLevel} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700">
                        Start Adventure
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* MASCOT INTRO MODAL */}
      <AnimatePresence>
          {showMascotIntro && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <motion.div 
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-28 h-28 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl mb-6"
                        >
                            <span className="text-6xl">🥝</span>
                        </motion.div>

                        <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">Kia ora, I'm Tudor!</h2>
                        <p className="text-slate-500 font-bold mb-6 text-lg">Your official Spelling Guide.</p>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 text-left relative">
                            <p className="text-slate-600 leading-relaxed">
                                "Before we start our adventure, I need to see what you already know! Let's take a quick <strong>Placement Challenge</strong> so I can pick the perfect path for you."
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                setShowMascotIntro(false);
                                onStartPlacement();
                            }}
                            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            Start Challenge <Rocket size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold font-display flex items-center gap-2">Customize Profile</h2>
                        <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                    </div>
                    
                    <div className="mb-6 text-center">
                        <div className="text-6xl mb-4 bg-slate-100 w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-inner">{student.avatar}</div>
                        <p className="text-gray-500 font-bold">Choose your avatar</p>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {AVATAR_OPTIONS.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => handleUpdateAvatar(emoji)}
                                className={`text-3xl p-3 rounded-xl transition-all ${student.avatar === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50 hover:bg-slate-100'}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={() => setShowSettings(false)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">
                        Save Looks
                    </button>
                </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* REWARDS MODAL */}
      <AnimatePresence>
          {showRewards && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 20, opacity: 0}} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold font-display flex items-center gap-2"><Gift className="text-pink-500" /> Your Rewards</h2>
                        <button onClick={() => setShowRewards(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                    </div>
                    
                    <div className="space-y-3">
                         {student.customRewards && student.customRewards.length > 0 ? (
                             student.customRewards.map((reward, idx) => (
                                 <div key={idx} className="bg-pink-50 border border-pink-100 p-4 rounded-xl flex items-center gap-3">
                                     <div className="bg-white p-2 rounded-full shadow-sm text-pink-500"><Gift size={20} /></div>
                                     <span className="font-bold text-pink-800">{reward}</span>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center py-8 text-gray-400">
                                 <Gift size={48} className="mx-auto mb-2 opacity-20" />
                                 <p>No rewards from your teacher yet.</p>
                             </div>
                         )}
                    </div>
                </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* ACHIEVEMENTS MODAL */}
      <AnimatePresence>
        {showAllAchievements && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 20, opacity: 0}} className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold font-display flex items-center gap-2"><Award className="text-purple-500" /> Achievements</h2>
                        <button onClick={() => setShowAllAchievements(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {student.achievements.map(ach => (
                            <div key={ach.id} className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <div className="text-4xl">{ach.icon}</div>
                                <div>
                                    <h3 className="font-bold text-purple-900">{ach.title}</h3>
                                    <p className="text-sm text-purple-700">{ach.description}</p>
                                </div>
                            </div>
                        ))}
                        {student.achievements.length === 0 && <p className="text-gray-500 col-span-2 text-center py-8">Complete modules to earn your first achievement!</p>}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Top Bar / Stats Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowSettings(true)}>
             <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl border border-blue-200 shadow-sm">
                  {student.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                    {student.level}
                </div>
             </div>
             <div>
                <h1 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    {student.name} <Settings size={14} className="text-slate-300" />
                </h1>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full" style={{ width: `${xpProgress}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{student.xp} XP</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                 <Star className="text-yellow-500 fill-yellow-500" size={20} />
                 <span className="font-bold text-slate-700">{student.stars} Stars</span>
             </div>
             <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                <Flame className={`w-5 h-5 ${student.currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`} />
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streak</div>
                    <div className="text-sm font-bold text-slate-700 leading-none">{student.currentStreak} Days</div>
                </div>
             </div>
             <button onClick={onLogout} className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors">
                Log Out
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Mission & Leaderboard */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* PLACEMENT TEST BANNER */}
            {student.placementTestStatus === 'NOT_STARTED' && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group cursor-pointer"
                    onClick={onStartPlacement}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-white/20 p-3 rounded-full"><Target size={24} /></div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Start Challenge</h3>
                            <p className="text-xs opacity-90">Find your starting level!</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* NEST SHOP BANNER */}
            <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowNest(true)}
                className="bg-gradient-to-r from-teal-400 to-emerald-500 rounded-3xl p-6 text-white shadow-lg cursor-pointer relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl">🥝</div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/20 p-3 rounded-full"><ShoppingBag size={24} /></div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Tudor's Nest</h3>
                        <p className="text-xs opacity-90">Spend stars to customize!</p>
                    </div>
                </div>
            </motion.div>
            
            {/* Daily Mission */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700" />
                <h2 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Daily Mission</h2>
                <h3 className="text-2xl font-display font-bold mb-6">Complete 1 Adventure</h3>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 border border-white/10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${student.lastActiveDate.startsWith(new Date().toISOString().split('T')[0]) ? 'bg-green-400 border-green-400 text-white' : 'border-white/30 text-transparent'}`}>
                        <CheckCircle size={16} fill="currentColor" className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm font-bold mb-1">
                            <span>Progress</span>
                            <span>{student.lastActiveDate.startsWith(new Date().toISOString().split('T')[0]) ? '1/1' : '0/1'}</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                             <div className={`h-full bg-white transition-all duration-500 ${student.lastActiveDate.startsWith(new Date().toISOString().split('T')[0]) ? 'w-full' : 'w-0'}`} />
                        </div>
                    </div>
                </div>
            </div>

             {/* Rewards Notification Card */}
             {student.customRewards && student.customRewards.length > 0 && (
                 <div onClick={() => setShowRewards(true)} className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-pink-200 cursor-pointer relative overflow-hidden group">
                     <div className="flex items-center gap-4">
                         <div className="bg-white/20 p-3 rounded-full"><Gift size={24} /></div>
                         <div>
                             <h3 className="font-bold text-lg leading-tight">You have rewards!</h3>
                             <p className="text-xs opacity-90">From your teacher</p>
                         </div>
                     </div>
                 </div>
             )}

            {/* Class Leaderboard */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-slate-800 font-display font-bold text-lg flex items-center gap-2">
                        <Crown size={20} className="text-yellow-500 fill-yellow-500" /> Leaderboard
                    </h2>
                </div>
                <div className="space-y-4">
                    {classmates.map((mate, idx) => {
                        // Tie Handling Logic
                        // Since classmates is sorted by XP DESC, check against the previous student
                        let rank = idx + 1;
                        if (idx > 0 && mate.xp === classmates[idx - 1].xp) {
                             // Find the first student with this XP to determine the rank number
                             // e.g. [100, 100, 90] -> Rank 1, 1, 3
                             const firstIndex = classmates.findIndex(s => s.xp === mate.xp);
                             rank = firstIndex + 1;
                        }

                        return (
                        <div key={mate.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? 'bg-yellow-100 text-yellow-700' : rank === 2 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-700'}`}>
                                    {rank}
                                </div>
                                <span className="text-xl group-hover:scale-110 transition-transform">{mate.avatar}</span>
                                <span className={`font-bold text-sm ${mate.id === student.id ? 'text-blue-600' : 'text-slate-600'}`}>
                                    {mate.name} {mate.id === student.id && '(You)'}
                                </span>
                            </div>
                            <span className="text-xs font-bold bg-slate-50 px-2 py-1 rounded-md text-slate-500 border border-slate-100">{mate.xp} XP</span>
                        </div>
                    )})}
                </div>
            </div>

            {/* Badges / Achievements Mini */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAllAchievements(true)}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-slate-800 font-display font-bold text-lg flex items-center gap-2">
                        <Award size={20} className="text-purple-500" /> Badges
                    </h2>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">View All</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {student.achievements.length === 0 && <p className="text-slate-400 text-sm italic">Complete modules to earn badges!</p>}
                    {student.achievements.slice(0, 5).map(ach => (
                        <div key={ach.id} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl border border-slate-100 tooltip" title={ach.title}>
                            {ach.icon}
                        </div>
                    ))}
                    {student.achievements.length > 5 && (
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-100">
                            +{student.achievements.length - 5}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: The Map (Adventures) */}
        <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
                        <Map className="text-blue-500" /> Your Journey
                    </h2>
                    <p className="text-slate-500 text-sm">Select an adventure to begin</p>
                </div>
                <span className="text-sm font-bold text-slate-500 bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm">
                    {Object.values(student.progress).filter((p: ModuleProgress) => p.completed).length} / {allModules.length} Completed
                </span>
            </div>

            <div className="grid gap-5">
            {allModules.map((module, index) => {
                const progress = student.progress[module.id];
                // IMPORTANT: Custom modules don't depend on previous modules. 
                // Only standard modules (which have fixed indices) should lock.
                const isCustom = module.isCustom;
                
                // For standard modules, find the previous standard module to check lock state
                let isLocked = false;
                if (!isCustom) {
                    const prevStandardModule = allModules.slice(0, index).reverse().find(m => !m.isCustom);
                    if (prevStandardModule) {
                        const prevProgress = student.progress[prevStandardModule.id];
                        isLocked = (!prevProgress || !prevProgress.completed);
                    }
                }

                // Teacher assignments override locks
                const isAssigned = student.assignedModuleIds?.includes(module.id);
                if (isAssigned) isLocked = false;
                
                const styles = getThemeStyles(module.theme);
                const isResumable = progress && !progress.completed && progress.resumeState;

                return (
                <motion.div 
                    key={module.id}
                    whileHover={{ scale: isLocked ? 1 : 1.01 }}
                    whileTap={{ scale: isLocked ? 1 : 0.99 }}
                    className={`relative rounded-[2rem] transition-all duration-300 ${isLocked ? 'opacity-80' : 'cursor-pointer hover:shadow-lg'}`}
                    onClick={() => !isLocked && onSelectModule(module.id)}
                >
                    <div className={`w-full bg-white rounded-[2rem] border-2 ${isLocked ? 'border-slate-100 bg-slate-50' : isAssigned ? 'border-indigo-400 ring-2 ring-indigo-200' : styles.border} p-1`}>
                        <div className={`rounded-[1.8rem] p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden ${isLocked ? 'bg-slate-50' : styles.bg}`}>
                            
                            {/* Assigned Badge */}
                            {isAssigned && (
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20 flex items-center gap-1">
                                    <BookOpen size={10} /> ASSIGNED
                                </div>
                            )}

                            {/* Locked Overlay */}
                            {isLocked && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/60 backdrop-blur-[1px]">
                                    <div className="bg-white p-3 rounded-full shadow-md text-slate-400">
                                        <Lock size={24} />
                                    </div>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl shadow-sm z-10 ${isLocked ? 'bg-white text-slate-300' : `${styles.iconBg} ${styles.iconColor}`}`}>
                                {isCustom ? '📝' : getIcon(module.theme)}
                            </div>

                            {/* Content */}
                            <div className="flex-grow z-10 text-center md:text-left min-w-0 w-full">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded text-slate-500">{module.level}</span>
                                    {isCustom && <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-1 rounded">CUSTOM</span>}
                                    {progress?.completed && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle size={10} /> Complete
                                        </span>
                                    )}
                                    {isResumable && (
                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1">
                                            <Play size={10} /> Resume
                                        </span>
                                    )}
                                </div>
                                <h3 className={`text-xl font-display font-bold mb-1 truncate ${isLocked ? 'text-slate-400' : styles.text}`}>{module.title}</h3>
                                <p className="text-sm text-slate-500 leading-snug truncate">{module.description}</p>
                                
                                {/* Mini Progress Bar inside card */}
                                {!isLocked && (
                                    <div className="mt-4 w-full h-1.5 bg-black/5 rounded-full overflow-hidden max-w-[200px] mx-auto md:mx-0">
                                        <div className={`h-full ${progress?.completed ? 'bg-green-500' : 'bg-blue-500'} transition-all`} style={{ width: progress?.completed ? '100%' : progress?.score ? `${progress.score}%` : '5%' }} />
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="z-10 flex-shrink-0 hidden md:block">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all ${isLocked ? 'bg-slate-200' : progress?.completed ? 'bg-green-500' : styles.btn}`}>
                                    {progress?.completed ? <RefreshCcw size={20} /> : <Play size={20} fill="currentColor" className="ml-1" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
                );
            })}
            </div>
        </div>

      </main>
    </div>
  );
};

export default StudentPortal;