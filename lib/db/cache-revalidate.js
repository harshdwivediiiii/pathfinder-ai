import { revalidatePath } from "next/cache";

export function revalidateAppPath(path) {
  revalidatePath(path);
}