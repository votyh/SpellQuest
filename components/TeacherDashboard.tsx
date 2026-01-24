
import React, { useState, useEffect } from 'react';
import { ClassGroup, Student, Teacher, ModuleTheme, LearningModule, ModuleProgress } from '../types';
import { getClasses, getStudents, createStudent, createClass, MODULES, updateStudent, updateClass, getCustomModules, saveCustomModule, subscribeToStore, bulkAssignModuleToClass } from '../services/mockStore';
import { Users, Plus, Trophy, ChevronRight, Settings, BookOpen, CheckCircle2, RefreshCw, Layers, Sparkles, LayoutGrid, Headphones, Book, BrainCircuit, LogOut, AlertCircle } from 'lucide-react';

interface Props {
  teacher: Teacher;
  onLogout: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ teacher, onLogout }) => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [customModules, setCustomModules] = useState<LearningModule[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assignments' | 'modules' | 'settings'>('dashboard');
  
  // Real-time Sync Indicator
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Form States
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [rewardInput, setRewardInput] = useState('');
  
  // Custom Module Form
  const [customTitle, setCustomTitle] = useState('');
  const [customWords, setCustomWords] = useState('');
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  
  // Settings Form
  const [editClassName, setEditClassName] = useState('');

  // Assessment State
  const [assessmentLevel, setAssessmentLevel] = useState<number>(1);
  const [assessmentFocus, setAssessmentFocus] = useState<string[]>([]);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToStore(() => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 800); 
        setLastSynced(new Date());
        refreshData();
    });
    return unsubscribe;
  }, [teacher]);

  const refreshData = () => {
    const teacherClasses = getClasses(teacher.id);
    setClasses(teacherClasses);
    const allStudents = getStudents();
    setStudents(allStudents);
    setCustomModules(getCustomModules());

    if (!selectedClassId && teacherClasses.length > 0) {
        setSelectedClassId(teacherClasses[0].id);
        setEditClassName(teacherClasses[0].name);
    } else if (selectedClassId) {
        const current = teacherClasses.find(c => c.id === selectedClassId);
        if (current) setEditClassName(current.name);
    }
  };

  const handleAddStudent = () => {
    if (newStudentName.trim() && selectedClassId) {
        createStudent(newStudentName, selectedClassId);
        setNewStudentName('');
    }
  };

  const handleCreateModule = () => {
      if (!customTitle.trim() || !customWords.trim()) return;
      const wordsArray = customWords.split(',').map(w => w.trim()).filter(w => w.length > 0);
      const newModule: LearningModule = {
          id: `custom_${Date.now()}`,
          title: customTitle,
          level: 'Custom List',
          theme: ModuleTheme.SPACE,
          description: `Teacher created: ${wordsArray.length} words`,
          ruleExplanation: 'Custom teacher list.',
          isCustom: true,
          customWords: wordsArray,
          createdBy: teacher.id
      };
      saveCustomModule(newModule);
      setCustomTitle('');
      setCustomWords('');
      setIsCreatingModule(false);
  }

  const toggleAssignment = (moduleId: string) => {
      if (!selectedStudent) return;
      const currentAssigned = selectedStudent.assignedModuleIds || [];
      const newAssigned = currentAssigned.includes(moduleId) 
        ? currentAssigned.filter(id => id !== moduleId)
        : [...currentAssigned, moduleId];
      
      const updated = { ...selectedStudent, assignedModuleIds: newAssigned };
      updateStudent(updated);
  }

  const handleBulkAssign = (moduleId: string, assign: boolean) => {
      if (!selectedClassId) return;
      if (confirm(`${assign ? 'Assign' : 'Unassign'} for everyone in ${selectedClass?.name}?`)) {
          bulkAssignModuleToClass(selectedClassId, moduleId, assign);
      }
  }

  // Handle saving the teacher assessment which triggers suggestions
  const saveAssessment = () => {
      if (selectedStudent) {
          const updated = { 
              ...selectedStudent, 
              teacherAssessment: {
                  readingLevel: assessmentLevel,
                  focusAreas: assessmentFocus
              }
          };
          updateStudent(updated);
          // Force refresh local view immediately
          setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => selectedClass?.studentIds.includes(s.id));
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Sync assessment state when student changes
  useEffect(() => {
      if (selectedStudent?.teacherAssessment) {
          setAssessmentLevel(selectedStudent.teacherAssessment.readingLevel);
          setAssessmentFocus(selectedStudent.teacherAssessment.focusAreas || []);
      } else {
          setAssessmentLevel(1);
          setAssessmentFocus([]);
      }
  }, [selectedStudentId]);

  const completedCounts = classStudents.reduce((acc, s) => acc + Object.values(s.progress).filter((p: ModuleProgress) => p.completed).length, 0);
  const avgLevel = classStudents.length > 0 ? (classStudents.reduce((acc, s) => acc + s.level, 0) / classStudents.length).toFixed(1) : '1.0';

  const renderAvatar = (avatar?: string, size: string = "text-xl") => {
      if (!avatar) return '👩‍🏫';
      if (avatar.startsWith('http')) {
          return <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />;
      }
      return <span className={size}>{avatar}</span>;
  }

  const FOCUS_OPTIONS = ['Phonics', 'Vowels', 'Endings', 'Roots', 'Prefixes', 'Suffixes', 'Blends', 'Silent Letters'];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* PROFESSIONAL SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col fixed inset-y-0 z-20 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold font-display text-xl shadow-md shadow-indigo-200">SQ</div>
              <div>
                  <h1 className="font-bold text-slate-800 leading-none">SpellQuest</h1>
                  <p className="text-xs text-slate-400 font-medium mt-1">Educator Portal</p>
              </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Navigation</div>
              <nav className="space-y-1">
                  <button 
                    onClick={() => { setActiveTab('dashboard'); setSelectedStudentId(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <LayoutGrid size={18} /> Overview
                  </button>
                  <button 
                    onClick={() => { setActiveTab('assignments'); setSelectedStudentId(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'assignments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <Layers size={18} /> Curriculum & Tasks
                  </button>
                  <button 
                    onClick={() => { setActiveTab('modules'); setSelectedStudentId(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'modules' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <Sparkles size={18} /> Custom Modules
                  </button>
                  <button 
                    onClick={() => { setActiveTab('settings'); setSelectedStudentId(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <Settings size={18} /> Class Settings
                  </button>
              </nav>

              <div className="mt-8 mb-4 px-2 flex justify-between items-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Classes</div>
                  <button onClick={() => setIsAddingClass(true)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Plus size={14}/></button>
              </div>
              <div className="space-y-1">
                  {classes.map(c => (
                      <button
                          key={c.id}
                          onClick={() => { setSelectedClassId(c.id); setSelectedStudentId(null); setEditClassName(c.name); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                              selectedClassId === c.id ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-indigo-500' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                          <span className="text-lg">{c.avatar || '🏫'}</span> {c.name}
                      </button>
                  ))}
                  {isAddingClass && (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                          <input 
                              autoFocus
                              className="w-full text-xs p-1 border rounded mb-2 outline-none focus:border-indigo-500"
                              placeholder="Class Name..."
                              value={newClassName}
                              onChange={(e) => setNewClassName(e.target.value)}
                          />
                          <div className="flex gap-2">
                              <button onClick={() => { 
                                  if(newClassName) createClass(newClassName, teacher.id); 
                                  setNewClassName(''); 
                                  setIsAddingClass(false); 
                              }} className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded">Save</button>
                              <button onClick={() => setIsAddingClass(false)} className="text-slate-500 text-[10px] px-2 py-1">Cancel</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>

          <div className="p-4 border-t border-slate-200">
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={18} /> Sign Out
              </button>
          </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
          
          {/* Top Header */}
          <div className="flex justify-between items-center mb-8">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800">{activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                  <p className="text-slate-500 text-sm">Managing <span className="font-bold text-indigo-600">{selectedClass?.name}</span></p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data Status</span>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          {isSyncing ? (
                              <span className="flex items-center gap-1 text-indigo-600"><RefreshCw size={12} className="animate-spin"/> Syncing...</span>
                          ) : (
                              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500"/> Synced {lastSynced.toLocaleTimeString()}</span>
                          )}
                      </div>
                  </div>
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-xl border-2 border-white shadow-sm overflow-hidden">
                      {renderAvatar(teacher.avatar)}
                  </div>
              </div>
          </div>

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Users size={24}/></div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{classStudents.length}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Students</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><Trophy size={24}/></div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{avgLevel}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg. Level</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><CheckCircle2 size={24}/></div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{completedCounts}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Modules Completed</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {!selectedStudentId ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Student Roster</h3>
                            <div className="flex gap-2">
                                <input 
                                    placeholder="Add new student..." 
                                    className="text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 w-64"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                                />
                                <button onClick={handleAddStudent} disabled={!newStudentName} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">Add</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Login Code</th>
                                        <th className="px-6 py-4">Level</th>
                                        <th className="px-6 py-4">Suggestions</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {classStudents.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No students yet. Add one above!</td></tr>
                                    )}
                                    {classStudents.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                                                <span className="text-xl">{s.avatar}</span> {s.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 w-fit font-bold">{s.loginCode}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Lvl {s.level}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.teacherAssessment ? (
                                                    <span className="text-green-600 flex items-center gap-1 font-bold text-xs"><CheckCircle2 size={14}/> Calibrated</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">Pending Review</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedStudentId(s.id)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs hover:underline">
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // STUDENT DETAIL VIEW
                    <div className="space-y-6">
                        <button onClick={() => setSelectedStudentId(null)} className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-bold mb-2">
                            <ChevronRight className="rotate-180" size={16}/> Back to Roster
                        </button>
                        
                        {/* Student Header */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl">{selectedStudent?.avatar}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent?.name}</h2>
                                <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium">
                                    <span>XP: <strong className="text-slate-800">{selectedStudent?.xp}</strong></span>
                                    <span>Streak: <strong className="text-slate-800">{selectedStudent?.currentStreak} Days</strong></span>
                                </div>
                            </div>
                            <div className="ml-auto flex gap-3">
                                <div className="flex items-center gap-2">
                                    <input 
                                        value={rewardInput} 
                                        onChange={(e) => setRewardInput(e.target.value)} 
                                        placeholder="Custom Reward..."
                                        className="text-sm px-3 py-2 border border-slate-200 rounded-lg w-48 outline-none focus:border-pink-500"
                                    />
                                    <button onClick={() => {
                                        if (selectedStudent && rewardInput) {
                                            updateStudent({...selectedStudent, customRewards: [rewardInput, ...(selectedStudent.customRewards || [])]});
                                            setRewardInput('');
                                        }
                                    }} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Send Gift</button>
                                </div>
                            </div>
                        </div>

                        {/* READING LOG ANALYSIS CARD */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl shadow-sm border border-orange-100 relative">
                             <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-sm">
                                <Headphones className="text-orange-600" size={20} />
                             </div>
                             <h3 className="font-bold text-lg mb-4 text-orange-900 flex items-center gap-2">
                                <Book size={20} /> Reading Analysis
                             </h3>
                             <p className="text-orange-800 text-sm mb-4">
                                Recent reading sessions, difficult vocabulary, and accuracy check.
                             </p>

                             {selectedStudent?.readingLog && selectedStudent.readingLog.length > 0 ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {selectedStudent.readingLog.slice(0, 3).map((session, idx) => (
                                         <div key={idx} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
                                             <div className="flex justify-between items-start mb-2">
                                                 <div className="text-xs text-slate-400 font-bold">{new Date(session.date).toLocaleDateString()}</div>
                                                 {session.targetText && <div className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">Story Mode</div>}
                                             </div>
                                             
                                             {/* Difficult Words */}
                                             <div className="mb-3">
                                                <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-1">New Vocab</h4>
                                                {session.difficultWords.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {session.difficultWords.map((dw, i) => (
                                                            <div key={i} title={dw.meaning} className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-bold border border-orange-200 cursor-help">
                                                                {dw.word}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-xs text-slate-300">None found</span>}
                                             </div>

                                             {/* Misread Words */}
                                             {session.misreadWords && session.misreadWords.length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-bold uppercase text-red-400 mb-1">Needs Practice</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {session.misreadWords.map((mw, i) => (
                                                            <div key={i} title={`Heard: "${mw.heard}"`} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-100 cursor-help">
                                                                {mw.word}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                             )}

                                             {session.targetText && (!session.misreadWords || session.misreadWords.length === 0) && (
                                                 <div className="text-xs font-bold text-green-600 flex items-center gap-1 mt-2">
                                                     <CheckCircle2 size={12} /> 100% Accuracy
                                                 </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-center py-6 border-2 border-dashed border-orange-200 rounded-xl bg-white/50">
                                     <p className="text-orange-400 text-sm font-bold">No reading sessions recorded yet.</p>
                                 </div>
                             )}
                        </div>

                        {/* AI Learning Path Assessment */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-indigo-100 relative">
                             <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-sm">
                                <BrainCircuit className="text-indigo-600" size={20} />
                             </div>
                             <h3 className="font-bold text-lg mb-4 text-indigo-900">AI Learning Path Assessment</h3>
                             <p className="text-indigo-700 text-sm mb-6 max-w-2xl">
                                Update the student's reading level and focus areas. Our algorithm will automatically tag suitable modules as "Recommended" in their portal.
                             </p>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-indigo-800 mb-2">Estimated Year Level</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-indigo-200 bg-white outline-none focus:ring-2 focus:ring-indigo-400"
                                        value={assessmentLevel}
                                        onChange={(e) => setAssessmentLevel(parseInt(e.target.value))}
                                    >
                                        {[...Array(14)].map((_, i) => ( // Updated to 14 to cover Years 1-13
                                            <option key={i+1} value={i+1}>Year {i+1}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-indigo-800 mb-2">Needs Focus On...</label>
                                    <div className="flex flex-wrap gap-2">
                                        {FOCUS_OPTIONS.map(opt => {
                                            const isSelected = assessmentFocus.includes(opt);
                                            return (
                                                <button 
                                                    key={opt}
                                                    onClick={() => {
                                                        if (isSelected) setAssessmentFocus(assessmentFocus.filter(f => f !== opt));
                                                        else setAssessmentFocus([...assessmentFocus, opt]);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-400 border-indigo-200 hover:border-indigo-400'}`}
                                                >
                                                    {opt}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                             </div>

                             <button 
                                onClick={saveAssessment}
                                className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                Update Assessment & Recalculate Suggestions
                             </button>
                        </div>

                        {/* Individual Assignment Panel */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Assignments & Suggestions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...MODULES, ...customModules].map(m => {
                                    const isAssigned = selectedStudent?.assignedModuleIds?.includes(m.id);
                                    const isSuggested = selectedStudent?.suggestedModuleIds?.includes(m.id);
                                    const isDone = selectedStudent?.progress[m.id]?.completed;
                                    
                                    return (
                                        <div key={m.id} className={`p-4 rounded-xl border transition-all ${isAssigned ? 'border-indigo-500 bg-indigo-50' : isSuggested ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm text-slate-700">{m.title}</h4>
                                                {isDone && <CheckCircle2 size={16} className="text-green-500" />}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                 {isSuggested && <span className="text-[10px] font-bold bg-green-200 text-green-800 px-2 py-0.5 rounded">AI Rec.</span>}
                                            </div>
                                            <div className="flex justify-between items-end mt-4">
                                                <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">{m.level}</span>
                                                <button 
                                                    onClick={() => toggleAssignment(m.id)}
                                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    {isAssigned ? 'Assigned' : 'Assign'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
              </>
          )}

          {/* CURRICULUM TAB (Assignments) */}
          {activeTab === 'assignments' && (
              <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-lg mb-2 text-slate-800">Class Assignments</h3>
                      <p className="text-slate-500 text-sm mb-6">Control which modules are available to <strong>all students</strong> in {selectedClass?.name}.</p>
                      
                      <div className="space-y-4">
                          {[...MODULES, ...customModules].map(m => (
                              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${m.isCustom ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                          {m.isCustom ? '✨' : '📚'}
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800">{m.title}</h4>
                                          <div className="flex items-center gap-2 text-xs text-slate-500">
                                              <span className="bg-slate-100 px-2 py-0.5 rounded">{m.level}</span>
                                              <span>• {m.description}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleBulkAssign(m.id, true)}
                                        className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100"
                                      >
                                          Assign All
                                      </button>
                                      <button 
                                        onClick={() => handleBulkAssign(m.id, false)}
                                        className="text-xs font-bold bg-slate-50 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100"
                                      >
                                          Unassign All
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* CUSTOM MODULES TAB */}
          {activeTab === 'modules' && (
              <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
                       <div className="absolute right-0 top-0 opacity-10 p-4">
                           <Sparkles size={120} />
                       </div>
                       <div className="relative z-10 max-w-lg">
                           <h2 className="text-2xl font-bold mb-2">Create Custom Learning Module</h2>
                           <p className="opacity-90 mb-6">Enter a list of words, and our AI will automatically generate a full lesson, including phonics rules, practice games, and a quiz.</p>
                           
                           {!isCreatingModule ? (
                               <button onClick={() => setIsCreatingModule(true)} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-50">
                                   + New Word List
                               </button>
                           ) : (
                               <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                                   <div className="mb-4">
                                       <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Module Title</label>
                                       <input 
                                            value={customTitle}
                                            onChange={(e) => setCustomTitle(e.target.value)}
                                            placeholder="e.g. Tricky Silent Letters"
                                            className="w-full p-3 rounded-lg bg-white/90 text-slate-800 outline-none focus:ring-2 focus:ring-white"
                                       />
                                   </div>
                                   <div className="mb-6">
                                       <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">Target Words (Comma Separated)</label>
                                       <textarea 
                                            value={customWords}
                                            onChange={(e) => setCustomWords(e.target.value)}
                                            placeholder="e.g. Knight, Gnat, Write, Comb, Lamb"
                                            className="w-full p-3 rounded-lg bg-white/90 text-slate-800 outline-none focus:ring-2 focus:ring-white h-24"
                                       />
                                   </div>
                                   <div className="flex gap-3">
                                       <button onClick={handleCreateModule} className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50">Generate Lesson</button>
                                       <button onClick={() => setIsCreatingModule(false)} className="bg-transparent border border-white/30 text-white px-6 py-2 rounded-lg font-bold hover:bg-white/10">Cancel</button>
                                   </div>
                               </div>
                           )}
                       </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {customModules.map(m => (
                          <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:border-purple-300 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                      <Sparkles size={24} />
                                  </div>
                                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded">Custom</span>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 mb-1">{m.title}</h3>
                              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{m.description}</p>
                              <div className="flex flex-wrap gap-1">
                                  {m.customWords?.slice(0, 5).map(w => (
                                      <span key={w} className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-600">{w}</span>
                                  ))}
                                  {(m.customWords?.length || 0) > 5 && <span className="text-xs text-slate-400 px-1">+{m.customWords!.length - 5} more</span>}
                              </div>
                          </div>
                      ))}
                      {customModules.length === 0 && !isCreatingModule && (
                          <div className="col-span-3 text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                              No custom modules yet. Create one to get started!
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && selectedClass && (
              <div className="max-w-2xl">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                      <h3 className="font-bold text-xl mb-6 text-slate-800">Classroom Settings</h3>
                      
                      <div className="mb-6">
                          <label className="block text-sm font-bold text-slate-700 mb-2">Class Name</label>
                          <input 
                              value={editClassName}
                              onChange={(e) => setEditClassName(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                          />
                      </div>

                      <div className="mb-8">
                           <label className="block text-sm font-bold text-slate-700 mb-2">Class Code / Join Link</label>
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-600 flex justify-between items-center">
                               <span>https://spellquest.nz/join/{selectedClass.id}</span>
                               <button className="text-indigo-600 font-bold text-sm hover:underline">Copy</button>
                           </div>
                           <p className="text-xs text-slate-400 mt-2">Share this link with students to auto-join (Mock functionality)</p>
                      </div>

                      <div className="flex gap-4">
                          <button 
                            onClick={() => {
                                updateClass({ ...selectedClass, name: editClassName });
                                alert('Settings saved!');
                            }}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700"
                          >
                              Save Changes
                          </button>
                      </div>
                  </div>
              </div>
          )}

      </main>
    </div>
  );
};

export default TeacherDashboard;
