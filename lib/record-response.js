import { createSuccessResponse } from "@/lib/action-success";

export function returnRecord(record) {
  return createSuccessResponse(record);
}