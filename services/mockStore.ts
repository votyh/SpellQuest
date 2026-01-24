
import { ClassGroup, Student, ModuleTheme, LearningModule, Achievement, Teacher, UserRole, ModuleProgress, LessonPhaseState, ShopItem } from '../types';

// VERSION 23 - New Reading Level Calibration (Data Wipe)
const CURRENT_VERSION = 'v23';
const STORAGE_KEY_STUDENTS = `sq_students_${CURRENT_VERSION}`;
const STORAGE_KEY_CLASSES = `sq_classes_${CURRENT_VERSION}`;
const STORAGE_KEY_TEACHERS = `sq_teachers_${CURRENT_VERSION}`;
const STORAGE_KEY_SESSION = `sq_session_${CURRENT_VERSION}`;
const STORAGE_KEY_CUSTOM_MODULES = `sq_custom_modules_${CURRENT_VERSION}`;

// --- DATA MIGRATION LOGIC ---
const migrateLegacyData = () => {
    try {
        if (!localStorage.getItem(STORAGE_KEY_STUDENTS)) {
            // We want to force a clean slate for reading logs, so we won't deeply merge old student data
            // but we will try to preserve XP/Stars if possible from immediately previous version if needed.
            // For now, based on instructions "Delete all the current saved ones", we treat this as a fresh start for logic
            // but preserve teacher/class structure if it exists.
            
            const legacyVersions = ['v22', 'v21', 'v20', 'v19', 'v18'];
            for (const ver of legacyVersions) {
                const key = `sq_students_${ver}`;
                const legacyData = localStorage.getItem(key);
                if (legacyData) {
                    // Start fresh for students to clear bad reading logs
                    // But we can keep teachers/classes
                    const legacyClasses = localStorage.getItem(`sq_classes_${ver}`);
                    if (legacyClasses) localStorage.setItem(STORAGE_KEY_CLASSES, legacyClasses);
                    const legacyTeachers = localStorage.getItem(`sq_teachers_${ver}`);
                    if (legacyTeachers) localStorage.setItem(STORAGE_KEY_TEACHERS, legacyTeachers);
                    const legacyCustom = localStorage.getItem(`sq_custom_modules_${ver}`);
                    if (legacyCustom) localStorage.setItem(STORAGE_KEY_CUSTOM_MODULES, legacyCustom);
                    break;
                }
            }
        }
    } catch (e) {
        console.error("Migration failed", e);
    }
};

migrateLegacyData();

const SYNC_CHANNEL = new BroadcastChannel('spellquest_sync_v1');

const notifyChanges = () => {
    const timestamp = Date.now();
    SYNC_CHANNEL.postMessage({ type: 'DATA_UPDATE', timestamp });
    window.dispatchEvent(new CustomEvent('sq_local_update', { detail: { timestamp } }));
    window.dispatchEvent(new Event('storage'));
};

