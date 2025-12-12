import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonContent, ActivityType, LearningModule } from "../types";

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

// 1. Generate the Full Lesson
export const generateActivitiesForModule = async (module: LearningModule): Promise<LessonContent> => {
  const prompt = `
    Create a comprehensive spelling lesson for New Zealand primary school students.
    
    Context:
    - Level: ${module.level}
    - Theme: ${module.theme}
    - Rule: ${module.ruleExplanation}

    Activity Type Guide:
    - 'BUILD_WORD': The student must type the word. (Use this for the main spelling tasks).
    - 'MATCHING': The student selects the correct option from a list.
    - 'FIX_SENTENCE': The student rewrites a sentence correctly.

    Structure Requirements:
    1. INTRO: Title, rule explanation, and 2-3 examples.
    
    2. PRACTICE: Generate 3 practice questions.
       - **STRICT PROMPT RULES**:
         - **NO FILL-IN-THE-BLANKS**: Do NOT use sentences with underscores (e.g. "The ___ sat down").
         - **USE DEFINITIONS**: Prompts must be clues or definitions.
           - Correct: "Spell the word for a fluffy animal that says meow."
           - Correct: "What word means the opposite of hot?"
       - **DISTRACTORS**: If type is 'MATCHING' or 'SORTING', you MUST provide at least 2 wrong answers in the 'distractors' array.

    3. CONCEPT CHECK: **MANDATORY**: Generate ONE open-ended question asking "What is...?" or "How does...?".
       - Example: "What is the rule for Magic E?"
    
    4. QUIZ: Generate 3 test questions.
       - Use 'BUILD_WORD' for at least 2 questions to test spelling ability.
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
        systemInstruction: "You are an expert literacy teacher. You NEVER use fill-in-the-blank sentences for spelling prompts. You ALWAYS use definitions.",
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
            // If it's matching but has no distractors, force it to build_word so they have to type it (fallback)
            if (p.type === "MATCHING" && (!p.distractors || p.distractors.length === 0)) {
                p.type = "BUILD_WORD";
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

// 2. Grade the Concept Check Answer
export const evaluateStudentAnswer = async (question: string, userAnswer: string, guidance: string): Promise<{ score: number; feedback: string }> => {
    const prompt = `
        Question: "${question}"
        Grading Guidance: "${guidance}"
        Student Answer: "${userAnswer}"

        Task: Grade the student's understanding on a scale of 1 to 5.
        
        Rules:
        - Target Audience: Year 1-6 Primary School Child.
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
        type: ActivityType.BUILD_WORD, 
        prompt: 'Spell the word for a pet that barks.', 
        correctAnswer: 'dog', 
        explanation: 'D-O-G. Short "o" sound.',
        hint: 'Starts with D.'
      },
      { 
        id: 'p2', 
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
      }
    ],
    conclusion: "You are a master of short sounds! Kia pai tō mahi!"
  };
}