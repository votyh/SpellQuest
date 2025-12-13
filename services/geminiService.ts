import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonContent, ActivityType, LearningModule, MistakeRecord } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the Main Lesson Generation
const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    intro: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            explanation: { type: Type.STRING },
            examples: { 
                type: Type.ARRAY, 
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        sentence: { type: Type.STRING }
                    }
                }
            }
        },
        required: ["title", "explanation", "examples"]
    },
    practice: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["BUILD_WORD", "MATCHING", "SORTING", "FIX_SENTENCE"] },
            prompt: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            hint: { type: Type.STRING }
            },
            required: ["id", "type", "prompt", "correctAnswer", "explanation", "hint"]
        }
    },
    conceptCheck: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            gradingGuidance: { type: Type.STRING }
        },
        required: ["question", "gradingGuidance"]
    },
    quiz: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["BUILD_WORD", "MATCHING", "SORTING", "FIX_SENTENCE"] },
            prompt: { type: Type.STRING },
            correctAnswer: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            hint: { type: Type.STRING }
            },
            required: ["id", "type", "prompt", "correctAnswer", "explanation", "hint"]
        }
    },
    conclusion: { type: Type.STRING }
  },
  required: ["intro", "practice", "conceptCheck", "quiz", "conclusion"]
};

// 1. Generate the Full Lesson (Standard + Custom Words)
export const generateActivitiesForModule = async (module: LearningModule): Promise<LessonContent> => {
  const isCustom = module.isCustom && module.customWords && module.customWords.length > 0;

  let promptContext = "";
  
  if (isCustom) {
      promptContext = `
        **CUSTOM WORD LIST MODE**
        The teacher has provided this specific list of words: ${module.customWords?.join(", ")}.
        
        Tasks:
        1. **Analyze** the list to find the common spelling pattern or rule (e.g. they all end in 'tion' or they are all about 'space').
        2. **Explain** this rule in the Intro.
        3. **Generate** practice and quiz questions that PRIMARILY use these specific words. You can add 1-2 similar words if the list is short (<4 words), but focus on the provided list.
      `;
  } else {
      promptContext = `
        **STANDARD CURRICULUM MODE**
        - Level: ${module.level}
        - Theme: ${module.theme}
        - Rule: ${module.ruleExplanation}
      `;
  }

  const prompt = `
    Create a comprehensive spelling and grammar lesson for New Zealand primary school students.
    
    ${promptContext}

    Activity Type Guide:
    - 'BUILD_WORD': The student must type the word.
    - 'MATCHING': The student selects the correct option from a list.
    - 'FIX_SENTENCE': The student rewrites a sentence correctly.

    Structure Requirements:
    1. INTRO: Title, rule explanation, and 2-3 examples.
    
    2. PRACTICE: Generate **4 to 6** practice questions.
       - **MANDATORY RULE QUESTIONS**: You MUST include at least 2 questions that ask about the rule itself, not just spelling a word.
       - **DISTRACTORS**: For 'MATCHING' or 'SORTING', you **MUST** provide 3 distinct, plausible wrong answers in the 'distractors' array. Do NOT leave this empty.
         - Correct: "Phonix", "Fonics", "Phonicks" (for Phonics).

    3. CONCEPT CHECK: **MANDATORY**: Generate ONE open-ended question asking "What is...?" or "How does...?".
    
    4. QUIZ: Generate **4 to 6** test questions.
       - Include at least 1 conceptual question about the rule.
       - Use 'BUILD_WORD' for the rest to test spelling ability.
       - Follow the same STRICT PROMPT RULES (No underscores/blanks).
    
    5. CONCLUSION: A short, encouraging wrap-up message.

    Tone: Encouraging, fun, and typically New Zealand (Kiwi) English.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        systemInstruction: "You are an expert literacy teacher. You ensure every multiple-choice question has exactly 1 correct answer and 3 incorrect distractors.",
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Validation: Ensure prompts are not empty and distractors exist for non-typing tasks
    const validateItems = (items: any[]) => {
        if (!items) return;
        items.forEach((p: any) => { 
            if (!p.prompt) p.prompt = "Solve this puzzle:";
            // Force Type if missing
            if (!p.type) p.type = "BUILD_WORD";
            
            // CRITICAL FIX: If type is MATCHING/SORTING but lacks distractors, convert to BUILD_WORD
            // This prevents questions with only 1 option (the correct answer) from appearing.
            if ((p.type === "MATCHING" || p.type === "SORTING")) {
                if (!p.distractors || !Array.isArray(p.distractors) || p.distractors.length === 0) {
                     // Fallback strategy: User must type the answer since we have no wrong options to show.
                     p.type = "BUILD_WORD";
                }
            }
        });
    };

    validateItems(data.practice);
    validateItems(data.quiz);

    if (!data.intro || !data.practice) throw new Error("Incomplete AI response");
    return data as LessonContent;

  } catch (error) {
    console.error("Gemini Generation Error", error);
    return getFallbackLesson(module.id);
  }
};

// 2. Generate Lesson Analysis (Feedback)
export const generateLessonAnalysis = async (moduleTitle: string, mistakes: MistakeRecord[]): Promise<{ analysis: string }> => {
    if (!mistakes || mistakes.length === 0) {
        return { analysis: "Perfect score! You're a legend!" };
    }

    const mistakesText = mistakes.map(m => `Word/Question: "${m.question}". Their Answer: "${m.attempt}". Correct: "${m.correct}".`).join('\n');

    const prompt = `
        You are Tudor, a friendly Kiwi bird teacher.
        The student just finished a module called "${moduleTitle}" but made some mistakes.
        
        Mistakes:
        ${mistakesText}

        Task:
        - Analyze the mistakes. Is there a pattern? (e.g. forgetting silent letters, mixing up vowels).
        - Give ONE concise, helpful tip to fix this pattern.
        - Be encouraging and constructive.
        - Limit response to 2 sentences.
    `;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return { analysis: response.text || "Good effort! Keep practicing those tricky words." };
    } catch (e) {
        return { analysis: "Keep practicing! You'll get it next time." };
    }
}

// 3. Grade the Concept Check Answer
export const evaluateStudentAnswer = async (question: string, userAnswer: string, guidance: string): Promise<{ score: number; feedback: string }> => {
    const prompt = `
        Question: "${question}"
        Grading Guidance: "${guidance}"
        Student Answer: "${userAnswer}"

        Task: Grade the student's understanding on a scale of 1 to 5.
        
        Rules:
        - Target Audience: Year 1-8 Student.
        - **BE LENIENT**: If they mention keywords (e.g. "letters", "sounds", "vowels", "consonants") or give a correct example, give at least a 3.
        - Score 1: Irrelevant or nonsense.
        - Score 3: Basic understanding / correct keywords.
        - Score 5: Perfect explanation.
        
        Output JSON:
        {
            "score": number, // 1-5
            "feedback": "A short, encouraging sentence explaining the score."
        }
    `;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        feedback: { type: Type.STRING }
                    },
                    required: ["score", "feedback"]
                }
            }
        });
        return JSON.parse(response.text || '{"score": 3, "feedback": "Good effort!"}');
    } catch (e) {
        return { score: 3, feedback: "Good effort! I think you've got the idea." }; // Fail open
    }
}

// 4. Tudor AI Chat
export const askTudor = async (studentQuery: string, context: { moduleTitle: string, currentQuestion?: string, rule?: string, exampleWords?: string[] }): Promise<string> => {
    const examplesContext = context.exampleWords && context.exampleWords.length > 0 
        ? `- Example words in this lesson: ${context.exampleWords.join(', ')}`
        : '';

    const prompt = `
        You are 'Tudor', a friendly, wise Kiwi bird assistant for a primary school spelling app.
        
        Context:
        - Module: "${context.moduleTitle}".
        - Rule: "${context.rule}".
        - Current Question: "${context.currentQuestion || 'General help'}".
        ${examplesContext}

        Student asks: "${studentQuery}"

        Instructions:
        - **Persona**: You are a helpful Kiwi bird teacher. Be encouraging, use emojis (🥝, ✨, 📚), and occasional NZ slang (e.g., "Kia ora", "Sweet as", "Good on ya").
        - **Visuals**: Use spacing, bullet points, and text formatting to make explanations clear.
        - **Phonetics**: When explaining a word, visually break it down (e.g., "B - EA - CH" or "PH - O - N - I - CS").
        - **Context**: If the student asks about a specific word from the lesson (listed above), explain it using the rule.
        - **Goal**: Help them learn *how* to spell. Do not just give the answer unless they are completely stuck after a hint.
        - **Length**: Keep responses short (max 3 sentences) unless explaining a concept with a list.
        - If they ask "What is the answer?", say "I can't give you the answer, but remember the rule: ${context.rule}" or give a strong hint.
    `;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "Oops, I dropped my notes! Try asking again.";
    } catch (e) {
        return "Sorry, I'm having trouble hearing you! Check your connection.";
    }
};

// 5. Placement Test Services
export interface PlacementQuestion {
    id: string;
    level: number;
    question: string;
    correctAnswer: string;
    distractors: string[]; // For multiple choice to make it easy to grade automatically without typing ambiguity
}

export const generatePlacementTest = async (): Promise<PlacementQuestion[]> => {
    const prompt = `
        Generate a comprehensive 20-question diagnostic spelling test for a primary school student (New Zealand Curriculum).
        
        CRITICAL INSTRUCTIONS:
        1. You MUST generate exactly 20 items.
        2. **RULE APPLICATION**: Do not just ask to spell a word. Include questions that test RULES (e.g., "Which suffix should we use?", "Why do we double the 't' in 'sitting'?").
        3. **NO AMBIGUITY**: There must be EXACTLY one correct answer. 
        4. **NO SELF-REFERENCE**: Do NOT use the answer word in the question text (e.g., Do NOT say "What rhymes with 'Den'?" if the answer is 'Den'). Instead say "Name the home of a lion".
        5. 'distractors' MUST contain 3 incorrect spellings that look phonetically plausible.
        
        Structure:
        - Questions 1-4: Level 1 (Simple CVC, initial sounds).
        - Questions 5-8: Level 2 (Blends, digraphs, magic E).
        - Questions 9-12: Level 3 (Vowel teams, soft c/g, r-controlled).
        - Questions 13-16: Level 4 (Prefixes/Suffixes, silent letters).
        - Questions 17-20: Level 5 (Academic vocab, complex roots).
        
        Output JSON Array of objects with: id, level (1-5), question, correctAnswer, distractors.
    `;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            level: { type: Type.INTEGER },
                            question: { type: Type.STRING },
                            correctAnswer: { type: Type.STRING },
                            distractors: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["id", "level", "question", "correctAnswer", "distractors"]
                    }
                }
            }
        });
        
        const data = JSON.parse(response.text || "[]");
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Empty question list generated");
        }
        
        // Sanitize data to ensure questions have text
        return data.map((q: any) => {
            const text = q.question || q.Question || q.prompt || q.Prompt || "Select the correct spelling:";
            return {
                ...q,
                question: (text && text.trim().length > 0) ? text : "Select the correct spelling:",
                distractors: q.distractors || []
            };
        });

    } catch (e) {
        console.error("Placement Gen Error", e);
        // Fallback with representative questions across levels
        return [
            { id: 'q1', level: 1, question: "Which word is spelled correctly?", correctAnswer: "cat", distractors: ["kat", "caat", "katt"] },
            { id: 'q2', level: 1, question: "Select the correct word: The pig is ___.", correctAnswer: "big", distractors: ["bigg", "beg", "bip"] },
            { id: 'q3', level: 1, question: "Select the correct word: I ___ on the chair.", correctAnswer: "sat", distractors: ["satt", "set", "sap"] },
            { id: 'q4', level: 1, question: "Which starts with P?", correctAnswer: "pin", distractors: ["bin", "din", "tin"] },
            { id: 'q5', level: 2, question: "Select the correct word: The ___ sails on the sea.", correctAnswer: "ship", distractors: ["shipp", "chip", "sip"] },
            { id: 'q6', level: 2, question: "Which word has a magic E?", correctAnswer: "hope", distractors: ["hop", "hopp", "hupe"] },
            { id: 'q7', level: 2, question: "Select the correct word: She has a ___ on her face.", correctAnswer: "chin", distractors: ["shin", "kin", "chen"] },
            { id: 'q8', level: 2, question: "Spell the animal:", correctAnswer: "frog", distractors: ["frock", "fog", "frug"] },
            { id: 'q9', level: 3, question: "Choose the right spelling:", correctAnswer: "train", distractors: ["trane", "trayn", "traen"] },
            { id: 'q10', level: 3, question: "Select the correct word:", correctAnswer: "circle", distractors: ["sircle", "sercle", "circl"] },
            { id: 'q11', level: 3, question: "Which word is an animal?", correctAnswer: "bird", distractors: ["burd", "berd", "bord"] },
            { id: 'q12', level: 3, question: "Select the correct word: The ___ was sweet.", correctAnswer: "cake", distractors: ["cak", "kaik", "cayk"] },
            { id: 'q13', level: 4, question: "Which is correct?", correctAnswer: "running", distractors: ["runing", "runeing", "runnig"] },
            { id: 'q14', level: 4, question: "Select the word with a prefix:", correctAnswer: "replay", distractors: ["play", "player", "playing"] },
            { id: 'q15', level: 4, question: "Past tense of stop:", correctAnswer: "stopped", distractors: ["stoped", "stopt", "stopd"] },
            { id: 'q16', level: 4, question: "Silent letter word:", correctAnswer: "knight", distractors: ["night", "nite", "kight"] },
            { id: 'q17', level: 5, question: "Select the correct academic word:", correctAnswer: "analyse", distractors: ["analize", "anulise", "analise"] },
            { id: 'q18', level: 5, question: "Which word ends correctly?", correctAnswer: "expansion", distractors: ["expantion", "expancion", "expanzion"] },
            { id: 'q19', level: 5, question: "Scientific term:", correctAnswer: "photo", distractors: ["foto", "fowto", "poto"] },
            { id: 'q20', level: 5, question: "Correct spelling:", correctAnswer: "muscle", distractors: ["mussel", "musle", "muscel"] }
        ];
    }
}

export const analyzePlacementTest = async (results: {question: PlacementQuestion, isCorrect: boolean}[]): Promise<{level: number, analysis: string}> => {
    const prompt = `
        Analyze these diagnostic test results to assign a New Zealand Curriculum spelling level (1-5).
        
        Results:
        ${results.map(r => `Level ${r.question.level} Question: ${r.isCorrect ? "CORRECT" : "WRONG"}`).join('\n')}
        
        Rules:
        - Analyze performance across the 5 levels.
        - **BE GENEROUS WITH PLACEMENT**: If a student gets most Level 1 and 2 questions right, place them in Level 3.
        - If they get most Level 3 right, place them in Level 4.
        - Only place in Level 1 if they failed basic Level 1/2 questions.
        - Provide a short, encouraging analysis sentence for the teacher.
        
        Output JSON: { level: number, analysis: string }
    `;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        level: { type: Type.INTEGER },
                        analysis: { type: Type.STRING }
                    },
                    required: ["level", "analysis"]
                }
            }
        });
        return JSON.parse(response.text || '{"level": 1, "analysis": "Let\'s start from the beginning to build confidence."}');
    } catch (e) {
        return { level: 1, analysis: "Placement analysis unavailable. Starting at Level 1." };
    }
}


const getFallbackLesson = (moduleId: string): LessonContent => {
  return {
    intro: {
        title: "Short Vowel Sounds",
        explanation: "CVC words are short words that have a Consonant, then a Vowel, then a Consonant. The vowel makes a short sound.",
        examples: [
            { word: "Cat", sentence: "The cat sat on the mat." },
            { word: "Pig", sentence: "The pig likes mud." }
        ]
    },
    practice: [
      { 
        id: 'p1', 
        type: ActivityType.MATCHING,
        prompt: 'What does "CVC" stand for?',
        correctAnswer: 'Consonant Vowel Consonant',
        options: ['Consonant Vowel Consonant', 'Cat Van Can', 'Circle Very Cool'],
        distractors: ['Cat Van Can', 'Circle Very Cool', 'Cool Very Cool'],
        explanation: 'CVC describes the pattern of letters.',
        hint: 'Think about the types of letters.'
      },
      { 
        id: 'p2', 
        type: ActivityType.BUILD_WORD, 
        prompt: 'Spell the word for a pet that barks.', 
        correctAnswer: 'dog', 
        explanation: 'D-O-G. Short "o" sound.',
        hint: 'Starts with D.'
      },
      { 
        id: 'p3', 
        type: ActivityType.SORTING, 
        prompt: 'Which word has a short "a"?', 
        correctAnswer: 'hat', 
        options: ['hat', 'late'], 
        explanation: 'Hat is short. Late is long.',
        hint: 'Listen for the quick sound.'
      }
    ],
    conceptCheck: {
        question: "What is a CVC word?",
        gradingGuidance: "Look for mentions of Consonant Vowel Consonant or short sounds."
    },
    quiz: [
         { 
        id: 'q1', 
        type: ActivityType.FIX_SENTENCE, 
        prompt: 'The sunn is hot.', 
        correctAnswer: 'sun', 
        explanation: 'Sun only needs one n.',
        hint: ''
      },
      { 
        id: 'q2', 
        type: ActivityType.BUILD_WORD, 
        prompt: 'Spell the word for a square container.', 
        correctAnswer: 'box', 
        explanation: 'B-O-X',
        hint: ''
      },
      {
        id: 'q3',
        type: ActivityType.MATCHING,
        prompt: 'Which letter is the vowel in "PIG"?',
        correctAnswer: 'I',
        options: ['P', 'I', 'G'],
        distractors: ['P', 'G', 'U', 'A'],
        explanation: 'I is the vowel.',
        hint: 'A, E, I, O, U'
      }
    ],
    conclusion: "You are a master of short sounds! Kia pai tō mahi!"
  };
}