export const subscribeToStore = (callback: () => void): () => void => {
    const channel = new BroadcastChannel('spellquest_sync_v1');
    const handleUpdate = () => requestAnimationFrame(() => callback());
    channel.onmessage = (event) => { if (event.data.type === 'DATA_UPDATE') handleUpdate(); };
    window.addEventListener('sq_local_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
        channel.close();
        window.removeEventListener('sq_local_update', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
        window.removeEventListener('focus', handleUpdate);
    };
};

const SEED_TEACHER: Teacher = {
    id: 't1',
    name: 'Mr. D', 
    email: 'vonalad@gmail.com',
    password: 'buddl9ja',
    avatar: '👨‍🏫'
};

const SEED_CLASSES: ClassGroup[] = [
  { id: 'c1', teacherId: 't1', name: 'Room 1', studentIds: ['s1', 's2'], avatar: '🚀' },
  { id: 'c2', teacherId: 't1', name: 'Senior English', studentIds: ['s3', 's4'], avatar: '🎓' }
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
      stars: 0, 
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(),
      progress: {}, 
      achievements: [],
      assignedModuleIds: ['l2_magic_e', 'l2_syllables_open', 'l2_vowel_teams', 'l2_bossy_r', 'l2_soft_c_g', 'l2_y_ending'], 
      suggestedModuleIds: [],
      customRewards: [],
      readingLog: [],
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
      assignedModuleIds: ['l2_magic_e', 'l2_syllables_open', 'l2_vowel_teams', 'l2_bossy_r', 'l2_soft_c_g', 'l2_y_ending'],
      suggestedModuleIds: [],
      customRewards: [],
      readingLog: [],
      inventory: [],
      equipped: {}
  },
  { 
      id: 's3', 
      loginCode: 'UDARI-13', 
      name: 'Udari', 
      avatar: '👩‍🎓', 
      yearLevel: 13,
      stars: 0, 
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(),
      progress: {}, 
      achievements: [],
      assignedModuleIds: ['l8_argumentation', 'l8_scholarly_conventions'], 
      suggestedModuleIds: [],
      customRewards: [],
      readingLog: [],
      inventory: [],
      equipped: {},
      teacherAssessment: {
          readingLevel: 13,
          focusAreas: ['Critical Analysis', 'Complex Argumentation']
      }
  },
  { 
      id: 's4', 
      loginCode: 'VONAL-10', 
      name: 'Vonal', 
      avatar: '🕵️‍♂️', 
      yearLevel: 10,
      stars: 0, 
      xp: 0, 
      level: 1, 
      currentStreak: 0, 
      lastActiveDate: new Date(0).toISOString(), 
      progress: {}, 
      achievements: [],
      assignedModuleIds: ['l5_sci_terms', 'l5_foreign', 'l5_lit_terms'],
      suggestedModuleIds: [],
      customRewards: [],
      readingLog: [],
      inventory: [],
      equipped: {},
      teacherAssessment: {
          readingLevel: 10,
          focusAreas: ['Scientific Vocabulary']
      }
  },
];

