"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { cachedGenerateGeminiContent, QUIZ_CACHE_TTL_MS, generateCacheKey } from "@/lib/cache";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { buildUserProfileContext } from "@/lib/ai-context";
import { validateInput, validateOutput } from "@/lib/validate";
import { quizCategorySchema, quizResultSaveSchema } from "@/lib/schemas/forms";
import { interviewQuestionsOutputSchema } from "@/lib/schemas/outputs";
import { checkRateLimit, formatResetTime } from "@/lib/rate-limit-actions";

// Fallback MCQ questions in case Gemini generation fails, categorized by industry
const TECH_FALLBACK_QUESTIONS = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Transfer Machine Language",
      "Hyperlink Text Management Language",
      "Home Tool Markup Language",
    ],
    correctAnswer: "Hyper Text Markup Language",
    explanation: "HTML (Hyper Text Markup Language) is the standard markup language used to structure and display web pages.",
  },
  {
    question: "Which programming language runs natively inside web browsers?",
    options: [
      "Java",
      "Python",
      "C++",
      "JavaScript",
    ],
    correctAnswer: "JavaScript",
    explanation: "JavaScript is a high-level, interpreted scripting language that conforms to the ECMAScript specification and runs natively inside all modern browsers.",
  },
  {
    question: "What is React mainly used for in web development?",
    options: [
      "Database management",
      "Frontend user interface development",
      "Operating systems",
      "Network routing and security",
    ],
    correctAnswer: "Frontend user interface development",
    explanation: "React is a popular open-source JavaScript library developed by Meta specifically for building component-based frontend user interfaces.",
  },
  {
    question: "Which of the following database models is NoSQL?",
    options: [
      "PostgreSQL",
      "MongoDB",
      "MySQL",
      "Oracle DB",
    ],
    correctAnswer: "MongoDB",
    explanation: "MongoDB is a leading document-oriented NoSQL database that stores data in JSON-like flexible documents.",
  },
  {
    question: "What does CSS handle in modern web development?",
    options: [
      "Server-side business logic",
      "Database storage and caching",
      "Styling, layout, and visual presentation",
      "User authentication and sessions",
    ],
    correctAnswer: "Styling, layout, and visual presentation",
    explanation: "CSS (Cascading Style Sheets) is a stylesheet language used to specify the layout, colors, fonts, and overall visual appearance of HTML documents.",
  },
  {
    question: "Which hook is commonly used to manage state inside a React function component?",
    options: [
      "useEffect",
      "useFetch",
      "useState",
      "useRouter",
    ],
    correctAnswer: "useState",
    explanation: "The useState hook is a built-in React hook that allows functional components to have local state variables that persist across renders.",
  },
  {
    question: "What is Node.js?",
    options: [
      "A frontend CSS styling framework",
      "An open-source server runtime environment for JavaScript",
      "A relational database system",
      "A code compilation package manager",
    ],
    correctAnswer: "An open-source server runtime environment for JavaScript",
    explanation: "Node.js is a cross-platform, open-source JavaScript runtime environment built on Chrome's V8 engine that allows developers to run JS code server-side.",
  },
  {
    question: "Which technology company originally created and released Java?",
    options: [
      "Google",
      "Sun Microsystems",
      "Microsoft",
      "Apple",
    ],
    correctAnswer: "Sun Microsystems",
    explanation: "Java was originally developed and released by James Gosling and his team at Sun Microsystems in 1995 (later acquired by Oracle).",
  },
  {
    question: "What does API stand for in software integration?",
    options: [
      "Application Programming Interface",
      "Advanced Program Interaction",
      "Applied Programming Internet",
      "Application Process Integration",
    ],
    correctAnswer: "Application Programming Interface",
    explanation: "An API (Application Programming Interface) is a set of defined rules and protocols that enables different software applications to communicate and exchange data.",
  },
  {
    question: "Which keyword is used to declare a variable in older JavaScript scopes that is function-scoped?",
    options: [
      "define",
      "string",
      "var",
      "integer",
    ],
    correctAnswer: "var",
    explanation: "In JavaScript, 'var' is the original keyword used to declare variables. It is function-scoped rather than block-scoped like 'let' and 'const'.",
  },
];

