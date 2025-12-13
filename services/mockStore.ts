import { ClassGroup, Student, ModuleTheme, LearningModule, Achievement, Teacher, UserRole, ModuleProgress, LessonPhaseState, ShopItem } from '../types';

// CHANGED TO v18 FOR CONTENT UPDATE
const STORAGE_KEY_STUDENTS = 'sq_students_v18';
const STORAGE_KEY_CLASSES = 'sq_classes_v18';
const STORAGE_KEY_TEACHERS = 'sq_teachers_v18';
const STORAGE_KEY_SESSION = 'sq_session_v18';
const STORAGE_KEY_CUSTOM_MODULES = 'sq_custom_modules_v18';

// Seed Data
const SEED_TEACHER: Teacher = {
    id: 't1',
    name: 'Mr. D', 
    email: 'vonalad@gmail.com',
    password: 'buddl9ja',
    avatar: '👨‍🏫'
};

const SEED_CLASSES: ClassGroup[] = [
  { id: 'c1', teacherId: 't1', name: 'Room 1', studentIds: ['s1', 's2'], avatar: '🚀' }
];

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'hat_top', name: 'Top Hat', type: 'HAT', icon: '🎩', cost: 20 },
    { id: 'hat_cap', name: 'Cool Cap', type: 'HAT', icon: '🧢', cost: 15 },
    { id: 'hat_crown', name: 'Royal Crown', type: 'HAT', icon: '👑', cost: 50 },
    { id: 'hat_wizard', name: 'Wizard Hat', type: 'HAT', icon: '🧙‍♂️', cost: 40 },
    { id: 'glass_sunglasses', name: 'Sunnies', type: 'GLASSES', icon: '😎', cost: 15 },
    { id: 'glass_nerd', name: 'Smart Specs', type: 'GLASSES', icon: '👓', cost: 10 },
    { id: 'acc_bow', name: 'Bow Tie', type: 'ACCESSORY', icon: '🎀', cost: 10 },
    { id: 'acc_scarf', name: 'Scarf', type: 'ACCESSORY', icon: '🧣', cost: 12 },
    { id: 'acc_medal', name: 'Medal', type: 'ACCESSORY', icon: '🥇', cost: 30 },
    { id: 'bg_forest', name: 'Forest', type: 'BACKGROUND', icon: '🌲', cost: 25 },
    { id: 'bg_beach', name: 'Beach', type: 'BACKGROUND', icon: '🏖️', cost: 25 },
    { id: 'bg_space', name: 'Space', type: 'BACKGROUND', icon: '🌌', cost: 40 },
];

const SEED_STUDENTS: Student[] = [
  { 
      id: 's1', 
      loginCode: 'MOA-176', 
      name: 'Nethalee', 
      avatar: '👸', 
      yearLevel: 4,
      stars: 50, // Give some starting cash for testing
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(),
      progress: {}, 
      achievements: [],
      assignedModuleIds: [], 
      customRewards: [],
      placementTestStatus: 'NOT_STARTED',
      inventory: [],
      equipped: {}
  },
  { 
      id: 's2', 
      loginCode: 'HAKA-283', 
      name: 'Yuven', 
      avatar: '✈️', 
      yearLevel: 4,
      stars: 0, 
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(), 
      progress: {}, 
      achievements: [],
      assignedModuleIds: [],
      customRewards: [],
      placementTestStatus: 'NOT_STARTED',
      inventory: [],
      equipped: {}
  },
];

