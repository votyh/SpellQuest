import { ClassGroup, Student, ModuleTheme, LearningModule, Achievement, Teacher } from '../types';

// CHANGED TO v6 TO RESET DATA AND SUPPORT TEACHER AUTH
const STORAGE_KEY_STUDENTS = 'sq_students_v6';
const STORAGE_KEY_CLASSES = 'sq_classes_v6';
const STORAGE_KEY_TEACHERS = 'sq_teachers_v6';

// Seed Data
const SEED_TEACHER: Teacher = {
    id: 't1',
    name: 'Mrs. Goodspell',
    email: 'teacher@school.nz',
    password: 'password123'
};

const SEED_CLASSES: ClassGroup[] = [
  { id: 'c1', teacherId: 't1', name: 'Room 4 - Kea', studentIds: ['s1', 's2'] }
];

const SEED_STUDENTS: Student[] = [
  { 
      id: 's1', 
      loginCode: 'KEA-001', 
      name: 'Nethalee', 
      avatar: '🌸', 
      stars: 0, 
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(),
      progress: {}, 
      achievements: [] 
  },
  { 
      id: 's2', 
      loginCode: 'KEA-002', 
      name: 'Yuven', 
      avatar: '✈️', 
      stars: 0, 
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(), 
      progress: {}, 
      achievements: [] 
  },
];

export const MODULES: LearningModule[] = [
  {
    id: 'm1',
    title: 'CVC Forest',
    level: 'Years 1-2',
    theme: ModuleTheme.FOREST,
    description: 'Master short vowel sounds in the magical forest.',
    ruleExplanation: 'CVC words have a Consonant, Vowel, and Consonant. The vowel sound is usually short! e.g., C-a-t.',
  },
  {
    id: 'm4',
    title: 'Blends Beach',
    level: 'Years 1-2',
    theme: ModuleTheme.OCEAN,
    description: 'Listen to two letters working together like sh, ch, and th.',
    ruleExplanation: 'A digraph is when two letters make one sound (like "sh" in ship). A blend is when you hear both sounds (like "bl" in blue).',
  },
  {
    id: 'm2',
    title: 'Magic E Oasis',
    level: 'Years 3-4',
    theme: ModuleTheme.DESERT,
    description: 'Find the Magic E that changes vowel sounds.',
    ruleExplanation: 'When "e" sits at the end of a word, it stays silent but makes the other vowel say its name! (tim -> time).',
  },
  {
    id: 'm5',
    title: 'Vowel Team Valley',
    level: 'Years 3-4',
    theme: ModuleTheme.FOREST,
    description: 'When two vowels go walking, the first one does the talking.',
    ruleExplanation: 'In vowel teams like "ea" (meat) or "ai" (rain), the first vowel says its long name and the second one is silent.',
  },
  {
    id: 'm3',
    title: 'Prefix Volcano',
    level: 'Years 5-6',
    theme: ModuleTheme.VOLCANO,
    description: 'Climb the volcano of complex words with prefixes.',
    ruleExplanation: 'Prefixes go at the start (un-, re-, dis-) and change the meaning. "Happy" becomes "Unhappy" (not happy).',
  },
  {
    id: 'm6',
    title: 'Homophone Horizon',
    level: 'Years 5-6',
    theme: ModuleTheme.OCEAN,
    description: 'Words that sound the same but mean different things.',
    ruleExplanation: 'Homophones sound identical but have different spellings and meanings. Example: "There" (place), "Their" (owner), "They\'re" (they are).',
  },
  {
    id: 'm7',
    title: 'Etymology Expedition',
    level: 'Years 7-8',
    theme: ModuleTheme.SPACE,
    description: 'Discover the ancient Greek and Latin roots of English.',
    ruleExplanation: 'Many English words are built from old parts. "Tele" means far (telephone). "Scope" means to look (telescope).',
  }
];

// --- GETTERS ---

export const getStudents = (): Student[] => {
  const stored = localStorage.getItem(STORAGE_KEY_STUDENTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(SEED_STUDENTS));
    return SEED_STUDENTS;
  }
  return JSON.parse(stored);
};

export const getClasses = (teacherId?: string): ClassGroup[] => {
  const stored = localStorage.getItem(STORAGE_KEY_CLASSES);
  let classes: ClassGroup[];
  
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(SEED_CLASSES));
    classes = SEED_CLASSES;
  } else {
    classes = JSON.parse(stored);
  }

  if (teacherId) {
      return classes.filter(c => c.teacherId === teacherId);
  }
  return classes;
};

export const getTeachers = (): Teacher[] => {
    const stored = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify([SEED_TEACHER]));
        return [SEED_TEACHER];
    }
    return JSON.parse(stored);
};

