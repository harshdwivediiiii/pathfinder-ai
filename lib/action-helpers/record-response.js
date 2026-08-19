import { createSuccessResponse } from "@/lib/action-helpers/action-success";

export function returnRecord(record) {
  return createSuccessResponse(record);
}