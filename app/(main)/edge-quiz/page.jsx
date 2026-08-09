"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, Award, CheckCircle2, XCircle, ArrowRight, RefreshCw, BarChart2, Lightbulb, HelpCircle, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const QUESTIONS = [
  {
    id: 1,
    domain: "Frontend",
    title: "React Hooks Lifecycle Assessment",
    question: "Which hook handles updates cleanly after layout paints?",
    options: ["useLayoutEffect", "useEffect", "useInsertionEffect", "useMemo"],
    correctOption: 1,
    explanation: "useLayoutEffect fires synchronously after layout mutations but before paint. Use this to read layout and synchronously re-render.",
    difficulty: 2,
    skillsTested: ["React", "Architecture", "Optimization"]
  },
  {
    id: 2,
    domain: "Backend",
    title: "HTTP/2 Multiplexing Assessment",
    question: "How does HTTP/2 multiplex requests over a single connection?",
    options: ["Binary framing layer", "UDP tunneling", "Header compression", "Cookie syncing"],
    correctOption: 0,
    explanation: "HTTP/2 introduces binary framing, dividing requests/responses into discrete frames, allowing multiple streams to interleave over a single TCP connection.",
    difficulty: 3,
    skillsTested: ["HTTP/2", "Architecture", "Optimization"]
  },
  {
    id: 3,
    domain: "DevOps",
    title: "Prisma Isolation Levels Assessment",
    question: "What isolation level prevents dirty reads but allows phantom reads in postgres?",
    options: ["Read Committed", "Serializable", "Repeatable Read", "Read Uncommitted"],
    correctOption: 0,
    explanation: "Read Committed isolation level avoids dirty reads, meaning transactions cannot read uncommitted data, but phantoms can still occur if new records match a range query.",
    difficulty: 4,
    skillsTested: ["Prisma", "Architecture", "Optimization"]
  },
  {
    id: 4,
    domain: "Security",
    title: "JWT Signature Secrets Assessment",
    question: "What algorithm uses asymmetric cryptography for signing tokens?",
    options: ["RS256", "HS256", "SHA256", "MD5"],
    correctOption: 0,
    explanation: "RS256 uses a private key to sign the token and a public key to verify. HS256 uses a shared symmetric secret.",
    difficulty: 5,
    skillsTested: ["JWT", "Architecture", "Optimization"]
  },
  {
    id: 5,
    domain: "Frontend",
    title: "Docker Layer Caching Assessment",
    question: "Which instruction creates a new cached write layer in Docker?",
    options: ["RUN", "ENV", "EXPOSE", "LABEL"],
    correctOption: 0,
    explanation: "Instructions like RUN, COPY, and ADD modify the image filesystem and generate cache layers. ENV/EXPOSE update metadata only.",
    difficulty: 2,
    skillsTested: ["Docker", "Architecture", "Optimization"]
  },
  {
    id: 6,
    domain: "Backend",
    title: "B-Tree Database Index Assessment",
    question: "What is the computational complexity of searching a value in balanced B-Tree of height h?",
    options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
    correctOption: 0,
    explanation: "Searching in balanced tree indexing structures yields logarithmic complexity relative to elements or branch branching factors.",
    difficulty: 3,
    skillsTested: ["B-Tree", "Architecture", "Optimization"]
  },
  {
    id: 7,
    domain: "DevOps",
    title: "React Hooks Lifecycle Assessment",
    question: "Which hook handles updates cleanly after layout paints?",
    options: ["useLayoutEffect", "useEffect", "useInsertionEffect", "useMemo"],
    correctOption: 1,
    explanation: "useLayoutEffect fires synchronously after layout mutations but before paint. Use this to read layout and synchronously re-render.",
    difficulty: 4,
    skillsTested: ["React", "Architecture", "Optimization"]
  },
  {
    id: 8,
    domain: "Security",
    title: "HTTP/2 Multiplexing Assessment",
    question: "How does HTTP/2 multiplex requests over a single connection?",
    options: ["Binary framing layer", "UDP tunneling", "Header compression", "Cookie syncing"],
    correctOption: 0,
    explanation: "HTTP/2 introduces binary framing, dividing requests/responses into discrete frames, allowing multiple streams to interleave over a single TCP connection.",
    difficulty: 5,
    skillsTested: ["HTTP/2", "Architecture", "Optimization"]
  },
  {
    id: 9,
    domain: "Frontend",
    title: "Prisma Isolation Levels Assessment",
    question: "What isolation level prevents dirty reads but allows phantom reads in postgres?",
    options: ["Read Committed", "Serializable", "Repeatable Read", "Read Uncommitted"],
    correctOption: 0,
    explanation: "Read Committed isolation level avoids dirty reads, meaning transactions cannot read uncommitted data, but phantoms can still occur if new records match a range query.",
    difficulty: 2,
    skillsTested: ["Prisma", "Architecture", "Optimization"]
  },
  {
    id: 10,
    domain: "Backend",
    title: "JWT Signature Secrets Assessment",
    question: "What algorithm uses asymmetric cryptography for signing tokens?",
    options: ["RS256", "HS256", "SHA256", "MD5"],
    correctOption: 0,
    explanation: "RS256 uses a private key to sign the token and a public key to verify. HS256 uses a shared symmetric secret.",
    difficulty: 3,
    skillsTested: ["JWT", "Architecture", "Optimization"]
  },
  {
    id: 11,
    domain: "DevOps",
    title: "Docker Layer Caching Assessment",
    question: "Which instruction creates a new cached write layer in Docker?",
    options: ["RUN", "ENV", "EXPOSE", "LABEL"],
    correctOption: 0,
    explanation: "Instructions like RUN, COPY, and ADD modify the image filesystem and generate cache layers. ENV/EXPOSE update metadata only.",
    difficulty: 4,
    skillsTested: ["Docker", "Architecture", "Optimization"]
  },
  {
    id: 12,
    domain: "Security",
    title: "B-Tree Database Index Assessment",
    question: "What is the computational complexity of searching a value in balanced B-Tree of height h?",
    options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
    correctOption: 0,
    explanation: "Searching in balanced tree indexing structures yields logarithmic complexity relative to elements or branch branching factors.",
    difficulty: 5,
    skillsTested: ["B-Tree", "Architecture", "Optimization"]
  },
  {
    id: 13,
    domain: "Frontend",
    title: "React Hooks Lifecycle Assessment",
    question: "Which hook handles updates cleanly after layout paints?",
    options: ["useLayoutEffect", "useEffect", "useInsertionEffect", "useMemo"],
    correctOption: 1,
    explanation: "useLayoutEffect fires synchronously after layout mutations but before paint. Use this to read layout and synchronously re-render.",
    difficulty: 2,
    skillsTested: ["React", "Architecture", "Optimization"]
  },
  {
    id: 14,
    domain: "Backend",
    title: "HTTP/2 Multiplexing Assessment",
    question: "How does HTTP/2 multiplex requests over a single connection?",
    options: ["Binary framing layer", "UDP tunneling", "Header compression", "Cookie syncing"],
    correctOption: 0,
    explanation: "HTTP/2 introduces binary framing, dividing requests/responses into discrete frames, allowing multiple streams to interleave over a single TCP connection.",
    difficulty: 3,
    skillsTested: ["HTTP/2", "Architecture", "Optimization"]
  },
  {
    id: 15,
    domain: "DevOps",
    title: "Prisma Isolation Levels Assessment",
    question: "What isolation level prevents dirty reads but allows phantom reads in postgres?",
    options: ["Read Committed", "Serializable", "Repeatable Read", "Read Uncommitted"],
    correctOption: 0,
    explanation: "Read Committed isolation level avoids dirty reads, meaning transactions cannot read uncommitted data, but phantoms can still occur if new records match a range query.",
    difficulty: 4,
    skillsTested: ["Prisma", "Architecture", "Optimization"]
  },
  {
    id: 16,
    domain: "Security",
    title: "JWT Signature Secrets Assessment",
    question: "What algorithm uses asymmetric cryptography for signing tokens?",
    options: ["RS256", "HS256", "SHA256", "MD5"],
    correctOption: 0,
    explanation: "RS256 uses a private key to sign the token and a public key to verify. HS256 uses a shared symmetric secret.",
    difficulty: 5,
    skillsTested: ["JWT", "Architecture", "Optimization"]
  },
  {
    id: 17,
    domain: "Frontend",
    title: "Docker Layer Caching Assessment",
    question: "Which instruction creates a new cached write layer in Docker?",
    options: ["RUN", "ENV", "EXPOSE", "LABEL"],
    correctOption: 0,
    explanation: "Instructions like RUN, COPY, and ADD modify the image filesystem and generate cache layers. ENV/EXPOSE update metadata only.",
    difficulty: 2,
    skillsTested: ["Docker", "Architecture", "Optimization"]
  },
  {
    id: 18,
    domain: "Backend",
    title: "B-Tree Database Index Assessment",
    question: "What is the computational complexity of searching a value in balanced B-Tree of height h?",
    options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
    correctOption: 0,
    explanation: "Searching in balanced tree indexing structures yields logarithmic complexity relative to elements or branch branching factors.",
    difficulty: 3,
    skillsTested: ["B-Tree", "Architecture", "Optimization"]
  },
  {
    id: 19,
    domain: "DevOps",
    title: "React Hooks Lifecycle Assessment",
    question: "Which hook handles updates cleanly after layout paints?",
    options: ["useLayoutEffect", "useEffect", "useInsertionEffect", "useMemo"],
    correctOption: 1,
    explanation: "useLayoutEffect fires synchronously after layout mutations but before paint. Use this to read layout and synchronously re-render.",
    difficulty: 4,
    skillsTested: ["React", "Architecture", "Optimization"]
  },
  {
    id: 20,
    domain: "Security",
    title: "HTTP/2 Multiplexing Assessment",
    question: "How does HTTP/2 multiplex requests over a single connection?",
    options: ["Binary framing layer", "UDP tunneling", "Header compression", "Cookie syncing"],
    correctOption: 0,
    explanation: "HTTP/2 introduces binary framing, dividing requests/responses into discrete frames, allowing multiple streams to interleave over a single TCP connection.",
    difficulty: 5,
    skillsTested: ["HTTP/2", "Architecture", "Optimization"]
  },
  {
    id: 21,
    domain: "Frontend",
    title: "Prisma Isolation Levels Assessment",
    question: "What isolation level prevents dirty reads but allows phantom reads in postgres?",
    options: ["Read Committed", "Serializable", "Repeatable Read", "Read Uncommitted"],
    correctOption: 0,
    explanation: "Read Committed isolation level avoids dirty reads, meaning transactions cannot read uncommitted data, but phantoms can still occur if new records match a range query.",
    difficulty: 2,
    skillsTested: ["Prisma", "Architecture", "Optimization"]
  },
  {
    id: 22,
    domain: "Backend",
    title: "JWT Signature Secrets Assessment",
    question: "What algorithm uses asymmetric cryptography for signing tokens?",
    options: ["RS256", "HS256", "SHA256", "MD5"],
    correctOption: 0,
    explanation: "RS256 uses a private key to sign the token and a public key to verify. HS256 uses a shared symmetric secret.",
    difficulty: 3,
    skillsTested: ["JWT", "Architecture", "Optimization"]
  },
  {
    id: 23,
    domain: "DevOps",
    title: "Docker Layer Caching Assessment",
    question: "Which instruction creates a new cached write layer in Docker?",
    options: ["RUN", "ENV", "EXPOSE", "LABEL"],
    correctOption: 0,
    explanation: "Instructions like RUN, COPY, and ADD modify the image filesystem and generate cache layers. ENV/EXPOSE update metadata only.",
    difficulty: 4,
    skillsTested: ["Docker", "Architecture", "Optimization"]
  },
  {
    id: 24,
    domain: "Security",
    title: "B-Tree Database Index Assessment",
    question: "What is the computational complexity of searching a value in balanced B-Tree of height h?",
    options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
    correctOption: 0,
    explanation: "Searching in balanced tree indexing structures yields logarithmic complexity relative to elements or branch branching factors.",
    difficulty: 5,
    skillsTested: ["B-Tree", "Architecture", "Optimization"]
  },
  {
    id: 25,
    domain: "Frontend",
    title: "React Hooks Lifecycle Assessment",
    question: "Which hook handles updates cleanly after layout paints?",
    options: ["useLayoutEffect", "useEffect", "useInsertionEffect", "useMemo"],
    correctOption: 1,
    explanation: "useLayoutEffect fires synchronously after layout mutations but before paint. Use this to read layout and synchronously re-render.",
    difficulty: 2,
    skillsTested: ["React", "Architecture", "Optimization"]
  },
  {
    id: 26,
    domain: "Backend",
    title: "HTTP/2 Multiplexing Assessment",
    question: "How does HTTP/2 multiplex requests over a single connection?",
    options: ["Binary framing layer", "UDP tunneling", "Header compression", "Cookie syncing"],
    correctOption: 0,
    explanation: "HTTP/2 introduces binary framing, dividing requests/responses into discrete frames, allowing multiple streams to interleave over a single TCP connection.",
    difficulty: 3,
    skillsTested: ["HTTP/2", "Architecture", "Optimization"]
  },
  {
    id: 27,
    domain: "DevOps",
    title: "Prisma Isolation Levels Assessment",
    question: "What isolation level prevents dirty reads but allows phantom reads in postgres?",
    options: ["Read Committed", "Serializable", "Repeatable Read", "Read Uncommitted"],
    correctOption: 0,
    explanation: "Read Committed isolation level avoids dirty reads, meaning transactions cannot read uncommitted data, but phantoms can still occur if new records match a range query.",
    difficulty: 4,
    skillsTested: ["Prisma", "Architecture", "Optimization"]
  },
  {
    id: 28,
    domain: "Security",
    title: "JWT Signature Secrets Assessment",
    question: "What algorithm uses asymmetric cryptography for signing tokens?",
    options: ["RS256", "HS256", "SHA256", "MD5"],
    correctOption: 0,
    explanation: "RS256 uses a private key to sign the token and a public key to verify. HS256 uses a shared symmetric secret.",
    difficulty: 5,
    skillsTested: ["JWT", "Architecture", "Optimization"]
  },
  {
    id: 29,
    domain: "Frontend",
    title: "Docker Layer Caching Assessment",
    question: "Which instruction creates a new cached write layer in Docker?",
    options: ["RUN", "ENV", "EXPOSE", "LABEL"],
    correctOption: 0,
    explanation: "Instructions like RUN, COPY, and ADD modify the image filesystem and generate cache layers. ENV/EXPOSE update metadata only.",
    difficulty: 2,
    skillsTested: ["Docker", "Architecture", "Optimization"]
  },
  {
    id: 30,
    domain: "Backend",
    title: "B-Tree Database Index Assessment",
    question: "What is the computational complexity of searching a value in balanced B-Tree of height h?",
    options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
    correctOption: 0,
    explanation: "Searching in balanced tree indexing structures yields logarithmic complexity relative to elements or branch branching factors.",
    difficulty: 3,
    skillsTested: ["B-Tree", "Architecture", "Optimization"]
  },
];


