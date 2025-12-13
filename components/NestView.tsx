import React, { useState } from 'react';
import { Student, ShopItem } from '../types';
import { SHOP_ITEMS, updateStudent } from '../services/mockStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, Lock, ArrowLeft, Shirt, GraduationCap, Image, Glasses } from 'lucide-react';
import { playCorrectSound, playIncorrectSound } from '../services/soundService';
import confetti from 'canvas-confetti';

interface Props {
    student: Student;
    onClose: () => void;
}

const NestView: React.FC<Props> = ({ student, onClose }) => {
    const [activeCategory, setActiveCategory] = useState<'HAT' | 'GLASSES' | 'ACCESSORY' | 'BACKGROUND'>('HAT');
    
    // Filter items based on category
    const items = SHOP_ITEMS.filter(item => item.type === activeCategory);

    const handlePurchase = (item: ShopItem) => {
        if (student.inventory.includes(item.id)) {
            // Equip or Unequip
            const isEquipped = student.equipped[item.type.toLowerCase() as keyof typeof student.equipped] === item.id;
            const newEquipped = { ...student.equipped };
            
            if (isEquipped) {
                delete newEquipped[item.type.toLowerCase() as keyof typeof student.equipped];
            } else {
                newEquipped[item.type.toLowerCase() as keyof typeof student.equipped] = item.id;
            }

            const updated = { ...student, equipped: newEquipped };
            updateStudent(updated);
            playCorrectSound();
        } else {
            // Buy
            if (student.stars >= item.cost) {
                const updated = {
                    ...student,
                    stars: student.stars - item.cost,
                    inventory: [...student.inventory, item.id],
                    equipped: { ...student.equipped, [item.type.toLowerCase() as keyof typeof student.equipped]: item.id }
                };
                updateStudent(updated);
                playCorrectSound();
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 }
                });
            } else {
                playIncorrectSound();
            }
        }
    };

    // Helper to get item icon for the Kiwi Preview
    const getEquippedIcon = (type: string) => {
        const id = student.equipped[type as keyof typeof student.equipped];
        if (!id) return null;
        return SHOP_ITEMS.find(i => i.id === id)?.icon;
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between">
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold">
                    <ArrowLeft size={20} /> Back to Map
                </button>
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold">
                    <Star size={20} fill="currentColor" /> {student.stars}
                </div>
            </div>

            <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-6xl mx-auto w-full">
                
                {/* Left: Kiwi Preview */}
                <div className="md:w-1/3 flex flex-col items-center justify-center">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-80 h-80 rounded-full border-4 border-white shadow-2xl flex items-center justify-center bg-gradient-to-br from-teal-400 to-emerald-600 overflow-hidden"
                    >
                        {/* Dynamic Background */}
                        {getEquippedIcon('background') ? (
                             <div className="absolute inset-0 flex items-center justify-center text-[10rem] opacity-30 select-none">
                                 {getEquippedIcon('background')}
                             </div>
                        ) : (
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        )}

                        {/* The Kiwi */}
                        <div className="relative z-10 text-9xl">
                            🥝
                            {/* Layers for accessories */}
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-7xl drop-shadow-lg">
                                {getEquippedIcon('hat')}
                            </div>
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-6xl drop-shadow-md">
                                {getEquippedIcon('glasses')}
                            </div>
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 text-5xl drop-shadow-md">
                                {getEquippedIcon('accessory')}
                            </div>
                        </div>
                    </motion.div>
                    
                    <h2 className="mt-6 text-3xl font-display font-bold text-slate-800">Tudor's Nest</h2>
                    <p className="text-slate-500">Customize your learning companion!</p>
                </div>

                {/* Right: Shop Grid */}
                <div className="md:w-2/3 bg-white rounded-3xl shadow-lg p-6 flex flex-col">
                    
                    {/* Category Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        <button onClick={() => setActiveCategory('HAT')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeCategory === 'HAT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <GraduationCap size={18} /> Hats
                        </button>
                        <button onClick={() => setActiveCategory('GLASSES')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeCategory === 'GLASSES' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <Glasses size={18} /> Specs
                        </button>
                        <button onClick={() => setActiveCategory('ACCESSORY')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeCategory === 'ACCESSORY' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <Shirt size={18} /> Gear
                        </button>
                        <button onClick={() => setActiveCategory('BACKGROUND')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeCategory === 'BACKGROUND' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            <Image size={18} /> Scene
                        </button>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] p-2">
                        {items.map((item) => {
                            const isOwned = student.inventory.includes(item.id);
                            const isEquipped = student.equipped[item.type.toLowerCase() as keyof typeof student.equipped] === item.id;
                            const canAfford = student.stars >= item.cost;

                            return (
                                <motion.div 
                                    key={item.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                                        isEquipped ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                                    }`}
                                    onClick={() => handlePurchase(item)}
                                >
                                    <div className="text-5xl drop-shadow-sm">{item.icon}</div>
                                    <div className="text-center">
                                        <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                        {isOwned ? (
                                            <div className="text-xs font-bold text-green-600 mt-1 flex items-center justify-center gap-1">
                                                {isEquipped ? <><Check size={12} /> Equipped</> : 'Owned'}
                                            </div>
                                        ) : (
                                            <div className={`text-xs font-bold mt-1 flex items-center justify-center gap-1 ${canAfford ? 'text-yellow-600' : 'text-red-400'}`}>
                                                <Star size={12} fill="currentColor" /> {item.cost}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!isOwned && !canAfford && (
                                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
                                            <Lock className="text-slate-400" />
                                        </div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default NestView;