const HEALTHCARE_FALLBACK_QUESTIONS = [
  {
    question: "What is the primary purpose of HIPAA?",
    options: [
      "Regulating medical device manufacturing",
      "Protecting patient health information privacy and security",
      "Determining hospital funding allocation",
      "Establishing medical licensing requirements",
    ],
    correctAnswer: "Protecting patient health information privacy and security",
    explanation: "HIPAA (Health Insurance Portability and Accountability Act) sets national standards for protecting sensitive patient health information from being disclosed without the patient's consent or knowledge.",
  },
  {
    question: "What does the acronym 'EHR' stand for in healthcare administration?",
    options: [
      "Emergency Hospital Registry",
      "Electronic Health Record",
      "Essential Health Requirements",
      "Extended Healthcare Registry",
    ],
    correctAnswer: "Electronic Health Record",
    explanation: "An Electronic Health Record (EHR) is a digital version of a patient's paper chart, containing real-time, patient-centered records that make information available instantly and securely.",
  },
  {
    question: "Which of the following is considered a primary care provider?",
    options: [
      "Cardiologist",
      "Family Medicine Physician",
      "Neurosurgeon",
      "Orthopedic Surgeon",
    ],
    correctAnswer: "Family Medicine Physician",
    explanation: "Family Medicine Physicians provide comprehensive, continuous primary healthcare for individuals and families across all ages, genders, and diseases.",
  },
  {
    question: "What is triage in healthcare settings?",
    options: [
      "A three-step surgical procedure",
      "The process of prioritizing patients based on the severity of their condition",
      "A clinical research trial phase",
      "A medical billing coding system",
    ],
    correctAnswer: "The process of prioritizing patients based on the severity of their condition",
    explanation: "Triage is the prioritization of patient care based on clinical urgency to optimize resource allocation and ensure critical patients receive immediate care.",
  },
  {
    question: "What does 'myocardial infarction' refer to?",
    options: [
      "A stroke",
      "A heart attack",
      "A kidney infection",
      "A bone fracture",
    ],
    correctAnswer: "A heart attack",
    explanation: "Myocardial infarction is the medical term for a heart attack, which occurs when blood flow to a part of the heart muscle is blocked, causing tissue damage.",
  },
  {
    question: "Which professional is responsible for preparing and dispensing prescriptions?",
    options: [
      "Physician Assistant",
      "Pharmacist",
      "Registered Nurse",
      "Physical Therapist",
    ],
    correctAnswer: "Pharmacist",
    explanation: "Pharmacists are healthcare professionals who specialize in the right use, storage, preservation, and dispensing of medicines.",
  },
  {
    question: "What is the standard term for a hospital-acquired infection?",
    options: [
      "Chronic infection",
      "Nosocomial infection",
      "Systemic infection",
      "Localized infection",
    ],
    correctAnswer: "Nosocomial infection",
    explanation: "Nosocomial infections (also called healthcare-associated infections) are those contracted by patients during their stay in a hospital or healthcare facility.",
  },
  {
    question: "What is the main function of red blood cells?",
    options: [
      "Fighting infections",
      "Carrying oxygen to body tissues",
      "Clotting blood",
      "Producing antibodies",
    ],
    correctAnswer: "Carrying oxygen to body tissues",
    explanation: "Red blood cells contain hemoglobin, a protein that binds to oxygen in the lungs and transports it to tissues throughout the body.",
  },
  {
    question: "What does the term 'benign' mean in medical pathology?",
    options: [
      "Spreading rapidly",
      "Non-cancerous",
      "Infectious",
      "Painful",
    ],
    correctAnswer: "Non-cancerous",
    explanation: "Benign refers to a condition, tumor, or growth that is not cancerous, does not invade nearby tissue, and does not spread to other parts of the body.",
  },
  {
    question: "What is telehealth?",
    options: [
      "A telephone triage hotline",
      "The remote delivery of healthcare services using telecommunications technology",
      "A television program about healthy living",
      "A database of patient medical records",
    ],
    correctAnswer: "The remote delivery of healthcare services using telecommunications technology",
    explanation: "Telehealth uses digital information and communication technologies (computers, mobile devices) to access and manage healthcare services remotely.",
  },
];

