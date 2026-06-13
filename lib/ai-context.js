import { sanitizePromptInput } from "@/lib/prompt-safety";

const FALLBACK_VALUE = "[not provided]";

function normalizeValue(value, maxLength = 400) {
  return sanitizePromptInput(value, maxLength);
}

function formatExperience(experience) {
  const numericExperience = Number(experience);

  if (Number.isFinite(numericExperience) && numericExperience >= 0) {
    return `${numericExperience} years`;
  }

  return FALLBACK_VALUE;
}

function formatSkills(skills) {
  if (!Array.isArray(skills) || skills.length === 0) {
    return FALLBACK_VALUE;
  }

  return skills
    .map((skill) => normalizeValue(skill, 120))
    .filter(Boolean)
    .join(", ") || FALLBACK_VALUE;
}

function formatProfileLine(label, value) {
  return `- ${label}: ${normalizeValue(value)}`;
}

function buildTurnEntries(messages = [], maxTurns = 3) {
  const lastMessages = messages
    .filter((message) => message && typeof message.role === "string")
    .slice(-maxTurns * 2);

  const turns = [];

  for (let index = 0; index < lastMessages.length; index += 2) {
    const userMessage = lastMessages[index];
    const assistantMessage = lastMessages[index + 1];

    turns.push({
      user: normalizeValue(userMessage?.content, 1500),
      assistant: assistantMessage ? normalizeValue(assistantMessage.content, 1500) : FALLBACK_VALUE,
    });
  }

  return turns.slice(-maxTurns);
}

export function buildUserProfileContext(user) {
  return [
    "User Profile Context:",
    formatProfileLine("Name", user?.name),
    formatProfileLine("Current Role", user?.currentRole),
    formatProfileLine("Industry", user?.industry),
    formatProfileLine("Experience", formatExperience(user?.experience)),
    formatProfileLine("Target Role", user?.targetRole),
    formatProfileLine("Skills", formatSkills(user?.skills)),
    formatProfileLine("Bio", user?.bio),
    formatProfileLine("Career Goals", user?.careerGoals),
  ].join("\n");
}

export function buildConversationContext(messages = []) {
  const turns = buildTurnEntries(messages);

  if (turns.length === 0) {
    return {
      context: "",
      debug: { turns: [] },
    };
  }

  const lines = ["Recent Conversation Turns:"];

  turns.forEach((turn, index) => {
    lines.push(
      `${index + 1}. User: ${turn.user}`,
      `   Assistant: ${turn.assistant}`
    );
  });

  return {
    context: lines.join("\n"),
    debug: { turns },
  };
}

export function buildUserAiContext(user, messages = []) {
  const profileContext = buildUserProfileContext(user);
  const conversationContext = buildConversationContext(messages);

  return {
    context: [profileContext, conversationContext.context].filter(Boolean).join("\n\n"),
    debug: {
      profileContext,
      conversationContext: conversationContext.context,
      recentTurns: conversationContext.debug.turns,
    },
  };
}