export const MODULES: LearningModule[] = [
  // --- NZC LEVEL 1 (The Code: Pink/Red/Yellow) ---
  {
    id: 'code_1',
    title: 'Initial Sounds (SATPIN)',
    level: 'Level 1 (Year 0-1)',
    theme: ModuleTheme.FOREST,
    description: 'Start your journey with the most common sounds: S, A, T, P, I, N.',
    ruleExplanation: 'These letters make distinct sounds. "A" says /a/ like apple. "S" says /s/ like snake.',
  },
  {
    id: 'code_2',
    title: 'CVC Foundations',
    level: 'Level 1 (Year 1)',
    theme: ModuleTheme.FOREST,
    description: 'Building simple words with Consonant-Vowel-Consonant.',
    ruleExplanation: 'In a CVC word, the vowel is usually short. C-a-t (Cat), H-o-t (Hot).',
  },
  {
    id: 'code_3',
    title: 'Digraph Discovery',
    level: 'Level 1 (Year 1-2)',
    theme: ModuleTheme.OCEAN,
    description: 'Two letters making one sound: sh, ch, th, ng.',
    ruleExplanation: 'A digraph is two letters holding hands to make a new sound. "S" and "H" together say /sh/ like "Ship".',
  },
  {
    id: 'code_4',
    title: 'Blends Beach',
    level: 'Level 1 (Year 2)',
    theme: ModuleTheme.OCEAN,
    description: 'Consonant blends at the start and end of words (st, bl, tr, nd).',
    ruleExplanation: 'In a blend, you can still hear both sounds, but they glide together quickly. "Bl" in "Blue".',
  },
  {
    id: 'code_5',
    title: 'The "F/L/S/Z" Floss Rule',
    level: 'Level 1 (Year 2)',
    theme: ModuleTheme.OCEAN,
    description: 'Why do we double letters at the end of words?',
    ruleExplanation: 'If a short vowel word ends in f, l, s, or z, double the last letter! (Huff, Hill, Mess, Buzz).',
  },

  // --- NZC LEVEL 2 (The Code: Blue/Green) ---
  {
    id: 'code_6',
    title: 'Magic E Oasis',
    level: 'Level 2 (Year 3-4)',
    theme: ModuleTheme.DESERT,
    description: 'The silent E that makes vowels say their name.',
    ruleExplanation: 'An "e" at the end of a word jumps over one consonant to make the vowel long. "Hop" becomes "Hope".',
  },
  {
    id: 'code_7',
    title: 'Vowel Team Valley',
    level: 'Level 2 (Year 3-4)',
    theme: ModuleTheme.FOREST,
    description: 'Common teams: ai, ay, ee, ea, oa.',
    ruleExplanation: 'When two vowels go walking, the first one often does the talking (says its name). "Rain" (ai), "Boat" (oa).',
  },
  {
    id: 'code_8',
    title: 'Bossy R Canyon',
    level: 'Level 2 (Year 3-4)',
    theme: ModuleTheme.DESERT,
    description: 'R-controlled vowels: ar, or, er, ir, ur.',
    ruleExplanation: 'The letter R changes the vowel sound. "Car" doesn\'t sound like "Cat". "Er", "Ir", and "Ur" often sound the same (Her, Bird, Fur).',
  },
  {
    id: 'code_9',
    title: 'Soft C and G',
    level: 'Level 2 (Year 3-4)',
    theme: ModuleTheme.DESERT,
    description: 'When C sounds like S, and G sounds like J.',
    ruleExplanation: 'C and G go soft when followed by E, I, or Y. "City", "Gem", "Cycle". Otherwise they are hard (Cat, Go).',
  },

  // --- NZC LEVEL 3 (Morphology & Complex Patterns) ---
  {
    id: 'morph_1',
    title: 'Plural Peaks',
    level: 'Level 3 (Year 5-6)',
    theme: ModuleTheme.VOLCANO,
    description: 'Rules for adding -s, -es, and changing y to i.',
    ruleExplanation: 'Add -es if the word ends in s, x, z, ch, or sh. If it ends in consonant+y, change y to i and add es (Baby -> Babies).',
  },
  {
    id: 'morph_2',
    title: 'Prefix Power',
    level: 'Level 3 (Year 5-6)',
    theme: ModuleTheme.VOLCANO,
    description: 'Changing meaning with un-, re-, dis-, pre-.',
    ruleExplanation: 'Prefixes attach to the front of a base word. "Re-" means again (Replay). "Un-" means not (Unhappy).',
  },
  {
    id: 'morph_3',
    title: 'Suffix Sands',
    level: 'Level 3 (Year 5-6)',
    theme: ModuleTheme.VOLCANO,
    description: 'Doubling rules when adding -ing and -ed.',
    ruleExplanation: 'Double the final consonant if the word has a short vowel and one consonant (Run -> Running). Do not double if it has two consonants (Jump -> Jumping).',
  },
  {
    id: 'code_10',
    title: 'The Schwa Sound',
    level: 'Level 3 (Year 5-6)',
    theme: ModuleTheme.VOLCANO,
    description: 'The unstressed "uh" sound found in many multi-syllable words.',
    ruleExplanation: 'Any vowel can make the schwa sound in an unstressed syllable. "About" (A), "Pencil" (i), "Doctor" (o).',
  },

  // --- NZC LEVEL 4 (Etymology & Advanced Rules) ---
  {
    id: 'etym_1',
    title: 'Greek & Latin Roots',
    level: 'Level 4 (Year 7-8)',
    theme: ModuleTheme.SPACE,
    description: 'Building blocks of English: Tele, Scope, Port, Struct.',
    ruleExplanation: 'English words are built like lego. "Tele" (far) + "Scope" (look) = Telescope. "Port" means to carry.',
  },
  {
    id: 'etym_2',
    title: 'Complex Endings',
    level: 'Level 4 (Year 7-8)',
    theme: ModuleTheme.SPACE,
    description: '-tion, -sion, -cian, -ture.',
    ruleExplanation: '-tion is the most common "shun". -sion is used if the base word ends in s/d (Expand->Expansion). -cian is for people (Musician).',
  },
  {
    id: 'etym_3',
    title: 'Homophone Horizon',
    level: 'Level 4 (Year 7-8)',
    theme: ModuleTheme.SPACE,
    description: 'Words that sound same but differ in meaning/spelling.',
    ruleExplanation: 'Context is key. Their (possession), There (place), They\'re (they are). To (direction), Too (also), Two (2).',
  },
  {
    id: 'etym_4',
    title: 'Silent Letter Space',
    level: 'Level 4 (Year 7-8)',
    theme: ModuleTheme.SPACE,
    description: 'Ghost letters: kn, gn, wr, mb.',
    ruleExplanation: 'Silent letters are often leftovers from old languages. Knight (Old English). Tsunami (Japanese). Psychology (Greek).',
  },

  // --- NZC LEVEL 5 (Academic & Secondary Prep - Years 9-10) ---
  {
    id: 'acad_1',
    title: 'Academic Verbs',
    level: 'Level 5 (Year 9-10)',
    theme: ModuleTheme.SPACE,
    description: 'Words for essays: Analyse, Evaluate, Synthesise.',
    ruleExplanation: 'Academic spelling focuses on precision. Note the "yse" in Analyse (NZ/UK spelling) vs "yze" (US).',
  },
  {
    id: 'acad_2',
    title: 'Scientific Terminology',
    level: 'Level 5 (Year 9-10)',
    theme: ModuleTheme.SPACE,
    description: 'Decoding complex science terms.',
    ruleExplanation: 'Science words follow strict patterns. "Photo" (light) + "Synthesis" (putting together).',
  },
  {
    id: 'acad_3',
    title: 'Foreign Borrowings',
    level: 'Level 5 (Year 9-10)',
    theme: ModuleTheme.SPACE,
    description: 'French and other loan words used in English.',
    ruleExplanation: 'Words kept their original spelling rules. "Ch" says /sh/ in French words like Chef, Chute, Champagne.',
  },
  {
    id: 'acad_4',
    title: 'Advanced Grammar',
    level: 'Level 5 (Year 9-10)',
    theme: ModuleTheme.SPACE,
    description: 'Tricky punctuation and grammar distinctions.',
    ruleExplanation: 'Effect (noun) vs Affect (verb). Practice vs Practise (in NZ/UK, \'c\' is noun, \'s\' is verb).',
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

export const getCustomModules = (): LearningModule[] => {
    const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_MODULES);
    return stored ? JSON.parse(stored) : [];
}

export const getAllModules = (): LearningModule[] => {
    return [...MODULES, ...getCustomModules()];
}

export const saveCustomModule = (module: LearningModule) => {
    const current = getCustomModules();
    current.push(module);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MODULES, JSON.stringify(current));
    // Dispatch storage event manually for same-window updates
    window.dispatchEvent(new Event('storage'));
}

