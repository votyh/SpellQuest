
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

export enum ModuleTheme {
  FOREST = 'forest',
  OCEAN = 'ocean',
  VOLCANO = 'volcano',
  DESERT = 'desert',
  SPACE = 'space',
}

export enum ActivityType {
  BUILD_WORD = 'BUILD_WORD',
  MATCHING = 'MATCHING',
  SORTING = 'SORTING',
  FIX_SENTENCE = 'FIX_SENTENCE',
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlockedAt?: number; // Timestamp
}

export interface ShopItem {
    id: string;
    name: string;
    type: 'HAT' | 'GLASSES' | 'BACKGROUND' | 'ACCESSORY';
    icon: string; // Emoji or image URL
    cost: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  password: string; // Plaintext for prototype
  avatar?: string; // Emoji
}

export interface Student {
  id: string;
  loginCode: string; // The "password" provided by teacher
  name: string;
  avatar: string; // Emoji char
  yearLevel?: number; 
  xp: number;
  level: number;
  currentStreak: number;
  lastActiveDate: string; // ISO Date string
  stars: number;
  progress: Record<string, ModuleProgress>; // moduleId -> progress
  achievements: Achievement[];
  assignedModuleIds?: string[]; // IDs of modules assigned by teacher
  customRewards?: string[]; // List of rewards given by teacher (e.g. "Free Time", "Sticker")
  
  // Placement Test
  placementTestStatus: 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';
  placementLevel?: number;
  placementAnalysis?: string;

  // Shop / Nest
  inventory: string[]; // Array of ShopItem IDs
  equipped: {
      hat?: string;
      glasses?: string;
      background?: string;
      accessory?: string;
  };
}

export interface MistakeRecord {
    question: string;
    attempt: string;
    correct: string;
}

export interface LessonPhaseState {
    phase: 'LOADING' | 'INTRO' | 'PRACTICE' | 'CONCEPT' | 'TEST' | 'RATING' | 'SUMMARY' | 'ERROR';
    subIndex: number;
    testScore: number;
    content: LessonContent; // We must save the content so the questions don't change on resume
    mistakes: MistakeRecord[]; // Track incorrect answers for analysis
    
    // Granular Resume State
    userAnswer?: string;
    feedback?: 'correct' | 'incorrect' | 'hint' | null;
    feedbackTitle?: string;
    attemptsForCurrent?: number;
}

export interface ModuleProgress {
  completed: boolean;
  score: number; // 0-100 (Based on Test section)
  attempts: number;
  confidence?: number; // 1-5 rating
  performanceAnalysis?: string; // AI generated feedback on specific mistakes
  resumeState?: LessonPhaseState; // Saved state if incomplete
}

export interface ClassGroup {
  id: string;
  teacherId: string;
  name: string;
  studentIds: string[];
  avatar?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  level: string; // Y1-2, Y3-4, Y5-6
  theme: ModuleTheme;
  description: string;
  ruleExplanation: string;
  isCustom?: boolean; // If true, generated from teacher words
  customWords?: string[]; 
  createdBy?: string; // Teacher ID
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  prompt: string;
  correctAnswer: string;
  options?: string[]; // For sorting/matching
  distractors?: string[];
  explanation: string; // The "why" it was wrong (shown on fail)
  hint: string; // A gentle nudge (shown on first attempt)
}

// Updated Interface for the Expanded Lesson Structure
export interface LessonContent {
  intro: {
    title: string;
    explanation: string;
    examples: { word: string; sentence: string }[];
  };
  practice: ActivityItem[]; // Practice questions (hints allowed)
  conceptCheck: {
    question: string; // Open ended question e.g. "What is a CVC word?"
    gradingGuidance: string; // Instructions for AI grader
  };
  quiz: ActivityItem[]; // Mini test (no hints, scored)
  conclusion: string;
}

export interface UserState {
  currentUser: Student | null; // For MVP teacher is just a "mode"
  currentRole: UserRole | null;
  currentClassId: string | null;
}
