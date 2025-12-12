import React, { useState, useEffect } from 'react';
import { ClassGroup, Student, Teacher } from '../types';
import { getClasses, getStudents, createStudent, createClass } from '../services/mockStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Plus, Trophy, Key, Copy, LogOut } from 'lucide-react';

interface Props {
  teacher: Teacher;
  onLogout: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ teacher, onLogout }) => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Form States
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  useEffect(() => {
    refreshData();
  }, [teacher]);

  const refreshData = () => {
    // Only fetch classes for this teacher
    const teacherClasses = getClasses(teacher.id);
    setClasses(teacherClasses);
    
    const allStudents = getStudents();
    setStudents(allStudents);

    // Auto-select first class if none selected
    if (!selectedClassId && teacherClasses.length > 0) {
        setSelectedClassId(teacherClasses[0].id);
    }
  };

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

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => selectedClass?.studentIds.includes(s.id));

  // Data for chart: Avg score per module for the class
  const chartData = [
    { name: 'Y1-2 CVC', score: 0, count: 0, id: 'm1' },
    { name: 'Y3-4 Magic E', score: 0, count: 0, id: 'm2' },
    { name: 'Y5-6 Prefix', score: 0, count: 0, id: 'm3' },
  ];

  classStudents.forEach(s => {
    chartData.forEach(d => {
        if (s.progress[d.id]) {
            d.score += s.progress[d.id].score;
            d.count += 1;
        }
    });
  });
  
  const finalChartData = chartData.map(d => ({
    name: d.name,
    avgScore: d.count > 0 ? Math.round(d.score / d.count) : 0
  }));

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
        <button onClick={onLogout} className="text-sm font-semibold text-gray-500 hover:text-red-500 flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={16} /> Log Out
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Class List */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">My Classes</h2>
            <div className="space-y-2">
                {classes.length === 0 && <p className="text-sm text-gray-400 italic mb-4">No classes yet.</p>}
                {classes.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedClassId(c.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                            selectedClassId === c.id ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100' : 'hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                        <Users size={18} />
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
            
            {classes.length === 0 ? (
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
            ) : (
                <>
                {/* Class Overview Stats */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-6 text-gray-800">Performance Overview: {selectedClass?.name}</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={finalChartData}>
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="avgScore" radius={[6, 6, 0, 0]}>
                                    {finalChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : index === 1 ? '#3b82f6' : '#ef4444'} />
                                    ))}
                                </Bar>
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
                                    <th className="px-4 py-3">XP / Stars</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map(s => (
                                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                                        <td className="px-4 py-3 text-yellow-600 font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">Lvl {s.level}</div>
                                                <span className="text-gray-400">•</span>
                                                <span>{s.xp} XP</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {['m1', 'm2', 'm3'].map(mid => (
                                                    <div 
                                                        key={mid} 
                                                        className={`w-2.5 h-2.5 rounded-full ${s.progress[mid]?.completed ? 'bg-green-500' : 'bg-gray-200'}`} 
                                                        title={s.progress[mid]?.completed ? 'Completed' : 'Not Started'}
                                                    />
                                                ))}
                                            </div>
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