export const MODULES: LearningModule[] = [
  // --- NZC LEVEL 1 (Years 0-2: The Code) ---
  {
    id: 'l1_satpin',
    title: 'Initial Sounds (SATPIN)',
    level: 'Level 1 (Year 0-1)',
    theme: ModuleTheme.FOREST,
    description: 'Start with S, A, T, P, I, N.',
    ruleExplanation: 'These letters make distinct sounds. "A" says /a/ (apple), "S" says /s/ (snake).',
  },
  {
    id: 'l1_short_vowels',
    title: 'Short Vowels (A E I O U)',
    level: 'Level 1 (Year 1)',
    theme: ModuleTheme.FOREST,
    description: 'Hearing the difference between cat, cot, cut, kit, ket.',
    ruleExplanation: 'Short vowels are quick sounds. A (apple), E (egg), I (igloo), O (octopus), U (umbrella).',
  },
  {
    id: 'l1_cvc',
    title: 'CVC Foundations',
    level: 'Level 1 (Year 1)',
    theme: ModuleTheme.FOREST,
    description: 'Building simple words like Cat, Dog, Bus.',
    ruleExplanation: 'Consonant-Vowel-Consonant words usually have a short vowel sound.',
  },
  {
    id: 'l1_digraphs',
    title: 'Digraph Discovery',
    level: 'Level 1 (Year 1-2)',
    theme: ModuleTheme.OCEAN,
    description: 'Two letters, one sound: sh, ch, th, ng.',
    ruleExplanation: 'When H makes friends with S, C, or T, they make a new sound together.',
  },
  {
    id: 'l1_blends',
    title: 'Blends Beach',
    level: 'Level 1 (Year 2)',
    theme: ModuleTheme.OCEAN,
    description: 'Beginning and ending blends (st, bl, tr, nd).',
    ruleExplanation: 'In a blend, you can hear both sounds gliding together quickly.',
  },
  {
    id: 'l1_floss',
    title: 'The Floss Rule',
    level: 'Level 1 (Year 2)',
    theme: ModuleTheme.OCEAN,
    description: 'Double letters at the end (ff, ll, ss, zz).',
    ruleExplanation: 'If a short vowel word ends in f, l, s, or z, double it! (Hill, Mess, Buzz).',
  },
  {
    id: 'l1_ck_rule',
    title: 'The "ck" Rule',
    level: 'Level 1 (Year 2)',
    theme: ModuleTheme.OCEAN,
    description: 'When to use "ck" vs "k" at the end of a word.',
    ruleExplanation: 'Use "ck" right after a short vowel (Duck). Use "k" after a consonant or long vowel (Milk, Cake).',
  },

  // --- NZC LEVEL 2 (Years 3-4: Patterns & Syllables) ---
  {
    id: 'l2_magic_e',
    title: 'Magic E Oasis',
    level: 'Level 2 (Year 3)',
    theme: ModuleTheme.DESERT,
    description: 'Silent E makes the vowel say its name.',
    ruleExplanation: 'An "e" at the end jumps over one consonant to make the vowel long. (Hop -> Hope).',
  },
  {
    id: 'l2_syllables_open',
    title: 'Open & Closed Syllables',
    level: 'Level 2 (Year 3)',
    theme: ModuleTheme.DESERT,
    description: 'Breaking words into chunks.',
    ruleExplanation: 'Closed syllable ends in a consonant (short vowel: Cat). Open syllable ends in a vowel (long vowel: Go, Hi).',
  },
  {
    id: 'l2_vowel_teams',
    title: 'Vowel Team Valley',
    level: 'Level 2 (Year 3-4)',
    theme: ModuleTheme.FOREST,
    description: 'Common teams: ai, ay, ee, ea, oa.',
    ruleExplanation: 'When two vowels go walking, the first one does the talking (Rain, Boat).',
  },
  {
    id: 'l2_bossy_r',
    title: 'Bossy R Canyon',
    level: 'Level 2 (Year 3-4)',
    theme: ModuleTheme.DESERT,
    description: 'ar, or, er, ir, ur patterns.',
    ruleExplanation: 'The letter R changes the vowel sound. Car, Fork, Bird, Turn.',
  },
  {
    id: 'l2_soft_c_g',
    title: 'Soft C and G',
    level: 'Level 2 (Year 4)',
    theme: ModuleTheme.DESERT,
    description: 'When C sounds like S, and G sounds like J.',
    ruleExplanation: 'C and G go soft when followed by E, I, or Y (City, Gem, Gym).',
  },
  {
    id: 'l2_y_ending',
    title: 'The Many Sounds of Y',
    level: 'Level 2 (Year 4)',
    theme: ModuleTheme.DESERT,
    description: 'Y as a vowel at the end of words.',
    ruleExplanation: 'In short words, Y says "I" (Sky). In long words, Y says "E" (Happy).',
  },

  // --- NZC LEVEL 3 (Years 5-6: Morphology) ---
  {
    id: 'l3_plurals',
    title: 'Plural Peaks',
    level: 'Level 3 (Year 5)',
    theme: ModuleTheme.VOLCANO,
    description: 'Adding -s, -es, and changing y to i.',
    ruleExplanation: 'Add -es for sh/ch/s/x/z. Change Y to I and add ES if consonant before Y (Baby -> Babies).',
  },
  {
    id: 'l3_apostrophes',
    title: 'Possession Station',
    level: 'Level 3 (Year 5)',
    theme: ModuleTheme.VOLCANO,
    description: 'Using apostrophes for ownership.',
    ruleExplanation: 'Use \'s for one owner (The dog\'s bone). Use s\' for many owners (The dogs\' bones).',
  },
  {
    id: 'l3_doubling',
    title: 'The Doubling Rule',
    level: 'Level 3 (Year 5-6)',
    theme: ModuleTheme.VOLCANO,
    description: 'Adding suffixes like -ing and -ed.',
    ruleExplanation: 'Double the final consonant if the word has 1 syllable, 1 short vowel, and 1 ending consonant (Run -> Running). Do not double if it has two consonants (Jump -> Jumping).',
  },
  {
    id: 'l3_prefixes',
    title: 'Prefix Power',
    level: 'Level 3 (Year 6)',
    theme: ModuleTheme.VOLCANO,
    description: 'Changing meaning with un-, re-, dis-, pre-.',
    ruleExplanation: 'Prefixes attach to the front. Re- means again. Un- means not.',
  },
  {
    id: 'l3_schwa',
    title: 'The Schwa Sound',
    level: 'Level 3 (Year 6)',
    theme: ModuleTheme.VOLCANO,
    description: 'The unstressed "uh" sound in longer words.',
    ruleExplanation: 'Any vowel can say "uh" in an unstressed syllable (About, Pencil, Doctor).',
  },
  {
    id: 'l3_homophones',
    title: 'Tricky Homophones',
    level: 'Level 3 (Year 6)',
    theme: ModuleTheme.VOLCANO,
    description: 'There, Their, They\'re and friends.',
    ruleExplanation: 'There (place), Their (owner), They\'re (they are). To (direction), Too (also), Two (2).',
  },

  // --- NZC LEVEL 4 (Years 7-8: Etymology & Complexity) ---
  {
    id: 'l4_roots',
    title: 'Greek & Latin Roots',
    level: 'Level 4 (Year 7)',
    theme: ModuleTheme.SPACE,
    description: 'Building blocks: Tele, Scope, Port, Struct.',
    ruleExplanation: 'English words are like lego. Tele (far) + Scope (see) = Telescope.',
  },
  {
    id: 'l4_silent_letters',
    title: 'Silent Letter Space',
    level: 'Level 4 (Year 7)',
    theme: ModuleTheme.SPACE,
    description: 'Ghost letters: kn, gn, wr, mb.',
    ruleExplanation: 'Silent letters are history traces. Knight (Old English), Psychology (Greek).',
  },
  {
    id: 'l4_complex_endings',
    title: 'Complex Endings',
    level: 'Level 4 (Year 8)',
    theme: ModuleTheme.SPACE,
    description: '-tion, -sion, -cian, -ture.',
    ruleExplanation: '-tion is common. -sion often follows S or D (Expand -> Expansion). -cian is for people (Musician).',
  },
  {
    id: 'l4_adv_suffixes',
    title: 'Advanced Suffixes',
    level: 'Level 4 (Year 8)',
    theme: ModuleTheme.SPACE,
    description: '-ance vs -ence, -able vs -ible.',
    ruleExplanation: 'Hard rules! Often -able if you can hear the base word (Comfort -> Comfortable).',
  },

  // --- NZC LEVEL 5 (Years 9-10: Academic & Prep) ---
  {
    id: 'l5_acad_verbs',
    title: 'Academic Verbs',
    level: 'Level 5 (Year 9)',
    theme: ModuleTheme.SPACE,
    description: 'Essay words: Analyse, Evaluate, Synthesise.',
    ruleExplanation: 'Academic spelling is precise. Analyse (NZ/UK) vs Analyze (US).',
  },
  {
    id: 'l5_hyphens',
    title: 'Hyphenation Station',
    level: 'Level 5 (Year 9)',
    theme: ModuleTheme.SPACE,
    description: 'Compound adjectives and prefixes.',
    ruleExplanation: 'Hyphenate compound adjectives before a noun (A well-known author) but not after (The author is well known).',
  },
  {
    id: 'l5_sci_terms',
    title: 'Scientific Vocabulary',
    level: 'Level 5 (Year 10)',
    theme: ModuleTheme.SPACE,
    description: 'Photosynthesis, Chromatography, Hypothesis.',
    ruleExplanation: 'Science words use Greek/Latin logic. Photo (light) + Synthesis (put together).',
  },
  {
    id: 'l5_foreign',
    title: 'Loan Words',
    level: 'Level 5 (Year 10)',
    theme: ModuleTheme.SPACE,
    description: 'French and Maori loan words.',
    ruleExplanation: 'Loan words keep original spelling. Ch -> /sh/ in Chef (French). Wh -> /f/ in Whānau (Maori).',
  },
  {
    id: 'l5_lit_terms',
    title: 'Literary Analysis',
    level: 'Level 5 (Year 10)',
    theme: ModuleTheme.SPACE,
    description: 'Metaphor, Simile, Onomatopoeia, Soliloquy.',
    ruleExplanation: 'Many literary terms come from Greek. Onomatopoeia is spelling sounds.',
  },

  // --- NCEA LEVEL 1 (Year 11) ---
  {
    id: 'l6_unfamiliar_text',
    title: 'Unfamiliar Text Analysis',
    level: 'NCEA Level 1 (Year 11)',
    theme: ModuleTheme.SPACE,
    description: 'Identifying tone, purpose, and audience.',
    ruleExplanation: 'Writers use specific choices to target an audience. Tones can be objective, subjective, critical, or nostalgic.',
  },
  {
    id: 'l6_language_features',
    title: 'Advanced Language Features',
    level: 'NCEA Level 1 (Year 11)',
    theme: ModuleTheme.SPACE,
    description: 'Hyperbole, Litotes, Euphemism, Paradox.',
    ruleExplanation: 'Advanced features add nuance. Litotes is understatement (Not bad). Paradox is a contradictory truth.',
  },

  // --- NCEA LEVEL 2 (Year 12) ---
  {
    id: 'l7_critical_analysis',
    title: 'Critical Analysis',
    level: 'NCEA Level 2 (Year 12)',
    theme: ModuleTheme.SPACE,
    description: 'Evaluating bias, reliability, and subtext.',
    ruleExplanation: 'Critical analysis looks beneath the surface. Bias is an inclination for or against a group or idea.',
  },
  {
    id: 'l7_academic_vocab',
    title: 'Academic Vocabulary L2',
    level: 'NCEA Level 2 (Year 12)',
    theme: ModuleTheme.SPACE,
    description: 'Words for precise academic expression.',
    ruleExplanation: 'Use precise verbs. Instead of "says", use "asserts", "implies", "demonstrates", or "contented".',
  },

  // --- NCEA LEVEL 3 (Year 13) ---
  {
    id: 'l8_argumentation',
    title: 'Complex Argumentation',
    level: 'NCEA Level 3 (Year 13)',
    theme: ModuleTheme.SPACE,
    description: 'Constructing nuanced arguments and counter-arguments.',
    ruleExplanation: 'A strong argument acknowledges complexity. Use "However", "Conversely", "While it is true that..." to weave ideas.',
  },
  {
    id: 'l8_scholarly_conventions',
    title: 'Scholarly Writing',
    level: 'NCEA Level 3 (Year 13)',
    theme: ModuleTheme.SPACE,
    description: 'Citations, referencing, and objective voice.',
    ruleExplanation: 'Scholarly writing requires evidence. Integrate quotes seamlessly and reference sources accurately.',
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
    notifyChanges();
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
        return null;
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
    createClass(className, newTeacher.id);
    return newTeacher;
};

export const loginTeacher = (email: string, password: string): Teacher | null => {
    const teachers = getTeachers();
    const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase() && t.password === password);
    return teacher || null;
};

