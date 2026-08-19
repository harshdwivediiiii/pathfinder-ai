"use server";

import crypto from "crypto";
import { handleServerError } from "@/lib/errors/error-handler";
import { db } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { cachedGenerateGeminiContent, QUIZ_CACHE_TTL_MS, generateCacheKey, getCacheStore } from "@/lib/cache";
import { buildSecurePrompt } from "@/lib/ai/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai/ai-context";
import { parseAIJson } from "@/lib/ai/validate";
import { validateInput, validateOutput } from "@/lib/ai/validate";
import { getCachedOrFetch } from "@/lib/ai/ai-cache";
import { quizCategorySchema, quizResultSaveSchema, quizResultSaveSessionSchema } from "@/lib/schemas/forms";
import { interviewQuestionsOutputSchema } from "@/lib/schemas";
import { voiceFeedbackOutputSchema, videoFeedbackOutputSchema } from "@/lib/schemas/interview";
import { checkRateLimit, formatResetTime, decrementRateLimit } from "@/lib/security/rate-limit-actions";
import { translations } from "@/lib/misc/translations";
import { unwrap } from "@/lib/db/redis-result";

// Fallback MCQ questions in case Gemini generation fails, categorized by industry
const TECH_FALLBACK_QUESTIONS = [
  {
    question: "What is the primary difference between process and thread?",
    options: [
      "Processes share memory, threads have isolated memory spaces",
      "Processes have isolated memory spaces, threads share memory space of parent process",
      "Threads run faster than processes on single-core CPUs only",
      "Processes cannot execute concurrently, threads can"
    ],
    correctAnswer: "Processes have isolated memory spaces, threads share memory space of parent process",
    explanation: "Processes are independent execution units with separate address spaces, whereas threads exist within a process and share memory and resources."
  },
  {
    question: "What does the SOLID acronym stand for in Object-Oriented Design?",
    options: [
      "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion",
      "Simple, Object-oriented, Logical, Integrated, Decoupled",
      "Synchronous, Operational, Linear, Inherited, Deterministic",
      "Stateful, Observability, Logging, Isolation, Durability"
    ],
    correctAnswer: "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion",
    explanation: "SOLID represents five key software design principles aimed at making software designs more understandable, flexible, and maintainable."
  },
  {
    question: "In relational databases, what is the purpose of an INDEX on a column?",
    options: [
      "To encrypt table data stored on disk",
      "To enforce foreign key constraints across tables",
      "To speed up data retrieval operations at the cost of additional write time and storage space",
      "To automatically deduplicate inserted rows"
    ],
    correctAnswer: "To speed up data retrieval operations at the cost of additional write time and storage space",
    explanation: "Indexes use B-trees or hash maps to allow the database engine to find rows matching a WHERE clause quickly without scanning the full table."
  },
  {
    question: "What is the main benefit of immutability in functional programming?",
    options: [
      "It eliminates memory allocation entirely",
      "It prevents unexpected side effects and makes state management predictable, especially in concurrent code",
      "It automatically compiles JavaScript code to WebAssembly",
      "It bypasses the garbage collector"
    ],
    correctAnswer: "It prevents unexpected side effects and makes state management predictable, especially in concurrent code",
    explanation: "Immutable data cannot be changed after creation, preventing multi-threaded race conditions and unintended mutations elsewhere in the application."
  },
  {
    question: "What is the Time Complexity of searching for an element in a balanced Binary Search Tree (BST)?",
    options: [
      "O(1)",
      "O(n)",
      "O(log n)",
      "O(n log n)"
    ],
    correctAnswer: "O(log n)",
    explanation: "In a balanced BST, each comparison halves the remaining search space, yielding O(log n) time complexity."
  }
];

const HEALTHCARE_FALLBACK_QUESTIONS = [
  {
    question: "What does HIPAA stand for in U.S. healthcare regulation?",
    options: [
      "Health Insurance Portability and Accountability Act",
      "Hospital Infrastructure Protection and Access Agency",
      "Healthcare Improvement and Patient Advocacy Association",
      "High-risk Insurance and Patient Assistance Act"
    ],
    correctAnswer: "Health Insurance Portability and Accountability Act",
    explanation: "HIPAA establishes federal standards to protect sensitive patient health information from disclosure without patient consent."
  },
  {
    question: "Which vital sign measurement indicates potential hypertensive crisis in an adult?",
    options: [
      "Systolic blood pressure over 180 mmHg and/or diastolic over 120 mmHg",
      "Heart rate of 72 beats per minute",
      "Oxygen saturation level of 98%",
      "Body temperature of 37.0 degrees Celsius"
    ],
    correctAnswer: "Systolic blood pressure over 180 mmHg and/or diastolic over 120 mmHg",
    explanation: "A blood pressure reading exceeding 180/120 mmHg is classified as a hypertensive crisis requiring prompt medical evaluation."
  }
];

