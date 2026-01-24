
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonContent, ActivityType, LearningModule, MistakeRecord, DifficultWord, MisreadWord } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- YEAR LEVEL REFERENCE DATA (CALIBRATION) ---
const LEVEL_REFERENCES: Record<number, { focus: string, text: string }> = {
    1: {
        focus: "Simple sentences, concrete ideas, familiar actions",
        text: "The dog ran across the grass. It saw a red ball and barked happily. The ball rolled into a puddle, and the dog splashed after it. The dog was wet, but it wagged its tail."
    },
    2: {
        focus: "Simple sequencing, basic emotion",
        text: "Mia walked to the park with her brother. The swing moved high and low, and the wind brushed her face. She laughed when her shoes almost touched the sky. It was her favourite part of the day."
    },
    3: {
        focus: "Description, cause and effect",
        text: "The old tree stood at the edge of the playground. Its branches stretched wide, giving shade on hot days. When the bell rang, children gathered underneath it. It felt like a quiet place in a noisy school."
    },
    4: {
        focus: "Figurative language (basic), expanded sentences",
        text: "Rain tapped gently on the window as Leo finished his homework. The sound reminded him of fingers drumming on a table. Outside, puddles grew bigger and shinier. Leo hoped the rain would stop before morning."
    },
    5: {
        focus: "Stronger description, inner thought",
        text: "The hallway felt longer than usual as Ava walked toward the office. Her heart thumped like a drum in her chest. She didn’t know what she had done wrong, but she felt nervous. When the door opened, she took a deep breath."
    },
    6: {
        focus: "Mood, tension, varied sentence length",
        text: "The forest grew quiet as the sun dipped behind the hills. Birds vanished into the trees, and the air turned cool. Sam slowed his steps. For the first time, he wondered if coming alone had been a mistake."
    },
    7: {
        focus: "Metaphor, inference, stronger vocabulary",
        text: "The classroom buzzed with energy before the debate began. Ideas bounced from desk to desk like sparks. Ella clenched her notes, knowing her turn was coming. This was no longer just an assignment — it was a test of confidence."
    },
    8: {
        focus: "Character motivation, symbolism",
        text: "The cracked trophy sat at the back of the shelf, forgotten. Once, it had meant everything to Marcus. Now, it reminded him of how much he had changed. He reached past it and closed the cupboard door."
    },
    9: {
        focus: "Abstract ideas, controlled imagery",
        text: "The town looked smaller from the hill, as if its problems could be folded away. Lila knew that wasn’t true. Distance made things seem simple, but living inside them was harder. She turned back toward the road."
    },
    10: {
        focus: "Theme, implication, layered meaning",
        text: "The announcement echoed through the hall, but no one spoke. Some students stared at the floor; others smiled too quickly. Change had arrived, whether they wanted it or not. The silence said more than words ever could."
    },
    11: {
        focus: "Symbolism, authorial intent, interpretation",
        text: "The river no longer flooded the village, yet people still feared it. Old stories clung to its banks like mist. Even progress could not erase memory. The water flowed on, indifferent to human belief."
    },
    12: {
        focus: "Ambiguity, complex metaphor, tone",
        text: "The abandoned house leaned into the wind, its windows dark and watchful. Time had stripped it of warmth but not of presence. Those who passed felt its weight without understanding why. Some places remember more than people do."
    },
    13: {
        focus: "Dense language, abstraction, layered symbolism",
        text: "The silence in the courtroom was not empty; it was burdened. Every pause carried the residue of unspoken truths. Justice, Elian realised, was less a verdict than a negotiation with memory. And memory, unlike law, never truly rested."
    }
};

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

