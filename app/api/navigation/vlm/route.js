import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/ai/gemini";
import { NextResponse } from "next/server";
import { ERROR_CODES, respondError } from "@/lib/api/error-handler";
import { IMAGE_MAX_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/security/input-limits";

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const body = await request.json();
    const { image, instruction } = body;

    if (!image || !instruction) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Image and instruction are required.");
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(image);
    } catch {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid image URL format.");
    }

    if (parsedUrl.protocol !== "data:") {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Only data: URLs are accepted for image input.");
    }

    const mimeType = parsedUrl.pathname.includes(";")
      ? parsedUrl.pathname.split(";")[0]
      : parsedUrl.pathname;

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        `Unsupported image type '${mimeType}'. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}.`
      );
    }

    const base64Data = parsedUrl.pathname.includes("base64,")
      ? parsedUrl.pathname.split("base64,")[1] || image.substring(image.indexOf("base64,") + 7)
      : image.substring(image.indexOf(",") + 1);

    if (!base64Data) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Invalid image format.");
    }

    const decodedBuffer = Buffer.from(base64Data, "base64");
    if (decodedBuffer.length === 0) {
      return respondError(ERROR_CODES.VALIDATION_ERROR, "Decoded image data is empty.");
    }

    if (decodedBuffer.length > IMAGE_MAX_BYTES) {
      return respondError(
        ERROR_CODES.VALIDATION_ERROR,
        `Image exceeds maximum size of ${IMAGE_MAX_BYTES / (1024 * 1024)}MB (got ${(decodedBuffer.length / (1024 * 1024)).toFixed(2)}MB).`
      );
    }

    const promptText = `
You are an expert navigation assistant that uses visual landmarks to give intuitive directions to pedestrians.
You are given an image of a street view or junction, and a standard navigation instruction.
Analyze the image to find prominent, permanent, and easily recognizable landmarks (e.g. a specific store, a unique colored building, a statue, a distinct intersection feature).
Translate the standard instruction into a natural language instruction using these landmarks.
For example, instead of "Turn right in 100 meters", say "Turn right just after the red brick Starbucks".
Keep the instruction concise, natural, and helpful.

Standard instruction: "${instruction}"
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