const FINANCE_FALLBACK_QUESTIONS = [
  {
    question: "What does the Sharpe Ratio measure in portfolio management?",
    options: [
      "The total dividend yield of a stock index",
      "The risk-adjusted return of an investment relative to the risk-free rate",
      "The percentage of debt used to finance company assets",
      "The liquidity ratio of short-term liabilities"
    ],
    correctAnswer: "The risk-adjusted return of an investment relative to the risk-free rate",
    explanation: "The Sharpe Ratio calculates excess return per unit of volatility (standard deviation), helping investors compare risk-adjusted performance."
  },
  {
    question: "In corporate accounting, what is the fundamental Accounting Equation?",
    options: [
      "Assets = Liabilities + Equity",
      "Revenue - Expenses = Liabilities",
      "Assets = Net Income - Dividends",
      "Equity = Cash Flow + Working Capital"
    ],
    correctAnswer: "Assets = Liabilities + Equity",
    explanation: "The balance sheet relies on Assets = Liabilities + Equity, balancing what a business owns against what it owes to creditors and owners."
  }
];

const BUSINESS_FALLBACK_QUESTIONS = [
  {
    question: "In SWOT analysis, which two factors are considered internal to the organization?",
    options: [
      "Strengths and Opportunities",
      "Strengths and Weaknesses",
      "Weaknesses and Threats",
      "Opportunities and Threats"
    ],
    correctAnswer: "Strengths and Weaknesses",
    explanation: "Strengths and Weaknesses reside inside the organization, whereas Opportunities and Threats arise from the external environment."
  },
  {
    question: "What is Customer Acquisition Cost (CAC)?",
    options: [
      "The total sales revenue generated per customer annually",
      "The total cost of sales and marketing efforts needed to gain a new customer",
      "The cost of producing a single physical product unit",
      "The discount given to high-volume buyers"
    ],
    correctAnswer: "The total cost of sales and marketing efforts needed to gain a new customer",
    explanation: "CAC evaluates unit economics by dividing total acquisition expenses by the number of new customers acquired during a given period."
  }
];

const FallbackQuizPool = {
  tech: TECH_FALLBACK_QUESTIONS,
  software: TECH_FALLBACK_QUESTIONS,
  healthcare: HEALTHCARE_FALLBACK_QUESTIONS,
  finance: FINANCE_FALLBACK_QUESTIONS,
  consulting: BUSINESS_FALLBACK_QUESTIONS,
  retail: BUSINESS_FALLBACK_QUESTIONS,
  media: BUSINESS_FALLBACK_QUESTIONS,
  education: BUSINESS_FALLBACK_QUESTIONS,
  hospitality: BUSINESS_FALLBACK_QUESTIONS,
  nonprofit: BUSINESS_FALLBACK_QUESTIONS,
};

export function getFallbackQuestionsForIndustry(industry) {
  const key = industry?.toLowerCase() || "tech";
  const primaryPool = FallbackQuizPool[key] || TECH_FALLBACK_QUESTIONS;
  if (primaryPool.length >= 10) {
    return primaryPool.slice(0, 10);
  }

  const pool = [...primaryPool];
  const poolsToSearch = [
    TECH_FALLBACK_QUESTIONS,
    HEALTHCARE_FALLBACK_QUESTIONS,
    FINANCE_FALLBACK_QUESTIONS,
    BUSINESS_FALLBACK_QUESTIONS,
  ];

  for (const extraPool of poolsToSearch) {
    for (const q of extraPool) {
      if (pool.length >= 10) break;
      if (!pool.some((existing) => existing.question === q.question)) {
        pool.push(q);
      }
    }
    if (pool.length >= 10) break;
  }

  return pool.slice(0, 10);
}

export async function getCoachQuestions(locale = "en") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });
  const fallbackQuestions = getFallbackQuestionsForIndustry(user?.industry);
  const pool = fallbackQuestions.map((q) => q.question);

  if (locale !== "en" && translations[locale]?.interviewQuestion) {
    const localized = translations[locale].interviewQuestion;
    return [localized, ...pool.filter((q) => q !== localized)];
  }

  return pool;
}