export interface PlacementQuestion {
  question: string;
  correctAnswer: string;
  distractors: string[];
  level: number;
}

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
    
    const validateItems = (items: any[]) => {
        if (!items) return;
        items.forEach((p: any) => { 
            if (!p.prompt) p.prompt = "Solve this puzzle:";
            if (!p.type) p.type = "BUILD_WORD";
            
            if ((p.type === "MATCHING" || p.type === "SORTING")) {
                if (!p.distractors || !Array.isArray(p.distractors) || p.distractors.length === 0) {
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
        You are a friendly, encouraging primary school teacher (Year 1-8).

        Question: "${question}"
        Grading Guidance: "${guidance}"
        Student Answer: "${userAnswer}"

        Task: Grade the student's understanding on a scale of 1 to 5.
        
        **GRADING RULES**:
        1. **ACCURACY OVER GRAMMAR**: If the student conveys the correct *meaning* or *concept*, give a high score (4 or 5), even if their grammar or spelling is imperfect.
        2. **IGNORE LENGTH**: Short answers (e.g. "It means x") are valid. Do not demand essay-length answers.
        3. **SYNONYMS ARE VALID**: If they use different words to say the same thing, count it as correct.
        4. **SCORE 1**: Only for irrelevant, nonsensical, or completely wrong answers.
        
        Output JSON:
        {
            "score": number, // 1-5
            "feedback": "A short, encouraging sentence explaining the score. If correct, say 'Spot on!' or similar."
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
export const askTudor = async (studentQuery: string, context: { moduleTitle: string, currentQuestion?: string, correctAnswer?: string, rule?: string, exampleWords?: string[] }): Promise<string> => {
    const examplesContext = context.exampleWords && context.exampleWords.length > 0 
        ? `- Known words in this lesson: ${context.exampleWords.join(', ')}`
        : '';

    const targetAnswerContext = context.correctAnswer 
        ? `**HIDDEN TARGET ANSWER**: "${context.correctAnswer}" (Do NOT say this word!)` 
        : "No specific target answer for this phase.";

    const prompt = `
        You are 'Tudor', a friendly, wise Kiwi bird assistant for a primary school spelling app.
        
        Context:
        - Module: "${context.moduleTitle}".
        - Rule: "${context.rule}".
        - Current Question Prompt: "${context.currentQuestion || 'General help'}".
        - ${targetAnswerContext}
        ${examplesContext}

        Student asks: "${studentQuery}"

        **CRITICAL INSTRUCTIONS (SCAFFOLDING MODE):**
        1. **NEVER GIVE THE ANSWER**: You are forbidden from spelling out or saying the "Hidden Target Answer" directly.
        2. **Strategy for Help**:
           - If they ask "What is the answer?", REFUSE politely. Say "I can't tell you, but..."
           - **Rhyme Strategy**: Give them a word that rhymes (e.g., "It rhymes with 'Cat'").
           - **Pattern Strategy**: Give them a *different* word that follows the same rule (e.g., "Think of how we spell 'Light'. This word works the same way!").
           - **Definition Strategy**: Describe the word's meaning (e.g., "It's an animal that barks").
           - **First Letter**: You can give the first letter ONLY if they are really stuck.
        
        **Persona Guidelines:**
        - Be encouraging and use emojis (🥝, ✨, 📚).
        - Use occasional NZ slang (e.g., "Kia ora", "Sweet as", "Good on ya").
        - Keep responses short (max 2-3 sentences).
        - Format clearly.

        Example Interaction:
        Target: "Night"
        Student: "How do I spell it?"
        Tudor: "I can't spell it for you, but I can help! 🥝 It rhymes with 'Bright' and uses the 'igh' pattern. Try sounding it out: N - IGHT."
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

// 5. Generate Placement Test
export const generatePlacementTest = async (): Promise<PlacementQuestion[]> => {
    const prompt = `
        Generate a spelling placement test for a primary school student (Year 1-8).
        Create 10 multiple choice questions, ranging from very easy (Level 1) to difficult (Level 5).
        
        Output JSON format:
        [
            {
                "question": "Which word is spelled correctly?",
                "correctAnswer": "Because",
                "distractors": ["Becoz", "Becuase", "Beceuse"],
                "level": 1
            },
            ...
        ]
        
        Ensure a good mix of phonics, irregular words, and morphological rules.
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
                            question: { type: Type.STRING },
                            correctAnswer: { type: Type.STRING },
                            distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            level: { type: Type.INTEGER }
                        },
                        required: ["question", "correctAnswer", "distractors", "level"]
                    }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Failed to generate placement test", e);
        // Fallback questions if AI fails
        return [
            { question: "Select the correct spelling.", correctAnswer: "Cat", distractors: ["Kat", "Catt", "Caat"], level: 1 },
            { question: "Select the correct spelling.", correctAnswer: "Happy", distractors: ["Hapy", "Happee", "Hapey"], level: 2 },
            { question: "Select the correct spelling.", correctAnswer: "Because", distractors: ["Becoz", "Becuase", "Beceuse"], level: 3 },
            { question: "Select the correct spelling.", correctAnswer: "Necessary", distractors: ["Neccessary", "Necesary", "Nesessary"], level: 4 },
            { question: "Select the correct spelling.", correctAnswer: "Accommodation", distractors: ["Acommodation", "Accomodation", "Acomodation"], level: 5 },
        ];
    }
}

// 6. Analyze Placement Results
export const analyzePlacementTest = async (results: {question: PlacementQuestion, isCorrect: boolean}[]): Promise<{level: number, analysis: string}> => {
    const correctCount = results.filter(r => r.isCorrect).length;
    const total = results.length;
    
    const mistakes = results.filter(r => !r.isCorrect).map(r => 
        `Level ${r.question.level} Question: "${r.question.question}". Target: "${r.question.correctAnswer}".`
    ).join('\n');

    const prompt = `
        A student took a spelling placement test.
        Score: ${correctCount}/${total}.
        
        Mistakes made:
        ${mistakes || "None. Perfect score."}

        Task:
        1. Determine the appropriate starting Level (1-5) based on where they started failing.
        2. Write a short, encouraging analysis for the student (max 2 sentences).
        
        Output JSON:
        {
            "level": number,
            "analysis": "string"
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
                        level: { type: Type.INTEGER },
                        analysis: { type: Type.STRING }
                    },
                    required: ["level", "analysis"]
                }
            }
        });
        return JSON.parse(response.text || '{"level": 1, "analysis": "Let\'s start at the beginning!"}');
    } catch (e) {
        return { level: 1, analysis: "Good effort! Let's start from Level 1 and build up." };
    }
}

// 7. Generate Reading Passage (ENHANCED with Calibrated Examples)
export const generateReadingPassage = async (level: number, theme: string = 'General'): Promise<{ title: string, content: string }> => {
    
    // Fallback to closest available level if user is out of range (though UI clamps at 1-13)
    const effectiveLevel = Math.max(1, Math.min(13, level));
    const reference = LEVEL_REFERENCES[effectiveLevel] || LEVEL_REFERENCES[4];

    const prompt = `
        You are an expert educational writer for New Zealand schools.
        
        **TASK**: Write a **complete short story** (approx 100-250 words) appropriate for a **Year ${effectiveLevel}** student.
        
        **THEME**: ${theme === 'General' ? 'Mystery or Adventure in New Zealand' : theme}

        **STYLE & COMPLEXITY GUIDE**:
        You MUST mimic the sentence structure, vocabulary difficulty, and tone of the following reference snippet, but expand it into a full narrative.
        
        *Reference Snippet*: "${reference.text}"
        *Focus Area*: ${reference.focus}

        **INSTRUCTIONS**:
        1. The story must be significantly longer than the snippet (at least 100 words).
        2. Use New Zealand English spelling (e.g. colour, mum, realised).
        3. Ensure the reading level matches the reference exactly. Do not make it too hard or too easy.
        
        Output JSON:
        {
            "title": "Creative Title",
            "content": "Full story content..."
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
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                    },
                    required: ["title", "content"]
                }
            }
        });
        return JSON.parse(response.text || '{"title": "The Kiwi", "content": "The kiwi bird is awake at night."}');
    } catch (e) {
        return { title: "The Forest", content: "Tudor the Kiwi walked through the green forest. He was looking for bugs to eat." };
    }
}

