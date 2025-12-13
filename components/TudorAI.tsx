import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Send, X, MessageCircle, Sparkles, Loader2, Volume2, Mic, HelpCircle, Book } from 'lucide-react';
import { askTudor } from '../services/geminiService';
import { speakText } from '../services/soundService';

interface Props {
    moduleTitle: string;
    ruleExplanation: string;
    currentQuestion: string;
    lessonWords?: string[];
}

const SUGGESTED_QUESTIONS = [
    "Can you give me a hint?",
    "Use it in a sentence.",
    "Explain the rule again.",
    "Why is this spelling right?"
];

const TudorAI: React.FC<Props> = ({ moduleTitle, ruleExplanation, currentQuestion, lessonWords }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user'|'tudor', text: string}[]>([
        { role: 'tudor', text: "Kia ora! I'm Tudor. Stuck on a tricky word? Ask me anything!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: text }]);
        setIsLoading(true);

        const response = await askTudor(text, {
            moduleTitle,
            rule: ruleExplanation,
            currentQuestion,
            exampleWords: lessonWords
        });

        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'tudor', text: response }]);
        speakText(response); // Auto-speak answer for accessibility
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Sorry, voice input is only available in Chrome or Edge.");
            return;
        }
        
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'en-NZ';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Optionally auto-send: handleSend(transcript);
        };

        recognition.start();
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
            >
                {isOpen ? <X size={28} /> : (
                    <div className="relative">
                        <GraduationCap size={28} />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                    </div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden flex flex-col max-h-[600px] h-[80vh]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4 text-white flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-full">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold font-display text-lg">Tudor AI</h3>
                                <p className="text-xs opacity-90 text-teal-50">Your Personal Tutor</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm flex flex-col gap-1 shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                    }`}>
                                        <span className="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                                        {msg.role === 'tudor' && (
                                            <button 
                                                onClick={() => speakText(msg.text)}
                                                className="self-start mt-1 p-1 bg-slate-100 rounded-full text-teal-600 hover:bg-teal-50 transition-colors"
                                                title="Listen"
                                            >
                                                <Volume2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-slate-400 text-xs">
                                        <Loader2 size={14} className="animate-spin" /> Tudor is thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions */}
                        <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSend(q)}
                                    className="whitespace-nowrap text-xs bg-white border border-teal-100 text-teal-700 px-3 py-1.5 rounded-full hover:bg-teal-50 transition-colors flex-shrink-0"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                            <button 
                                onClick={handleVoiceInput}
                                className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                <Mic size={20} />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask a question..."
                                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="bg-teal-500 text-white p-2 rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default TudorAI;