/**
 * Generates 10 unique MCQ questions based on user's industry, skills, and quiz category.
 */
export async function generateQuiz(category = "Technical") {
  let userId = null;
  try {
    const authResult = await auth();
    userId = authResult?.userId;
    if (!userId) throw new Error("Unauthorized");

    const categoryValidation = validateInput(quizCategorySchema, { category });
    if (!categoryValidation.success) return { success: false, errors: categoryValidation.errors };

    const quizLimit = await checkRateLimit(userId, "quiz");
    if (!quizLimit.allowed) {
      return {
        success: false,
        errors: {
          _form: [`Quiz generation limit reached. Resets in ${formatResetTime(quizLimit.resetAt)}.`],
        },
      };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        name: true,
        industry: true,
        currentRole: true,
        targetRole: true,
        careerGoals: true,
        experience: true,
        bio: true,
        skills: true,
      },
    });
    if (!user) throw new Error("User not found");

    const profileContext = buildUserProfileContext(user);
    const validatedCategory = categoryValidation.data.category;

    const normalizedSkills = user.skills
      ? Array.from(new Set(user.skills.map((s) => String(s).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
      : [];

    const categoryPrompts = {
      Technical: "Generate 10 technical interview questions focusing on programming concepts, data structures, system design, algorithms, and practical technical knowledge.",
      Behavioral: "Generate 10 behavioral interview questions focusing on teamwork, leadership, conflict resolution, communication, and past experiences. Use scenarios like 'Tell me about a time when...' or 'How would you handle...'",
      Situational: "Generate 10 situational interview questions focusing on hypothetical workplace scenarios - how the candidate would handle specific on-the-job situations, ethical dilemmas, and decision-making.",
      "Industry Knowledge": "Generate 10 industry knowledge interview questions focusing on domain trends, terminology, business context, and role-specific professional awareness.",
    };

    const categoryIntro = categoryPrompts[validatedCategory] || categoryPrompts.Technical;

    const prompt = buildSecurePrompt({
      context: `${profileContext}\n\nThe candidate has listed their industry, skills, and a quiz category below.`,
      task: `You are a highly experienced hiring manager and strict quiz generator.

${categoryIntro}

Generate EXACTLY 10 UNIQUE MCQ questions.`,
      untrustedData: [
        { label: "industry", value: user.industry || "software", maxLength: 200 },
        { label: "skills", value: normalizedSkills.join(", ") || "Not specified", maxLength: 1000 },
        { label: "category", value: validatedCategory, maxLength: 200 },
      ],
      outputRules: `RULES:
- Exactly 10 questions only. No repetition.
- Each question must be highly relevant.
- Each question must have 4 FULL, realistic options (do NOT use labels like 'A', 'B', 'C', 'D' at the beginning of options).
- Only ONE correct answer.
- The 'correctAnswer' field MUST exactly match the string text of one of the options.
- Include a helpful, 1-2 sentence 'explanation' for the correct answer.

Return ONLY a valid JSON object matching this schema. Do not output any markdown code fences, headers, or extra text:

{
  "questions": [
    {
      "question": "Descriptive question text?",
      "options": [
        "Option text 1",
        "Option text 2",
        "Option text 3",
        "Option text 4"
      ],
      "correctAnswer": "Option text 3",
      "explanation": "Detailed explanation of why Option 3 is correct."
    }
  ]
}`,
    });

    const rawAiText = await getCachedOrFetch(
      JSON.stringify(prompt),
      'interview',
      async () => {
        const res = await generateGeminiContent(prompt);
        return res?.response && typeof res.response.text === "function"
          ? await res.response.text()
          : res?.text ?? "";
      },
      24 // 24 hour TTL
    );
    const quizValidation = validateOutput(interviewQuestionsOutputSchema, rawAiText);

    if (!quizValidation.success || !quizValidation.data?.questions?.length) {
      throw new Error("Invalid questions structure received from AI.");
    }

    const questions = quizValidation.data.questions.slice(0, 10);
    const sessionId = crypto.randomUUID();
    const cacheStore = getCacheStore();
    const cacheKey = generateCacheKey("quiz-session", userId, sessionId);
    await cacheStore.set(cacheKey, questions, QUIZ_CACHE_TTL_MS);

    return { sessionId, questions, isFallback: false };
  } catch (error) {
    if (userId) await decrementRateLimit(userId, "quiz");
    console.error("Quiz generation top-level error:", error);
    // Return fallback questions instead of throwing or returning error object
    const sessionId = crypto.randomUUID();
    const defaultQuestions = [
      {
        question: "Tell me about yourself.",
        options: ["A brief summary of my experience", "My entire life story", "Why I want this job", "My salary expectations"],
        correctAnswer: "A brief summary of my experience",
        explanation: "A good answer is concise and relevant to the position.",
      },
      {
        question: "What are your greatest strengths?",
        options: ["I have no weaknesses", "Only technical skills", "Relevant skills and how you've applied them", "Personal hobbies unrelated to work"],
        correctAnswer: "Relevant skills and how you've applied them",
        explanation: "Interviewers want to hear about skills that are relevant to the role.",
      },
    ];

    // Persist the fallback session so saveQuizResult can later load the questions.
    if (userId) {
      const cacheStore = getCacheStore();
      const cacheKey = generateCacheKey("quiz-session", userId, sessionId);
      await cacheStore.set(cacheKey, defaultQuestions, QUIZ_CACHE_TTL_MS);
    }

    return { sessionId, questions: defaultQuestions, isFallback: true };
  }
}

/**
 * Saves a quiz result and generates AI-powered feedback if mistakes were made.
 */
export async function saveQuizResult(sessionIdOrQuestions, answers, category = "Technical") {
  let userId = null;
  try {
    const authResult = await auth();
    userId = authResult?.userId;
    if (!userId) throw new Error("Unauthorized");

    if (!sessionIdOrQuestions) {
      throw new Error("Session ID or questions array is required.");
    }

    const cacheStore = getCacheStore();

    let questions;
    let isCached = false;
    let cacheKey = null;
    let validatedSessionId = "direct-array";

    if (typeof sessionIdOrQuestions === "string" && sessionIdOrQuestions.trim().length > 0) {
      validatedSessionId = sessionIdOrQuestions;
      cacheKey = generateCacheKey("quiz-session", userId, validatedSessionId);
      const questionsResult = await cacheStore.get(cacheKey);
      questions = unwrap(questionsResult);
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error("Quiz session expired or not found. Please start a new quiz.");
      }
      isCached = true;
    } else if (Array.isArray(sessionIdOrQuestions) && sessionIdOrQuestions.length > 0) {
      questions = sessionIdOrQuestions;
    } else {
      throw new Error("Invalid session ID or questions format.");
    }

    const validation = validateInput(
      isCached ? quizResultSaveSessionSchema : quizResultSaveSchema,
      isCached
        ? { sessionId: validatedSessionId, answers, category }
        : { questions, answers, category }
    );
    if (!validation.success) return { success: false, errors: validation.errors };

    const validatedAnswers = validation.data.answers;
    const validatedCategory = validation.data.category;

    const feedbackLimit = await checkRateLimit(userId, "quizFeedback");
    if (!feedbackLimit.allowed) {
      return {
        success: false,
        errors: {
          _form: [`Quiz feedback limit reached. Resets in ${formatResetTime(feedbackLimit.resetAt)}.`],
        },
      };
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const profileContext = buildUserProfileContext(user);

    const sanitizedAnswers = Array.isArray(validatedAnswers)
      ? validatedAnswers.slice(0, questions.length)
      : [];
    while (sanitizedAnswers.length < questions.length) {
      sanitizedAnswers.push(null);
    }

    let correctCount = 0;
    const questionResults = [];
    const wrongAnswers = [];

    questions.forEach((q, index) => {
      if (!q?.question) return;

      const userAnswer = sanitizedAnswers[index];
      const isCorrect = q.correctAnswer === userAnswer;
      if (isCorrect) {
        correctCount++;
      }

      const mappedQuestion = {
        question: q.question.trim(),
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer,
        isCorrect,
        explanation: q.explanation || "",
      };

      questionResults.push(mappedQuestion);

      if (!isCorrect) {
        wrongAnswers.push(mappedQuestion);
      }
    });

    const score = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

    let improvementTip = null;

    if (wrongAnswers.length > 0) {
      const wrongText = wrongAnswers
        .slice(0, 3)
        .map((q) => `Q: ${q.question}\nCorrect answer was: ${q.correctAnswer}\nUser answered: ${q.userAnswer || "No Answer"}`)
        .join("\n\n");

      const tipPrompt = buildSecurePrompt({
        context: profileContext,
        task: "You are a supportive career mentor. The candidate completed a quiz. Provide an encouraging, actionable improvement tip (strictly max 2 sentences) recommending key learning areas. Be positive, warm, and professional. Do not refer to question indexes or speak critically.",
        untrustedData: [
          { label: "industry", value: user.industry || "software", maxLength: 200 },
          { label: "category", value: validatedCategory, maxLength: 200 },
          { label: "score", value: String(score), maxLength: 50 },
          { label: "wrongAnswers", value: wrongText, maxLength: 4000 },
        ],
      });

      try {
        const tipResult = await generateGeminiContent(tipPrompt);
        improvementTip = tipResult.response.text().trim();
      } catch (e) {
        console.error("Failed to generate custom AI improvement tip:", e);
        const industryText = user.industry ? `in ${user.industry.toLowerCase()}` : "in your field";
        improvementTip = `Focus on reviewing core ${validatedCategory.toLowerCase()} concepts and typical industry practices ${industryText} to strengthen your skills.`;
      }
    }

    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: validatedCategory,
        improvementTip,
      },
    });

    if (cacheKey) {
      await cacheStore.delete(cacheKey);
    }

    return assessment;
  } catch (error) {
    const isRateLimitError = error.message?.includes("limit reached");
    if (userId && !isRateLimitError) {
      await decrementRateLimit(userId, "quizFeedback");
    }
    return handleServerError(error, "interview");
  }
}