const FINANCE_FALLBACK_QUESTIONS = [
  {
    question: "What does 'ROI' stand for in financial management?",
    options: [
      "Rate of Inflation",
      "Return on Investment",
      "Risk of Insolvency",
      "Revenue on Installments",
    ],
    correctAnswer: "Return on Investment",
    explanation: "Return on Investment (ROI) measures the gain or loss generated on an investment relative to the amount of money invested.",
  },
  {
    question: "What is a bond in finance?",
    options: [
      "A share of ownership in a corporation",
      "A debt security where an investor lends money to an entity",
      "A contract to buy foreign currency",
      "A legally binding agreement between business partners",
    ],
    correctAnswer: "A debt security where an investor lends money to an entity",
    explanation: "A bond is a fixed-income instrument that represents a loan made by an investor to a borrower (typically corporate or governmental) with fixed interest payments.",
  },
  {
    question: "What is the main objective of diversifying a portfolio?",
    options: [
      "Maximizing short-term transaction fees",
      "Reducing overall investment risk",
      "Avoiding taxes on gains",
      "Guarantying a fixed return rate",
    ],
    correctAnswer: "Reducing overall investment risk",
    explanation: "Diversification spreads investments across various financial instruments, industries, and categories to minimize the impact of any single asset's poor performance.",
  },
  {
    question: "What does the Federal Reserve regulate in the United States?",
    options: [
      "Corporate tax rates",
      "Monetary policy and the banking system",
      "International trade agreements",
      "Federal government spending",
    ],
    correctAnswer: "Monetary policy and the banking system",
    explanation: "The Federal Reserve is the central bank of the U.S., responsible for conducting monetary policy and regulating financial institutions to promote economic stability.",
  },
  {
    question: "What is a bear market?",
    options: [
      "A market characterized by rising stock prices",
      "A market characterized by falling stock prices",
      "A market with low trading volume",
      "A market for commodities and raw materials",
    ],
    correctAnswer: "A market characterized by falling stock prices",
    explanation: "A bear market is a condition in which securities prices fall 20% or more from recent highs amid widespread pessimism and negative investor sentiment.",
  },
  {
    question: "What does 'liquid asset' mean?",
    options: [
      "An asset stored in digital format",
      "Cash or an asset that can be quickly converted to cash",
      "An asset that changes in value daily",
      "An investment in water utilities",
    ],
    correctAnswer: "Cash or an asset that can be quickly converted to cash",
    explanation: "Liquid assets are cash or other assets (like stocks or short-term bonds) that can be easily and quickly converted into cash without significant loss of value.",
  },
  {
    question: "What is inflation?",
    options: [
      "A decrease in the money supply",
      "The rate at which the general level of prices for goods and services rises",
      "A growth in corporate profit margins",
      "The decrease in the physical size of currency notes",
    ],
    correctAnswer: "The rate at which the general level of prices for goods and services rises",
    explanation: "Inflation is the decline of purchasing power of a given currency over time, reflected in the increase of prices of goods and services.",
  },
  {
    question: "What is the P/E ratio of a stock?",
    options: [
      "Profit-to-Expense ratio",
      "Price-to-Earnings ratio",
      "Payment-to-Equity ratio",
      "Principal-to-Estimate ratio",
    ],
    correctAnswer: "Price-to-Earnings ratio",
    explanation: "The Price-to-Earnings (P/E) ratio is the ratio for valuing a company that measures its current share price relative to its per-share earnings.",
  },
  {
    question: "What is the difference between revenue and net income?",
    options: [
      "Revenue includes taxes; net income does not",
      "Revenue is total sales; net income is profit after all expenses",
      "Revenue is cash flow; net income is account balances",
      "There is no difference",
    ],
    correctAnswer: "Revenue is total sales; net income is profit after all expenses",
    explanation: "Revenue represents the total money brought in by sales, whereas net income is the profit remaining after deducting all operating costs, taxes, and expenses.",
  },
  {
    question: "What does 'amortization' mean?",
    options: [
      "Increasing the value of an asset",
      "Paying off debt over time in regular installments",
      "Calculating tax write-offs",
      "Converting debt into equity shares",
    ],
    correctAnswer: "Paying off debt over time in regular installments",
    explanation: "Amortization is the practice of spreading out a loan into a series of periodic payments, or writing off the value of an intangible asset over time.",
  },
];

