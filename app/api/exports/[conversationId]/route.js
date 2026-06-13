import { db } from "@/lib/prisma";
import { respondError, ERROR_CODES } from "@/lib/api/error-handler";
import { generateJsonExport } from "@/lib/export/json-export";
import { generateMarkdownExport } from "@/lib/export/markdown-export";
import { getOwnedConversation } from "@/lib/conversation/getConversation";
import { validateId } from "@/lib/validate";


/**
 * GET handler for exporting a conversation by its ID.
 * Supports exporting in JSON and Markdown formats.
 * Records the export event in ExportRecord and AuditLog tables.
 *
 * @param {Request} request - The incoming HTTP request.
 * @param {object} context - Context containing route params.
 * @param {object} context.params - Route parameters.
 * @returns {Promise<Response>} HTTP Response containing the exported file data.
 */
export async function GET(request, context) {
  const params = await context.params;
  const idValidation = validateId(params.conversationId, "conversationId");

  if (!idValidation.success) {
    return respondError(ERROR_CODES.VALIDATION_ERROR, "Conversation ID is required", idValidation.errors);
  }
  const format =
    new URL(request.url).searchParams.get("format") || "json";
    if (!["json", "md"].includes(format)) {
        return respondError(
            ERROR_CODES.VALIDATION_ERROR,
            "Supported formats are json and md"
        );
    }

  try {
    const result = await getOwnedConversation(idValidation.data);

    if (!result) {
      return respondError(ERROR_CODES.UNAUTHORIZED);
    }

    const { user, conversation } = result;

    if (!conversation) {
      return respondError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Conversation not found"
      );
    }

    let exportData;
    let contentType;
    let fileExtension;

    if (format === "md") {
        exportData = generateMarkdownExport(conversation);
        contentType = "text/markdown";
        fileExtension = "md";
    } else {
        exportData = generateJsonExport(conversation);
        contentType = "application/json";
        fileExtension = "json";
    }

    // Create ExportRecord and AuditLog entries
    await db.$transaction([
      db.exportRecord.create({
        data: {
          userId: user.id,
          conversationId: conversation.id,
          format,
          status: "completed",
          downloadCount: 1,
        },
      }),
      db.auditLog.create({
        data: {
          userId: user.id,
          action: "EXPORT",
          resourceType: "CONVERSATION",
          resourceId: conversation.id,
          metadata: {
            format,
            title: conversation.title,
          },
        },
      }),
    ]);

    console.log("Conversation exported", {
      userId: user.id,
      conversationId: conversation.id,
      format,
    });

    return new Response(exportData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition":
            `attachment; filename="${conversation.title}.${fileExtension}"`,
        },
    });
  } catch (error) {
    console.error("Export conversation error:", error);

    return respondError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to export conversation"
    );
  }
}