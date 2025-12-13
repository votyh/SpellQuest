import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { generatePlacementTest, analyzePlacementTest, PlacementQuestion } from '../services/geminiService';
import { updateStudent } from '../services/mockStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle, BrainCircuit, Target, Sparkles, BookOpen } from 'lucide-react';
import { playCorrectSound, playFanfare } from '../services/soundService';
import confetti from 'canvas-confetti';

interface Props {
    student: Student;
    onComplete: () => void;
}

const PlacementTestView: React.FC<Props> = ({ student, onComplete }) => {
    const [status, setStatus] = useState<'LOADING' | 'INTRO' | 'TEST' | 'ANALYZING' | 'RESULT'>('LOADING');
    const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<{question: PlacementQuestion, isCorrect: boolean}[]>([]);
    const [finalLevel, setFinalLevel] = useState(1);
    const [analysis, setAnalysis] = useState('');
    
    // New state for "Select then Confirm" pattern
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    useEffect(() => {
        loadTest();
    }, []);

    const loadTest = async () => {
        const qs = await generatePlacementTest();
        setQuestions(qs);
        setStatus('INTRO');
    };

    const handleConfirm = () => {
        if (!selectedAnswer) return;

        const currentQ = questions[currentIndex];
        const isCorrect = selectedAnswer === currentQ.correctAnswer;
        
        if (isCorrect) playCorrectSound();

        const newResults = [...results, { question: currentQ, isCorrect }];
        setResults(newResults);
        
        // Reset selection for next question
        setSelectedAnswer(null);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            finishTest(newResults);
        }
    };

    const finishTest = async (finalResults: {question: PlacementQuestion, isCorrect: boolean}[]) => {
        setStatus('ANALYZING');
        const outcome = await analyzePlacementTest(finalResults);
        setFinalLevel(outcome.level);
        setAnalysis(outcome.analysis);
        
        // Save to student profile
        const updated = {
            ...student,
            placementTestStatus: 'COMPLETED' as const,
            placementLevel: outcome.level,
            placementAnalysis: outcome.analysis,
            level: outcome.level 
        };
        updateStudent(updated);
        
        playFanfare();
        confetti();
        setStatus('RESULT');
    };

    if (status === 'LOADING') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-50">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-indigo-900">Preparing your challenge...</h2>
            </div>
        );
    }

    if (status === 'INTRO') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl max-w-lg text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                        <Target size={40} />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-slate-800 mb-4">Placement Challenge</h1>
                    <p className="text-slate-600 mb-8 text-lg">
                        Let's find the perfect starting point for your adventure! 
                        Answer these 20 questions to show us what you know.
                    </p>
                    <button onClick={() => setStatus('TEST')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xl hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2">
                        Start Challenge <ArrowRight />
                    </button>
                </motion.div>
            </div>
        );
    }

    if (status === 'TEST') {
        const currentQ = questions[currentIndex];
        
        // Safety check if questions failed to load properly
        if (!currentQ) {
            return (
                 <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                     <div className="text-center">
                        <p className="text-red-500 font-bold mb-4">Error loading question.</p>
                        <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-4 py-2 rounded-lg">Retry</button>
                     </div>
                 </div>
            );
        }

        // We should memoize options or store them in state to prevent shuffling on re-render, 
        // but for this prototype, checking that options exist is enough.
        const options = [...currentQ.distractors, currentQ.correctAnswer].sort(); 

        return (
            <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-6">
                <div className="w-full max-w-2xl">
                    <div className="mb-6 flex justify-between items-center text-indigo-900 font-bold">
                        <span>Question {currentIndex + 1} of {questions.length}</span>
                        <span className="bg-indigo-100 px-3 py-1 rounded-full text-xs uppercase">Level {currentQ.level}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-indigo-200 rounded-full mb-8 overflow-hidden">
                        <motion.div 
                            initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            className="h-full bg-indigo-600"
                        />
                    </div>

                    <motion.div 
                        key={currentIndex}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-white p-8 rounded-3xl shadow-xl"
                    >
                        {/* Explicit text color to ensure visibility */}
                        <h2 className="text-2xl font-bold text-center mb-8 text-slate-800">
                            {currentQ.question || "Select the correct answer"}
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedAnswer(opt)}
                                    className={`p-4 rounded-xl border-2 text-lg font-medium transition-all ${
                                        selectedAnswer === opt 
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md ring-2 ring-indigo-200' 
                                            : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleConfirm}
                            disabled={!selectedAnswer}
                            className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all ${
                                selectedAnswer 
                                    ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-[1.02]' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Confirm Answer <CheckCircle size={20} />
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (status === 'ANALYZING') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-50">
                <BrainCircuit className="w-16 h-16 text-purple-600 animate-pulse mb-6" />
                <h2 className="text-2xl font-bold text-purple-900 mb-2">Analyzing your skills...</h2>
                <p className="text-slate-500">Our AI is determining your custom learning path.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-indigo-50 p-6">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-xl max-w-lg text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <Sparkles size={40} />
                </div>
                <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">Challenge Complete!</h1>
                <p className="text-slate-500 font-bold mb-6">We've updated your profile.</p>
                
                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Starting Level</div>
                    <div className="text-4xl font-bold text-indigo-600 mb-4">Level {finalLevel}</div>
                    <div className="text-slate-600 italic">"{analysis}"</div>
                </div>

                <button onClick={onComplete} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xl hover:bg-black shadow-lg">
                    Go to Dashboard
                </button>
            </motion.div>
        </div>
    );
};

export default PlacementTestView;