const BUSINESS_FALLBACK_QUESTIONS = [
  {
    question: "What does a SWOT analysis evaluate?",
    options: [
      "Sales, Wages, Operations, Taxes",
      "Strengths, Weaknesses, Opportunities, Threats",
      "Strategy, Workload, Organization, Timing",
      "Success, Wealth, Optimization, Target",
    ],
    correctAnswer: "Strengths, Weaknesses, Opportunities, Threats",
    explanation: "A SWOT analysis is a strategic planning framework used to identify and analyze internal and external factors affecting a business's projects.",
  },
  {
    question: "What is a 'deliverable' in project management?",
    options: [
      "A vehicle used to transport goods",
      "A tangible or intangible good or service produced as a result of a project",
      "A team member assigned to client communication",
      "A project milestone that has been missed",
    ],
    correctAnswer: "A tangible or intangible good or service produced as a result of a project",
    explanation: "Deliverables are the quantifiable goods or services that must be completed and delivered to a client or stakeholder upon a project's completion.",
  },
  {
    question: "What does 'B2B' stand for in business operations?",
    options: [
      "Back-to-Back transactions",
      "Business-to-Business commerce",
      "Budget-to-Business planning",
      "Buyer-to-Broker negotiation",
    ],
    correctAnswer: "Business-to-Business commerce",
    explanation: "B2B (Business-to-Business) describes transactions or commerce conducted between one business and another, rather than between a business and individual consumers.",
  },
  {
    question: "What is the primary focus of change management?",
    options: [
      "Updating software platforms in an organization",
      "Helping individuals and teams transition through organizational change",
      "Calculating currency exchange rates",
      "Hiring new executive leadership",
    ],
    correctAnswer: "Helping individuals and teams transition through organizational change",
    explanation: "Change management is a structured approach to transition individuals, teams, and organizations from a current state to a desired future state.",
  },
  {
    question: "What does 'KPI' stand for in business analytics?",
    options: [
      "Key Profit Indicator",
      "Key Performance Indicator",
      "Key Process Integration",
      "Knowledge Performance Index",
    ],
    correctAnswer: "Key Performance Indicator",
    explanation: "A Key Performance Indicator (KPI) is a quantifiable measure used to evaluate the success of an organization or activity in meeting performance objectives.",
  },
  {
    question: "What is scope creep in project management?",
    options: [
      "A team member who works slowly",
      "Uncontrolled changes or continuous growth in a project's scope",
      "A software tool used for tracking bugs",
      "A decrease in project budget allocations",
    ],
    correctAnswer: "Uncontrolled changes or continuous growth in a project's scope",
    explanation: "Scope creep refers to when a project's requirements expand beyond the original plan without corresponding adjustments in time, budget, or resources.",
  },
  {
    question: "What is 'market segmentation'?",
    options: [
      "Dividing a market into distinct groups of buyers based on different needs or characteristics",
      "Selling a business in parts",
      "Comparing prices of different competitors",
      "Registering a trademark in multiple regions",
    ],
    correctAnswer: "Dividing a market into distinct groups of buyers based on different needs or characteristics",
    explanation: "Market segmentation involves dividing a broad target market into subsets of consumers who have common needs or priorities, then designing strategies to target them.",
  },
  {
    question: "What is the main purpose of a non-disclosure agreement (NDA)?",
    options: [
      "Determining salary structures",
      "Protecting proprietary or confidential information from being shared",
      "Establishing partnership profit shares",
      "Setting employee working hours",
    ],
    correctAnswer: "Protecting proprietary or confidential information from being shared",
    explanation: "An NDA is a legal contract that prohibits parties from sharing confidential information or trade secrets disclosed to them with external entities.",
  },
  {
    question: "What is 'customer acquisition cost' (CAC)?",
    options: [
      "The price a customer pays for a product",
      "The total cost associated with convincing a customer to buy a product or service",
      "The cost of manufacturing a custom item",
      "The loss incurred from losing a client",
    ],
    correctAnswer: "The total cost associated with convincing a customer to buy a product or service",
    explanation: "CAC measures the total sales and marketing cost required to acquire a single new customer over a specific period.",
  },
  {
    question: "What does 'RFP' stand for in procurement?",
    options: [
      "Request for Pricing",
      "Request for Proposal",
      "Reason for Purchase",
      "Record of Financial Performance",
    ],
    correctAnswer: "Request for Proposal",
    explanation: "An RFP is a document that solicits proposals, often made through a bidding process, by an agency or company interested in procurement of services or assets.",
  },
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

/**
 * Generates 10 unique MCQ questions based on user's industry, skills, and quiz category.
 */
export async function generateQuiz(category = "Technical") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const categoryValidation = validateInput(quizCategorySchema, { category });
  if (!categoryValidation.success) return { success: false, errors: categoryValidation.errors };

  const quizLimit = await checkRateLimit(userId, "quiz");
  if (!quizLimit.allowed) {
    throw new Error(`Quiz generation limit reached. Resets in ${formatResetTime(quizLimit.resetAt)}.`);
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

  const categoryIntro = categoryPrompts[validatedCategory];

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

  try {
    const result = await generateGeminiContent(prompt);
    const quizValidation = validateOutput(interviewQuestionsOutputSchema, result.response.text());

    if (!quizValidation.success || !quizValidation.data?.questions?.length) {
      throw new Error("Invalid questions structure received from AI.");
    }

    return quizValidation.data.questions.slice(0, 10);
  } catch (error) {
    console.error("AI Quiz generation failed, using fallback questions:", error);
    const industryId = user.industry?.split("-")[0]?.toLowerCase() || "tech";
    return FallbackQuizPool[industryId] || TECH_FALLBACK_QUESTIONS;
  }
}

/**
 * Saves a quiz result and generates AI-powered feedback if mistakes were made.
 */
export async function saveQuizResult(questions, answers, category = "Technical") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validation = validateInput(quizResultSaveSchema, { questions, answers, category });
  if (!validation.success) return { success: false, errors: validation.errors };

  const feedbackLimit = await checkRateLimit(userId, "quizFeedback");
  if (!feedbackLimit.allowed) {
    throw new Error(`Quiz feedback limit reached. Resets in ${formatResetTime(feedbackLimit.resetAt)}.`);
  }

  const {
    questions: validatedQuestions,
    answers: validatedAnswers,
    category: validatedCategory,
  } = validation.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  // Map user answers to question outcomes and compute score server-side
  const questionResults = [];
  const wrongAnswers = [];
  let correctCount = 0;

  validatedQuestions.forEach((q, index) => {
    if (!q?.question) return;

    const userAnswer = validatedAnswers[index];
    const isCorrect = q.correctAnswer === userAnswer;

    const mappedQuestion = {
      question: q.question.trim(),
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswer,
      isCorrect,
      explanation: q.explanation,
    };

    questionResults.push(mappedQuestion);

    if (isCorrect) {
      correctCount++;
    } else {
      wrongAnswers.push(mappedQuestion);
    }
  });

  const computedScore = validatedQuestions.length > 0
    ? Math.round((correctCount / validatedQuestions.length) * 100)
    : 0;

  let improvementTip = null;

  if (wrongAnswers.length > 0) {
    const profileContext = buildUserProfileContext(user);
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
        { label: "score", value: String(computedScore), maxLength: 50 },
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

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: computedScore,
        questions: questionResults,
        category: validatedCategory,
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving assessment to database:", error);
    throw new Error("Failed to save quiz results.");
  }
}