// --- AUTHENTICATION & TEACHER MANAGEMENT ---

export const registerTeacher = (name: string, email: string, password: string): Teacher | null => {
    const teachers = getTeachers();
    if (teachers.find(t => t.email.toLowerCase() === email.toLowerCase())) {
        return null; // Already exists
    }
    const newTeacher: Teacher = {
        id: `t${Date.now()}`,
        name,
        email,
        password
    };
    teachers.push(newTeacher);
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    return newTeacher;
};

export const loginTeacher = (email: string, password: string): Teacher | null => {
    const teachers = getTeachers();
    const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase() && t.password === password);
    return teacher || null;
};

// --- CLASS MANAGEMENT ---

export const createClass = (name: string, teacherId: string): ClassGroup => {
    const classes = getClasses();
    const newClass: ClassGroup = {
        id: `c${Date.now()}`,
        teacherId,
        name,
        studentIds: []
    };
    classes.push(newClass);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
    return newClass;
}

// --- STUDENT MANAGEMENT ---

// Helper to calculate streaks
const updateStreak = (student: Student): Student => {
    const last = new Date(student.lastActiveDate);
    const now = new Date();
    const isSameDay = last.getDate() === now.getDate() && last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear();
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = last.getDate() === yesterday.getDate() && last.getMonth() === yesterday.getMonth() && last.getFullYear() === yesterday.getFullYear();

    if (isSameDay) return student; // No change

    if (wasYesterday) {
        student.currentStreak += 1;
    } else {
        student.currentStreak = 1; // Reset
    }
    student.lastActiveDate = now.toISOString();
    return student;
};

// Helper to calculate level
const calculateLevel = (xp: number) => {
    return Math.floor(xp / 500) + 1;
};

export const updateStudent = (updatedStudent: Student) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    // 1. Check for Achievements
    let processedStudent = checkForAchievements(updatedStudent);
    
    // 2. Update Level based on new XP
    processedStudent.level = calculateLevel(processedStudent.xp);

    // 3. Update Streak (This is usually called on Login or Activity Complete)
    processedStudent = updateStreak(processedStudent);

    students[index] = processedStudent;
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }
};

const checkForAchievements = (student: Student): Student => {
    const newAchievements: Achievement[] = [...student.achievements];
    const completedModules = Object.values(student.progress).filter(p => p.completed).length;

    const addAchievement = (id: string, title: string, icon: string, desc: string) => {
        if (!newAchievements.find(a => a.id === id)) {
            newAchievements.push({ id, title, icon, description: desc, unlockedAt: Date.now() });
        }
    };

    if (completedModules >= 1) addAchievement('first_step', 'First Step', '👣', 'Completed your first adventure!');
    if (completedModules >= 3) addAchievement('master_explorer', 'Master Explorer', '🗺️', 'Completed 3 adventures!');
    if (student.xp >= 1000) addAchievement('legend', 'Spelling Legend', '👑', 'Earned 1000 XP!');
    if (student.currentStreak >= 3) addAchievement('on_fire', 'On Fire', '🔥', '3 Day Streak!');

    return { ...student, achievements: newAchievements };
};

const generateLoginCode = (): string => {
    const prefixes = ['KIWI', 'KEA', 'TUI', 'FERN', 'HAKA', 'MOA'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900); // 3 digit number
    return `${prefix}-${num}`;
};

export const createStudent = (name: string, classId: string) => {
  const students = getStudents();
  const classes = getClasses();
  
  const newStudent: Student = {
    id: `s${Date.now()}`,
    loginCode: generateLoginCode(),
    name,
    avatar: '🐣',
    stars: 0,
    xp: 0,
    level: 1,
    currentStreak: 0,
    lastActiveDate: new Date(0).toISOString(), // Never active
    progress: {},
    achievements: []
  };
  
  students.push(newStudent);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));

  const clsIndex = classes.findIndex(c => c.id === classId);
  if (clsIndex !== -1) {
    classes[clsIndex].studentIds.push(newStudent.id);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  }
  
  return newStudent;
};

// Authenticate
export const authenticateStudent = (code: string): Student | null => {
    const students = getStudents();
    return students.find(s => s.loginCode.toUpperCase() === code.toUpperCase().trim()) || null;
};

// Get Classmates for Leaderboard
export const getClassmates = (studentId: string): Student[] => {
    const classes = getClasses();
    const students = getStudents();
    const myClass = classes.find(c => c.studentIds.includes(studentId));
    
    if (!myClass) return [];
    
    return students
        .filter(s => myClass.studentIds.includes(s.id))
        .sort((a, b) => b.xp - a.xp); // Sorted by XP desc
};
