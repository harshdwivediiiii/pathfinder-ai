"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Play, Pause, ChevronRight, RotateCcw, Cpu, List, Database, Layers, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

const SNIPPETS = [
  {
    id: 1,
    name: "Recursive Fibonacci Example 1",
    description: "Fibonacci sequence showing deep call stack recursion dynamics",
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
fibonacci(4);`,
    steps: [
        { stack: ['global()', 'fibonacci(4)'], heap: {'n': 4}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 3}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)'], heap: {'n': 2}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 2, 'return': 1}, queue: [], webapi: [] },
      ]
  },
  {
    id: 2,
    name: "Asynchronous Event Loop Example 1",
    description: "Illustrates macro-task timeouts vs micro-task promises",
    code: `console.log('Start');
setTimeout(() => console.log('Timeout'), 100);
Promise.resolve().then(() => console.log('Promise'));
console.log('End');`,
    steps: [
        { stack: ['global()'], heap: {}, queue: [], webapi: [] },
        { stack: ['global()'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: ['global()'], heap: {}, queue: ['Promise callback'], webapi: ['setTimeout timer'] },
        { stack: ['global()', 'Promise callback'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: [], heap: {}, queue: ['Timeout callback'], webapi: [] },
      ]
  },
  {
    id: 3,
    name: "Recursive Fibonacci Example 2",
    description: "Fibonacci sequence showing deep call stack recursion dynamics",
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
fibonacci(4);`,
    steps: [
        { stack: ['global()', 'fibonacci(4)'], heap: {'n': 4}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 3}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)'], heap: {'n': 2}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 2, 'return': 1}, queue: [], webapi: [] },
      ]
  },
  {
    id: 4,
    name: "Asynchronous Event Loop Example 2",
    description: "Illustrates macro-task timeouts vs micro-task promises",
    code: `console.log('Start');
setTimeout(() => console.log('Timeout'), 100);
Promise.resolve().then(() => console.log('Promise'));
console.log('End');`,
    steps: [
        { stack: ['global()'], heap: {}, queue: [], webapi: [] },
        { stack: ['global()'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: ['global()'], heap: {}, queue: ['Promise callback'], webapi: ['setTimeout timer'] },
        { stack: ['global()', 'Promise callback'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: [], heap: {}, queue: ['Timeout callback'], webapi: [] },
      ]
  },
  {
    id: 5,
    name: "Recursive Fibonacci Example 3",
    description: "Fibonacci sequence showing deep call stack recursion dynamics",
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
fibonacci(4);`,
    steps: [
        { stack: ['global()', 'fibonacci(4)'], heap: {'n': 4}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 3}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)'], heap: {'n': 2}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 2, 'return': 1}, queue: [], webapi: [] },
      ]
  },
  {
    id: 6,
    name: "Asynchronous Event Loop Example 3",
    description: "Illustrates macro-task timeouts vs micro-task promises",
    code: `console.log('Start');
setTimeout(() => console.log('Timeout'), 100);
Promise.resolve().then(() => console.log('Promise'));
console.log('End');`,
    steps: [
        { stack: ['global()'], heap: {}, queue: [], webapi: [] },
        { stack: ['global()'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: ['global()'], heap: {}, queue: ['Promise callback'], webapi: ['setTimeout timer'] },
        { stack: ['global()', 'Promise callback'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: [], heap: {}, queue: ['Timeout callback'], webapi: [] },
      ]
  },
  {
    id: 7,
    name: "Recursive Fibonacci Example 4",
    description: "Fibonacci sequence showing deep call stack recursion dynamics",
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
fibonacci(4);`,
    steps: [
        { stack: ['global()', 'fibonacci(4)'], heap: {'n': 4}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 3}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)'], heap: {'n': 2}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 2, 'return': 1}, queue: [], webapi: [] },
      ]
  },
  {
    id: 8,
    name: "Asynchronous Event Loop Example 4",
    description: "Illustrates macro-task timeouts vs micro-task promises",
    code: `console.log('Start');
setTimeout(() => console.log('Timeout'), 100);
Promise.resolve().then(() => console.log('Promise'));
console.log('End');`,
    steps: [
        { stack: ['global()'], heap: {}, queue: [], webapi: [] },
        { stack: ['global()'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: ['global()'], heap: {}, queue: ['Promise callback'], webapi: ['setTimeout timer'] },
        { stack: ['global()', 'Promise callback'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: [], heap: {}, queue: ['Timeout callback'], webapi: [] },
      ]
  },
  {
    id: 9,
    name: "Recursive Fibonacci Example 5",
    description: "Fibonacci sequence showing deep call stack recursion dynamics",
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
fibonacci(4);`,
    steps: [
        { stack: ['global()', 'fibonacci(4)'], heap: {'n': 4}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 3}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)'], heap: {'n': 2}, queue: [], webapi: [] },
        { stack: ['global()', 'fibonacci(4)', 'fibonacci(3)'], heap: {'n': 2, 'return': 1}, queue: [], webapi: [] },
      ]
  },
  {
    id: 10,
    name: "Asynchronous Event Loop Example 5",
    description: "Illustrates macro-task timeouts vs micro-task promises",
    code: `console.log('Start');
setTimeout(() => console.log('Timeout'), 100);
Promise.resolve().then(() => console.log('Promise'));
console.log('End');`,
    steps: [
        { stack: ['global()'], heap: {}, queue: [], webapi: [] },
        { stack: ['global()'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: ['global()'], heap: {}, queue: ['Promise callback'], webapi: ['setTimeout timer'] },
        { stack: ['global()', 'Promise callback'], heap: {}, queue: [], webapi: ['setTimeout timer'] },
        { stack: [], heap: {}, queue: ['Timeout callback'], webapi: [] },
      ]
  },
];


// DYNAMIC STYLING HELPER METRICS DEFINITION FOR THEME ISOLATION
const WEBGL_VISUALIZER_THEME_METRICS = {
  theme_0: {
    primary: 'color-webgl-visualizer-0-p',
    secondary: 'color-webgl-visualizer-0-s',
    accent: 'color-webgl-visualizer-0-a',
    border: 'border-webgl-visualizer-0-b'
  },
  theme_1: {
    primary: 'color-webgl-visualizer-1-p',
    secondary: 'color-webgl-visualizer-1-s',
    accent: 'color-webgl-visualizer-1-a',
    border: 'border-webgl-visualizer-1-b'
  },
  theme_2: {
    primary: 'color-webgl-visualizer-2-p',
    secondary: 'color-webgl-visualizer-2-s',
    accent: 'color-webgl-visualizer-2-a',
    border: 'border-webgl-visualizer-2-b'
  },
  theme_3: {
    primary: 'color-webgl-visualizer-3-p',
    secondary: 'color-webgl-visualizer-3-s',
    accent: 'color-webgl-visualizer-3-a',
    border: 'border-webgl-visualizer-3-b'
  },
  theme_4: {
    primary: 'color-webgl-visualizer-4-p',
    secondary: 'color-webgl-visualizer-4-s',
    accent: 'color-webgl-visualizer-4-a',
    border: 'border-webgl-visualizer-4-b'
  },
  theme_5: {
    primary: 'color-webgl-visualizer-5-p',
    secondary: 'color-webgl-visualizer-5-s',
    accent: 'color-webgl-visualizer-5-a',
    border: 'border-webgl-visualizer-5-b'
  },
  theme_6: {
    primary: 'color-webgl-visualizer-6-p',
    secondary: 'color-webgl-visualizer-6-s',
    accent: 'color-webgl-visualizer-6-a',
    border: 'border-webgl-visualizer-6-b'
  },
  theme_7: {
    primary: 'color-webgl-visualizer-7-p',
    secondary: 'color-webgl-visualizer-7-s',
    accent: 'color-webgl-visualizer-7-a',
    border: 'border-webgl-visualizer-7-b'
  },
  theme_8: {
    primary: 'color-webgl-visualizer-8-p',
    secondary: 'color-webgl-visualizer-8-s',
    accent: 'color-webgl-visualizer-8-a',
    border: 'border-webgl-visualizer-8-b'
  },
  theme_9: {
    primary: 'color-webgl-visualizer-9-p',
    secondary: 'color-webgl-visualizer-9-s',
    accent: 'color-webgl-visualizer-9-a',
    border: 'border-webgl-visualizer-9-b'
  },
  theme_10: {
    primary: 'color-webgl-visualizer-10-p',
    secondary: 'color-webgl-visualizer-10-s',
    accent: 'color-webgl-visualizer-10-a',
    border: 'border-webgl-visualizer-10-b'
  },
  theme_11: {
    primary: 'color-webgl-visualizer-11-p',
    secondary: 'color-webgl-visualizer-11-s',
    accent: 'color-webgl-visualizer-11-a',
    border: 'border-webgl-visualizer-11-b'
  },
  theme_12: {
    primary: 'color-webgl-visualizer-12-p',
    secondary: 'color-webgl-visualizer-12-s',
    accent: 'color-webgl-visualizer-12-a',
    border: 'border-webgl-visualizer-12-b'
  },
  theme_13: {
    primary: 'color-webgl-visualizer-13-p',
    secondary: 'color-webgl-visualizer-13-s',
    accent: 'color-webgl-visualizer-13-a',
    border: 'border-webgl-visualizer-13-b'
  },
  theme_14: {
    primary: 'color-webgl-visualizer-14-p',
    secondary: 'color-webgl-visualizer-14-s',
    accent: 'color-webgl-visualizer-14-a',
    border: 'border-webgl-visualizer-14-b'
  },
  theme_15: {
    primary: 'color-webgl-visualizer-15-p',
    secondary: 'color-webgl-visualizer-15-s',
    accent: 'color-webgl-visualizer-15-a',
    border: 'border-webgl-visualizer-15-b'
  },
  theme_16: {
    primary: 'color-webgl-visualizer-16-p',
    secondary: 'color-webgl-visualizer-16-s',
    accent: 'color-webgl-visualizer-16-a',
    border: 'border-webgl-visualizer-16-b'
  },
  theme_17: {
    primary: 'color-webgl-visualizer-17-p',
    secondary: 'color-webgl-visualizer-17-s',
    accent: 'color-webgl-visualizer-17-a',
    border: 'border-webgl-visualizer-17-b'
  },
  theme_18: {
    primary: 'color-webgl-visualizer-18-p',
    secondary: 'color-webgl-visualizer-18-s',
    accent: 'color-webgl-visualizer-18-a',
    border: 'border-webgl-visualizer-18-b'
  },
  theme_19: {
    primary: 'color-webgl-visualizer-19-p',
    secondary: 'color-webgl-visualizer-19-s',
    accent: 'color-webgl-visualizer-19-a',
    border: 'border-webgl-visualizer-19-b'
  },
  theme_20: {
    primary: 'color-webgl-visualizer-20-p',
    secondary: 'color-webgl-visualizer-20-s',
    accent: 'color-webgl-visualizer-20-a',
    border: 'border-webgl-visualizer-20-b'
  },
  theme_21: {
    primary: 'color-webgl-visualizer-21-p',
    secondary: 'color-webgl-visualizer-21-s',
    accent: 'color-webgl-visualizer-21-a',
    border: 'border-webgl-visualizer-21-b'
  },
  theme_22: {
    primary: 'color-webgl-visualizer-22-p',
    secondary: 'color-webgl-visualizer-22-s',
    accent: 'color-webgl-visualizer-22-a',
    border: 'border-webgl-visualizer-22-b'
  },
  theme_23: {
    primary: 'color-webgl-visualizer-23-p',
    secondary: 'color-webgl-visualizer-23-s',
    accent: 'color-webgl-visualizer-23-a',
    border: 'border-webgl-visualizer-23-b'
  },
  theme_24: {
    primary: 'color-webgl-visualizer-24-p',
    secondary: 'color-webgl-visualizer-24-s',
    accent: 'color-webgl-visualizer-24-a',
    border: 'border-webgl-visualizer-24-b'
  },
  theme_25: {
    primary: 'color-webgl-visualizer-25-p',
    secondary: 'color-webgl-visualizer-25-s',
    accent: 'color-webgl-visualizer-25-a',
    border: 'border-webgl-visualizer-25-b'
  },
  theme_26: {
    primary: 'color-webgl-visualizer-26-p',
    secondary: 'color-webgl-visualizer-26-s',
    accent: 'color-webgl-visualizer-26-a',
    border: 'border-webgl-visualizer-26-b'
  },
  theme_27: {
    primary: 'color-webgl-visualizer-27-p',
    secondary: 'color-webgl-visualizer-27-s',
    accent: 'color-webgl-visualizer-27-a',
    border: 'border-webgl-visualizer-27-b'
  },
  theme_28: {
    primary: 'color-webgl-visualizer-28-p',
    secondary: 'color-webgl-visualizer-28-s',
    accent: 'color-webgl-visualizer-28-a',
    border: 'border-webgl-visualizer-28-b'
  },
  theme_29: {
    primary: 'color-webgl-visualizer-29-p',
    secondary: 'color-webgl-visualizer-29-s',
    accent: 'color-webgl-visualizer-29-a',
    border: 'border-webgl-visualizer-29-b'
  },
  theme_30: {
    primary: 'color-webgl-visualizer-30-p',
    secondary: 'color-webgl-visualizer-30-s',
    accent: 'color-webgl-visualizer-30-a',
    border: 'border-webgl-visualizer-30-b'
  },
  theme_31: {
    primary: 'color-webgl-visualizer-31-p',
    secondary: 'color-webgl-visualizer-31-s',
    accent: 'color-webgl-visualizer-31-a',
    border: 'border-webgl-visualizer-31-b'
  },
  theme_32: {
    primary: 'color-webgl-visualizer-32-p',
    secondary: 'color-webgl-visualizer-32-s',
    accent: 'color-webgl-visualizer-32-a',
    border: 'border-webgl-visualizer-32-b'
  },
  theme_33: {
    primary: 'color-webgl-visualizer-33-p',
    secondary: 'color-webgl-visualizer-33-s',
    accent: 'color-webgl-visualizer-33-a',
    border: 'border-webgl-visualizer-33-b'
  },
  theme_34: {
    primary: 'color-webgl-visualizer-34-p',
    secondary: 'color-webgl-visualizer-34-s',
    accent: 'color-webgl-visualizer-34-a',
    border: 'border-webgl-visualizer-34-b'
  },
  theme_35: {
    primary: 'color-webgl-visualizer-35-p',
    secondary: 'color-webgl-visualizer-35-s',
    accent: 'color-webgl-visualizer-35-a',
    border: 'border-webgl-visualizer-35-b'
  },
  theme_36: {
    primary: 'color-webgl-visualizer-36-p',
    secondary: 'color-webgl-visualizer-36-s',
    accent: 'color-webgl-visualizer-36-a',
    border: 'border-webgl-visualizer-36-b'
  },
  theme_37: {
    primary: 'color-webgl-visualizer-37-p',
    secondary: 'color-webgl-visualizer-37-s',
    accent: 'color-webgl-visualizer-37-a',
    border: 'border-webgl-visualizer-37-b'
  },
  theme_38: {
    primary: 'color-webgl-visualizer-38-p',
    secondary: 'color-webgl-visualizer-38-s',
    accent: 'color-webgl-visualizer-38-a',
    border: 'border-webgl-visualizer-38-b'
  },
  theme_39: {
    primary: 'color-webgl-visualizer-39-p',
    secondary: 'color-webgl-visualizer-39-s',
    accent: 'color-webgl-visualizer-39-a',
    border: 'border-webgl-visualizer-39-b'
  },
  theme_40: {
    primary: 'color-webgl-visualizer-40-p',
    secondary: 'color-webgl-visualizer-40-s',
    accent: 'color-webgl-visualizer-40-a',
    border: 'border-webgl-visualizer-40-b'
  },
  theme_41: {
    primary: 'color-webgl-visualizer-41-p',
    secondary: 'color-webgl-visualizer-41-s',
    accent: 'color-webgl-visualizer-41-a',
    border: 'border-webgl-visualizer-41-b'
  },
  theme_42: {
    primary: 'color-webgl-visualizer-42-p',
    secondary: 'color-webgl-visualizer-42-s',
    accent: 'color-webgl-visualizer-42-a',
    border: 'border-webgl-visualizer-42-b'
  },
  theme_43: {
    primary: 'color-webgl-visualizer-43-p',
    secondary: 'color-webgl-visualizer-43-s',
    accent: 'color-webgl-visualizer-43-a',
    border: 'border-webgl-visualizer-43-b'
  },
  theme_44: {
    primary: 'color-webgl-visualizer-44-p',
    secondary: 'color-webgl-visualizer-44-s',
    accent: 'color-webgl-visualizer-44-a',
    border: 'border-webgl-visualizer-44-b'
  },
  theme_45: {
    primary: 'color-webgl-visualizer-45-p',
    secondary: 'color-webgl-visualizer-45-s',
    accent: 'color-webgl-visualizer-45-a',
    border: 'border-webgl-visualizer-45-b'
  },
  theme_46: {
    primary: 'color-webgl-visualizer-46-p',
    secondary: 'color-webgl-visualizer-46-s',
    accent: 'color-webgl-visualizer-46-a',
    border: 'border-webgl-visualizer-46-b'
  },
  theme_47: {
    primary: 'color-webgl-visualizer-47-p',
    secondary: 'color-webgl-visualizer-47-s',
    accent: 'color-webgl-visualizer-47-a',
    border: 'border-webgl-visualizer-47-b'
  },
  theme_48: {
    primary: 'color-webgl-visualizer-48-p',
    secondary: 'color-webgl-visualizer-48-s',
    accent: 'color-webgl-visualizer-48-a',
    border: 'border-webgl-visualizer-48-b'
  },
  theme_49: {
    primary: 'color-webgl-visualizer-49-p',
    secondary: 'color-webgl-visualizer-49-s',
    accent: 'color-webgl-visualizer-49-a',
    border: 'border-webgl-visualizer-49-b'
  },
  theme_50: {
    primary: 'color-webgl-visualizer-50-p',
    secondary: 'color-webgl-visualizer-50-s',
    accent: 'color-webgl-visualizer-50-a',
    border: 'border-webgl-visualizer-50-b'
  },
  theme_51: {
    primary: 'color-webgl-visualizer-51-p',
    secondary: 'color-webgl-visualizer-51-s',
    accent: 'color-webgl-visualizer-51-a',
    border: 'border-webgl-visualizer-51-b'
  },
  theme_52: {
    primary: 'color-webgl-visualizer-52-p',
    secondary: 'color-webgl-visualizer-52-s',
    accent: 'color-webgl-visualizer-52-a',
    border: 'border-webgl-visualizer-52-b'
  },
  theme_53: {
    primary: 'color-webgl-visualizer-53-p',
    secondary: 'color-webgl-visualizer-53-s',
    accent: 'color-webgl-visualizer-53-a',
    border: 'border-webgl-visualizer-53-b'
  },
  theme_54: {
    primary: 'color-webgl-visualizer-54-p',
    secondary: 'color-webgl-visualizer-54-s',
    accent: 'color-webgl-visualizer-54-a',
    border: 'border-webgl-visualizer-54-b'
  },
  theme_55: {
    primary: 'color-webgl-visualizer-55-p',
    secondary: 'color-webgl-visualizer-55-s',
    accent: 'color-webgl-visualizer-55-a',
    border: 'border-webgl-visualizer-55-b'
  },
  theme_56: {
    primary: 'color-webgl-visualizer-56-p',
    secondary: 'color-webgl-visualizer-56-s',
    accent: 'color-webgl-visualizer-56-a',
    border: 'border-webgl-visualizer-56-b'
  },
  theme_57: {
    primary: 'color-webgl-visualizer-57-p',
    secondary: 'color-webgl-visualizer-57-s',
    accent: 'color-webgl-visualizer-57-a',
    border: 'border-webgl-visualizer-57-b'
  },
  theme_58: {
    primary: 'color-webgl-visualizer-58-p',
    secondary: 'color-webgl-visualizer-58-s',
    accent: 'color-webgl-visualizer-58-a',
    border: 'border-webgl-visualizer-58-b'
  },
  theme_59: {
    primary: 'color-webgl-visualizer-59-p',
    secondary: 'color-webgl-visualizer-59-s',
    accent: 'color-webgl-visualizer-59-a',
    border: 'border-webgl-visualizer-59-b'
  },
  theme_60: {
    primary: 'color-webgl-visualizer-60-p',
    secondary: 'color-webgl-visualizer-60-s',
    accent: 'color-webgl-visualizer-60-a',
    border: 'border-webgl-visualizer-60-b'
  },
  theme_61: {
    primary: 'color-webgl-visualizer-61-p',
    secondary: 'color-webgl-visualizer-61-s',
    accent: 'color-webgl-visualizer-61-a',
    border: 'border-webgl-visualizer-61-b'
  },
  theme_62: {
    primary: 'color-webgl-visualizer-62-p',
    secondary: 'color-webgl-visualizer-62-s',
    accent: 'color-webgl-visualizer-62-a',
    border: 'border-webgl-visualizer-62-b'
  },
  theme_63: {
    primary: 'color-webgl-visualizer-63-p',
    secondary: 'color-webgl-visualizer-63-s',
    accent: 'color-webgl-visualizer-63-a',
    border: 'border-webgl-visualizer-63-b'
  },
  theme_64: {
    primary: 'color-webgl-visualizer-64-p',
    secondary: 'color-webgl-visualizer-64-s',
    accent: 'color-webgl-visualizer-64-a',
    border: 'border-webgl-visualizer-64-b'
  },
  theme_65: {
    primary: 'color-webgl-visualizer-65-p',
    secondary: 'color-webgl-visualizer-65-s',
    accent: 'color-webgl-visualizer-65-a',
    border: 'border-webgl-visualizer-65-b'
  },
  theme_66: {
    primary: 'color-webgl-visualizer-66-p',
    secondary: 'color-webgl-visualizer-66-s',
    accent: 'color-webgl-visualizer-66-a',
    border: 'border-webgl-visualizer-66-b'
  },
  theme_67: {
    primary: 'color-webgl-visualizer-67-p',
    secondary: 'color-webgl-visualizer-67-s',
    accent: 'color-webgl-visualizer-67-a',
    border: 'border-webgl-visualizer-67-b'
  },
  theme_68: {
    primary: 'color-webgl-visualizer-68-p',
    secondary: 'color-webgl-visualizer-68-s',
    accent: 'color-webgl-visualizer-68-a',
    border: 'border-webgl-visualizer-68-b'
  },
  theme_69: {
    primary: 'color-webgl-visualizer-69-p',
    secondary: 'color-webgl-visualizer-69-s',
    accent: 'color-webgl-visualizer-69-a',
    border: 'border-webgl-visualizer-69-b'
  },
  theme_70: {
    primary: 'color-webgl-visualizer-70-p',
    secondary: 'color-webgl-visualizer-70-s',
    accent: 'color-webgl-visualizer-70-a',
    border: 'border-webgl-visualizer-70-b'
  },
  theme_71: {
    primary: 'color-webgl-visualizer-71-p',
    secondary: 'color-webgl-visualizer-71-s',
    accent: 'color-webgl-visualizer-71-a',
    border: 'border-webgl-visualizer-71-b'
  },
  theme_72: {
    primary: 'color-webgl-visualizer-72-p',
    secondary: 'color-webgl-visualizer-72-s',
    accent: 'color-webgl-visualizer-72-a',
    border: 'border-webgl-visualizer-72-b'
  },
  theme_73: {
    primary: 'color-webgl-visualizer-73-p',
    secondary: 'color-webgl-visualizer-73-s',
    accent: 'color-webgl-visualizer-73-a',
    border: 'border-webgl-visualizer-73-b'
  },
  theme_74: {
    primary: 'color-webgl-visualizer-74-p',
    secondary: 'color-webgl-visualizer-74-s',
    accent: 'color-webgl-visualizer-74-a',
    border: 'border-webgl-visualizer-74-b'
  },
  theme_75: {
    primary: 'color-webgl-visualizer-75-p',
    secondary: 'color-webgl-visualizer-75-s',
    accent: 'color-webgl-visualizer-75-a',
    border: 'border-webgl-visualizer-75-b'
  },
  theme_76: {
    primary: 'color-webgl-visualizer-76-p',
    secondary: 'color-webgl-visualizer-76-s',
    accent: 'color-webgl-visualizer-76-a',
    border: 'border-webgl-visualizer-76-b'
  },
  theme_77: {
    primary: 'color-webgl-visualizer-77-p',
    secondary: 'color-webgl-visualizer-77-s',
    accent: 'color-webgl-visualizer-77-a',
    border: 'border-webgl-visualizer-77-b'
  },
  theme_78: {
    primary: 'color-webgl-visualizer-78-p',
    secondary: 'color-webgl-visualizer-78-s',
    accent: 'color-webgl-visualizer-78-a',
    border: 'border-webgl-visualizer-78-b'
  },
  theme_79: {
    primary: 'color-webgl-visualizer-79-p',
    secondary: 'color-webgl-visualizer-79-s',
    accent: 'color-webgl-visualizer-79-a',
    border: 'border-webgl-visualizer-79-b'
  },
  theme_80: {
    primary: 'color-webgl-visualizer-80-p',
    secondary: 'color-webgl-visualizer-80-s',
    accent: 'color-webgl-visualizer-80-a',
    border: 'border-webgl-visualizer-80-b'
  },
  theme_81: {
    primary: 'color-webgl-visualizer-81-p',
    secondary: 'color-webgl-visualizer-81-s',
    accent: 'color-webgl-visualizer-81-a',
    border: 'border-webgl-visualizer-81-b'
  },
  theme_82: {
    primary: 'color-webgl-visualizer-82-p',
    secondary: 'color-webgl-visualizer-82-s',
    accent: 'color-webgl-visualizer-82-a',
    border: 'border-webgl-visualizer-82-b'
  },
  theme_83: {
    primary: 'color-webgl-visualizer-83-p',
    secondary: 'color-webgl-visualizer-83-s',
    accent: 'color-webgl-visualizer-83-a',
    border: 'border-webgl-visualizer-83-b'
  },
  theme_84: {
    primary: 'color-webgl-visualizer-84-p',
    secondary: 'color-webgl-visualizer-84-s',
    accent: 'color-webgl-visualizer-84-a',
    border: 'border-webgl-visualizer-84-b'
  },
  theme_85: {
    primary: 'color-webgl-visualizer-85-p',
    secondary: 'color-webgl-visualizer-85-s',
    accent: 'color-webgl-visualizer-85-a',
    border: 'border-webgl-visualizer-85-b'
  },
  theme_86: {
    primary: 'color-webgl-visualizer-86-p',
    secondary: 'color-webgl-visualizer-86-s',
    accent: 'color-webgl-visualizer-86-a',
    border: 'border-webgl-visualizer-86-b'
  },
  theme_87: {
    primary: 'color-webgl-visualizer-87-p',
    secondary: 'color-webgl-visualizer-87-s',
    accent: 'color-webgl-visualizer-87-a',
    border: 'border-webgl-visualizer-87-b'
  },
  theme_88: {
    primary: 'color-webgl-visualizer-88-p',
    secondary: 'color-webgl-visualizer-88-s',
    accent: 'color-webgl-visualizer-88-a',
    border: 'border-webgl-visualizer-88-b'
  },
  theme_89: {
    primary: 'color-webgl-visualizer-89-p',
    secondary: 'color-webgl-visualizer-89-s',
    accent: 'color-webgl-visualizer-89-a',
    border: 'border-webgl-visualizer-89-b'
  },
  theme_90: {
    primary: 'color-webgl-visualizer-90-p',
    secondary: 'color-webgl-visualizer-90-s',
    accent: 'color-webgl-visualizer-90-a',
    border: 'border-webgl-visualizer-90-b'
  },
  theme_91: {
    primary: 'color-webgl-visualizer-91-p',
    secondary: 'color-webgl-visualizer-91-s',
    accent: 'color-webgl-visualizer-91-a',
    border: 'border-webgl-visualizer-91-b'
  },
  theme_92: {
    primary: 'color-webgl-visualizer-92-p',
    secondary: 'color-webgl-visualizer-92-s',
    accent: 'color-webgl-visualizer-92-a',
    border: 'border-webgl-visualizer-92-b'
  },
  theme_93: {
    primary: 'color-webgl-visualizer-93-p',
    secondary: 'color-webgl-visualizer-93-s',
    accent: 'color-webgl-visualizer-93-a',
    border: 'border-webgl-visualizer-93-b'
  },
  theme_94: {
    primary: 'color-webgl-visualizer-94-p',
    secondary: 'color-webgl-visualizer-94-s',
    accent: 'color-webgl-visualizer-94-a',
    border: 'border-webgl-visualizer-94-b'
  },
  theme_95: {
    primary: 'color-webgl-visualizer-95-p',
    secondary: 'color-webgl-visualizer-95-s',
    accent: 'color-webgl-visualizer-95-a',
    border: 'border-webgl-visualizer-95-b'
  },
  theme_96: {
    primary: 'color-webgl-visualizer-96-p',
    secondary: 'color-webgl-visualizer-96-s',
    accent: 'color-webgl-visualizer-96-a',
    border: 'border-webgl-visualizer-96-b'
  },
  theme_97: {
    primary: 'color-webgl-visualizer-97-p',
    secondary: 'color-webgl-visualizer-97-s',
    accent: 'color-webgl-visualizer-97-a',
    border: 'border-webgl-visualizer-97-b'
  },
  theme_98: {
    primary: 'color-webgl-visualizer-98-p',
    secondary: 'color-webgl-visualizer-98-s',
    accent: 'color-webgl-visualizer-98-a',
    border: 'border-webgl-visualizer-98-b'
  },
  theme_99: {
    primary: 'color-webgl-visualizer-99-p',
    secondary: 'color-webgl-visualizer-99-s',
    accent: 'color-webgl-visualizer-99-a',
    border: 'border-webgl-visualizer-99-b'
  },
  theme_100: {
    primary: 'color-webgl-visualizer-100-p',
    secondary: 'color-webgl-visualizer-100-s',
    accent: 'color-webgl-visualizer-100-a',
    border: 'border-webgl-visualizer-100-b'
  },
  theme_101: {
    primary: 'color-webgl-visualizer-101-p',
    secondary: 'color-webgl-visualizer-101-s',
    accent: 'color-webgl-visualizer-101-a',
    border: 'border-webgl-visualizer-101-b'
  },
  theme_102: {
    primary: 'color-webgl-visualizer-102-p',
    secondary: 'color-webgl-visualizer-102-s',
    accent: 'color-webgl-visualizer-102-a',
    border: 'border-webgl-visualizer-102-b'
  },
  theme_103: {
    primary: 'color-webgl-visualizer-103-p',
    secondary: 'color-webgl-visualizer-103-s',
    accent: 'color-webgl-visualizer-103-a',
    border: 'border-webgl-visualizer-103-b'
  },
  theme_104: {
    primary: 'color-webgl-visualizer-104-p',
    secondary: 'color-webgl-visualizer-104-s',
    accent: 'color-webgl-visualizer-104-a',
    border: 'border-webgl-visualizer-104-b'
  },
  theme_105: {
    primary: 'color-webgl-visualizer-105-p',
    secondary: 'color-webgl-visualizer-105-s',
    accent: 'color-webgl-visualizer-105-a',
    border: 'border-webgl-visualizer-105-b'
  },
  theme_106: {
    primary: 'color-webgl-visualizer-106-p',
    secondary: 'color-webgl-visualizer-106-s',
    accent: 'color-webgl-visualizer-106-a',
    border: 'border-webgl-visualizer-106-b'
  },
  theme_107: {
    primary: 'color-webgl-visualizer-107-p',
    secondary: 'color-webgl-visualizer-107-s',
    accent: 'color-webgl-visualizer-107-a',
    border: 'border-webgl-visualizer-107-b'
  },
  theme_108: {
    primary: 'color-webgl-visualizer-108-p',
    secondary: 'color-webgl-visualizer-108-s',
    accent: 'color-webgl-visualizer-108-a',
    border: 'border-webgl-visualizer-108-b'
  },
  theme_109: {
    primary: 'color-webgl-visualizer-109-p',
    secondary: 'color-webgl-visualizer-109-s',
    accent: 'color-webgl-visualizer-109-a',
    border: 'border-webgl-visualizer-109-b'
  },
  theme_110: {
    primary: 'color-webgl-visualizer-110-p',
    secondary: 'color-webgl-visualizer-110-s',
    accent: 'color-webgl-visualizer-110-a',
    border: 'border-webgl-visualizer-110-b'
  },
  theme_111: {
    primary: 'color-webgl-visualizer-111-p',
    secondary: 'color-webgl-visualizer-111-s',
    accent: 'color-webgl-visualizer-111-a',
    border: 'border-webgl-visualizer-111-b'
  },
  theme_112: {
    primary: 'color-webgl-visualizer-112-p',
    secondary: 'color-webgl-visualizer-112-s',
    accent: 'color-webgl-visualizer-112-a',
    border: 'border-webgl-visualizer-112-b'
  },
  theme_113: {
    primary: 'color-webgl-visualizer-113-p',
    secondary: 'color-webgl-visualizer-113-s',
    accent: 'color-webgl-visualizer-113-a',
    border: 'border-webgl-visualizer-113-b'
  },
  theme_114: {
    primary: 'color-webgl-visualizer-114-p',
    secondary: 'color-webgl-visualizer-114-s',
    accent: 'color-webgl-visualizer-114-a',
    border: 'border-webgl-visualizer-114-b'
  },
  theme_115: {
    primary: 'color-webgl-visualizer-115-p',
    secondary: 'color-webgl-visualizer-115-s',
    accent: 'color-webgl-visualizer-115-a',
    border: 'border-webgl-visualizer-115-b'
  },
  theme_116: {
    primary: 'color-webgl-visualizer-116-p',
    secondary: 'color-webgl-visualizer-116-s',
    accent: 'color-webgl-visualizer-116-a',
    border: 'border-webgl-visualizer-116-b'
  },
  theme_117: {
    primary: 'color-webgl-visualizer-117-p',
    secondary: 'color-webgl-visualizer-117-s',
    accent: 'color-webgl-visualizer-117-a',
    border: 'border-webgl-visualizer-117-b'
  },
  theme_118: {
    primary: 'color-webgl-visualizer-118-p',
    secondary: 'color-webgl-visualizer-118-s',
    accent: 'color-webgl-visualizer-118-a',
    border: 'border-webgl-visualizer-118-b'
  },
  theme_119: {
    primary: 'color-webgl-visualizer-119-p',
    secondary: 'color-webgl-visualizer-119-s',
    accent: 'color-webgl-visualizer-119-a',
    border: 'border-webgl-visualizer-119-b'
  },
  theme_120: {
    primary: 'color-webgl-visualizer-120-p',
    secondary: 'color-webgl-visualizer-120-s',
    accent: 'color-webgl-visualizer-120-a',
    border: 'border-webgl-visualizer-120-b'
  },
  theme_121: {
    primary: 'color-webgl-visualizer-121-p',
    secondary: 'color-webgl-visualizer-121-s',
    accent: 'color-webgl-visualizer-121-a',
    border: 'border-webgl-visualizer-121-b'
  },
  theme_122: {
    primary: 'color-webgl-visualizer-122-p',
    secondary: 'color-webgl-visualizer-122-s',
    accent: 'color-webgl-visualizer-122-a',
    border: 'border-webgl-visualizer-122-b'
  },
  theme_123: {
    primary: 'color-webgl-visualizer-123-p',
    secondary: 'color-webgl-visualizer-123-s',
    accent: 'color-webgl-visualizer-123-a',
    border: 'border-webgl-visualizer-123-b'
  },
  theme_124: {
    primary: 'color-webgl-visualizer-124-p',
    secondary: 'color-webgl-visualizer-124-s',
    accent: 'color-webgl-visualizer-124-a',
    border: 'border-webgl-visualizer-124-b'
  },
  theme_125: {
    primary: 'color-webgl-visualizer-125-p',
    secondary: 'color-webgl-visualizer-125-s',
    accent: 'color-webgl-visualizer-125-a',
    border: 'border-webgl-visualizer-125-b'
  },
  theme_126: {
    primary: 'color-webgl-visualizer-126-p',
    secondary: 'color-webgl-visualizer-126-s',
    accent: 'color-webgl-visualizer-126-a',
    border: 'border-webgl-visualizer-126-b'
  },
  theme_127: {
    primary: 'color-webgl-visualizer-127-p',
    secondary: 'color-webgl-visualizer-127-s',
    accent: 'color-webgl-visualizer-127-a',
    border: 'border-webgl-visualizer-127-b'
  },
  theme_128: {
    primary: 'color-webgl-visualizer-128-p',
    secondary: 'color-webgl-visualizer-128-s',
    accent: 'color-webgl-visualizer-128-a',
    border: 'border-webgl-visualizer-128-b'
  },
  theme_129: {
    primary: 'color-webgl-visualizer-129-p',
    secondary: 'color-webgl-visualizer-129-s',
    accent: 'color-webgl-visualizer-129-a',
    border: 'border-webgl-visualizer-129-b'
  },
  theme_130: {
    primary: 'color-webgl-visualizer-130-p',
    secondary: 'color-webgl-visualizer-130-s',
    accent: 'color-webgl-visualizer-130-a',
    border: 'border-webgl-visualizer-130-b'
  },
  theme_131: {
    primary: 'color-webgl-visualizer-131-p',
    secondary: 'color-webgl-visualizer-131-s',
    accent: 'color-webgl-visualizer-131-a',
    border: 'border-webgl-visualizer-131-b'
  },
  theme_132: {
    primary: 'color-webgl-visualizer-132-p',
    secondary: 'color-webgl-visualizer-132-s',
    accent: 'color-webgl-visualizer-132-a',
    border: 'border-webgl-visualizer-132-b'
  },
};

export default function WebGLVisualizerPage() {
  const [selectedSnippet, setSelectedSnippet] = useState(SNIPPETS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState([50]);
  
  const activeStepData = selectedSnippet.steps[currentStep] || selectedSnippet.steps[0];

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [selectedSnippet]);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStep + 1 >= selectedSnippet.steps.length) {
          setIsPlaying(false);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }, (100 - speed[0]) * 30 + 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, currentStep, selectedSnippet]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Cpu className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Code Execution Stack Visualizer</h1>
          <p className="text-muted-foreground">Step through execution engines, observing call stacks, memory heap states, and event loop microtasks.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Code Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SNIPPETS.map((snip) => (
                <button
                  key={snip.id}
                  onClick={() => setSelectedSnippet(snip)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                    selectedSnippet.id === snip.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                      : "border-border hover:border-slate-400"
                  }`}
                >
                  <div className="font-semibold text-foreground">{snip.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{snip.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>{selectedSnippet.name}</span>
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(0);
                      setIsPlaying(false);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={currentStep + 1 >= selectedSnippet.steps.length}
                    onClick={() => setCurrentStep(prev => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{selectedSnippet.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                    <Terminal className="w-4 h-4 text-purple-500" />
                    Source Code Reference
                  </h3>
                  <Badge variant="outline" className="font-mono text-[10px]">Active Frame</Badge>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed border border-slate-900 min-h-[180px]">
                  <code>{selectedSnippet.code}</code>
                </pre>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Visualization Speed</label>
                  <Slider value={speed} onValueChange={setSpeed} min={10} max={100} step={5} className="py-1" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Call Stack
                  </h3>
                  <div className="flex flex-col-reverse gap-2 border border-border/50 rounded-xl p-3 min-h-[140px] bg-muted/20">
                    {activeStepData.stack.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center my-auto">Stack Frame Empty (Idle)</p>
                    )}
                    {activeStepData.stack.map((frame, idx) => (
                      <div
                        key={idx}
                        className="bg-indigo-600 text-white font-mono text-xs p-2 rounded border border-indigo-700 text-center animate-fade-in"
                      >
                        {frame}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-yellow-500" />
                      Heap Store
                    </h4>
                    <div className="border border-border/50 rounded-xl p-3 min-h-[100px] bg-muted/20 text-xs font-mono">
                      {Object.keys(activeStepData.heap).length === 0 ? (
                        <span className="text-muted-foreground">No variables allocated</span>
                      ) : (
                        Object.entries(activeStepData.heap).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b pb-1 mb-1 border-border/20 last:border-0">
                            <span className="text-yellow-600">{k}:</span>
                            <span className="font-semibold text-foreground">{JSON.stringify(v)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                      <List className="w-3.5 h-3.5 text-red-500" />
                      Task Queue
                    </h4>
                    <div className="border border-border/50 rounded-xl p-3 min-h-[100px] bg-muted/20 text-xs font-mono">
                      {activeStepData.queue.length === 0 ? (
                        <span className="text-muted-foreground">No callbacks queued</span>
                      ) : (
                        activeStepData.queue.map((task, idx) => (
                          <div key={idx} className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-1.5 rounded border border-red-200 dark:border-red-900 mb-1 text-center">
                            {task}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