/**
 * Fetches all assessments for the signed-in user, newest first.
 */
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
    console.error("Error fetching assessments:", error);
    return [];
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
    console.error("Error fetching assessment:", error);
    return null;
  }
}

/**
 * Evaluates a transcribed voice answer.
 */
export async function evaluateVoiceAnswer(question, transcribedAnswer) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const prompt = buildSecurePrompt({
  context: "You are an expert interview coach evaluating a spoken answer from a candidate.",
  task: "Evaluate the transcribed answer based on confidence, filler words, and content quality.",
  untrustedData: [
    { label: "question",          value: question,          maxLength: 1000 },
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
  try {
    const aiResult = await generateGeminiContent(prompt);
    let rawText = aiResult.response.text();
    const parsed = JSON.parse(rawText);
    return { success: true, data: parsed };
  } catch (error) {
    console.error("Voice evaluation error:", error);
    return { success: false, error: "Failed to evaluate answer." };
  }
}

/**
 * Evaluates a transcribed video answer along with basic body language metrics.
 */
export async function evaluateVideoAnswer(question, transcribedAnswer, metrics) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");


const prompt = buildSecurePrompt({
  context: "You are an expert interview coach evaluating a video interview response.",
  task: "Evaluate the transcribed answer and the provided facial metrics (e.g., face detected percentage).",
  untrustedData: [
    { label: "question",           value: question,                    maxLength: 1000 },
    { label: "transcribedAnswer",  value: transcribedAnswer,           maxLength: 3000 },
    { label: "metrics",            value: JSON.stringify(metrics),     maxLength: 500  },
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

  try {
    const aiResult = await generateGeminiContent(prompt);
    let rawText = aiResult.response.text();
    const parsed = JSON.parse(rawText);
    return { success: true, data: parsed };
  } catch (error) {
    console.error("Video evaluation error:", error);
    return { success: false, error: "Failed to evaluate video answer." };
  }
}