export async function getAssessments() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return [];

    return db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    return handleServerError(error, "interview");
  }
}

/**
 * Fetches a single assessment by ID.
 */
export async function getAssessment(id) {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) return null;

    return db.assessment.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
  } catch (error) {
    return handleServerError(error, "interview");
  }
}

/**
 * Evaluates a transcribed voice answer using the AI coach.
 */
export async function evaluateVoiceAnswer(question, transcribedAnswer) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const voiceLimit = await checkRateLimit(userId, "voiceEvaluation");
    if (!voiceLimit.allowed) {
      return { success: false, error: `Voice evaluation limit reached. Resets in ${formatResetTime(voiceLimit.resetAt)}.` };
    }

    const prompt = buildSecurePrompt({
      context: "You are an expert interview coach evaluating a spoken answer from a candidate.",
      task: "Evaluate the transcribed answer based on confidence, filler words, and content quality.",
      untrustedData: [
        { label: "question", value: question, maxLength: 1000 },
        { label: "transcribedAnswer", value: transcribedAnswer, maxLength: 3000 },
      ],
      outputRules: `Provide feedback in JSON format ONLY. Do not output any markdown code fences or extra text:
{
  "score": 85,
  "fillerWordsCount": 3,
  "confidence": "High",
  "feedback": "Your answer was very structured, but you used 'um' a few times."
}`,
    });

    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(voiceFeedbackOutputSchema, aiResult.response.text());
    if (!validation.success) {
      console.error("Voice evaluation output validation failed:", validation.errors);
      return { success: false, error: "AI returned an unexpected format." };
    }
    return { success: true, data: validation.data };
  } catch (error) {
    return handleServerError(error, "interview");
  }
}

