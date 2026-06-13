import { z } from "zod";

export const chatPromptSchema = z.string().trim().min(1, "Prompt is required");
