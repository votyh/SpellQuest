
import React, { useState, useEffect } from 'react';
import { ActivityItem, ActivityType, ModuleTheme, LearningModule, Student, LessonContent, LessonPhaseState, MistakeRecord } from '../types';
import { generateActivitiesForModule, evaluateStudentAnswer, generateLessonAnalysis } from '../services/geminiService';
import { playCorrectSound, playIncorrectSound, playFanfare, playTryAgainSound, speakText } from '../services/soundService';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Loader2, Sparkles, AlertCircle, CheckCircle, Volume2, BookOpen, GraduationCap, Lightbulb, RefreshCcw, Star, BrainCircuit, HelpCircle, Save, Mic } from 'lucide-react';
import { updateStudent, saveStudentProgressState } from '../services/mockStore';
import TudorAI from './TudorAI';
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
  const [subIndex, setSubIndex] = useState(0); 
  const [showRule, setShowRule] = useState(false);

  // User Input State
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [attemptsForCurrent, setAttemptsForCurrent] = useState(0);
  const [isListening, setIsListening] = useState(false); // Voice Input State

  // Concept Check Specific
  const [isGrading, setIsGrading] = useState(false);
  const [conceptResult, setConceptResult] = useState<{score: number, feedback: string} | null>(null);
  const [conceptAttempts, setConceptAttempts] = useState(0);

  // Scoring & Analysis
  const [testScore, setTestScore] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [lessonAnalysis, setLessonAnalysis] = useState<string>('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
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
    const savedProgress = student.progress[module.id];
    if (savedProgress && savedProgress.resumeState && !savedProgress.completed) {
        const state = savedProgress.resumeState;
        setLessonContent(state.content);
        setTestScore(state.testScore);
        setSubIndex(state.subIndex);
        setMistakes(state.mistakes || []);
        setPhase(state.phase as LessonPhase);
        
        // Restore detailed state
        if (state.userAnswer) setUserAnswer(state.userAnswer);
        if (state.feedback) setFeedback(state.feedback);
        if (state.feedbackTitle) setFeedbackTitle(state.feedbackTitle);
        if (state.attemptsForCurrent) setAttemptsForCurrent(state.attemptsForCurrent);
        return;
    }

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

  const saveProgress = (currentPhase: LessonPhase, currentSubIndex: number, currentScore: number) => {
      if (!lessonContent) return;
      if (currentPhase === 'SUMMARY' || currentPhase === 'LOADING' || currentPhase === 'ERROR') return;

      const stateToSave: LessonPhaseState = {
          phase: currentPhase,
          subIndex: currentSubIndex,
          testScore: currentScore,
          content: lessonContent,
          mistakes: mistakes,
          // Save granular state
          userAnswer: userAnswer,
          feedback: feedback,
          feedbackTitle: feedbackTitle,
          attemptsForCurrent: attemptsForCurrent
      };
      saveStudentProgressState(student.id, module.id, stateToSave);
  };

  const handleExit = () => {
      // Save current state before exiting
      saveProgress(phase, subIndex, testScore);
      onExit();
  };

  const startPhase = (newPhase: LessonPhase) => {
      setPhase(newPhase);
      setUserAnswer('');
      setFeedback(null);
      setAttemptsForCurrent(0);
      setSubIndex(0);
      setShowRule(false);
      
      // We manually clear these before saving for the next phase
      if (!lessonContent) return;
      const stateToSave: LessonPhaseState = {
          phase: newPhase,
          subIndex: 0,
          testScore: testScore,
          content: lessonContent,
          mistakes: mistakes,
          userAnswer: '',
          feedback: null,
          feedbackTitle: '',
          attemptsForCurrent: 0
      };
      saveStudentProgressState(student.id, module.id, stateToSave);
  };

  // --- SPEECH RECOGNITION ---
  const handleVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window)) {
          alert("Sorry, voice input is only available in Chrome or Edge.");
          return;
      }
      
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-NZ'; // Try for Kiwi accent
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          const clean = transcript.replace(/[^a-zA-Z]/g, '');
          setUserAnswer(clean);
      };

      recognition.start();
  }

  // Improved Answer Checking Logic
  const checkAnswer = (user: string, correct: string) => {
      const normalize = (s: string) => s.toLowerCase().trim()
          .replace(/\s+/g, ' ') // Collapse multiple spaces
          .replace(/[.,!?;:]$/, ''); // Remove trailing punctuation for looser matching
      
      const exactMatch = user.toLowerCase().trim() === correct.toLowerCase().trim();
      const looseMatch = normalize(user) === normalize(correct);
      
      return exactMatch || looseMatch;
  };

  const handlePracticeCheck = () => {
    if (!lessonContent) return;
    const current = lessonContent.practice[subIndex];
    
    if (checkAnswer(userAnswer, current.correctAnswer)) {
        setFeedback('correct');
        setFeedbackTitle('Spot on!');
        playCorrectSound();
    } else {
        if (attemptsForCurrent === 0) {
            setFeedback('hint');
            setAttemptsForCurrent(1);
            const dist = getEditDistance(userAnswer.toLowerCase().trim(), current.correctAnswer.toLowerCase().trim());
            const threshold = current.correctAnswer.length <= 4 ? 1 : 2;
            setFeedbackTitle(dist <= threshold && dist > 0 ? 'Almost Correct!' : 'Not quite right');
            playTryAgainSound();
        } else {
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
    setShowRule(false);
    
    if (subIndex < lessonContent.practice.length - 1) {
        const nextIdx = subIndex + 1;
        setSubIndex(nextIdx);
        saveProgress(phase, nextIdx, testScore);
    } else {
        setUserAnswer('');
        setSubIndex(0);
        setPhase('CONCEPT'); 
        startPhase('CONCEPT'); // This handles the save
    }
  };

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

  const handleQuizCheck = () => {
      if (!lessonContent) return;
      const current = lessonContent.quiz[subIndex];
      const isCorrect = checkAnswer(userAnswer, current.correctAnswer);

      if (isCorrect) {
          const newScore = testScore + 1;
          setTestScore(newScore);
          setFeedback('correct');
          setFeedbackTitle('Correct!');
          playCorrectSound();
      } else {
          if (attemptsForCurrent === 0) {
            setFeedback('hint');
            setAttemptsForCurrent(1);
            const dist = getEditDistance(userAnswer.toLowerCase().trim(), current.correctAnswer.toLowerCase().trim());
            const threshold = current.correctAnswer.length <= 4 ? 1 : 2;
            setFeedbackTitle(dist <= threshold && dist > 0 ? 'So close!' : 'Try again');
            playTryAgainSound();
          } else {
            // Record mistake on final fail
            setMistakes(prev => [...prev, {
                question: current.prompt,
                attempt: userAnswer,
                correct: current.correctAnswer
            }]);
            
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
      setShowRule(false);
      
      if (subIndex < lessonContent.quiz.length - 1) {
          const nextIdx = subIndex + 1;
          setSubIndex(nextIdx);
          saveProgress(phase, nextIdx, testScore);
      } else {
          setPhase('RATING'); // Move to Confidence Rating
          startPhase('RATING');
      }
  };

  const generateAnalysis = async () => {
      if (mistakes.length === 0) return;
      setIsGeneratingAnalysis(true);
      const result = await generateLessonAnalysis(module.title, mistakes);
      setLessonAnalysis(result.analysis);
      setIsGeneratingAnalysis(false);
  }

  const finishModule = () => {
    if (!lessonContent) return;
    
    const updatedStudent = { ...student };
    const oldScore = updatedStudent.progress[module.id]?.score || 0;
    const finalPercentage = Math.round((testScore / lessonContent.quiz.length) * 100);

    updatedStudent.progress[module.id] = {
        completed: true,
        score: Math.max(oldScore, finalPercentage),
        attempts: (updatedStudent.progress[module.id]?.attempts || 0) + 1,
        confidence: confidenceRating,
        performanceAnalysis: lessonAnalysis || undefined,
        resumeState: undefined
    };
    
    let xpEarned = 100;
    if (conceptResult) {
        xpEarned += (conceptResult.score * 10);
    }

    if (finalPercentage === 100) {
        updatedStudent.stars += 10;
        xpEarned += 50; 
    }
    updatedStudent.stars += 20; 
    updatedStudent.xp += xpEarned;

    updateStudent(updatedStudent);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    onComplete();
  };

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

  const Header = () => (
    <div className={`h-16 ${themeClasses} text-white flex items-center justify-between px-6 shadow-md shrink-0 relative z-20`}>
        <button onClick={handleExit} className="opacity-80 hover:opacity-100 font-bold flex items-center gap-1">
            <X size={20} /> Exit
        </button>
        <div className="font-display font-bold text-lg hidden md:block">{module.title}</div>
        <div className="flex items-center gap-2">
            {(phase === 'PRACTICE' || phase === 'TEST' || phase === 'CONCEPT') && (
                <button 
                    onClick={() => setShowRule(!showRule)} 
                    className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors flex items-center gap-2 px-4"
                >
                    <HelpCircle size={18} />
                    <span className="text-xs font-bold uppercase hidden sm:inline">Rule Reminder</span>
                </button>
            )}
            <div className="flex gap-2 items-center text-xs font-bold uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full">
                {phase.replace('_', ' ')}
            </div>
        </div>
    </div>
  );

  const RuleOverlay = () => (
      <AnimatePresence>
          {showRule && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-6 right-6 z-30 mx-auto max-w-2xl"
              >
                  <div className="bg-white p-6 rounded-2xl shadow-2xl border-2 border-yellow-200 text-left relative">
                      <button onClick={() => setShowRule(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                          <X size={20} />
                      </button>
                      <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                              <Lightbulb size={18} />
                          </div>
                          <h3 className="font-bold text-gray-800">Rule Reminder</h3>
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed">
                          {module.ruleExplanation}
                      </p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
  );

  // Extract all relevant words from the lesson for Tudor context
  const lessonWords = lessonContent ? [
      ...lessonContent.intro.examples.map(e => e.word),
      ...lessonContent.practice.map(p => p.correctAnswer),
      ...lessonContent.quiz.map(q => q.correctAnswer)
  ] : [];

  // Remove duplicates
  const uniqueLessonWords = Array.from(new Set(lessonWords));

  if (phase === 'INTRO') {
      const { intro } = lessonContent;
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            <Header />
            <TudorAI 
                moduleTitle={module.title} 
                ruleExplanation={module.ruleExplanation} 
                currentQuestion={`Introduction phase: ${intro.title}`}
                lessonWords={uniqueLessonWords}
            />
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

  if (phase === 'CONCEPT') {
      const passed = conceptResult && conceptResult.score >= 3;
      const failedTwice = conceptAttempts >= 2;
      const questionText = lessonContent.conceptCheck.question || `Explain the rule for ${module.title} in your own words.`;

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            <Header />
            <RuleOverlay />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto relative z-10">
                <TudorAI 
                    moduleTitle={module.title} 
                    ruleExplanation={module.ruleExplanation} 
                    currentQuestion={questionText} 
                    lessonWords={uniqueLessonWords}
                />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-xl w-full">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
                        <BrainCircuit size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">In your own words...</h2>
                    <p className="text-xl mb-6 text-gray-800">{questionText}</p>
                    
                    {!passed && !failedTwice ? (
                        <>
                            <div className="relative">
                                <textarea 
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl mb-4 text-lg focus:border-purple-500 outline-none min-h-[120px]"
                                    placeholder="Type your answer here..."
                                    disabled={isGrading}
                                />
                                <button 
                                    onClick={handleVoiceInput}
                                    className={`absolute bottom-6 right-4 p-2 rounded-full shadow-sm transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title="Speak answer"
                                >
                                    <Mic size={20} />
                                </button>
                            </div>
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
                            // Trigger analysis generation immediately
                            generateAnalysis();
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
                    
                    {/* Performance Analysis Section */}
                    {isGeneratingAnalysis ? (
                        <div className="bg-blue-50 p-4 rounded-2xl mb-6 flex items-center justify-center gap-3 text-blue-700">
                            <Loader2 className="animate-spin" /> Tudor is analyzing your results...
                        </div>
                    ) : lessonAnalysis ? (
                        <div className="bg-blue-50 p-6 rounded-2xl mb-8 text-left relative overflow-hidden border border-blue-100">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">🥝</div>
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-1">Tudor's Feedback</h3>
                                    <p className="text-blue-800 text-sm leading-relaxed italic">"{lessonAnalysis}"</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-6 rounded-2xl mb-8">
                            <p className="text-blue-900 text-lg font-medium">"{lessonContent.conclusion}"</p>
                        </div>
                    )}

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

  const options = [currentActivity.correctAnswer, ...(currentActivity.distractors || [])].sort();
  // Valid multiple choice needs more than just the answer. 
  const hasValidOptions = options.length > 1;

  // Decide input type: Force Text Input if it's explicitly a BUILD_WORD task OR if data generation failed to provide options.
  const showTextInput = currentActivity.type === ActivityType.BUILD_WORD || currentActivity.type === ActivityType.FIX_SENTENCE || !hasValidOptions;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <Header />
      <RuleOverlay />
      
      {/* Tudor AI Floating Assistant - Now with HIDDEN ANSWER context for hints */}
      <TudorAI 
        moduleTitle={module.title} 
        ruleExplanation={module.ruleExplanation} 
        currentQuestion={currentActivity.prompt} 
        correctAnswer={currentActivity.correctAnswer}
        lessonWords={uniqueLessonWords}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center relative z-10">
        <AnimatePresence mode='wait'>
            <motion.div 
                key={`${phase}-${subIndex}`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-3xl p-8 shadow-xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${((subIndex + 1) / totalItems) * 100}%` }}
                        className={`h-full ${themeClasses}`} 
                    />
                </div>
                
                <span className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    {isPractice ? 'Practice Question' : 'Mini Test'} {subIndex + 1} of {totalItems}
                </span>

                <h2 className="text-3xl font-bold text-black text-center mb-8 font-display leading-tight">
                    {currentActivity.prompt}
                </h2>

                <div className="w-full max-w-md">
                     {showTextInput ? (
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
                            
                            <div className="relative w-full">
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
                                {showTextInput && !feedback && (
                                    <button 
                                        onClick={handleVoiceInput}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        title="Speak answer"
                                    >
                                        <Mic size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                         <div className="grid grid-cols-2 gap-4">
                            {options.map((opt, i) => (
                                <motion.button
                                    key={opt}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => setUserAnswer(opt)}
                                    disabled={feedback === 'correct' || (feedback === 'incorrect' && phase === 'TEST') || (feedback === 'incorrect' && attemptsForCurrent > 0)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`p-6 rounded-2xl border-2 text-xl font-bold transition-all relative overflow-hidden ${
                                        userAnswer === opt && !feedback
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' 
                                            : userAnswer === opt && feedback === 'correct' 
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : userAnswer === opt && feedback === 'incorrect'
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-black'
                                    }`}
                                >
                                    <span className="relative z-10">{opt}</span>
                                </motion.button>
                            ))}
                         </div>
                    )}
                </div>
                
                {feedback && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`mt-8 p-4 rounded-xl w-full flex items-start gap-3 ${feedback === 'correct' ? 'bg-green-100 text-green-800' : feedback === 'hint' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                        {feedback === 'correct' ? <CheckCircle className="shrink-0 mt-1" /> : feedback === 'hint' ? <Lightbulb className="shrink-0 mt-1" /> : <AlertCircle className="shrink-0 mt-1" />}
                        <div className="flex-grow text-left">
                            <p className="font-bold">{feedbackTitle}</p>
                            <p className="text-sm">
                                {feedback === 'correct' ? currentActivity.explanation : feedback === 'hint' ? currentActivity.hint : currentActivity.explanation}
                            </p>
                            {feedback === 'incorrect' && (
                                <p className="font-bold mt-1 text-sm">Answer: {currentActivity.correctAnswer}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
      </main>

      <div className="p-6 max-w-2xl w-full mx-auto relative z-10">
        {!feedback || feedback === 'hint' ? (
             <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isPractice ? handlePracticeCheck : handleQuizCheck}
                disabled={!userAnswer}
                className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg flex items-center justify-center gap-2
                ${!userAnswer ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : feedback === 'hint' ? 'bg-orange-500 text-white' : `${themeClasses} text-white`}`}
             >
                {feedback === 'hint' ? <>Try Again <RefreshCcw size={24} /></> : <>Check Answer <Check size={24} /></>}
             </motion.button>
        ) : (
            <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={isPractice ? nextPractice : nextQuiz}
                className="w-full py-4 rounded-2xl font-bold text-xl shadow-lg bg-gray-800 text-white hover:bg-black flex items-center justify-center gap-2"
             >
                Next <ArrowRight size={24} />
             </motion.button>
        )}
      </div>
    </div>
  );
};

export default ActivityView;