// 8. Analyze Reading Log (UPDATED FOR MULTIMODAL AUDIO INPUT)
export const analyzeReadingLog = async (
    audioBase64: string, 
    mimeType: string,
    studentYearLevel: number, 
    targetText?: string
): Promise<{difficultWords: DifficultWord[], misreadWords: MisreadWord[], feedback: string, assessedLevel: string}> => {
    
    const audioPart = {
        inlineData: {
            mimeType: mimeType,
            data: audioBase64
        }
    };

    const promptText = `
        You are an expert New Zealand Literacy Specialist (Tudor).
        Please listen to the attached audio of a student reading.
        
        **Context:**
        - Student Year Level: Year ${studentYearLevel}
        ${targetText ? `- Target Text they are trying to read: "${targetText}"` : '- Student is Free Reading (no target text provided, so judge based on vocabulary used).'}

        **Your Assessment Tasks:**
        1. **Listen & Transcribe Internally:** Listen carefully to what was actually said.
        2. **Evaluate Accuracy:** Compare it to the target text. 
           - **CRITICAL:** Do NOT penalize for minor accent variations (Kiwi accent) or self-corrections if they get it right eventually.
           - **CRITICAL:** Do NOT drop the reading level for 1 or 2 mistakes. If they read a Level 5 text with >90% accuracy, they are "Fluent Level 5", not "Level 3".
        3. **Evaluate Fluency:** Listen for expression, pausing at punctuation, and smooth phrasing.
        
        **Output Requirements:**
        - **difficultWords**: Identify 2-3 words from the text that are complex for this level (even if they read them correctly, just highlight them as "advanced vocabulary").
        - **misreadWords**: Only list words they genuinely struggled with or got wrong. If they were perfect, leave this empty.
        - **feedback**: Write 2 encouraging sentences. Focus on what they did WELL (e.g. "Great expression!", "You tackled that long word perfectly").
        - **assessedLevel**: Give a string estimate. 
           - Use format: "[Fluency] [Level]". e.g. "Fluent Level 5", "Developing Level 4", "Early Level 5".
           - **ACCURACY RULE:** If the Target Text was Level X, and they made <3 mistakes, the Assessed Level MUST be Level X (Fluent). Only downgrade if they struggled significantly.
        
        Output JSON:
        {
            "difficultWords": [ { "word": "example", "meaning": "definition" } ],
            "misreadWords": [ { "word": "targetWord", "heard": "whatYouHeard" } ],
            "feedback": "Your reading was very clear! You stumbled slightly on multi-syllable words.",
            "assessedLevel": "Fluent Level 5"
        }
    `;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [audioPart, { text: promptText }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        difficultWords: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    meaning: { type: Type.STRING }
                                },
                                required: ["word", "meaning"]
                            }
                        },
                        misreadWords: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    heard: { type: Type.STRING }
                                },
                                required: ["word", "heard"]
                            }
                        },
                        feedback: { type: Type.STRING },
                        assessedLevel: { type: Type.STRING }
                    },
                    required: ["difficultWords", "misreadWords", "feedback", "assessedLevel"]
                }
            }
        });
        const result = JSON.parse(response.text || "{}");
        return { 
            difficultWords: result.difficultWords || [], 
            misreadWords: result.misreadWords || [],
            feedback: result.feedback || "Good reading!",
            assessedLevel: result.assessedLevel || `Level ${studentYearLevel}`
        };
    } catch (e) {
        console.error("Reading analysis failed", e);
        return { difficultWords: [], misreadWords: [], feedback: "Great effort reading today! I had a little trouble hearing the file.", assessedLevel: "Level " + studentYearLevel };
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