// DYNAMIC STYLING HELPER METRICS DEFINITION FOR THEME ISOLATION
const EDGE_QUIZ_THEME_METRICS = {
  theme_0: {
    primary: 'color-edge-quiz-0-p',
    secondary: 'color-edge-quiz-0-s',
    accent: 'color-edge-quiz-0-a',
    border: 'border-edge-quiz-0-b'
  },
  theme_1: {
    primary: 'color-edge-quiz-1-p',
    secondary: 'color-edge-quiz-1-s',
    accent: 'color-edge-quiz-1-a',
    border: 'border-edge-quiz-1-b'
  },
  theme_2: {
    primary: 'color-edge-quiz-2-p',
    secondary: 'color-edge-quiz-2-s',
    accent: 'color-edge-quiz-2-a',
    border: 'border-edge-quiz-2-b'
  },
  theme_3: {
    primary: 'color-edge-quiz-3-p',
    secondary: 'color-edge-quiz-3-s',
    accent: 'color-edge-quiz-3-a',
    border: 'border-edge-quiz-3-b'
  },
  theme_4: {
    primary: 'color-edge-quiz-4-p',
    secondary: 'color-edge-quiz-4-s',
    accent: 'color-edge-quiz-4-a',
    border: 'border-edge-quiz-4-b'
  },
  theme_5: {
    primary: 'color-edge-quiz-5-p',
    secondary: 'color-edge-quiz-5-s',
    accent: 'color-edge-quiz-5-a',
    border: 'border-edge-quiz-5-b'
  },
  theme_6: {
    primary: 'color-edge-quiz-6-p',
    secondary: 'color-edge-quiz-6-s',
    accent: 'color-edge-quiz-6-a',
    border: 'border-edge-quiz-6-b'
  },
  theme_7: {
    primary: 'color-edge-quiz-7-p',
    secondary: 'color-edge-quiz-7-s',
    accent: 'color-edge-quiz-7-a',
    border: 'border-edge-quiz-7-b'
  },
  theme_8: {
    primary: 'color-edge-quiz-8-p',
    secondary: 'color-edge-quiz-8-s',
    accent: 'color-edge-quiz-8-a',
    border: 'border-edge-quiz-8-b'
  },
  theme_9: {
    primary: 'color-edge-quiz-9-p',
    secondary: 'color-edge-quiz-9-s',
    accent: 'color-edge-quiz-9-a',
    border: 'border-edge-quiz-9-b'
  },
  theme_10: {
    primary: 'color-edge-quiz-10-p',
    secondary: 'color-edge-quiz-10-s',
    accent: 'color-edge-quiz-10-a',
    border: 'border-edge-quiz-10-b'
  },
  theme_11: {
    primary: 'color-edge-quiz-11-p',
    secondary: 'color-edge-quiz-11-s',
    accent: 'color-edge-quiz-11-a',
    border: 'border-edge-quiz-11-b'
  },
  theme_12: {
    primary: 'color-edge-quiz-12-p',
    secondary: 'color-edge-quiz-12-s',
    accent: 'color-edge-quiz-12-a',
    border: 'border-edge-quiz-12-b'
  },
  theme_13: {
    primary: 'color-edge-quiz-13-p',
    secondary: 'color-edge-quiz-13-s',
    accent: 'color-edge-quiz-13-a',
    border: 'border-edge-quiz-13-b'
  },
  theme_14: {
    primary: 'color-edge-quiz-14-p',
    secondary: 'color-edge-quiz-14-s',
    accent: 'color-edge-quiz-14-a',
    border: 'border-edge-quiz-14-b'
  },
  theme_15: {
    primary: 'color-edge-quiz-15-p',
    secondary: 'color-edge-quiz-15-s',
    accent: 'color-edge-quiz-15-a',
    border: 'border-edge-quiz-15-b'
  },
  theme_16: {
    primary: 'color-edge-quiz-16-p',
    secondary: 'color-edge-quiz-16-s',
    accent: 'color-edge-quiz-16-a',
    border: 'border-edge-quiz-16-b'
  },
  theme_17: {
    primary: 'color-edge-quiz-17-p',
    secondary: 'color-edge-quiz-17-s',
    accent: 'color-edge-quiz-17-a',
    border: 'border-edge-quiz-17-b'
  },
  theme_18: {
    primary: 'color-edge-quiz-18-p',
    secondary: 'color-edge-quiz-18-s',
    accent: 'color-edge-quiz-18-a',
    border: 'border-edge-quiz-18-b'
  },
  theme_19: {
    primary: 'color-edge-quiz-19-p',
    secondary: 'color-edge-quiz-19-s',
    accent: 'color-edge-quiz-19-a',
    border: 'border-edge-quiz-19-b'
  },
  theme_20: {
    primary: 'color-edge-quiz-20-p',
    secondary: 'color-edge-quiz-20-s',
    accent: 'color-edge-quiz-20-a',
    border: 'border-edge-quiz-20-b'
  },
  theme_21: {
    primary: 'color-edge-quiz-21-p',
    secondary: 'color-edge-quiz-21-s',
    accent: 'color-edge-quiz-21-a',
    border: 'border-edge-quiz-21-b'
  },
  theme_22: {
    primary: 'color-edge-quiz-22-p',
    secondary: 'color-edge-quiz-22-s',
    accent: 'color-edge-quiz-22-a',
    border: 'border-edge-quiz-22-b'
  },
  theme_23: {
    primary: 'color-edge-quiz-23-p',
    secondary: 'color-edge-quiz-23-s',
    accent: 'color-edge-quiz-23-a',
    border: 'border-edge-quiz-23-b'
  },
  theme_24: {
    primary: 'color-edge-quiz-24-p',
    secondary: 'color-edge-quiz-24-s',
    accent: 'color-edge-quiz-24-a',
    border: 'border-edge-quiz-24-b'
  },
  theme_25: {
    primary: 'color-edge-quiz-25-p',
    secondary: 'color-edge-quiz-25-s',
    accent: 'color-edge-quiz-25-a',
    border: 'border-edge-quiz-25-b'
  },
  theme_26: {
    primary: 'color-edge-quiz-26-p',
    secondary: 'color-edge-quiz-26-s',
    accent: 'color-edge-quiz-26-a',
    border: 'border-edge-quiz-26-b'
  },
  theme_27: {
    primary: 'color-edge-quiz-27-p',
    secondary: 'color-edge-quiz-27-s',
    accent: 'color-edge-quiz-27-a',
    border: 'border-edge-quiz-27-b'
  },
  theme_28: {
    primary: 'color-edge-quiz-28-p',
    secondary: 'color-edge-quiz-28-s',
    accent: 'color-edge-quiz-28-a',
    border: 'border-edge-quiz-28-b'
  },
  theme_29: {
    primary: 'color-edge-quiz-29-p',
    secondary: 'color-edge-quiz-29-s',
    accent: 'color-edge-quiz-29-a',
    border: 'border-edge-quiz-29-b'
  },
  theme_30: {
    primary: 'color-edge-quiz-30-p',
    secondary: 'color-edge-quiz-30-s',
    accent: 'color-edge-quiz-30-a',
    border: 'border-edge-quiz-30-b'
  },
  theme_31: {
    primary: 'color-edge-quiz-31-p',
    secondary: 'color-edge-quiz-31-s',
    accent: 'color-edge-quiz-31-a',
    border: 'border-edge-quiz-31-b'
  },
  theme_32: {
    primary: 'color-edge-quiz-32-p',
    secondary: 'color-edge-quiz-32-s',
    accent: 'color-edge-quiz-32-a',
    border: 'border-edge-quiz-32-b'
  },
  theme_33: {
    primary: 'color-edge-quiz-33-p',
    secondary: 'color-edge-quiz-33-s',
    accent: 'color-edge-quiz-33-a',
    border: 'border-edge-quiz-33-b'
  },
  theme_34: {
    primary: 'color-edge-quiz-34-p',
    secondary: 'color-edge-quiz-34-s',
    accent: 'color-edge-quiz-34-a',
    border: 'border-edge-quiz-34-b'
  },
  theme_35: {
    primary: 'color-edge-quiz-35-p',
    secondary: 'color-edge-quiz-35-s',
    accent: 'color-edge-quiz-35-a',
    border: 'border-edge-quiz-35-b'
  },
  theme_36: {
    primary: 'color-edge-quiz-36-p',
    secondary: 'color-edge-quiz-36-s',
    accent: 'color-edge-quiz-36-a',
    border: 'border-edge-quiz-36-b'
  },
  theme_37: {
    primary: 'color-edge-quiz-37-p',
    secondary: 'color-edge-quiz-37-s',
    accent: 'color-edge-quiz-37-a',
    border: 'border-edge-quiz-37-b'
  },
  theme_38: {
    primary: 'color-edge-quiz-38-p',
    secondary: 'color-edge-quiz-38-s',
    accent: 'color-edge-quiz-38-a',
    border: 'border-edge-quiz-38-b'
  },
  theme_39: {
    primary: 'color-edge-quiz-39-p',
    secondary: 'color-edge-quiz-39-s',
    accent: 'color-edge-quiz-39-a',
    border: 'border-edge-quiz-39-b'
  },
  theme_40: {
    primary: 'color-edge-quiz-40-p',
    secondary: 'color-edge-quiz-40-s',
    accent: 'color-edge-quiz-40-a',
    border: 'border-edge-quiz-40-b'
  },
  theme_41: {
    primary: 'color-edge-quiz-41-p',
    secondary: 'color-edge-quiz-41-s',
    accent: 'color-edge-quiz-41-a',
    border: 'border-edge-quiz-41-b'
  },
  theme_42: {
    primary: 'color-edge-quiz-42-p',
    secondary: 'color-edge-quiz-42-s',
    accent: 'color-edge-quiz-42-a',
    border: 'border-edge-quiz-42-b'
  },
  theme_43: {
    primary: 'color-edge-quiz-43-p',
    secondary: 'color-edge-quiz-43-s',
    accent: 'color-edge-quiz-43-a',
    border: 'border-edge-quiz-43-b'
  },
  theme_44: {
    primary: 'color-edge-quiz-44-p',
    secondary: 'color-edge-quiz-44-s',
    accent: 'color-edge-quiz-44-a',
    border: 'border-edge-quiz-44-b'
  },
  theme_45: {
    primary: 'color-edge-quiz-45-p',
    secondary: 'color-edge-quiz-45-s',
    accent: 'color-edge-quiz-45-a',
    border: 'border-edge-quiz-45-b'
  },
  theme_46: {
    primary: 'color-edge-quiz-46-p',
    secondary: 'color-edge-quiz-46-s',
    accent: 'color-edge-quiz-46-a',
    border: 'border-edge-quiz-46-b'
  },
  theme_47: {
    primary: 'color-edge-quiz-47-p',
    secondary: 'color-edge-quiz-47-s',
    accent: 'color-edge-quiz-47-a',
    border: 'border-edge-quiz-47-b'
  },
  theme_48: {
    primary: 'color-edge-quiz-48-p',
    secondary: 'color-edge-quiz-48-s',
    accent: 'color-edge-quiz-48-a',
    border: 'border-edge-quiz-48-b'
  },
  theme_49: {
    primary: 'color-edge-quiz-49-p',
    secondary: 'color-edge-quiz-49-s',
    accent: 'color-edge-quiz-49-a',
    border: 'border-edge-quiz-49-b'
  },
  theme_50: {
    primary: 'color-edge-quiz-50-p',
    secondary: 'color-edge-quiz-50-s',
    accent: 'color-edge-quiz-50-a',
    border: 'border-edge-quiz-50-b'
  },
  theme_51: {
    primary: 'color-edge-quiz-51-p',
    secondary: 'color-edge-quiz-51-s',
    accent: 'color-edge-quiz-51-a',
    border: 'border-edge-quiz-51-b'
  },
  theme_52: {
    primary: 'color-edge-quiz-52-p',
    secondary: 'color-edge-quiz-52-s',
    accent: 'color-edge-quiz-52-a',
    border: 'border-edge-quiz-52-b'
  },
  theme_53: {
    primary: 'color-edge-quiz-53-p',
    secondary: 'color-edge-quiz-53-s',
    accent: 'color-edge-quiz-53-a',
    border: 'border-edge-quiz-53-b'
  },
  theme_54: {
    primary: 'color-edge-quiz-54-p',
    secondary: 'color-edge-quiz-54-s',
    accent: 'color-edge-quiz-54-a',
    border: 'border-edge-quiz-54-b'
  },
  theme_55: {
    primary: 'color-edge-quiz-55-p',
    secondary: 'color-edge-quiz-55-s',
    accent: 'color-edge-quiz-55-a',
    border: 'border-edge-quiz-55-b'
  },
  theme_56: {
    primary: 'color-edge-quiz-56-p',
    secondary: 'color-edge-quiz-56-s',
    accent: 'color-edge-quiz-56-a',
    border: 'border-edge-quiz-56-b'
  },
  theme_57: {
    primary: 'color-edge-quiz-57-p',
    secondary: 'color-edge-quiz-57-s',
    accent: 'color-edge-quiz-57-a',
    border: 'border-edge-quiz-57-b'
  },
  theme_58: {
    primary: 'color-edge-quiz-58-p',
    secondary: 'color-edge-quiz-58-s',
    accent: 'color-edge-quiz-58-a',
    border: 'border-edge-quiz-58-b'
  },
  theme_59: {
    primary: 'color-edge-quiz-59-p',
    secondary: 'color-edge-quiz-59-s',
    accent: 'color-edge-quiz-59-a',
    border: 'border-edge-quiz-59-b'
  },
  theme_60: {
    primary: 'color-edge-quiz-60-p',
    secondary: 'color-edge-quiz-60-s',
    accent: 'color-edge-quiz-60-a',
    border: 'border-edge-quiz-60-b'
  },
  theme_61: {
    primary: 'color-edge-quiz-61-p',
    secondary: 'color-edge-quiz-61-s',
    accent: 'color-edge-quiz-61-a',
    border: 'border-edge-quiz-61-b'
  },
  theme_62: {
    primary: 'color-edge-quiz-62-p',
    secondary: 'color-edge-quiz-62-s',
    accent: 'color-edge-quiz-62-a',
    border: 'border-edge-quiz-62-b'
  },
  theme_63: {
    primary: 'color-edge-quiz-63-p',
    secondary: 'color-edge-quiz-63-s',
    accent: 'color-edge-quiz-63-a',
    border: 'border-edge-quiz-63-b'
  },
  theme_64: {
    primary: 'color-edge-quiz-64-p',
    secondary: 'color-edge-quiz-64-s',
    accent: 'color-edge-quiz-64-a',
    border: 'border-edge-quiz-64-b'
  },
  theme_65: {
    primary: 'color-edge-quiz-65-p',
    secondary: 'color-edge-quiz-65-s',
    accent: 'color-edge-quiz-65-a',
    border: 'border-edge-quiz-65-b'
  },
  theme_66: {
    primary: 'color-edge-quiz-66-p',
    secondary: 'color-edge-quiz-66-s',
    accent: 'color-edge-quiz-66-a',
    border: 'border-edge-quiz-66-b'
  },
  theme_67: {
    primary: 'color-edge-quiz-67-p',
    secondary: 'color-edge-quiz-67-s',
    accent: 'color-edge-quiz-67-a',
    border: 'border-edge-quiz-67-b'
  },
  theme_68: {
    primary: 'color-edge-quiz-68-p',
    secondary: 'color-edge-quiz-68-s',
    accent: 'color-edge-quiz-68-a',
    border: 'border-edge-quiz-68-b'
  },
  theme_69: {
    primary: 'color-edge-quiz-69-p',
    secondary: 'color-edge-quiz-69-s',
    accent: 'color-edge-quiz-69-a',
    border: 'border-edge-quiz-69-b'
  },
  theme_70: {
    primary: 'color-edge-quiz-70-p',
    secondary: 'color-edge-quiz-70-s',
    accent: 'color-edge-quiz-70-a',
    border: 'border-edge-quiz-70-b'
  },
  theme_71: {
    primary: 'color-edge-quiz-71-p',
    secondary: 'color-edge-quiz-71-s',
    accent: 'color-edge-quiz-71-a',
    border: 'border-edge-quiz-71-b'
  },
  theme_72: {
    primary: 'color-edge-quiz-72-p',
    secondary: 'color-edge-quiz-72-s',
    accent: 'color-edge-quiz-72-a',
    border: 'border-edge-quiz-72-b'
  },
  theme_73: {
    primary: 'color-edge-quiz-73-p',
    secondary: 'color-edge-quiz-73-s',
    accent: 'color-edge-quiz-73-a',
    border: 'border-edge-quiz-73-b'
  },
  theme_74: {
    primary: 'color-edge-quiz-74-p',
    secondary: 'color-edge-quiz-74-s',
    accent: 'color-edge-quiz-74-a',
    border: 'border-edge-quiz-74-b'
  },
  theme_75: {
    primary: 'color-edge-quiz-75-p',
    secondary: 'color-edge-quiz-75-s',
    accent: 'color-edge-quiz-75-a',
    border: 'border-edge-quiz-75-b'
  },
  theme_76: {
    primary: 'color-edge-quiz-76-p',
    secondary: 'color-edge-quiz-76-s',
    accent: 'color-edge-quiz-76-a',
    border: 'border-edge-quiz-76-b'
  },
  theme_77: {
    primary: 'color-edge-quiz-77-p',
    secondary: 'color-edge-quiz-77-s',
    accent: 'color-edge-quiz-77-a',
    border: 'border-edge-quiz-77-b'
  },
  theme_78: {
    primary: 'color-edge-quiz-78-p',
    secondary: 'color-edge-quiz-78-s',
    accent: 'color-edge-quiz-78-a',
    border: 'border-edge-quiz-78-b'
  },
  theme_79: {
    primary: 'color-edge-quiz-79-p',
    secondary: 'color-edge-quiz-79-s',
    accent: 'color-edge-quiz-79-a',
    border: 'border-edge-quiz-79-b'
  },
  theme_80: {
    primary: 'color-edge-quiz-80-p',
    secondary: 'color-edge-quiz-80-s',
    accent: 'color-edge-quiz-80-a',
    border: 'border-edge-quiz-80-b'
  },
  theme_81: {
    primary: 'color-edge-quiz-81-p',
    secondary: 'color-edge-quiz-81-s',
    accent: 'color-edge-quiz-81-a',
    border: 'border-edge-quiz-81-b'
  },
  theme_82: {
    primary: 'color-edge-quiz-82-p',
    secondary: 'color-edge-quiz-82-s',
    accent: 'color-edge-quiz-82-a',
    border: 'border-edge-quiz-82-b'
  },
  theme_83: {
    primary: 'color-edge-quiz-83-p',
    secondary: 'color-edge-quiz-83-s',
    accent: 'color-edge-quiz-83-a',
    border: 'border-edge-quiz-83-b'
  },
  theme_84: {
    primary: 'color-edge-quiz-84-p',
    secondary: 'color-edge-quiz-84-s',
    accent: 'color-edge-quiz-84-a',
    border: 'border-edge-quiz-84-b'
  },
  theme_85: {
    primary: 'color-edge-quiz-85-p',
    secondary: 'color-edge-quiz-85-s',
    accent: 'color-edge-quiz-85-a',
    border: 'border-edge-quiz-85-b'
  },
  theme_86: {
    primary: 'color-edge-quiz-86-p',
    secondary: 'color-edge-quiz-86-s',
    accent: 'color-edge-quiz-86-a',
    border: 'border-edge-quiz-86-b'
  },
  theme_87: {
    primary: 'color-edge-quiz-87-p',
    secondary: 'color-edge-quiz-87-s',
    accent: 'color-edge-quiz-87-a',
    border: 'border-edge-quiz-87-b'
  },
  theme_88: {
    primary: 'color-edge-quiz-88-p',
    secondary: 'color-edge-quiz-88-s',
    accent: 'color-edge-quiz-88-a',
    border: 'border-edge-quiz-88-b'
  },
  theme_89: {
    primary: 'color-edge-quiz-89-p',
    secondary: 'color-edge-quiz-89-s',
    accent: 'color-edge-quiz-89-a',
    border: 'border-edge-quiz-89-b'
  },
  theme_90: {
    primary: 'color-edge-quiz-90-p',
    secondary: 'color-edge-quiz-90-s',
    accent: 'color-edge-quiz-90-a',
    border: 'border-edge-quiz-90-b'
  },
  theme_91: {
    primary: 'color-edge-quiz-91-p',
    secondary: 'color-edge-quiz-91-s',
    accent: 'color-edge-quiz-91-a',
    border: 'border-edge-quiz-91-b'
  },
  theme_92: {
    primary: 'color-edge-quiz-92-p',
    secondary: 'color-edge-quiz-92-s',
    accent: 'color-edge-quiz-92-a',
    border: 'border-edge-quiz-92-b'
  },
};

