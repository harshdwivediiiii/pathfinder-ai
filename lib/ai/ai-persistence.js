import { revalidatePath } from "next/cache";

export function finalizeAiPersistence(path) {
  revalidatePath(path);
}