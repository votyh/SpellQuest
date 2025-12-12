import React, { useState, useEffect } from 'react';
import { ActivityItem, ActivityType, ModuleTheme, LearningModule, Student, LessonContent } from '../types';
import { generateActivitiesForModule, evaluateStudentAnswer } from '../services/geminiService';
import { playCorrectSound, playIncorrectSound, playFanfare, playTryAgainSound, speakText } from '../services/soundService';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Loader2, Sparkles, AlertCircle, CheckCircle, Volume2, BookOpen, GraduationCap, Lightbulb, RefreshCcw, Star, BrainCircuit } from 'lucide-react';
import { updateStudent } from '../services/mockStore';
import confetti from 'canvas-confetti';

interface Props {
  module: LearningModule;
  student: Student;
  onComplete: () => void;
  onExit: () => void;
}

type LessonPhase = 'LOADING' | 'INTRO' | 'PRACTICE' | 'CONCEPT' | 'TEST' | 'RATING' | 'SUMMARY' | 'ERROR';
type FeedbackState = 'correct' | 'incorrect' | 'hint' | null;

// Levenshtein helper
const getEditDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const ActivityView: React.FC<Props> = ({ module, student, onComplete, onExit }) => {
  const [phase, setPhase] = useState<LessonPhase>('LOADING');
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  
  // Navigation State
  const [subIndex, setSubIndex] = useState(0); // Index for Practice or Quiz array
  
  // User Input State
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [attemptsForCurrent, setAttemptsForCurrent] = useState(0);

  // Concept Check Specific
  const [isGrading, setIsGrading] = useState(false);
  const [conceptResult, setConceptResult] = useState<{score: number, feedback: string} | null>(null);
  const [conceptAttempts, setConceptAttempts] = useState(0);

  // Scoring
  const [testScore, setTestScore] = useState(0);
  const [confidenceRating, setConfidenceRating] = useState(0);

  // Theme Helpers
  const themeClasses = module.theme === ModuleTheme.FOREST 
    ? 'bg-forest-500' 
    : module.theme === ModuleTheme.OCEAN 
      ? 'bg-ocean-500' 
      : 'bg-volcano-500';

  const lightThemeClasses = module.theme === ModuleTheme.FOREST 
  ? 'bg-forest-100 text-forest-900' 
  : module.theme === ModuleTheme.OCEAN 
    ? 'bg-ocean-100 text-ocean-900' 
    : 'bg-volcano-100 text-volcano-900';

  useEffect(() => {
    loadContent();
  }, [module]);

  const loadContent = async () => {
    setPhase('LOADING');
    try {
        const data = await generateActivitiesForModule(module);
        if (data) {
            setLessonContent(data);
            setPhase('INTRO');
        } else {
            setPhase('ERROR');
        }
    } catch (e) {
        console.error(e);
        setPhase('ERROR');
    }
  };

  // Helper to transition smoothly
  const startPhase = (newPhase: LessonPhase) => {
      setPhase(newPhase);
      setUserAnswer('');
      setFeedback(null);
      setAttemptsForCurrent(0);
      setSubIndex(0);
  };

  // --- LOGIC: PRACTICE PHASE ---
  const handlePracticeCheck = () => {
    if (!lessonContent) return;
    const current = lessonContent.practice[subIndex];
    const uAnswer = userAnswer.toLowerCase().trim();
    const cAnswer = current.correctAnswer.toLowerCase().trim();

    if (uAnswer === cAnswer) {
        setFeedback('correct');
        setFeedbackTitle('Spot on!');
        playCorrectSound();
    } else {
        if (attemptsForCurrent === 0) {
            // Hint
            setFeedback('hint');
            setAttemptsForCurrent(1);
            const dist = getEditDistance(uAnswer, cAnswer);
            const threshold = cAnswer.length <= 4 ? 1 : 2;
            setFeedbackTitle(dist <= threshold && dist > 0 ? 'Almost Correct!' : 'Not quite right');
            playTryAgainSound();
        } else {
            // Fail
            setFeedback('incorrect');
            setFeedbackTitle('Let\'s learn from this.');
            playIncorrectSound();
        }
    }
  };

  const nextPractice = () => {
    if (!lessonContent) return;
    setFeedback(null);
    setUserAnswer('');
    setAttemptsForCurrent(0);
    
    if (subIndex < lessonContent.practice.length - 1) {
        setSubIndex(s => s + 1);
    } else {
        // Transition to Concept Check
        // Explicitly clear answer state to prevent bleed-over
        setUserAnswer('');
        setPhase('CONCEPT'); 
        setSubIndex(0);
    }
  };

  // --- LOGIC: CONCEPT CHECK PHASE ---
  const handleConceptSubmit = async () => {
      if (!lessonContent) return;
      setIsGrading(true);
      const result = await evaluateStudentAnswer(
          lessonContent.conceptCheck.question, 
          userAnswer, 
          lessonContent.conceptCheck.gradingGuidance
      );
      
      setConceptResult(result);
      setIsGrading(false);

      if (result.score >= 3) {
          playCorrectSound();
          playFanfare();
      } else {
          setConceptAttempts(prev => prev + 1);
          playTryAgainSound();
      }
  };

  // --- LOGIC: QUIZ PHASE ---
  const handleQuizCheck = () => {
      if (!lessonContent) return;
      const current = lessonContent.quiz[subIndex];
      const uAnswer = userAnswer.toLowerCase().trim();
      const cAnswer = current.correctAnswer.toLowerCase().trim();
      const isCorrect = uAnswer === cAnswer;

      if (isCorrect) {
          setTestScore(s => s + 1);
          setFeedback('correct');
          setFeedbackTitle('Correct!');
          playCorrectSound();
      } else {
          // Allow 1 retry in Test too
          if (attemptsForCurrent === 0) {
            setFeedback('hint');
            setAttemptsForCurrent(1);
            
            // Re-use the nice distance logic for the title
            const dist = getEditDistance(uAnswer, cAnswer);
            const threshold = cAnswer.length <= 4 ? 1 : 2;
            setFeedbackTitle(dist <= threshold && dist > 0 ? 'So close!' : 'Try again');
            
            playTryAgainSound();
          } else {
            setFeedback('incorrect');
            setFeedbackTitle('Incorrect');
            playIncorrectSound();
          }
      }
  };

  const nextQuiz = () => {
      if (!lessonContent) return;
      setFeedback(null);
      setUserAnswer('');
      setAttemptsForCurrent(0);
      
      if (subIndex < lessonContent.quiz.length - 1) {
          setSubIndex(s => s + 1);
      } else {
          setPhase('RATING'); // Move to Confidence Rating
      }
  };

  // --- LOGIC: COMPLETION ---
  const finishModule = () => {
    if (!lessonContent) return;
    
    const updatedStudent = { ...student };
    const oldScore = updatedStudent.progress[module.id]?.score || 0;
    // Calculate final score based on Quiz Section
    const finalPercentage = Math.round((testScore / lessonContent.quiz.length) * 100);

    updatedStudent.progress[module.id] = {
        completed: true,
        score: Math.max(oldScore, finalPercentage),
        attempts: (updatedStudent.progress[module.id]?.attempts || 0) + 1,
        confidence: confidenceRating
    };
    
    // Awards
    let xpEarned = 100; // Base completion XP
    
    if (finalPercentage === 100) {
        updatedStudent.stars += 10;
        xpEarned += 50; // Perfect score bonus
    }
    updatedStudent.stars += 20; // Completion Stars
    updatedStudent.xp += xpEarned;

    updateStudent(updatedStudent);
    onComplete();
  };

  // --- RENDERERS ---

  if (phase === 'LOADING') {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center ${lightThemeClasses}`}>
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-xl font-display font-bold">Summoning Lesson Content...</p>
      </div>
    );
  }

  if (phase === 'ERROR' || !lessonContent) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-xl text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Content Unavailable</h2>
                <button onClick={onExit} className="px-6 py-2 bg-gray-200 rounded-lg">Exit</button>
            </div>
        </div>
    )
  }

  // --- HEADER ---
  const Header = () => (
    <div className={`h-16 ${themeClasses} text-white flex items-center justify-between px-6 shadow-md shrink-0`}>
        <button onClick={onExit} className="opacity-80 hover:opacity-100 font-bold flex items-center gap-1">
            <X size={20} /> Exit
        </button>
        <div className="font-display font-bold text-lg hidden md:block">{module.title}</div>
        <div className="flex gap-2 items-center text-xs font-bold uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full">
            {phase.replace('_', ' ')}
        </div>
    </div>
  );

  // --- PHASE: INTRO ---
  if (phase === 'INTRO') {
      const { intro } = lessonContent;
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">{intro.title}</h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">{intro.explanation}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
                        {intro.examples.map((ex, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg text-blue-600">{ex.word}</span>
                                    <button onClick={() => speakText(ex.word)} className="p-2 bg-white rounded-full shadow-sm hover:bg-blue-50"><Volume2 size={16} /></button>
                                </div>
                                <p className="text-sm text-gray-500 italic">"{ex.sentence}"</p>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => startPhase('PRACTICE')} className={`w-full py-4 rounded-xl font-bold text-xl shadow-lg ${themeClasses} text-white hover:brightness-110 flex items-center justify-center gap-2`}>
                        Start Practice <ArrowRight />
                    </button>
                </motion.div>
            </main>
        </div>
      );
  }

  // --- PHASE: CONCEPT CHECK ---
  if (phase === 'CONCEPT') {
      const passed = conceptResult && conceptResult.score >= 3;
      const failedTwice = conceptAttempts >= 2;

      // Fallback text if API returns empty question
      const questionText = lessonContent.conceptCheck.question || `Explain the rule for ${module.title} in your own words.`;

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                        <BrainCircuit size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">In your own words...</h2>
                    <p className="text-xl mb-6 text-gray-800">{questionText}</p>
                    
                    {!passed && !failedTwice ? (
                        <>
                            <textarea 
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                className="w-full p-4 border-2 border-gray-200 rounded-xl mb-4 text-lg focus:border-purple-500 outline-none min-h-[120px]"
                                placeholder="Type your answer here..."
                                disabled={isGrading}
                            />
                            {conceptResult && (
                                <div className="mb-4 text-orange-600 bg-orange-50 p-3 rounded-lg text-sm">
                                    <p className="font-bold">Not quite.</p>
                                    <p>{conceptResult.feedback}</p>
                                </div>
                            )}
                            <button 
                                onClick={handleConceptSubmit}
                                disabled={!userAnswer || isGrading}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGrading ? <Loader2 className="animate-spin" /> : 'Check Answer'}
                            </button>
                        </>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            {passed ? (
                                <>
                                    <div className="flex justify-center gap-1 mb-3 text-yellow-400">
                                        {[...Array(conceptResult.score)].map((_, i) => <Star key={i} fill="currentColor" />)}
                                    </div>
                                    <div className="font-bold text-lg mb-2 text-green-600">Great Job!</div>
                                </>
                            ) : (
                                <div className="font-bold text-lg mb-2 text-gray-600">Let's move on for now.</div>
                            )}
                            
                            <p className="text-gray-600 mb-6">{conceptResult ? conceptResult.feedback : "Don't worry, you'll get it next time!"}</p>
                            
                            <button 
                                onClick={() => startPhase('TEST')}
                                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold"
                            >
                                Continue to Mini Test <ArrowRight size={18} className="inline ml-2" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
      );
  }

  // --- PHASE: RATING ---
  if (phase === 'RATING') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6">How confident do you feel?</h2>
                    <div className="flex justify-center gap-4 mb-8">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button 
                                key={star}
                                onClick={() => setConfidenceRating(star)}
                                className={`transition-transform hover:scale-110 ${confidenceRating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                            >
                                <Star size={40} fill="currentColor" />
                            </button>
                        ))}
                    </div>
                    <button 
                        disabled={confidenceRating === 0}
                        onClick={() => {
                            playFanfare();
                            setPhase('SUMMARY');
                        }}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
                    >
                        Finish Lesson
                    </button>
                </motion.div>
            </main>
        </div>
      )
  }

  // --- PHASE: SUMMARY ---
  if (phase === 'SUMMARY') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
                        <GraduationCap size={32} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-800 mb-2">Lesson Complete!</h2>
                    <p className="text-gray-500 mb-6 font-bold">Test Score: {testScore}/{lessonContent.quiz.length}</p>
                    
                    <div className="bg-blue-50 p-6 rounded-2xl mb-8">
                        <p className="text-blue-900 text-lg font-medium">"{lessonContent.conclusion}"</p>
                    </div>

                    <button onClick={finishModule} className="w-full py-4 rounded-xl font-bold text-xl shadow-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2">
                        Complete & Collect Stars <Sparkles />
                    </button>
                </motion.div>
            </main>
        </div>
      );
  }

  // --- SHARED: PRACTICE & QUIZ RENDERER ---
  const isPractice = phase === 'PRACTICE';
  const currentActivity = isPractice ? lessonContent.practice[subIndex] : lessonContent.quiz[subIndex];
  const totalItems = isPractice ? lessonContent.practice.length : lessonContent.quiz.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        <AnimatePresence mode='wait'>
            <motion.div 
                key={`${phase}-${subIndex}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                className="bg-white rounded-3xl p-8 shadow-xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                    <div className={`h-full ${themeClasses} transition-all duration-500`} style={{ width: `${((subIndex + 1) / totalItems) * 100}%` }} />
                </div>
                
                <span className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    {isPractice ? 'Practice Question' : 'Mini Test'} {subIndex + 1} of {totalItems}
                </span>

                <h2 className="text-3xl font-bold text-black text-center mb-8 font-display leading-tight">
                    {currentActivity.prompt}
                </h2>

                {/* Input Area */}
                <div className="w-full max-w-md">
                     {currentActivity.type === ActivityType.BUILD_WORD || currentActivity.type === ActivityType.FIX_SENTENCE ? (
                        <div className="flex flex-col items-center">
                            
                            {/* LISTEN BUTTON: Specifically for BUILD_WORD tasks */}
                            {currentActivity.type === ActivityType.BUILD_WORD && (
                                <button 
                                    onClick={() => speakText(currentActivity.correctAnswer)}
                                    className="mb-6 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-bold flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Volume2 size={24} /> Listen to Word
                                </button>
                            )}

                            <motion.input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                disabled={feedback === 'correct' || (feedback === 'incorrect' && phase === 'TEST') || (feedback === 'incorrect' && attemptsForCurrent > 0)}
                                placeholder="Type answer..."
                                animate={feedback === 'correct' ? { 
                                    scale: [1, 1.05, 1],
                                    color: '#16a34a',
                                    borderColor: '#16a34a',
                                    textShadow: '0 0 8px rgba(34, 197, 94, 0.3)'
                                } : feedback === 'incorrect' ? {
                                    x: [0, -10, 10, -10, 10, 0],
                                    color: '#dc2626', 
                                    borderColor: '#dc2626'
                                } : {
                                    color: '#000000',
                                    borderColor: '#d1d5db'
                                }}
                                transition={{ duration: 0.4 }}
                                className={`w-full text-center text-4xl font-bold border-b-4 outline-none py-4 bg-transparent placeholder:text-gray-200 ${!feedback ? 'focus:border-blue-500' : ''}`}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                    ) : (
                         <div className="grid grid-cols-2 gap-4">
                            {[currentActivity.correctAnswer, ...(currentActivity.distractors || [])].sort().map(opt => (
                                <motion.button
                                    key={opt}
                                    onClick={() => setUserAnswer(opt)}
                                    disabled={feedback === 'correct' || (feedback === 'incorrect' && phase === 'TEST') || (feedback === 'incorrect' && attemptsForCurrent > 0)}
                                    animate={userAnswer === opt && feedback === 'correct' ? {
                                        scale: [1, 1.05, 1],
                                        backgroundColor: '#dcfce7',
                                        borderColor: '#16a34a',
                                        boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
                                    } : userAnswer === opt && feedback === 'incorrect' ? {
                                        x: [0, -10, 10, -10, 10, 0],
                                        borderColor: '#ef4444',
                                        backgroundColor: '#fee2e2'
                                    } : {
                                        scale: 1,
                                        x: 0
                                    }}
                                    className={`p-6 rounded-2xl border-2 text-xl font-bold transition-all relative overflow-hidden ${
                                        userAnswer === opt && !feedback
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' 
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-black'
                                    }`}
                                >
                                    <span className="relative z-10">{opt}</span>
                                    {userAnswer === opt && feedback === 'correct' && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1.5 }}
                                            className="absolute inset-0 bg-green-100 opacity-20"
                                        />
                                    )}
                                </motion.button>
                            ))}
                         </div>
                    )}
                </div>
                
                {/* Feedback Box */}
                {feedback && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`mt-8 p-4 rounded-xl w-full flex items-start gap-3 ${feedback === 'correct' ? 'bg-green-100 text-green-800' : feedback === 'hint' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                        {feedback === 'correct' ? <CheckCircle className="shrink-0 mt-1" /> : feedback === 'hint' ? <Lightbulb className="shrink-0 mt-1" /> : <AlertCircle className="shrink-0 mt-1" />}
                        <div className="flex-grow text-left">
                            <p className="font-bold">{feedbackTitle}</p>
                            <p className="text-sm">
                                {feedback === 'correct' ? currentActivity.explanation : feedback === 'hint' ? currentActivity.hint : currentActivity.explanation}
                            </p>
                            {/* Show Correct Answer on Incorrect Test or Incorrect Practice (2nd attempt) */}
                            {feedback === 'incorrect' && (
                                <p className="font-bold mt-1 text-sm">Answer: {currentActivity.correctAnswer}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
      </main>

      <div className="p-6 max-w-2xl w-full mx-auto">
        {!feedback || feedback === 'hint' ? (
             <button 
                onClick={isPractice ? handlePracticeCheck : handleQuizCheck}
                disabled={!userAnswer}
                className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                ${!userAnswer ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : feedback === 'hint' ? 'bg-orange-500 text-white' : `${themeClasses} text-white`}`}
             >
                {feedback === 'hint' ? <>Try Again <RefreshCcw size={24} /></> : <>Check Answer <Check size={24} /></>}
             </button>
        ) : (
            <button 
                onClick={isPractice ? nextPractice : nextQuiz}
                className="w-full py-4 rounded-2xl font-bold text-xl shadow-lg bg-gray-800 text-white hover:bg-black transition-transform active:scale-95 flex items-center justify-center gap-2"
             >
                Next <ArrowRight size={24} />
             </button>
        )}
      </div>
    </div>
  );
};

export default ActivityView;