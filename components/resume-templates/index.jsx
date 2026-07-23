import ClassicTemplate from "./ClassicTemplate";
import ModernTemplate from "./ModernTemplate";
import MinimalTemplate from "./MinimalTemplate";

export const RESUME_TEMPLATES = {
  classic: { label: "Classic", component: ClassicTemplate },
  modern: { label: "Modern", component: ModernTemplate },
  minimal: { label: "Minimal (ATS-safe)", component: MinimalTemplate },
};

export const DEFAULT_TEMPLATE = "classic";