export default function EdgeQuizPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState("start");
  const [history, setHistory] = useState([]);
  const [mastery, setMastery] = useState({ Frontend: 20, Backend: 20, DevOps: 20, Security: 20 });

  const activeQuestion = useMemo(() => {
    return QUESTIONS[currentIdx] || QUESTIONS[0];
  }, [currentIdx]);

  const handleStart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizState("active");
    setHistory([]);
    setMastery({ Frontend: 20, Backend: 20, DevOps: 20, Security: 20 });
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || isAnswered) return;
    
    setIsAnswered(true);
    const isCorrect = selectedOption === activeQuestion.correctOption;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setMastery(prev => ({
        ...prev,
        [activeQuestion.domain]: Math.min(100, prev[activeQuestion.domain] + 15)
      }));
    } else {
      setMastery(prev => ({
        ...prev,
        [activeQuestion.domain]: Math.max(0, prev[activeQuestion.domain] - 8)
      }));
    }
    
    setHistory(prev => [...prev, {
      questionId: activeQuestion.id,
      selected: selectedOption,
      isCorrect
    }]);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    
    if (currentIdx + 1 >= 10) {
      setQuizState("result");
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
          <BookOpen className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edge-Computed Personalized Quiz</h1>
          <p className="text-muted-foreground">Local client-side adaptive skill assessments with dynamic difficulty models.</p>
        </div>
      </div>

      {quizState === "start" && (
        <Card className="border border-border/50 text-center p-8 max-w-2xl mx-auto shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Initialize Adaptive Assessment</CardTitle>
            <CardDescription className="text-muted-foreground">
              Tests cover Frontend, Backend, DevOps, and Security topics, adjusting questions dynamically to measure your skill profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge variant="secondary" className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-sm">10 Questions</Badge>
              <Badge variant="secondary" className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-sm">Adaptive Routing</Badge>
              <Badge variant="secondary" className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-sm">Skill Mastery Mapping</Badge>
            </div>
            <Button size="lg" onClick={handleStart} className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {quizState === "active" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-2">
                  <Badge className="bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 hover:bg-teal-100">{activeQuestion.domain}</Badge>
                  <span className="text-xs font-mono text-muted-foreground">Question {currentIdx + 1} of 10</span>
                </div>
                <CardTitle className="text-xl leading-snug">{activeQuestion.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {activeQuestion.options.map((option, idx) => {
                    let btnVariant = "outline";
                    let optionColor = "border-border hover:border-slate-400";
                    
                    if (selectedOption === idx) {
                      btnVariant = "secondary";
                      optionColor = "border-teal-500 bg-teal-50 dark:bg-teal-950/20";
                    }
                    if (isAnswered) {
                      if (idx === activeQuestion.correctOption) {
                        optionColor = "border-green-500 bg-green-50 dark:bg-green-950/20";
                      } else if (selectedOption === idx) {
                        optionColor = "border-red-500 bg-red-50 dark:bg-red-950/20";
                      }
                    }
                    
                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => setSelectedOption(idx)}
                        className={`flex items-center justify-between text-left p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${optionColor}`}
                      >
                        <span>{option}</span>
                        {isAnswered && idx === activeQuestion.correctOption && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />}
                        {isAnswered && selectedOption === idx && idx !== activeQuestion.correctOption && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAnswered(true)}
                    disabled={selectedOption === null || isAnswered}
                    className="text-xs text-muted-foreground"
                  >
                    Skip & Review
                  </Button>
                  
                  {!isAnswered ? (
                    <Button
                      onClick={handleAnswerSubmit}
                      disabled={selectedOption === null}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
                      {currentIdx + 1 === 10 ? "Finish Assessment" : "Next Question"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {isAnswered && (
              <Card className="border border-green-500/20 bg-green-50/10 dark:bg-green-950/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Lightbulb className="w-5 h-5" />
                    Skill Explanation Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground">{activeQuestion.explanation}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Assessment Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Quiz Complete</span>
                    <span>{currentIdx * 10}%</span>
                  </div>
                  <Progress value={currentIdx * 10} className="h-2" />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-teal-600" />
                    Real-time Skills Radar
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(mastery).map(([domain, val]) => (
                      <div key={domain} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">{domain}</span>
                          <span className="text-muted-foreground">{val}%</span>
                        </div>
                        <Progress value={val} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {quizState === "result" && (
        <Card className="border border-border/50 max-w-3xl mx-auto p-8 shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Award className="w-16 h-16 text-teal-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Assessment Complete!</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              You scored {score} out of 10. Check your domain alignment scores below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(mastery).map(([domain, val]) => (
                <div key={domain} className="p-4 bg-muted/40 rounded-xl text-center border border-border/30">
                  <span className="text-xs text-muted-foreground block mb-1 font-medium">{domain}</span>
                  <span className="text-2xl font-bold text-teal-600">{val}%</span>
                  <div className="mt-2 text-[10px] text-muted-foreground">Computed Rating</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t">
              <Button onClick={handleStart} className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retake Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