// --- SESSION MANAGEMENT ---

export const saveSession = (role: UserRole, id: string) => {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({ role, id }));
};

export const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
};

export const getSession = (): { role: UserRole, id: string } | null => {
    const stored = localStorage.getItem(STORAGE_KEY_SESSION);
    return stored ? JSON.parse(stored) : null;
};

// --- AUTHENTICATION & TEACHER MANAGEMENT ---

export const registerTeacher = (name: string, email: string, password: string, className: string): Teacher | null => {
    const teachers = getTeachers();
    if (teachers.find(t => t.email.toLowerCase() === email.toLowerCase())) {
        return null; // Already exists
    }
    const newTeacher: Teacher = {
        id: `t${Date.now()}`,
        name,
        email,
        password,
        avatar: '👩‍🏫'
    };
    teachers.push(newTeacher);
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    
    // Automatically create the class
    createClass(className, newTeacher.id);
    
    return newTeacher;
};

export const loginTeacher = (email: string, password: string): Teacher | null => {
    const teachers = getTeachers();
    const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase() && t.password === password);
    return teacher || null;
};

export const updateTeacher = (updatedTeacher: Teacher) => {
    const teachers = getTeachers();
    const index = teachers.findIndex(t => t.id === updatedTeacher.id);
    if (index !== -1) {
        teachers[index] = updatedTeacher;
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
        window.dispatchEvent(new Event('storage'));
    }
};

