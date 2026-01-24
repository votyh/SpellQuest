import React, { useState, useEffect } from 'react';
import { UserRole, Student, Teacher, LearningModule } from './types';
import { getStudents, getTeachers, MODULES, authenticateStudent, updateStudent, loginTeacher, registerTeacher, saveSession, clearSession, getSession, subscribeToStore, loginOrRegisterTeacherViaGoogle } from './services/mockStore';
import StudentPortal from './components/StudentPortal';
import TeacherDashboard from './components/TeacherDashboard';
import ActivityView from './components/ActivityView';
import { Users, GraduationCap, ArrowRight, Sparkles, BookOpen, ShieldCheck, ArrowLeft, Mail, Lock, User, School } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Placeholder Client ID - Replace with your own from Google Cloud Console
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  
  // Student Login State
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Teacher Auth State
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [className, setClassName] = useState('');
  const [teacherAuthError, setTeacherAuthError] = useState('');

  // Restore Session on Mount
  useEffect(() => {
    const session = getSession();
    if (session) {
        if (session.role === UserRole.STUDENT) {
            const students = getStudents();
            const student = students.find(s => s.id === session.id);
            if (student) {
                // Ensure streak is updated if it's a new day
                updateStudent(student);
                const updated = getStudents().find(s => s.id === student.id);
                setCurrentStudent(updated || student);
                setRole(UserRole.STUDENT);
            }
        } else if (session.role === UserRole.TEACHER) {
            const teachers = getTeachers();
            const teacher = teachers.find(t => t.id === session.id);
            if (teacher) {
                setCurrentTeacher(teacher);
                setRole(UserRole.TEACHER);
            }
        }
    }
  }, []);

  // Global Sync Listener
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
        if (role === UserRole.STUDENT && currentStudent) {
            const freshStudents = getStudents();
            const fresh = freshStudents.find(s => s.id === currentStudent.id);
            if (fresh) setCurrentStudent(fresh);
        } else if (role === UserRole.TEACHER && currentTeacher) {
            const freshTeachers = getTeachers();
            const fresh = freshTeachers.find(t => t.id === currentTeacher.id);
            if (fresh) setCurrentTeacher(fresh);
        }
    });
    return unsubscribe;
  }, [role, currentStudent?.id, currentTeacher?.id]);

  // Handle Google Sign-In Initialization
  useEffect(() => {
      // Check if showTeacherAuth is true and google script is loaded
      if (showTeacherAuth && (window as any).google) {
          try {
            (window as any).google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredentialResponse
            });
            (window as any).google.accounts.id.renderButton(
                document.getElementById("googleButton"),
                { theme: "outline", size: "large", width: "100%", text: "continue_with" } 
            );
          } catch (e) {
              console.log("Google Init Error (likely missing client_id)", e);
          }
      }
  }, [showTeacherAuth]);

  // Decode JWT without external lib
  const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
  };

  const handleGoogleCredentialResponse = (response: any) => {
      const payload = decodeJwt(response.credential);
      if (payload) {
          const { email, name, picture } = payload;
          const teacher = loginOrRegisterTeacherViaGoogle(email, name, picture);
          
          setCurrentTeacher(teacher);
          setRole(UserRole.TEACHER);
          saveSession(UserRole.TEACHER, teacher.id);
          setShowTeacherAuth(false);
      }
  };

  const handleStudentLogin = () => {
    const student = authenticateStudent(loginCode);
    if (student) {
        updateStudent(student); 
        const updated = getStudents().find(s => s.id === student.id);
        setCurrentStudent(updated || student);
        setRole(UserRole.STUDENT);
        saveSession(UserRole.STUDENT, student.id);
        setLoginCode('');
        setLoginError('');
    } else {
        setLoginError('Invalid code. Please check with your teacher.');
    }
  };

  const handleTeacherAuth = () => {
      setTeacherAuthError('');
      if (!teacherEmail || !teacherPassword) {
          setTeacherAuthError('Please fill in all fields.');
          return;
      }

      if (isRegistering) {
          if (!teacherName) {
              setTeacherAuthError('Please provide your name.');
              return;
          }
          if (!className) {
              setTeacherAuthError('Please provide a class name.');
              return;
          }
          const newTeacher = registerTeacher(teacherName, teacherEmail, teacherPassword, className);
          if (newTeacher) {
              setCurrentTeacher(newTeacher);
              setRole(UserRole.TEACHER);
              saveSession(UserRole.TEACHER, newTeacher.id);
              setShowTeacherAuth(false);
          } else {
              setTeacherAuthError('Email already registered.');
          }
      } else {
          // Login
          const teacher = loginTeacher(teacherEmail, teacherPassword);
          if (teacher) {
              setCurrentTeacher(teacher);
              setRole(UserRole.TEACHER);
              saveSession(UserRole.TEACHER, teacher.id);
              setShowTeacherAuth(false);
          } else {
              setTeacherAuthError('Invalid email or password.');
          }
      }
  };

  const handleModuleSelect = (moduleId: string) => {
    const m = MODULES.find(mod => mod.id === moduleId);
    if (m) setActiveModule(m);
  };

  const handleModuleComplete = () => {
    if (currentStudent) {
        const updated = getStudents().find(s => s.id === currentStudent.id);
        if (updated) setCurrentStudent(updated);
    }
    setActiveModule(null);
  };

  const resetTeacherForm = () => {
      setTeacherEmail('');
      setTeacherPassword('');
      setTeacherName('');
      setClassName('');
      setTeacherAuthError('');
      setIsRegistering(false);
  }

  // 1. Activity View (Game Loop)
  if (role === UserRole.STUDENT && currentStudent && activeModule) {
    return (
      <ActivityView 
        module={activeModule} 
        student={currentStudent} 
        onComplete={handleModuleComplete}
        onExit={() => setActiveModule(null)}
      />
    );
  }

  // 2. Student Portal
  if (role === UserRole.STUDENT && currentStudent) {
    return (
      <StudentPortal 
        student={currentStudent} 
        onSelectModule={handleModuleSelect}
        onLogout={() => {
            clearSession();
            setRole(null);
            setCurrentStudent(null);
        }}
      />
    );
  }

  // 3. Teacher Dashboard
  if (role === UserRole.TEACHER && currentTeacher) {
    return (
      <TeacherDashboard 
        teacher={currentTeacher}
        onLogout={() => {
            clearSession();
            setRole(null);
            setCurrentTeacher(null);
            resetTeacherForm();
        }} 
      />
    );
  }

  // 4. Modern Landing / Login Screen
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200 rounded-full blur-[100px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[80px] opacity-40 animate-pulse" style={{animationDelay: '2s'}} />

        <div className="max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center p-6 gap-8 relative z-10">
            
            {/* Branding & Value Prop */}
            <div className="text-center max-w-2xl">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-blue-600 font-bold text-sm mb-6 border border-blue-50">
                        <Sparkles size={16} /> New Zealand Curriculum Aligned
                    </div>
                    <h1 className="text-6xl lg:text-7xl font-display font-bold text-slate-900 leading-tight mb-6">
                        SpellQuest <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">NZ</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto">
                        The intelligent, gamified spelling platform for Kiwi classrooms. Powered by AI to adapt to every student's learning journey.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-slate-500">
                        <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-500" /> Safe & Secure</div>
                        <div className="flex items-center gap-2"><BookOpen size={18} className="text-blue-500" /> Years 1-8 + NCEA</div>
                    </div>
                </motion.div>
            </div>

            {/* Login Interface */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:w-[480px] w-full"
            >
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 min-h-[500px] flex flex-col justify-center relative">
                    
                    <AnimatePresence mode="wait">
                        {!showTeacherAuth ? (
                            <motion.div
                                key="student-login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full"
                            >
                                {/* Student Login Mode */}
                                <div className="mb-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                            <GraduationCap size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold font-display text-slate-800">Student Login</h2>
                                            <p className="text-slate-500 text-sm">Enter the code from your teacher</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                value={loginCode}
                                                onChange={(e) => setLoginCode(e.target.value)}
                                                placeholder="e.g. KEA-123"
                                                className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-lg text-slate-700 placeholder:text-slate-300 transition-all uppercase tracking-wider"
                                            />
                                            <button 
                                                onClick={handleStudentLogin}
                                                disabled={!loginCode}
                                                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg flex items-center justify-center transition-colors shadow-md"
                                            >
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                        {loginError && (
                                            <p className="text-red-500 font-medium text-sm text-center">{loginError}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-8"></div>

                                {/* Switch to Teacher */}
                                <div>
                                    <button 
                                        onClick={() => setShowTeacherAuth(true)}
                                        className="w-full py-3 px-4 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        <Users size={18} className="group-hover:scale-110 transition-transform" />
                                        Teacher Dashboard Access
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="teacher-auth"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full"
                            >
                                <button 
                                    onClick={() => {
                                        setShowTeacherAuth(false);
                                        resetTeacherForm();
                                    }}
                                    className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 mb-6 uppercase tracking-wider"
                                >
                                    <ArrowLeft size={14} /> Back to Student Login
                                </button>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold font-display text-slate-800">{isRegistering ? 'Teacher Sign Up' : 'Teacher Login'}</h2>
                                        <p className="text-slate-500 text-sm">{isRegistering ? 'Create your classroom account' : 'Welcome back, educator'}</p>
                                    </div>
                                </div>

                                {/* GOOGLE SIGN IN BUTTON */}
                                <div className="mb-6">
                                    <div id="googleButton" className="w-full min-h-[44px]"></div>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                                    <span className="text-xs font-bold text-slate-400">OR EMAIL</span>
                                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                                </div>

                                <div className="space-y-4">
                                    {isRegistering && (
                                        <>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                            <input 
                                                type="text"
                                                value={teacherName}
                                                onChange={(e) => setTeacherName(e.target.value)}
                                                placeholder="Full Name (e.g. Mrs. Smith)"
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-slate-700 transition-all"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                            <input 
                                                type="text"
                                                value={className}
                                                onChange={(e) => setClassName(e.target.value)}
                                                placeholder="Class Name (e.g. Room 10)"
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-slate-700 transition-all"
                                            />
                                        </div>
                                        </>
                                    )}

                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                        <input 
                                            type="email"
                                            value={teacherEmail}
                                            onChange={(e) => setTeacherEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-slate-700 transition-all"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                                        <input 
                                            type="password"
                                            value={teacherPassword}
                                            onChange={(e) => setTeacherPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-medium text-slate-700 transition-all"
                                        />
                                    </div>

                                    {teacherAuthError && (
                                        <p className="text-red-500 text-sm font-medium text-center">{teacherAuthError}</p>
                                    )}

                                    <button 
                                        onClick={handleTeacherAuth}
                                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95"
                                    >
                                        {isRegistering ? 'Create Account' : 'Sign In'}
                                    </button>

                                    <div className="text-center mt-4">
                                        <button 
                                            onClick={() => {
                                                setIsRegistering(!isRegistering);
                                                setTeacherAuthError('');
                                            }}
                                            className="text-sm text-slate-500 hover:text-purple-600 font-semibold"
                                        >
                                            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
                
                <p className="text-center text-slate-400 text-xs font-semibold mt-8">
                    Prototype v0.5 • Powered by Gemini • Designed for NZC
                </p>
            </motion.div>
        </div>
    </div>
  );
};

export default App;
