import { revalidateAppPath } from "@/lib/db/cache-revalidate";
import { createSuccessResponse } from "@/lib/action-helpers/action-success";

export function completePersistence(record, path) {
  revalidateAppPath(path);
  return createSuccessResponse(record);
}