// --- CLASS MANAGEMENT ---

export const createClass = (name: string, teacherId: string): ClassGroup => {
    const classes = getClasses();
    const newClass: ClassGroup = {
        id: `c${Date.now()}_${Math.floor(Math.random()*1000)}`,
        teacherId,
        name,
        studentIds: [],
        avatar: '🏫'
    };
    classes.push(newClass);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
    window.dispatchEvent(new Event('storage'));
    return newClass;
}

export const updateClass = (updatedClass: ClassGroup) => {
    const classes = getClasses();
    const index = classes.findIndex(c => c.id === updatedClass.id);
    if (index !== -1) {
        classes[index] = updatedClass;
        localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
        window.dispatchEvent(new Event('storage'));
    }
}

// --- STUDENT MANAGEMENT ---

const updateStreak = (student: Student): Student => {
    const lastActive = new Date(student.lastActiveDate);
    const now = new Date();

    const lastDateStr = lastActive.toDateString(); // e.g., "Fri Oct 27 2023" (Uses local browser time)
    const todayStr = now.toDateString();

    // 1. Same day login: No change to streak count
    if (lastDateStr === todayStr) {
        return student; 
    }

    // 2. Consecutive day check
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (lastDateStr === yesterday.toDateString()) {
        student.currentStreak += 1; // Streak continues!

        // Streak Bonuses
        if (student.currentStreak % 7 === 0) {
            student.xp += 50;
            student.stars += 5;
        }
        if (student.currentStreak % 30 === 0) {
            student.xp += 200;
            student.stars += 20;
        }
    } else {
        // 3. Missed a day: Reset streak to 1
        student.currentStreak = 1; 
    }

    return student;
};

// Helper to calculate level
const calculateLevel = (xp: number) => {
    return Math.floor(xp / 500) + 1;
};

