
import React, { useState, useEffect, useRef } from 'react';
import { Student, DifficultWord, MisreadWord } from '../types';
import { analyzeReadingLog, generateReadingPassage } from '../services/geminiService';
import { updateStudent } from '../services/mockStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2, BookOpen, ArrowLeft, Star, Volume2, Sparkles, RefreshCcw, Book, AlertCircle, Quote } from 'lucide-react';
import { speakText, playCorrectSound } from '../services/soundService';
import confetti from 'canvas-confetti';

interface Props {
    student: Student;
    onExit: () => void;
}

const ReadingRoom: React.FC<Props> = ({ student, onExit }) => {
    const [mode, setMode] = useState<'SELECT' | 'READING' | 'ANALYZING' | 'RESULTS'>('SELECT');
    const [isRecording, setIsRecording] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    
    // Live Transcript State (Visual Feedback only)
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState(''); 
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState(''); 
    
    // Story Mode State
    const [targetStory, setTargetStory] = useState<{title: string, content: string} | null>(null);

    // Results State
    const [difficultWords, setDifficultWords] = useState<DifficultWord[]>([]);
    const [misreadWords, setMisreadWords] = useState<MisreadWord[]>([]);
    const [feedback, setFeedback] = useState<string>('');
    const [assessedLevel, setAssessedLevel] = useState<string>('');
    
    // Audio Capture References
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startStoryMode = async () => {
        setIsGenerating(true);
        // Prioritize teacher assessed level, fall back to student profile year, default to 4
        const level = student.teacherAssessment?.readingLevel || student.yearLevel || 4;
        const story = await generateReadingPassage(level, 'Mystery');
        
        setTargetStory(story);
        setIsGenerating(false);
        setMode('READING');
        setTranscript('');
        setInterimTranscript('');
        setAudioReady(false);
        audioChunksRef.current = [];
    };

    const startFreeRead = () => {
        setTargetStory(null);
        setMode('READING');
        setTranscript('');
        setInterimTranscript('');
        setAudioReady(false);
        audioChunksRef.current = [];
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = async () => {
        setErrorMsg('');
        setAudioReady(false);
        audioChunksRef.current = [];

        try {
            // 1. Start Audio Recording (For Analysis)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // Vital: Update state when recorder actually stops and data is ready
            mediaRecorder.onstop = () => {
                setAudioReady(audioChunksRef.current.length > 0);
            };
            
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;

            // 2. Start Speech Recognition (For Visual Feedback ONLY)
            if ('webkitSpeechRecognition' in window) {
                const recognition = new (window as any).webkitSpeechRecognition();
                recognition.lang = 'en-NZ';
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let interim = '';
                    let final = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    if (final) setTranscript(prev => (prev + ' ' + final).trim());
                    setInterimTranscript(interim);
                };
                
                recognition.onerror = () => { /* Ignore visual recognition errors, we rely on audio */ };
                recognition.start();
                recognitionRef.current = recognition;
            }

            setIsRecording(true);
        } catch (e) {
            console.error(e);
            setErrorMsg("Could not access microphone. Please allow permissions.");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        // Stop Audio Recording - This will trigger onstop
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        
        // Stop Visual Recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        
        setIsRecording(false);
        setInterimTranscript('');
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
                const base64Data = base64String.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleAnalyze = async () => {
        // Ensure we have audio data
        if (audioChunksRef.current.length === 0 && !isRecording) {
            setErrorMsg("No audio recorded!");
            return;
        }

        // If still recording, stop first
        if (isRecording) stopRecording();

        setMode('ANALYZING');
        
        // Wait a brief moment for the media recorder 'stop' event to flush final chunks if not already ready
        if (!audioReady) {
             await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioBase64 = await blobToBase64(audioBlob);
            
            // Send actual audio to Gemini
            const result = await analyzeReadingLog(
                audioBase64, 
                'audio/webm',
                student.yearLevel || 4, 
                targetStory?.content
            );

            setDifficultWords(result.difficultWords);
            setMisreadWords(result.misreadWords);
            setFeedback(result.feedback);
            setAssessedLevel(result.assessedLevel);
            
            // Save to student profile
            const fullText = (transcript + ' ' + interimTranscript).trim();
            const newSession = {
                id: `read_${Date.now()}`,
                date: new Date().toISOString(),
                transcript: fullText || "(Audio Analyzed)",
                targetText: targetStory?.content,
                difficultWords: result.difficultWords,
                misreadWords: result.misreadWords,
                feedback: result.feedback,
                assessedLevel: result.assessedLevel
            };
            
            const updatedStudent = {
                ...student,
                readingLog: [newSession, ...(student.readingLog || [])],
                xp: student.xp + 20, 
                stars: student.stars + 1
            };
            
            updateStudent(updatedStudent);
            playCorrectSound();
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            setMode('RESULTS');

        } catch (error) {
            console.error("Analysis Failed", error);
            setErrorMsg("Analysis failed. Please try again.");
            setMode('READING');
        }
    };

    return (
        <div className="min-h-screen bg-orange-50 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between z-10">
                <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold">
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="font-display font-bold text-lg text-orange-800 flex items-center gap-2">
                    <BookOpen className="text-orange-500" /> Reading Room
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
                
                {/* MODE SELECTION */}
                {mode === 'SELECT' && (
                     <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="text-center mb-4">
                            <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">Choose your Reading Adventure</h2>
                            <p className="text-slate-500">How do you want to practice reading today?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                             <button onClick={startFreeRead} className="bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-orange-400 hover:scale-105 transition-all text-left group">
                                 <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:rotate-12 transition-transform">📚</div>
                                 <h3 className="text-xl font-bold text-slate-800 mb-2">Free Read</h3>
                                 <p className="text-slate-500 text-sm">Grab any book you have nearby and read it to Tudor.</p>
                             </button>

                             <button onClick={startStoryMode} disabled={isGenerating} className="bg-white p-8 rounded-3xl shadow-lg border-2 border-transparent hover:border-indigo-400 hover:scale-105 transition-all text-left group relative overflow-hidden">
                                 {isGenerating && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><Loader2 className="animate-spin text-indigo-500" /></div>}
                                 <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:rotate-12 transition-transform">✨</div>
                                 <h3 className="text-xl font-bold text-slate-800 mb-2">Mystery Story</h3>
                                 <p className="text-slate-500 text-sm">Let AI generate a new mystery story just for you!</p>
                             </button>
                        </div>
                     </div>
                )}

                {/* READING INTERFACE */}
                {mode === 'READING' && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        
                        {/* STORY DISPLAY */}
                        {targetStory ? (
                            <div className="w-full bg-white rounded-3xl p-8 shadow-md border border-indigo-100 mb-8 max-h-[40vh] overflow-y-auto">
                                <h2 className="text-2xl font-bold text-indigo-900 mb-4 font-display">{targetStory.title}</h2>
                                <p className="text-xl text-slate-700 leading-relaxed font-medium">{targetStory.content}</p>
                            </div>
                        ) : (
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready? Set? Read!</h2>
                                <p className="text-slate-500">I'm listening to whatever book you have chosen.</p>
                            </div>
                        )}

                        {/* Transcript Area (Visual Feedback) */}
                        <div className="w-full bg-orange-50/50 rounded-2xl p-4 border border-orange-100 min-h-[100px] mb-4 relative transition-colors">
                            <span className="text-xs font-bold text-orange-400 absolute top-2 right-2 uppercase tracking-wider">
                                {isRecording ? 'Listening...' : 'Transcript Preview'}
                            </span>
                            {transcript || interimTranscript ? (
                                <p className="text-slate-700 leading-relaxed text-lg">
                                    {transcript} <span className="text-slate-400 italic">{interimTranscript}</span>
                                </p>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                    {isRecording ? "Speak now..." : "Press microphone to start"}
                                </div>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-lg mb-4">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex flex-col items-center gap-6">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleRecording}
                                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}
                            >
                                {isRecording ? <Square size={32} className="text-white fill-white" /> : <Mic size={32} className="text-white" />}
                            </motion.button>
                            
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                {isRecording ? 'Stop Recording' : 'Press to Record'}
                            </p>

                            {/* Button appears if we have audio ready OR if we have a significant transcript fallback */}
                            {!isRecording && (audioReady || transcript.length > 5) && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleAnalyze}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700"
                                >
                                    Finish & Analyze <Sparkles size={18} />
                                </motion.button>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'ANALYZING' && (
                     <div className="flex-1 flex flex-col items-center justify-center text-center">
                         <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                         <h2 className="text-2xl font-bold text-indigo-900">Uploading Audio...</h2>
                         <p className="text-slate-500">Tudor is listening to your recording.</p>
                     </div>
                )}

                {/* RESULTS VIEW */}
                {mode === 'RESULTS' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-8 max-w-3xl mx-auto w-full">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <Star size={32} fill="currentColor" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Reading Complete!</h2>
                            <p className="text-slate-500">I've sent a report to your teacher.</p>
                        </div>
                        
                        {/* Tudor's Feedback Section */}
                        <div className="mb-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center relative z-10">
                                <div className="text-4xl">🥝</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-blue-900 text-lg mb-1 flex items-center gap-2">
                                        Tudor's Feedback 
                                        {assessedLevel && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider">{assessedLevel}</span>}
                                    </h3>
                                    <div className="text-blue-800 leading-relaxed italic flex gap-2">
                                        <Quote size={16} className="shrink-0 rotate-180 opacity-50" />
                                        {feedback}
                                        <Quote size={16} className="shrink-0 opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            
                            {/* Difficult Vocabulary */}
                            <div>
                                <h3 className="font-bold text-orange-600 mb-4 flex items-center gap-2"><Book size={18} /> New Vocabulary</h3>
                                <div className="space-y-3">
                                    {difficultWords.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No new vocabulary words found.</p>
                                    ) : (
                                        difficultWords.map((item, idx) => (
                                            <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-xl">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-800 capitalize">{item.word}</span>
                                                    <button onClick={() => speakText(item.word)} className="text-orange-400 hover:text-orange-600"><Volume2 size={14} /></button>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-snug">{item.meaning}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Misread Words */}
                            <div>
                                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2"><RefreshCcw size={18} /> Words to Practice</h3>
                                <div className="space-y-3">
                                    {misreadWords.length === 0 ? (
                                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-bold text-center">
                                            Perfect accuracy! Amazing job!
                                        </div>
                                    ) : (
                                        misreadWords.map((item, idx) => (
                                            <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-slate-800 capitalize">{item.word}</div>
                                                    <div className="text-xs text-red-400">Heard: "{item.heard}"</div>
                                                </div>
                                                <button onClick={() => speakText(item.word)} className="text-red-400 hover:text-red-600"><Volume2 size={16} /></button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button onClick={() => setMode('SELECT')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">
                                Read Another
                            </button>
                            <button onClick={onExit} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black">
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default ReadingRoom;
