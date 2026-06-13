import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["components/**/*.{js,jsx}", "hooks/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/lib/prisma",
                "**/lib/db",
                "**/lib/gemini",
                "**/lib/env",
                "**/lib/cache/**",
                "**/lib/inngest/**",
                "**/lib/rate-limit**",
                "**/lib/checkUser",
              ],
              message: "Server-only modules cannot be imported in client components/hooks. Use Server Actions or API routes instead."
            }
          ]
        }
      ]
    }
  }
];

export default eslintConfig;