// Helper to parse module level number string e.g. "Level 2 (Year 3-4)" -> 2
const getModuleNumericLevel = (levelStr: string): number => {
    const match = levelStr.match(/Level (\d+)/);
    return match ? parseInt(match[1]) : 1;
}

const unlockModulesUpToLevel = (student: Student, placementLevel: number): Student => {
    const updatedProgress = { ...student.progress };
    
    // Only standard modules, not custom ones
    MODULES.forEach(module => {
        const modLevel = getModuleNumericLevel(module.level);
        
        // If the module's level is STRICTLY LESS than the placement level, we mark it as done/skipped
        // so the student can start fresh at their placement level.
        if (modLevel < placementLevel) {
            if (!updatedProgress[module.id] || !updatedProgress[module.id].completed) {
                updatedProgress[module.id] = {
                    completed: true,
                    score: 100, // Give full credit for skipped levels to simplify unlocking
                    attempts: 0,
                    confidence: 5,
                    performanceAnalysis: "Skipped via Placement Test"
                };
            }
        }
    });

    return { ...student, progress: updatedProgress };
};

export const updateStudent = (updatedStudent: Student) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    let processedStudent = { ...updatedStudent };
    
    // 1. Check if placement test just finished, unlock previous content
    if (processedStudent.placementTestStatus === 'COMPLETED' && processedStudent.placementLevel && processedStudent.placementLevel > 1) {
        // Logic to unlock all modules BELOW this level
        processedStudent = unlockModulesUpToLevel(processedStudent, processedStudent.placementLevel);
    }

    // 2. Check for Achievements
    processedStudent = checkForAchievements(processedStudent);
    
    // 3. Update Level based on new XP
    processedStudent.level = calculateLevel(processedStudent.xp);

    // 4. Update Streak & Active Date
    processedStudent = updateStreak(processedStudent);
    processedStudent.lastActiveDate = new Date().toISOString();

    students[index] = processedStudent;
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    
    // Dispatch storage event manually for same-window updates (Teacher Dashboard sync)
    window.dispatchEvent(new Event('storage'));
  }
};

// Save Resume State without marking activity as active/streak
export const saveStudentProgressState = (studentId: string, moduleId: string, state: LessonPhaseState) => {
    const students = getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
        if (!student.progress[moduleId]) {
            student.progress[moduleId] = { completed: false, score: 0, attempts: 0 };
        }
        student.progress[moduleId].resumeState = state;
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
        // No dispatch needed here usually as it's internal state, but safe to add
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
    if (completedModules >= 5) addAchievement('pro_speller', 'Pro Speller', '📚', 'Completed 5 adventures!');
    if (completedModules >= 10) addAchievement('champion', 'Champion', '🏆', 'Completed 10 adventures!');
    
    if (student.xp >= 500) addAchievement('novice', 'Rising Star', '🌟', 'Earned 500 XP!');
    if (student.xp >= 1000) addAchievement('legend', 'Spelling Legend', '👑', 'Earned 1000 XP!');
    if (student.xp >= 2000) addAchievement('grandmaster', 'Grandmaster', '🧙‍♂️', 'Earned 2000 XP!');

    if (student.currentStreak >= 3) addAchievement('on_fire', 'On Fire', '🔥', '3 Day Streak!');
    if (student.currentStreak >= 7) addAchievement('unstoppable', 'Unstoppable', '🚀', '7 Day Streak!');

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
    achievements: [],
    assignedModuleIds: [],
    customRewards: [],
    placementTestStatus: 'NOT_STARTED',
    inventory: [],
    equipped: {}
  };
  
  students.push(newStudent);
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));

  const clsIndex = classes.findIndex(c => c.id === classId);
  if (clsIndex !== -1) {
    classes[clsIndex].studentIds.push(newStudent.id);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  }
  
  window.dispatchEvent(new Event('storage'));
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