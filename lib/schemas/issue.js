import { z } from "zod";

export const issueSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.enum(["Bug", "Feature Request", "Feedback", "Support"], {
    errorMap: () => ({ message: "Please select a category" }),
  }),
  priority: z.enum(["Low", "Medium", "High"], {
    errorMap: () => ({ message: "Please select a priority" }),
  }),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
