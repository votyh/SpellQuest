import React from 'react';
import { Student, ModuleTheme, ModuleProgress } from '../types';
import { MODULES, getClassmates } from '../services/mockStore';
import { motion } from 'framer-motion';
import { Star, Lock, Play, CheckCircle, Award, Flame, Zap, Crown, Map, RefreshCcw, Rocket, Mountain, Trees, Droplets } from 'lucide-react';

interface Props {
  student: Student;
  onSelectModule: (moduleId: string) => void;
  onLogout: () => void;
}

const StudentPortal: React.FC<Props> = ({ student, onSelectModule, onLogout }) => {
  const classmates = getClassmates(student.id).slice(0, 3); // Top 3
  const xpProgress = (student.xp % 500) / 500 * 100;

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Bar / Stats Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl border border-blue-200 shadow-sm">
                  {student.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                    {student.level}
                </div>
             </div>
             <div>
                <h1 className="font-display font-bold text-slate-800 text-lg">{student.name}</h1>
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

            {/* Class Leaderboard */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-slate-800 font-display font-bold text-lg flex items-center gap-2">
                        <Crown size={20} className="text-yellow-500 fill-yellow-500" /> Leaderboard
                    </h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Top 3</span>
                </div>
                <div className="space-y-4">
                    {classmates.map((mate, idx) => (
                        <div key={mate.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-700'}`}>
                                    {idx + 1}
                                </div>
                                <span className="text-xl group-hover:scale-110 transition-transform">{mate.avatar}</span>
                                <span className={`font-bold text-sm ${mate.id === student.id ? 'text-blue-600' : 'text-slate-600'}`}>
                                    {mate.name} {mate.id === student.id && '(You)'}
                                </span>
                            </div>
                            <span className="text-xs font-bold bg-slate-50 px-2 py-1 rounded-md text-slate-500 border border-slate-100">{mate.xp} XP</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Badges / Achievements Mini */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-slate-800 font-display font-bold text-lg mb-4 flex items-center gap-2">
                    <Award size={20} className="text-purple-500" /> Badges
                </h2>
                <div className="flex flex-wrap gap-2">
                    {student.achievements.length === 0 && <p className="text-slate-400 text-sm italic">Complete modules to earn badges!</p>}
                    {student.achievements.map(ach => (
                        <div key={ach.id} className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl border border-slate-100 tooltip" title={ach.title}>
                            {ach.icon}
                        </div>
                    ))}
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
                    {Object.values(student.progress).filter(p => p.completed).length} / {MODULES.length} Completed
                </span>
            </div>

            <div className="grid gap-5">
            {MODULES.map((module, index) => {
                const progress = student.progress[module.id];
                const prevModule = index > 0 ? MODULES[index - 1] : null;
                const prevProgress = prevModule ? student.progress[prevModule.id] : undefined;
                // Lock if previous not completed (except for first one)
                // Using explicit check for completed property presence to avoid TS unknown type errors
                const isLocked = index > 0 && !prevProgress?.completed;
                const styles = getThemeStyles(module.theme);

                return (
                <motion.div 
                    key={module.id}
                    whileHover={{ scale: isLocked ? 1 : 1.01 }}
                    whileTap={{ scale: isLocked ? 1 : 0.99 }}
                    className={`relative rounded-[2rem] transition-all duration-300 ${isLocked ? 'opacity-80' : 'cursor-pointer hover:shadow-lg'}`}
                    onClick={() => !isLocked && onSelectModule(module.id)}
                >
                    <div className={`w-full bg-white rounded-[2rem] border-2 ${isLocked ? 'border-slate-100 bg-slate-50' : styles.border} p-1`}>
                        <div className={`rounded-[1.8rem] p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden ${isLocked ? 'bg-slate-50' : styles.bg}`}>
                            
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
                                {getIcon(module.theme)}
                            </div>

                            {/* Content */}
                            <div className="flex-grow z-10 text-center md:text-left min-w-0 w-full">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/50 px-2 py-1 rounded text-slate-500">{module.level}</span>
                                    {progress?.completed && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle size={10} /> Complete
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