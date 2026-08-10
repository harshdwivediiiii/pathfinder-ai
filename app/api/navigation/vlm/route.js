import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";
import { ERROR_CODES, respondError } from "@/lib/api/error-handler";
import { vlmNavigationSchema } from "@/lib/schemas/forms";
import { sanitizeInput } from "@/lib/security/sanitize";

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const body = await request.json();

    const validation = vlmNavigationSchema.safeParse(body);

    if (!validation.success) {
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid navigation payload",
        validation.error.flatten().fieldErrors
      );
    }

    const { image, instruction } = validation.data;
    const sanitizedInstruction = sanitizeInput(instruction);

    const base64Data = image.split(",")[1];
    const mimeType = image.split(",")[0].match(/:(.*?);/)[1];

    const promptText = `
You are an expert navigation assistant that uses visual landmarks to give intuitive directions to pedestrians.
You are given an image of a street view or junction, and a standard navigation instruction.
Analyze the image to find prominent, permanent, and easily recognizable landmarks (e.g. a specific store, a unique colored building, a statue, a distinct intersection feature).
Translate the standard instruction into a natural language instruction using these landmarks.
For example, instead of "Turn right in 100 meters", say "Turn right just after the red brick Starbucks".
Keep the instruction concise, natural, and helpful.

Standard instruction: "${sanitizedInstruction}"
    `;

    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
    };

    const result = await generateGeminiContent(requestPayload);
    const text = result.response.text();

    return NextResponse.json({
      landmarkInstruction: text.trim(),
    });
  } catch (error) {
    console.error("VLM Navigation Error:", error);
    return respondError(ERROR_CODES.INTERNAL_SERVER_ERROR, "Failed to generate landmark instructions.");
  }
}
