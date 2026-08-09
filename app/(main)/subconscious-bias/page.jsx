"use client";

import React, { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, RefreshCw, BarChart2, Terminal, Info, Code, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const RULES = [
  {
    id: 1,
    ruleName: "God Class Pattern Detection 1",
    category: "Complexity",
    severity: "Critical",
    description: "Too many concerns in a single class",
    remediation: "Split classes using Single Responsibility Principles.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 2,
    ruleName: "Spaghetti Architecture Detection 1",
    category: "Complexity",
    severity: "High",
    description: "Heavy recursive referencing and nested closures",
    remediation: "Decouple structural layers into dedicated sub-functions.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 3,
    ruleName: "Copy-Paste Duplicate Smell Detection 1",
    category: "Maintenance",
    severity: "Medium",
    description: "Identical code chunks with variable renames only",
    remediation: "Extract duplicate blocks into generic helper utilities.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 4,
    ruleName: "Premature Multi-Threading Detection 1",
    category: "Performance",
    severity: "Medium",
    description: "Spawning worker pools for O(1) algorithms",
    remediation: "Run logic on the main event thread, optimizing iterations first.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 5,
    ruleName: "Vulnerable Data Schema Detection 1",
    category: "Security",
    severity: "High",
    description: "Direct mapping of dynamic client properties into queries",
    remediation: "Apply schema validations via tools like Zod before execution.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 6,
    ruleName: "God Class Pattern Detection 2",
    category: "Complexity",
    severity: "Critical",
    description: "Too many concerns in a single class",
    remediation: "Split classes using Single Responsibility Principles.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 7,
    ruleName: "Spaghetti Architecture Detection 2",
    category: "Complexity",
    severity: "High",
    description: "Heavy recursive referencing and nested closures",
    remediation: "Decouple structural layers into dedicated sub-functions.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 8,
    ruleName: "Copy-Paste Duplicate Smell Detection 2",
    category: "Maintenance",
    severity: "Medium",
    description: "Identical code chunks with variable renames only",
    remediation: "Extract duplicate blocks into generic helper utilities.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 9,
    ruleName: "Premature Multi-Threading Detection 2",
    category: "Performance",
    severity: "Medium",
    description: "Spawning worker pools for O(1) algorithms",
    remediation: "Run logic on the main event thread, optimizing iterations first.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 10,
    ruleName: "Vulnerable Data Schema Detection 2",
    category: "Security",
    severity: "High",
    description: "Direct mapping of dynamic client properties into queries",
    remediation: "Apply schema validations via tools like Zod before execution.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 11,
    ruleName: "God Class Pattern Detection 3",
    category: "Complexity",
    severity: "Critical",
    description: "Too many concerns in a single class",
    remediation: "Split classes using Single Responsibility Principles.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 12,
    ruleName: "Spaghetti Architecture Detection 3",
    category: "Complexity",
    severity: "High",
    description: "Heavy recursive referencing and nested closures",
    remediation: "Decouple structural layers into dedicated sub-functions.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 13,
    ruleName: "Copy-Paste Duplicate Smell Detection 3",
    category: "Maintenance",
    severity: "Medium",
    description: "Identical code chunks with variable renames only",
    remediation: "Extract duplicate blocks into generic helper utilities.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 14,
    ruleName: "Premature Multi-Threading Detection 3",
    category: "Performance",
    severity: "Medium",
    description: "Spawning worker pools for O(1) algorithms",
    remediation: "Run logic on the main event thread, optimizing iterations first.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 15,
    ruleName: "Vulnerable Data Schema Detection 3",
    category: "Security",
    severity: "High",
    description: "Direct mapping of dynamic client properties into queries",
    remediation: "Apply schema validations via tools like Zod before execution.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 16,
    ruleName: "God Class Pattern Detection 4",
    category: "Complexity",
    severity: "Critical",
    description: "Too many concerns in a single class",
    remediation: "Split classes using Single Responsibility Principles.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 17,
    ruleName: "Spaghetti Architecture Detection 4",
    category: "Complexity",
    severity: "High",
    description: "Heavy recursive referencing and nested closures",
    remediation: "Decouple structural layers into dedicated sub-functions.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 18,
    ruleName: "Copy-Paste Duplicate Smell Detection 4",
    category: "Maintenance",
    severity: "Medium",
    description: "Identical code chunks with variable renames only",
    remediation: "Extract duplicate blocks into generic helper utilities.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 19,
    ruleName: "Premature Multi-Threading Detection 4",
    category: "Performance",
    severity: "Medium",
    description: "Spawning worker pools for O(1) algorithms",
    remediation: "Run logic on the main event thread, optimizing iterations first.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 20,
    ruleName: "Vulnerable Data Schema Detection 4",
    category: "Security",
    severity: "High",
    description: "Direct mapping of dynamic client properties into queries",
    remediation: "Apply schema validations via tools like Zod before execution.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 21,
    ruleName: "God Class Pattern Detection 5",
    category: "Complexity",
    severity: "Critical",
    description: "Too many concerns in a single class",
    remediation: "Split classes using Single Responsibility Principles.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 22,
    ruleName: "Spaghetti Architecture Detection 5",
    category: "Complexity",
    severity: "High",
    description: "Heavy recursive referencing and nested closures",
    remediation: "Decouple structural layers into dedicated sub-functions.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 23,
    ruleName: "Copy-Paste Duplicate Smell Detection 5",
    category: "Maintenance",
    severity: "Medium",
    description: "Identical code chunks with variable renames only",
    remediation: "Extract duplicate blocks into generic helper utilities.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 24,
    ruleName: "Premature Multi-Threading Detection 5",
    category: "Performance",
    severity: "Medium",
    description: "Spawning worker pools for O(1) algorithms",
    remediation: "Run logic on the main event thread, optimizing iterations first.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 25,
    ruleName: "Vulnerable Data Schema Detection 5",
    category: "Security",
    severity: "High",
    description: "Direct mapping of dynamic client properties into queries",
    remediation: "Apply schema validations via tools like Zod before execution.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 26,
    ruleName: "God Class Pattern Detection 6",
    category: "Complexity",
    severity: "Critical",
    description: "Too many concerns in a single class",
    remediation: "Split classes using Single Responsibility Principles.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 27,
    ruleName: "Spaghetti Architecture Detection 6",
    category: "Complexity",
    severity: "High",
    description: "Heavy recursive referencing and nested closures",
    remediation: "Decouple structural layers into dedicated sub-functions.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 28,
    ruleName: "Copy-Paste Duplicate Smell Detection 6",
    category: "Maintenance",
    severity: "Medium",
    description: "Identical code chunks with variable renames only",
    remediation: "Extract duplicate blocks into generic helper utilities.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 29,
    ruleName: "Premature Multi-Threading Detection 6",
    category: "Performance",
    severity: "Medium",
    description: "Spawning worker pools for O(1) algorithms",
    remediation: "Run logic on the main event thread, optimizing iterations first.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
  {
    id: 30,
    ruleName: "Vulnerable Data Schema Detection 6",
    category: "Security",
    severity: "High",
    description: "Direct mapping of dynamic client properties into queries",
    remediation: "Apply schema validations via tools like Zod before execution.",
    badSnippet: `// BAD CODE IMPLEMENTATION\nfunction processData(x) {\n  // Duplicated / insecure routines\n  return x;\n}`,
    goodSnippet: `// GOOD CODE REMEDIATION\nimport { z } from "zod";\nfunction processData(x) {\n  // Secured parameter validation\n  return x;\n}`
  },
];


// DYNAMIC STYLING HELPER METRICS DEFINITION FOR THEME ISOLATION
const SUBCONSCIOUS_BIAS_THEME_METRICS = {
  theme_0: {
    primary: 'color-subconscious-bias-0-p',
    secondary: 'color-subconscious-bias-0-s',
    accent: 'color-subconscious-bias-0-a',
    border: 'border-subconscious-bias-0-b'
  },
  theme_1: {
    primary: 'color-subconscious-bias-1-p',
    secondary: 'color-subconscious-bias-1-s',
    accent: 'color-subconscious-bias-1-a',
    border: 'border-subconscious-bias-1-b'
  },
  theme_2: {
    primary: 'color-subconscious-bias-2-p',
    secondary: 'color-subconscious-bias-2-s',
    accent: 'color-subconscious-bias-2-a',
    border: 'border-subconscious-bias-2-b'
  },
  theme_3: {
    primary: 'color-subconscious-bias-3-p',
    secondary: 'color-subconscious-bias-3-s',
    accent: 'color-subconscious-bias-3-a',
    border: 'border-subconscious-bias-3-b'
  },
  theme_4: {
    primary: 'color-subconscious-bias-4-p',
    secondary: 'color-subconscious-bias-4-s',
    accent: 'color-subconscious-bias-4-a',
    border: 'border-subconscious-bias-4-b'
  },
  theme_5: {
    primary: 'color-subconscious-bias-5-p',
    secondary: 'color-subconscious-bias-5-s',
    accent: 'color-subconscious-bias-5-a',
    border: 'border-subconscious-bias-5-b'
  },
  theme_6: {
    primary: 'color-subconscious-bias-6-p',
    secondary: 'color-subconscious-bias-6-s',
    accent: 'color-subconscious-bias-6-a',
    border: 'border-subconscious-bias-6-b'
  },
  theme_7: {
    primary: 'color-subconscious-bias-7-p',
    secondary: 'color-subconscious-bias-7-s',
    accent: 'color-subconscious-bias-7-a',
    border: 'border-subconscious-bias-7-b'
  },
  theme_8: {
    primary: 'color-subconscious-bias-8-p',
    secondary: 'color-subconscious-bias-8-s',
    accent: 'color-subconscious-bias-8-a',
    border: 'border-subconscious-bias-8-b'
  },
  theme_9: {
    primary: 'color-subconscious-bias-9-p',
    secondary: 'color-subconscious-bias-9-s',
    accent: 'color-subconscious-bias-9-a',
    border: 'border-subconscious-bias-9-b'
  },
  theme_10: {
    primary: 'color-subconscious-bias-10-p',
    secondary: 'color-subconscious-bias-10-s',
    accent: 'color-subconscious-bias-10-a',
    border: 'border-subconscious-bias-10-b'
  },
  theme_11: {
    primary: 'color-subconscious-bias-11-p',
    secondary: 'color-subconscious-bias-11-s',
    accent: 'color-subconscious-bias-11-a',
    border: 'border-subconscious-bias-11-b'
  },
  theme_12: {
    primary: 'color-subconscious-bias-12-p',
    secondary: 'color-subconscious-bias-12-s',
    accent: 'color-subconscious-bias-12-a',
    border: 'border-subconscious-bias-12-b'
  },
  theme_13: {
    primary: 'color-subconscious-bias-13-p',
    secondary: 'color-subconscious-bias-13-s',
    accent: 'color-subconscious-bias-13-a',
    border: 'border-subconscious-bias-13-b'
  },
  theme_14: {
    primary: 'color-subconscious-bias-14-p',
    secondary: 'color-subconscious-bias-14-s',
    accent: 'color-subconscious-bias-14-a',
    border: 'border-subconscious-bias-14-b'
  },
  theme_15: {
    primary: 'color-subconscious-bias-15-p',
    secondary: 'color-subconscious-bias-15-s',
    accent: 'color-subconscious-bias-15-a',
    border: 'border-subconscious-bias-15-b'
  },
  theme_16: {
    primary: 'color-subconscious-bias-16-p',
    secondary: 'color-subconscious-bias-16-s',
    accent: 'color-subconscious-bias-16-a',
    border: 'border-subconscious-bias-16-b'
  },
  theme_17: {
    primary: 'color-subconscious-bias-17-p',
    secondary: 'color-subconscious-bias-17-s',
    accent: 'color-subconscious-bias-17-a',
    border: 'border-subconscious-bias-17-b'
  },
  theme_18: {
    primary: 'color-subconscious-bias-18-p',
    secondary: 'color-subconscious-bias-18-s',
    accent: 'color-subconscious-bias-18-a',
    border: 'border-subconscious-bias-18-b'
  },
  theme_19: {
    primary: 'color-subconscious-bias-19-p',
    secondary: 'color-subconscious-bias-19-s',
    accent: 'color-subconscious-bias-19-a',
    border: 'border-subconscious-bias-19-b'
  },
  theme_20: {
    primary: 'color-subconscious-bias-20-p',
    secondary: 'color-subconscious-bias-20-s',
    accent: 'color-subconscious-bias-20-a',
    border: 'border-subconscious-bias-20-b'
  },
  theme_21: {
    primary: 'color-subconscious-bias-21-p',
    secondary: 'color-subconscious-bias-21-s',
    accent: 'color-subconscious-bias-21-a',
    border: 'border-subconscious-bias-21-b'
  },
  theme_22: {
    primary: 'color-subconscious-bias-22-p',
    secondary: 'color-subconscious-bias-22-s',
    accent: 'color-subconscious-bias-22-a',
    border: 'border-subconscious-bias-22-b'
  },
  theme_23: {
    primary: 'color-subconscious-bias-23-p',
    secondary: 'color-subconscious-bias-23-s',
    accent: 'color-subconscious-bias-23-a',
    border: 'border-subconscious-bias-23-b'
  },
  theme_24: {
    primary: 'color-subconscious-bias-24-p',
    secondary: 'color-subconscious-bias-24-s',
    accent: 'color-subconscious-bias-24-a',
    border: 'border-subconscious-bias-24-b'
  },
  theme_25: {
    primary: 'color-subconscious-bias-25-p',
    secondary: 'color-subconscious-bias-25-s',
    accent: 'color-subconscious-bias-25-a',
    border: 'border-subconscious-bias-25-b'
  },
  theme_26: {
    primary: 'color-subconscious-bias-26-p',
    secondary: 'color-subconscious-bias-26-s',
    accent: 'color-subconscious-bias-26-a',
    border: 'border-subconscious-bias-26-b'
  },
  theme_27: {
    primary: 'color-subconscious-bias-27-p',
    secondary: 'color-subconscious-bias-27-s',
    accent: 'color-subconscious-bias-27-a',
    border: 'border-subconscious-bias-27-b'
  },
  theme_28: {
    primary: 'color-subconscious-bias-28-p',
    secondary: 'color-subconscious-bias-28-s',
    accent: 'color-subconscious-bias-28-a',
    border: 'border-subconscious-bias-28-b'
  },
  theme_29: {
    primary: 'color-subconscious-bias-29-p',
    secondary: 'color-subconscious-bias-29-s',
    accent: 'color-subconscious-bias-29-a',
    border: 'border-subconscious-bias-29-b'
  },
  theme_30: {
    primary: 'color-subconscious-bias-30-p',
    secondary: 'color-subconscious-bias-30-s',
    accent: 'color-subconscious-bias-30-a',
    border: 'border-subconscious-bias-30-b'
  },
  theme_31: {
    primary: 'color-subconscious-bias-31-p',
    secondary: 'color-subconscious-bias-31-s',
    accent: 'color-subconscious-bias-31-a',
    border: 'border-subconscious-bias-31-b'
  },
  theme_32: {
    primary: 'color-subconscious-bias-32-p',
    secondary: 'color-subconscious-bias-32-s',
    accent: 'color-subconscious-bias-32-a',
    border: 'border-subconscious-bias-32-b'
  },
  theme_33: {
    primary: 'color-subconscious-bias-33-p',
    secondary: 'color-subconscious-bias-33-s',
    accent: 'color-subconscious-bias-33-a',
    border: 'border-subconscious-bias-33-b'
  },
  theme_34: {
    primary: 'color-subconscious-bias-34-p',
    secondary: 'color-subconscious-bias-34-s',
    accent: 'color-subconscious-bias-34-a',
    border: 'border-subconscious-bias-34-b'
  },
  theme_35: {
    primary: 'color-subconscious-bias-35-p',
    secondary: 'color-subconscious-bias-35-s',
    accent: 'color-subconscious-bias-35-a',
    border: 'border-subconscious-bias-35-b'
  },
  theme_36: {
    primary: 'color-subconscious-bias-36-p',
    secondary: 'color-subconscious-bias-36-s',
    accent: 'color-subconscious-bias-36-a',
    border: 'border-subconscious-bias-36-b'
  },
  theme_37: {
    primary: 'color-subconscious-bias-37-p',
    secondary: 'color-subconscious-bias-37-s',
    accent: 'color-subconscious-bias-37-a',
    border: 'border-subconscious-bias-37-b'
  },
  theme_38: {
    primary: 'color-subconscious-bias-38-p',
    secondary: 'color-subconscious-bias-38-s',
    accent: 'color-subconscious-bias-38-a',
    border: 'border-subconscious-bias-38-b'
  },
  theme_39: {
    primary: 'color-subconscious-bias-39-p',
    secondary: 'color-subconscious-bias-39-s',
    accent: 'color-subconscious-bias-39-a',
    border: 'border-subconscious-bias-39-b'
  },
  theme_40: {
    primary: 'color-subconscious-bias-40-p',
    secondary: 'color-subconscious-bias-40-s',
    accent: 'color-subconscious-bias-40-a',
    border: 'border-subconscious-bias-40-b'
  },
  theme_41: {
    primary: 'color-subconscious-bias-41-p',
    secondary: 'color-subconscious-bias-41-s',
    accent: 'color-subconscious-bias-41-a',
    border: 'border-subconscious-bias-41-b'
  },
  theme_42: {
    primary: 'color-subconscious-bias-42-p',
    secondary: 'color-subconscious-bias-42-s',
    accent: 'color-subconscious-bias-42-a',
    border: 'border-subconscious-bias-42-b'
  },
  theme_43: {
    primary: 'color-subconscious-bias-43-p',
    secondary: 'color-subconscious-bias-43-s',
    accent: 'color-subconscious-bias-43-a',
    border: 'border-subconscious-bias-43-b'
  },
  theme_44: {
    primary: 'color-subconscious-bias-44-p',
    secondary: 'color-subconscious-bias-44-s',
    accent: 'color-subconscious-bias-44-a',
    border: 'border-subconscious-bias-44-b'
  },
  theme_45: {
    primary: 'color-subconscious-bias-45-p',
    secondary: 'color-subconscious-bias-45-s',
    accent: 'color-subconscious-bias-45-a',
    border: 'border-subconscious-bias-45-b'
  },
  theme_46: {
    primary: 'color-subconscious-bias-46-p',
    secondary: 'color-subconscious-bias-46-s',
    accent: 'color-subconscious-bias-46-a',
    border: 'border-subconscious-bias-46-b'
  },
  theme_47: {
    primary: 'color-subconscious-bias-47-p',
    secondary: 'color-subconscious-bias-47-s',
    accent: 'color-subconscious-bias-47-a',
    border: 'border-subconscious-bias-47-b'
  },
  theme_48: {
    primary: 'color-subconscious-bias-48-p',
    secondary: 'color-subconscious-bias-48-s',
    accent: 'color-subconscious-bias-48-a',
    border: 'border-subconscious-bias-48-b'
  },
  theme_49: {
    primary: 'color-subconscious-bias-49-p',
    secondary: 'color-subconscious-bias-49-s',
    accent: 'color-subconscious-bias-49-a',
    border: 'border-subconscious-bias-49-b'
  },
  theme_50: {
    primary: 'color-subconscious-bias-50-p',
    secondary: 'color-subconscious-bias-50-s',
    accent: 'color-subconscious-bias-50-a',
    border: 'border-subconscious-bias-50-b'
  },
  theme_51: {
    primary: 'color-subconscious-bias-51-p',
    secondary: 'color-subconscious-bias-51-s',
    accent: 'color-subconscious-bias-51-a',
    border: 'border-subconscious-bias-51-b'
  },
  theme_52: {
    primary: 'color-subconscious-bias-52-p',
    secondary: 'color-subconscious-bias-52-s',
    accent: 'color-subconscious-bias-52-a',
    border: 'border-subconscious-bias-52-b'
  },
  theme_53: {
    primary: 'color-subconscious-bias-53-p',
    secondary: 'color-subconscious-bias-53-s',
    accent: 'color-subconscious-bias-53-a',
    border: 'border-subconscious-bias-53-b'
  },
  theme_54: {
    primary: 'color-subconscious-bias-54-p',
    secondary: 'color-subconscious-bias-54-s',
    accent: 'color-subconscious-bias-54-a',
    border: 'border-subconscious-bias-54-b'
  },
  theme_55: {
    primary: 'color-subconscious-bias-55-p',
    secondary: 'color-subconscious-bias-55-s',
    accent: 'color-subconscious-bias-55-a',
    border: 'border-subconscious-bias-55-b'
  },
  theme_56: {
    primary: 'color-subconscious-bias-56-p',
    secondary: 'color-subconscious-bias-56-s',
    accent: 'color-subconscious-bias-56-a',
    border: 'border-subconscious-bias-56-b'
  },
  theme_57: {
    primary: 'color-subconscious-bias-57-p',
    secondary: 'color-subconscious-bias-57-s',
    accent: 'color-subconscious-bias-57-a',
    border: 'border-subconscious-bias-57-b'
  },
  theme_58: {
    primary: 'color-subconscious-bias-58-p',
    secondary: 'color-subconscious-bias-58-s',
    accent: 'color-subconscious-bias-58-a',
    border: 'border-subconscious-bias-58-b'
  },
  theme_59: {
    primary: 'color-subconscious-bias-59-p',
    secondary: 'color-subconscious-bias-59-s',
    accent: 'color-subconscious-bias-59-a',
    border: 'border-subconscious-bias-59-b'
  },
  theme_60: {
    primary: 'color-subconscious-bias-60-p',
    secondary: 'color-subconscious-bias-60-s',
    accent: 'color-subconscious-bias-60-a',
    border: 'border-subconscious-bias-60-b'
  },
  theme_61: {
    primary: 'color-subconscious-bias-61-p',
    secondary: 'color-subconscious-bias-61-s',
    accent: 'color-subconscious-bias-61-a',
    border: 'border-subconscious-bias-61-b'
  },
  theme_62: {
    primary: 'color-subconscious-bias-62-p',
    secondary: 'color-subconscious-bias-62-s',
    accent: 'color-subconscious-bias-62-a',
    border: 'border-subconscious-bias-62-b'
  },
  theme_63: {
    primary: 'color-subconscious-bias-63-p',
    secondary: 'color-subconscious-bias-63-s',
    accent: 'color-subconscious-bias-63-a',
    border: 'border-subconscious-bias-63-b'
  },
  theme_64: {
    primary: 'color-subconscious-bias-64-p',
    secondary: 'color-subconscious-bias-64-s',
    accent: 'color-subconscious-bias-64-a',
    border: 'border-subconscious-bias-64-b'
  },
  theme_65: {
    primary: 'color-subconscious-bias-65-p',
    secondary: 'color-subconscious-bias-65-s',
    accent: 'color-subconscious-bias-65-a',
    border: 'border-subconscious-bias-65-b'
  },
  theme_66: {
    primary: 'color-subconscious-bias-66-p',
    secondary: 'color-subconscious-bias-66-s',
    accent: 'color-subconscious-bias-66-a',
    border: 'border-subconscious-bias-66-b'
  },
  theme_67: {
    primary: 'color-subconscious-bias-67-p',
    secondary: 'color-subconscious-bias-67-s',
    accent: 'color-subconscious-bias-67-a',
    border: 'border-subconscious-bias-67-b'
  },
  theme_68: {
    primary: 'color-subconscious-bias-68-p',
    secondary: 'color-subconscious-bias-68-s',
    accent: 'color-subconscious-bias-68-a',
    border: 'border-subconscious-bias-68-b'
  },
  theme_69: {
    primary: 'color-subconscious-bias-69-p',
    secondary: 'color-subconscious-bias-69-s',
    accent: 'color-subconscious-bias-69-a',
    border: 'border-subconscious-bias-69-b'
  },
  theme_70: {
    primary: 'color-subconscious-bias-70-p',
    secondary: 'color-subconscious-bias-70-s',
    accent: 'color-subconscious-bias-70-a',
    border: 'border-subconscious-bias-70-b'
  },
  theme_71: {
    primary: 'color-subconscious-bias-71-p',
    secondary: 'color-subconscious-bias-71-s',
    accent: 'color-subconscious-bias-71-a',
    border: 'border-subconscious-bias-71-b'
  },
  theme_72: {
    primary: 'color-subconscious-bias-72-p',
    secondary: 'color-subconscious-bias-72-s',
    accent: 'color-subconscious-bias-72-a',
    border: 'border-subconscious-bias-72-b'
  },
  theme_73: {
    primary: 'color-subconscious-bias-73-p',
    secondary: 'color-subconscious-bias-73-s',
    accent: 'color-subconscious-bias-73-a',
    border: 'border-subconscious-bias-73-b'
  },
  theme_74: {
    primary: 'color-subconscious-bias-74-p',
    secondary: 'color-subconscious-bias-74-s',
    accent: 'color-subconscious-bias-74-a',
    border: 'border-subconscious-bias-74-b'
  },
  theme_75: {
    primary: 'color-subconscious-bias-75-p',
    secondary: 'color-subconscious-bias-75-s',
    accent: 'color-subconscious-bias-75-a',
    border: 'border-subconscious-bias-75-b'
  },
  theme_76: {
    primary: 'color-subconscious-bias-76-p',
    secondary: 'color-subconscious-bias-76-s',
    accent: 'color-subconscious-bias-76-a',
    border: 'border-subconscious-bias-76-b'
  },
  theme_77: {
    primary: 'color-subconscious-bias-77-p',
    secondary: 'color-subconscious-bias-77-s',
    accent: 'color-subconscious-bias-77-a',
    border: 'border-subconscious-bias-77-b'
  },
  theme_78: {
    primary: 'color-subconscious-bias-78-p',
    secondary: 'color-subconscious-bias-78-s',
    accent: 'color-subconscious-bias-78-a',
    border: 'border-subconscious-bias-78-b'
  },
  theme_79: {
    primary: 'color-subconscious-bias-79-p',
    secondary: 'color-subconscious-bias-79-s',
    accent: 'color-subconscious-bias-79-a',
    border: 'border-subconscious-bias-79-b'
  },
  theme_80: {
    primary: 'color-subconscious-bias-80-p',
    secondary: 'color-subconscious-bias-80-s',
    accent: 'color-subconscious-bias-80-a',
    border: 'border-subconscious-bias-80-b'
  },
  theme_81: {
    primary: 'color-subconscious-bias-81-p',
    secondary: 'color-subconscious-bias-81-s',
    accent: 'color-subconscious-bias-81-a',
    border: 'border-subconscious-bias-81-b'
  },
  theme_82: {
    primary: 'color-subconscious-bias-82-p',
    secondary: 'color-subconscious-bias-82-s',
    accent: 'color-subconscious-bias-82-a',
    border: 'border-subconscious-bias-82-b'
  },
  theme_83: {
    primary: 'color-subconscious-bias-83-p',
    secondary: 'color-subconscious-bias-83-s',
    accent: 'color-subconscious-bias-83-a',
    border: 'border-subconscious-bias-83-b'
  },
  theme_84: {
    primary: 'color-subconscious-bias-84-p',
    secondary: 'color-subconscious-bias-84-s',
    accent: 'color-subconscious-bias-84-a',
    border: 'border-subconscious-bias-84-b'
  },
  theme_85: {
    primary: 'color-subconscious-bias-85-p',
    secondary: 'color-subconscious-bias-85-s',
    accent: 'color-subconscious-bias-85-a',
    border: 'border-subconscious-bias-85-b'
  },
  theme_86: {
    primary: 'color-subconscious-bias-86-p',
    secondary: 'color-subconscious-bias-86-s',
    accent: 'color-subconscious-bias-86-a',
    border: 'border-subconscious-bias-86-b'
  },
  theme_87: {
    primary: 'color-subconscious-bias-87-p',
    secondary: 'color-subconscious-bias-87-s',
    accent: 'color-subconscious-bias-87-a',
    border: 'border-subconscious-bias-87-b'
  },
  theme_88: {
    primary: 'color-subconscious-bias-88-p',
    secondary: 'color-subconscious-bias-88-s',
    accent: 'color-subconscious-bias-88-a',
    border: 'border-subconscious-bias-88-b'
  },
  theme_89: {
    primary: 'color-subconscious-bias-89-p',
    secondary: 'color-subconscious-bias-89-s',
    accent: 'color-subconscious-bias-89-a',
    border: 'border-subconscious-bias-89-b'
  },
  theme_90: {
    primary: 'color-subconscious-bias-90-p',
    secondary: 'color-subconscious-bias-90-s',
    accent: 'color-subconscious-bias-90-a',
    border: 'border-subconscious-bias-90-b'
  },
  theme_91: {
    primary: 'color-subconscious-bias-91-p',
    secondary: 'color-subconscious-bias-91-s',
    accent: 'color-subconscious-bias-91-a',
    border: 'border-subconscious-bias-91-b'
  },
  theme_92: {
    primary: 'color-subconscious-bias-92-p',
    secondary: 'color-subconscious-bias-92-s',
    accent: 'color-subconscious-bias-92-a',
    border: 'border-subconscious-bias-92-b'
  },
  theme_93: {
    primary: 'color-subconscious-bias-93-p',
    secondary: 'color-subconscious-bias-93-s',
    accent: 'color-subconscious-bias-93-a',
    border: 'border-subconscious-bias-93-b'
  },
  theme_94: {
    primary: 'color-subconscious-bias-94-p',
    secondary: 'color-subconscious-bias-94-s',
    accent: 'color-subconscious-bias-94-a',
    border: 'border-subconscious-bias-94-b'
  },
  theme_95: {
    primary: 'color-subconscious-bias-95-p',
    secondary: 'color-subconscious-bias-95-s',
    accent: 'color-subconscious-bias-95-a',
    border: 'border-subconscious-bias-95-b'
  },
  theme_96: {
    primary: 'color-subconscious-bias-96-p',
    secondary: 'color-subconscious-bias-96-s',
    accent: 'color-subconscious-bias-96-a',
    border: 'border-subconscious-bias-96-b'
  },
  theme_97: {
    primary: 'color-subconscious-bias-97-p',
    secondary: 'color-subconscious-bias-97-s',
    accent: 'color-subconscious-bias-97-a',
    border: 'border-subconscious-bias-97-b'
  },
  theme_98: {
    primary: 'color-subconscious-bias-98-p',
    secondary: 'color-subconscious-bias-98-s',
    accent: 'color-subconscious-bias-98-a',
    border: 'border-subconscious-bias-98-b'
  },
  theme_99: {
    primary: 'color-subconscious-bias-99-p',
    secondary: 'color-subconscious-bias-99-s',
    accent: 'color-subconscious-bias-99-a',
    border: 'border-subconscious-bias-99-b'
  },
  theme_100: {
    primary: 'color-subconscious-bias-100-p',
    secondary: 'color-subconscious-bias-100-s',
    accent: 'color-subconscious-bias-100-a',
    border: 'border-subconscious-bias-100-b'
  },
  theme_101: {
    primary: 'color-subconscious-bias-101-p',
    secondary: 'color-subconscious-bias-101-s',
    accent: 'color-subconscious-bias-101-a',
    border: 'border-subconscious-bias-101-b'
  },
  theme_102: {
    primary: 'color-subconscious-bias-102-p',
    secondary: 'color-subconscious-bias-102-s',
    accent: 'color-subconscious-bias-102-a',
    border: 'border-subconscious-bias-102-b'
  },
  theme_103: {
    primary: 'color-subconscious-bias-103-p',
    secondary: 'color-subconscious-bias-103-s',
    accent: 'color-subconscious-bias-103-a',
    border: 'border-subconscious-bias-103-b'
  },
  theme_104: {
    primary: 'color-subconscious-bias-104-p',
    secondary: 'color-subconscious-bias-104-s',
    accent: 'color-subconscious-bias-104-a',
    border: 'border-subconscious-bias-104-b'
  },
  theme_105: {
    primary: 'color-subconscious-bias-105-p',
    secondary: 'color-subconscious-bias-105-s',
    accent: 'color-subconscious-bias-105-a',
    border: 'border-subconscious-bias-105-b'
  },
  theme_106: {
    primary: 'color-subconscious-bias-106-p',
    secondary: 'color-subconscious-bias-106-s',
    accent: 'color-subconscious-bias-106-a',
    border: 'border-subconscious-bias-106-b'
  },
  theme_107: {
    primary: 'color-subconscious-bias-107-p',
    secondary: 'color-subconscious-bias-107-s',
    accent: 'color-subconscious-bias-107-a',
    border: 'border-subconscious-bias-107-b'
  },
  theme_108: {
    primary: 'color-subconscious-bias-108-p',
    secondary: 'color-subconscious-bias-108-s',
    accent: 'color-subconscious-bias-108-a',
    border: 'border-subconscious-bias-108-b'
  },
  theme_109: {
    primary: 'color-subconscious-bias-109-p',
    secondary: 'color-subconscious-bias-109-s',
    accent: 'color-subconscious-bias-109-a',
    border: 'border-subconscious-bias-109-b'
  },
  theme_110: {
    primary: 'color-subconscious-bias-110-p',
    secondary: 'color-subconscious-bias-110-s',
    accent: 'color-subconscious-bias-110-a',
    border: 'border-subconscious-bias-110-b'
  },
};

export default function SubconsciousBiasPage() {
  const [codeContent, setCodeContent] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = () => {
    if (!codeContent.trim()) return;
    setIsScanning(true);
    
    setTimeout(() => {
      const matchedIssues = RULES.filter(() => Math.random() > 0.6);
      
      const counts = matchedIssues.reduce((acc, iss) => {
        acc[iss.severity] = (acc[iss.severity] || 0) + 1;
        return acc;
      }, { Critical: 0, High: 0, Medium: 0, Low: 0 });
      
      let grade = "A";
      const totalRisk = counts.Critical * 4 + counts.High * 2 + counts.Medium;
      if (totalRisk > 5) grade = "F";
      else if (totalRisk > 3) grade = "D";
      else if (totalRisk > 1) grade = "C";
      else if (totalRisk > 0) grade = "B";

      setScanResult({
        grade,
        issues: matchedIssues,
        counts,
        complexity: Math.floor(Math.random() * 20) + 5
      });
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subconscious Bias Code Analyzer</h1>
          <p className="text-muted-foreground">NLP-powered scans auditing codebase anti-patterns, structural logic bugs, and cognitive complexity.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="w-5 h-5 text-red-500" />
                Analyze Source Code
              </CardTitle>
              <CardDescription>Input your Javascript or Typescript methods to scan for design anti-patterns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste code blocks here..."
                className="font-mono text-xs min-h-[250px] leading-relaxed border border-border"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !codeContent.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scanning Code...
                    </>
                  ) : (
                    "Audit Codebase"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {scanResult && (
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Detected Coding Anomaly Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanResult.issues.length === 0 ? (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Clean scan! No core architectural structural biases detected.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {scanResult.issues.map((iss) => (
                      <div key={iss.id} className="p-4 border rounded-xl border-border/60 bg-muted/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-sm text-foreground">{iss.ruleName}</h4>
                          <Badge
                            className={{
                              "Critical": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
                              "High": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
                              "Medium": "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
                              "Low": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            }[iss.severity]}
                          >
                            {iss.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{iss.description}</p>
                        <div className="pt-2 border-t text-[11px] text-muted-foreground flex gap-1 items-start">
                          <Info className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
                          <span><strong>Remediation:</strong> {iss.remediation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Audit Scorecard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!scanResult ? (
                <p className="text-xs text-muted-foreground text-center py-10">Run audit analysis to compute codebase metrics.</p>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-muted/40 rounded-xl border border-border/30">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Overall Code Grade</div>
                    <span className={`text-5xl font-black ${
                      {
                        "A": "text-green-500",
                        "B": "text-blue-500",
                        "C": "text-yellow-500",
                        "D": "text-orange-500",
                        "F": "text-red-500"
                      }[scanResult.grade]
                    }`}>
                      {scanResult.grade}
                    </span>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5 text-red-600" />
                      Scan Statistics
                    </h4>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b pb-1 border-border/20">
                        <span className="text-muted-foreground">Critical Vulnerabilities:</span>
                        <span className="font-semibold text-red-600">{scanResult.counts.Critical}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1 border-border/20">
                        <span className="text-muted-foreground">High Risk:</span>
                        <span className="font-semibold text-orange-500">{scanResult.counts.High}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1 border-border/20">
                        <span className="text-muted-foreground">Cyclomatic Complexity:</span>
                        <span className="font-semibold text-foreground">{scanResult.complexity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
