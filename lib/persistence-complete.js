import { revalidateAppPath } from "@/lib/cache-revalidate";
import { createSuccessResponse } from "@/lib/action-success";

export function completePersistence(record, path) {
  revalidateAppPath(path);
  return createSuccessResponse(record);
}