import React, { useState, useEffect } from 'react';
import { ClassGroup, Student, Teacher, ModuleTheme, LearningModule } from '../types';
import { getClasses, getStudents, createStudent, createClass, MODULES, updateTeacher, updateStudent, updateClass, getCustomModules, saveCustomModule } from '../services/mockStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ComposedChart, Line } from 'recharts';
import { Users, Plus, Trophy, Key, Copy, LogOut, ChevronRight, Activity, Settings, BookOpen, Gift, CheckSquare, Square, Save, Trash2, Target, Sparkles, FileText } from 'lucide-react';

interface Props {
  teacher: Teacher;
  onLogout: () => void;
}

const AVATAR_OPTIONS = ['👨‍🏫', '👩‍🏫', '🎓', '👓', '📚', '🦉', '🦁', '⭐', '🍎', '🖊️'];

const TeacherDashboard: React.FC<Props> = ({ teacher, onLogout }) => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [customModules, setCustomModules] = useState<LearningModule[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'modules' | 'settings'>('dashboard');
  
  // Form States
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [rewardInput, setRewardInput] = useState('');
  
  // Custom Module Form
  const [customTitle, setCustomTitle] = useState('');
  const [customWords, setCustomWords] = useState('');
  
  // Settings Form
  const [editClassName, setEditClassName] = useState('');

  useEffect(() => {
    refreshData();

    // Listen for storage events (changes from other tabs) and custom events (changes in same tab)
    const handleStorageChange = () => {
        refreshData();
    };

    window.addEventListener('storage', handleStorageChange);
    // We dispatch 'storage' manually in mockStore for same-tab updates too, so this covers both.
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [teacher]);

  const refreshData = () => {
    // Only fetch classes for this teacher
    const teacherClasses = getClasses(teacher.id);
    setClasses(teacherClasses);
    
    const allStudents = getStudents();
    setStudents(allStudents);

    setCustomModules(getCustomModules());

    // Auto-select first class if none selected
    if (!selectedClassId && teacherClasses.length > 0) {
        // We only set selected class if it wasn't already set, 
        // OR if the currently selected class ID is no longer valid (e.g. deleted)
        // But for refresh, we usually want to keep selection.
        // Logic: if selectedClassId is null, pick first.
    } else if (selectedClassId) {
        // Keep current selection, just update the class name in edit field if needed
        const current = teacherClasses.find(c => c.id === selectedClassId);
        if (current) setEditClassName(current.name);
    }
  };
  
  // Effect to set initial class selection
  useEffect(() => {
      if (!selectedClassId && classes.length > 0) {
          setSelectedClassId(classes[0].id);
          setEditClassName(classes[0].name);
      }
  }, [classes.length, selectedClassId]);


  const handleAddStudent = () => {
    if (newStudentName.trim() && selectedClassId) {
        createStudent(newStudentName, selectedClassId);
        setNewStudentName('');
        refreshData();
    }
  };

  const handleAddClass = () => {
      if (newClassName.trim()) {
          const newClass = createClass(newClassName, teacher.id);
          setNewClassName('');
          setIsAddingClass(false);
          refreshData();
          setSelectedClassId(newClass.id);
      }
  }

  const handleUpdateAvatar = (emoji: string) => {
      updateTeacher({ ...teacher, avatar: emoji });
  }
  
  const handleUpdateClassName = () => {
      if (selectedClassId && editClassName.trim()) {
          const current = classes.find(c => c.id === selectedClassId);
          if (current) {
              updateClass({ ...current, name: editClassName });
              refreshData();
          }
      }
  }

  const handleCreateModule = () => {
      if (!customTitle.trim() || !customWords.trim()) return;

      const wordsArray = customWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
      
      const newModule: LearningModule = {
          id: `custom_${Date.now()}`,
          title: customTitle,
          level: 'Custom List',
          theme: ModuleTheme.SPACE, // Default theme for custom
          description: `Teacher created list: ${wordsArray.slice(0, 3).join(', ')}...`,
          ruleExplanation: 'Custom teacher list.',
          isCustom: true,
          customWords: wordsArray,
          createdBy: teacher.id
      };

      saveCustomModule(newModule);
      setCustomTitle('');
      setCustomWords('');
      refreshData();
      // Switch back to dashboard to assign it? Or stay here.
      alert(`Module "${newModule.title}" created! You can now assign it to students.`);
  }

  const toggleAssignment = (moduleId: string) => {
      if (!selectedStudent) return;
      const currentAssigned = selectedStudent.assignedModuleIds || [];
      const newAssigned = currentAssigned.includes(moduleId) 
        ? currentAssigned.filter(id => id !== moduleId)
        : [...currentAssigned, moduleId];
      
      const updated = { ...selectedStudent, assignedModuleIds: newAssigned };
      updateStudent(updated);
      refreshData();
  }

  const giveReward = () => {
      if (!selectedStudent || !rewardInput.trim()) return;
      const currentRewards = selectedStudent.customRewards || [];
      const updated = { ...selectedStudent, customRewards: [rewardInput, ...currentRewards] };
      updateStudent(updated);
      setRewardInput('');
      refreshData();
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => selectedClass?.studentIds.includes(s.id));
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // --- CHART DATA GENERATION ---

  // 1. Class Overview: Avg score per module
  const classChartData = MODULES.slice(0, 5).map(m => { // Just show first 5 for dashboard overview
      let totalScore = 0;
      let count = 0;
      classStudents.forEach(s => {
          if (s.progress[m.id]?.completed) {
              totalScore += s.progress[m.id].score;
              count++;
          }
      });
      return {
          name: m.title.split(' ')[0], // Short name
          avgScore: count > 0 ? Math.round(totalScore / count) : 0
      };
  });

  // 3. Student Detail: Bar Chart for Individual Module Scores
  const getStudentModuleData = (student: Student) => {
      const allMods = [...MODULES, ...customModules];
      return allMods.filter(m => student.progress[m.id]?.completed).map(m => ({
          name: m.title.length > 15 ? m.title.substring(0, 15) + '...' : m.title,
          score: student.progress[m.id].score,
          confidence: (student.progress[m.id].confidence || 0) * 20 // Normalize 1-5 to 0-100
      }));
  };

  // 4. Analysis Text
  const getStudentAnalysis = (student: Student) => {
      const strengths: string[] = [];
      const needsWork: string[] = [];
      const allMods = [...MODULES, ...customModules];

      allMods.forEach(m => {
          const p = student.progress[m.id];
          if (p?.completed) {
              if (p.score >= 85) strengths.push(m.title);
              if (p.score < 60) needsWork.push(m.title);
          }
      });

      return { strengths, needsWork };
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold font-display text-xl shadow-md">SQ</div>
            <div>
                <h1 className="text-xl font-bold text-gray-800 leading-none">Teacher Portal</h1>
                <p className="text-xs text-gray-500 font-semibold">Welcome, {teacher.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <button 
                onClick={() => { setActiveTab('modules'); setSelectedStudentId(null); }}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${activeTab === 'modules' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                <FileText size={18} /> Word Lists
            </button>
            <button 
                onClick={() => { setActiveTab(activeTab === 'dashboard' ? 'settings' : 'dashboard'); setSelectedStudentId(null); }}
                className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="Settings"
            >
                <Settings size={20} />
            </button>
            <button onClick={onLogout} className="text-sm font-semibold text-gray-500 hover:text-red-500 flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} /> Log Out
            </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Class List */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">{teacher.avatar || '👩‍🏫'}</div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Classes</h2>
            </div>
            
            <div className="space-y-2">
                {classes.length === 0 && <p className="text-sm text-gray-400 italic mb-4">No classes yet.</p>}
                {classes.map(c => (
                    <button
                        key={c.id}
                        onClick={() => { setSelectedClassId(c.id); setSelectedStudentId(null); setActiveTab('dashboard'); setEditClassName(c.name); }}
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                            selectedClassId === c.id ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100' : 'hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                        <span>{c.avatar || '🏫'}</span>
                        {c.name}
                    </button>
                ))}
            </div>

            {isAddingClass ? (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <input 
                        type="text" 
                        autoFocus
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Class Name (e.g. Room 5)"
                        className="w-full text-sm p-2 mb-2 border rounded-lg outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAddClass} disabled={!newClassName.trim()} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700">Create</button>
                        <button onClick={() => setIsAddingClass(false)} className="flex-1 bg-gray-200 text-gray-600 text-xs font-bold py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAddingClass(true)}
                    className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={16} /> Add Class
                </button>
            )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
            
            {activeTab === 'modules' ? (
                // --- CUSTOM MODULE CREATOR ---
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2"><Sparkles className="text-purple-500" /> Custom Word Lists</h2>
                        <p className="text-gray-500">Create a new lesson module by simply typing a list of words. Our AI will detect the patterns and generate the lesson content for you.</p>
                     </div>

                     <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                         <div className="grid gap-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">List Title</label>
                                 <input 
                                    type="text" 
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="e.g. Week 4: 'ough' words"
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500"
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">Word List (comma separated)</label>
                                 <textarea 
                                    value={customWords}
                                    onChange={(e) => setCustomWords(e.target.value)}
                                    placeholder="e.g. though, although, dough, plough, rough, tough, enough"
                                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 min-h-[100px]"
                                 />
                             </div>
                             <button 
                                onClick={handleCreateModule}
                                className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 self-start"
                             >
                                 Generate Lesson
                             </button>
                         </div>
                     </div>

                     <div>
                         <h3 className="font-bold text-gray-800 mb-4">Your Custom Modules</h3>
                         <div className="space-y-3">
                             {customModules.length === 0 && <p className="text-gray-400 italic">No custom modules created yet.</p>}
                             {customModules.map(m => (
                                 <div key={m.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
                                     <div>
                                         <h4 className="font-bold text-gray-800">{m.title}</h4>
                                         <p className="text-sm text-gray-500">{m.customWords?.length} words • {m.customWords?.slice(0, 5).join(', ')}...</p>
                                     </div>
                                     <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">Ready to Assign</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                </div>
            ) : activeTab === 'settings' ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto space-y-8">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-gray-400" /> Settings</h2>
                    
                    {/* Avatar Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-3">Your Avatar</label>
                        <div className="grid grid-cols-5 gap-2">
                            {AVATAR_OPTIONS.map(emoji => (
                                <button 
                                    key={emoji}
                                    onClick={() => handleUpdateAvatar(emoji)}
                                    className={`text-3xl p-3 rounded-xl transition-all ${teacher.avatar === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Class Management */}
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-3">Class Management ({selectedClass?.name})</label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="text"
                                value={editClassName}
                                onChange={(e) => setEditClassName(e.target.value)}
                                className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                                placeholder="Edit Class Name"
                            />
                            <button onClick={handleUpdateClassName} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
                                Save
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                         <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2"><Trash2 size={18}/> Danger Zone</h3>
                         <p className="text-sm text-red-600 mb-4">Resetting class data will wipe all student progress. This cannot be undone.</p>
                         <button className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-colors">
                             Reset Class Data (Coming Soon)
                         </button>
                    </div>
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <Users size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Create your first class</h2>
                    <p className="text-gray-500 max-w-md mb-8">Start by adding a class group on the left. Once created, you can add students and generate login codes.</p>
                    <button onClick={() => setIsAddingClass(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">
                        Create Class Group
                    </button>
                </div>
            ) : selectedStudentId && selectedStudent ? (
                // --- INDIVIDUAL STUDENT VIEW ---
                <div className="space-y-6">
                    <button onClick={() => setSelectedStudentId(null)} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 font-bold">
                        <ChevronRight className="rotate-180" size={16} /> Back to Class List
                    </button>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-6">
                         <div className="text-4xl bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center">
                             {selectedStudent.avatar}
                         </div>
                         <div className="flex-1">
                             <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h2>
                             <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                 <span>Year {selectedStudent.yearLevel || '?'}</span>
                                 <span>•</span>
                                 <span>{selectedStudent.xp} XP</span>
                                 <span>•</span>
                                 <span>{selectedStudent.currentStreak} Day Streak</span>
                             </div>
                         </div>
                         
                         {/* Placement Test Result Card */}
                         <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl max-w-sm">
                             <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                                 <Target size={12} /> Placement Test
                             </h4>
                             {selectedStudent.placementTestStatus === 'COMPLETED' ? (
                                 <div>
                                     <span className="text-lg font-bold text-indigo-900">Level {selectedStudent.placementLevel}</span>
                                     <p className="text-xs text-indigo-700 mt-1 leading-snug">{selectedStudent.placementAnalysis}</p>
                                 </div>
                             ) : (
                                 <div className="text-indigo-400 text-sm italic">Not completed yet.</div>
                             )}
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Assignment Control */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BookOpen size={18} className="text-indigo-500"/> Assign Modules</h3>
                            <div className="h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {[...MODULES, ...customModules].map(m => {
                                    const isAssigned = selectedStudent.assignedModuleIds?.includes(m.id);
                                    const isDone = selectedStudent.progress[m.id]?.completed;
                                    return (
                                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{m.title}</span>
                                                <span className="text-[10px] text-gray-400">{m.level} {m.isCustom ? '(Custom)' : ''}</span>
                                            </div>
                                            {isDone ? (
                                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Done</span>
                                            ) : (
                                                <button 
                                                    onClick={() => toggleAssignment(m.id)}
                                                    className={`p-2 rounded-lg transition-colors ${isAssigned ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    {isAssigned ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                         {/* Rewards Control */}
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Gift size={18} className="text-pink-500"/> Give Reward</h3>
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={rewardInput}
                                        onChange={(e) => setRewardInput(e.target.value)}
                                        placeholder="Reward (e.g. Free Time)"
                                        className="flex-grow px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-pink-500"
                                    />
                                    <button 
                                        onClick={giveReward}
                                        disabled={!rewardInput.trim()}
                                        className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedStudent.customRewards?.map((r, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-pink-700 bg-pink-50 px-3 py-2 rounded-lg">
                                        <Gift size={14} /> {r}
                                    </div>
                                ))}
                                {(!selectedStudent.customRewards || selectedStudent.customRewards.length === 0) && (
                                    <p className="text-sm text-gray-400 italic">No rewards given yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Analysis Text */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                            <h3 className="font-bold text-gray-800 mb-4">Deep Analysis</h3>
                            
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Areas of Strength</h4>
                                {getStudentAnalysis(selectedStudent).strengths.length > 0 ? (
                                    <ul className="space-y-1">
                                        {getStudentAnalysis(selectedStudent).strengths.map(s => (
                                            <li key={s} className="text-sm text-gray-600 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/> {s}</li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-400 italic">Keep practicing to build strengths.</p>}
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">Needs Focus</h4>
                                {getStudentAnalysis(selectedStudent).needsWork.length > 0 ? (
                                    <ul className="space-y-1">
                                        {getStudentAnalysis(selectedStudent).needsWork.map(s => (
                                            <li key={s} className="text-sm text-gray-600 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> {s}</li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-gray-400 italic">No major concerns yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Lesson Progress Bar Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6">Lesson Performance</h3>
                        <div className="h-64">
                             {getStudentModuleData(selectedStudent).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={getStudentModuleData(selectedStudent)} layout="vertical">
                                        <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                                        <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={12} width={100} />
                                        <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px'}} />
                                        <Legend />
                                        <Bar dataKey="score" name="Test Score %" fill="#8b5cf6" barSize={20} radius={[0, 4, 4, 0]} />
                                        <Line dataKey="confidence" name="Confidence Level" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                             ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No lessons completed yet.</div>
                             )}
                        </div>
                    </div>

                </div>
            ) : (
                // --- CLASS OVERVIEW ---
                <>
                {/* Class Overview Stats */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-6 text-gray-800">Performance Overview: {selectedClass?.name}</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={classChartData}>
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Student List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-lg font-bold text-gray-800">Students ({classStudents.length})</h2>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input 
                                type="text" 
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="Student Name"
                                className="flex-grow px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <button 
                                onClick={handleAddStudent}
                                disabled={!newStudentName.trim()}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                            >
                                Add Student
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Student</th>
                                    <th className="px-4 py-3">Login Code</th>
                                    <th className="px-4 py-3">Level</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map(s => (
                                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedStudentId(s.id)}>
                                        <td className="px-4 py-3 font-medium flex items-center gap-3">
                                            <span className="text-2xl bg-white p-1 rounded-full shadow-sm">{s.avatar}</span> 
                                            <span className="text-gray-700 font-bold">{s.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg w-fit font-mono font-bold text-xs tracking-wide">
                                                <Key size={12} />
                                                {s.loginCode}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold">Lvl {s.level}</div>
                                                {s.placementTestStatus === 'COMPLETED' && (
                                                    <div className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]" title="Determined by Placement Test">
                                                        <Target size={10} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1">
                                                View Analysis <ChevronRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {classStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                            <p>No students in this class yet.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;