export const loginOrRegisterTeacherViaGoogle = (email: string, name: string, pictureUrl: string): Teacher => {
    const teachers = getTeachers();
    let teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());

    if (!teacher) {
        teacher = {
            id: `tg_${Date.now()}`,
            name,
            email,
            password: 'GOOGLE_AUTH_USER',
            avatar: pictureUrl || '👩‍🏫'
        };
        teachers.push(teacher);
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
        createClass(`${name.split(' ')[0]}'s Class`, teacher.id);
    } else {
        if (pictureUrl && !teacher.avatar?.startsWith('http')) {
            teacher.avatar = pictureUrl;
            localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
        }
    }
    notifyChanges();
    return teacher;
};

export const updateTeacher = (updatedTeacher: Teacher) => {
    const teachers = getTeachers();
    const index = teachers.findIndex(t => t.id === updatedTeacher.id);
    if (index !== -1) {
        teachers[index] = updatedTeacher;
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
        notifyChanges();
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
    notifyChanges();
    return newClass;
}

export const updateClass = (updatedClass: ClassGroup) => {
    const classes = getClasses();
    const index = classes.findIndex(c => c.id === updatedClass.id);
    if (index !== -1) {
        classes[index] = updatedClass;
        localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
        notifyChanges();
    }
}

export const bulkAssignModuleToClass = (classId: string, moduleId: string, shouldAssign: boolean) => {
    const classes = getClasses();
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    
    const students = getStudents();
    let changed = false;

    students.forEach(s => {
        if (cls.studentIds.includes(s.id)) {
            const currentAssigned = s.assignedModuleIds || [];
            if (shouldAssign) {
                if (!currentAssigned.includes(moduleId)) {
                    s.assignedModuleIds = [...currentAssigned, moduleId];
                    changed = true;
                }
            } else {
                if (currentAssigned.includes(moduleId)) {
                    s.assignedModuleIds = currentAssigned.filter(id => id !== moduleId);
                    changed = true;
                }
            }
        }
    });

    if (changed) {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
        notifyChanges();
    }
}

// --- ALGORITHMIC SUGGESTIONS (REPLACES PLACEMENT TEST) ---

// Helper to check if a module's level string (e.g. "Level 1 (Year 0-1)") matches student's year
const isLevelMatch = (moduleLevelStr: string, studentYear: number): boolean => {
    // Extract year range numbers from string like "Level 1 (Year 0-1)"
    const match = moduleLevelStr.match(/Year (\d+)(-(\d+))?/);
    if (match) {
        const startYear = parseInt(match[1]);
        const endYear = match[3] ? parseInt(match[3]) : startYear;
        // Suggested if it matches current year or year-1 (for revision)
        return studentYear >= startYear && studentYear <= endYear + 1;
    }
    return false;
};

// Main Algo
const recalculateSuggestions = (student: Student): Student => {
    // If no assessment, no suggestions
    if (!student.teacherAssessment) {
        return { ...student, suggestedModuleIds: [] };
    }

    const { readingLevel, focusAreas } = student.teacherAssessment;
    const allModules = getAllModules();
    const suggestions: string[] = [];

    allModules.forEach(mod => {
        let score = 0;
        const modTitle = mod.title.toLowerCase();
        const modDesc = mod.description.toLowerCase();

        // 1. Year Level Match
        if (isLevelMatch(mod.level, readingLevel)) {
            score += 5;
        }

        // 2. Focus Area Match
        if (focusAreas && focusAreas.length > 0) {
            focusAreas.forEach(focus => {
                const term = focus.toLowerCase();
                if (modTitle.includes(term) || modDesc.includes(term)) {
                    score += 10; // High priority if explicit match
                }
            });
        }

        // 3. Threshold for suggestion
        if (score >= 5) {
            suggestions.push(mod.id);
        }
    });

    return { ...student, suggestedModuleIds: suggestions };
};

// --- STUDENT MANAGEMENT ---

const updateStreak = (student: Student): Student => {
    const lastActive = new Date(student.lastActiveDate);
    const now = new Date();
    const lastDateStr = lastActive.toDateString(); 
    const todayStr = now.toDateString();

    if (lastDateStr === todayStr) return student; 

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    if (lastDateStr === yesterday.toDateString()) {
        student.currentStreak += 1; 
        if (student.currentStreak % 7 === 0) {
            student.xp += 50;
            student.stars += 5;
        }
        if (student.currentStreak % 30 === 0) {
            student.xp += 200;
            student.stars += 20;
        }
    } else {
        student.currentStreak = 1; 
    }
    return student;
};

const calculateLevel = (xp: number) => Math.floor(xp / 500) + 1;

export const updateStudent = (updatedStudent: Student) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === updatedStudent.id);
  if (index !== -1) {
    let processedStudent = { ...updatedStudent };
    
    // Recalculate suggestions if assessment changed
    if (processedStudent.teacherAssessment) {
        processedStudent = recalculateSuggestions(processedStudent);
    }
    
    processedStudent = checkForAchievements(processedStudent);
    processedStudent.level = calculateLevel(processedStudent.xp);
    processedStudent = updateStreak(processedStudent);
    processedStudent.lastActiveDate = new Date().toISOString();

    students[index] = processedStudent;
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    notifyChanges();
  }
};

export const saveStudentProgressState = (studentId: string, moduleId: string, state: LessonPhaseState) => {
    const students = getStudents();
    const student = students.find(s => s.id === studentId);
    if (student) {
        if (!student.progress[moduleId]) {
            student.progress[moduleId] = { completed: false, score: 0, attempts: 0 };
        }
        student.progress[moduleId].resumeState = state;
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
        notifyChanges();
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
    lastActiveDate: new Date(0).toISOString(), 
    progress: {},
    achievements: [],
    assignedModuleIds: [],
    suggestedModuleIds: [],
    customRewards: [],
    readingLog: [],
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
  
  notifyChanges();
  return newStudent;
};

export const authenticateStudent = (code: string): Student | null => {
    const students = getStudents();
    return students.find(s => s.loginCode.toUpperCase() === code.toUpperCase().trim()) || null;
};

export const getClassmates = (studentId: string): Student[] => {
    const classes = getClasses();
    const students = getStudents();
    const myClass = classes.find(c => c.studentIds.includes(studentId));
    if (!myClass) return [];
    return students
        .filter(s => myClass.studentIds.includes(s.id))
        .sort((a, b) => b.xp - a.xp); 
};