/**
 * Evaluates a transcribed video answer along with basic body language metrics.
 */
export async function evaluateVideoAnswer(question, transcribedAnswer, metrics) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const videoLimit = await checkRateLimit(userId, "videoEvaluation");
    if (!videoLimit.allowed) {
      return { success: false, error: `Video evaluation limit reached. Resets in ${formatResetTime(videoLimit.resetAt)}.` };
    }

    const prompt = buildSecurePrompt({
      context: "You are an expert interview coach evaluating a video interview response.",
      task: "Evaluate the transcribed answer and the provided facial metrics (e.g., face detected percentage).",
      untrustedData: [
        { label: "question", value: question, maxLength: 1000 },
        { label: "transcribedAnswer", value: transcribedAnswer, maxLength: 3000 },
        { label: "metrics", value: JSON.stringify(metrics), maxLength: 500 },
      ],
      outputRules: `Provide feedback in JSON format ONLY. Do not output any markdown code fences or extra text:
{
  "score": 85,
  "fillerWordsCount": 3,
  "confidence": "High",
  "bodyLanguageFeedback": "You maintained great eye contact and presence.",
  "verbalFeedback": "Your answer was very structured, but you used 'um' a few times."
}`,
    });

    const aiResult = await generateGeminiContent(prompt);
    const validation = validateOutput(videoFeedbackOutputSchema, aiResult.response.text());
    if (!validation.success) {
      console.error("Video evaluation output validation failed:", validation.errors);
      return { success: false, error: "AI returned an unexpected format." };
    }
    return { success: true, data: validation.data };
  } catch (error) {
    return handleServerError(error, "interview");
  }
}
