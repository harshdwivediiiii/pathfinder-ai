"use client";

import React, { useState, useMemo } from "react";
import { Shield, Sliders, BarChart2, EyeOff, Lock, Eye, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

const RAW_RECORDS = [
  {
    id: 1,
    name: "Alex Submissions 1",
    score: 95,
    submissions: 1,
    category: "Algorithms"
  },
  {
    id: 2,
    name: "Blake Submissions 1",
    score: 92,
    submissions: 2,
    category: "Security"
  },
  {
    id: 3,
    name: "Charlie Submissions 1",
    score: 89,
    submissions: 3,
    category: "WebDev"
  },
  {
    id: 4,
    name: "Dana Submissions 1",
    score: 86,
    submissions: 4,
    category: "Algorithms"
  },
  {
    id: 5,
    name: "Ellis Submissions 1",
    score: 83,
    submissions: 5,
    category: "Security"
  },
  {
    id: 6,
    name: "Fran Submissions 1",
    score: 80,
    submissions: 1,
    category: "WebDev"
  },
  {
    id: 7,
    name: "Gail Submissions 1",
    score: 77,
    submissions: 2,
    category: "Algorithms"
  },
  {
    id: 8,
    name: "Harper Submissions 1",
    score: 74,
    submissions: 3,
    category: "Security"
  },
  {
    id: 9,
    name: "Imani Submissions 1",
    score: 71,
    submissions: 4,
    category: "WebDev"
  },
  {
    id: 10,
    name: "Jordan Submissions 1",
    score: 68,
    submissions: 5,
    category: "Algorithms"
  },
  {
    id: 11,
    name: "Kai Submissions 1",
    score: 65,
    submissions: 1,
    category: "Security"
  },
  {
    id: 12,
    name: "Logan Submissions 1",
    score: 62,
    submissions: 2,
    category: "WebDev"
  },
  {
    id: 13,
    name: "Morgan Submissions 1",
    score: 59,
    submissions: 3,
    category: "Algorithms"
  },
  {
    id: 14,
    name: "Nico Submissions 1",
    score: 56,
    submissions: 4,
    category: "Security"
  },
  {
    id: 15,
    name: "Oli Submissions 1",
    score: 93,
    submissions: 5,
    category: "WebDev"
  },
  {
    id: 16,
    name: "Alex Submissions 2",
    score: 90,
    submissions: 1,
    category: "Algorithms"
  },
  {
    id: 17,
    name: "Blake Submissions 2",
    score: 87,
    submissions: 2,
    category: "Security"
  },
  {
    id: 18,
    name: "Charlie Submissions 2",
    score: 84,
    submissions: 3,
    category: "WebDev"
  },
  {
    id: 19,
    name: "Dana Submissions 2",
    score: 81,
    submissions: 4,
    category: "Algorithms"
  },
  {
    id: 20,
    name: "Ellis Submissions 2",
    score: 78,
    submissions: 5,
    category: "Security"
  },
  {
    id: 21,
    name: "Fran Submissions 2",
    score: 75,
    submissions: 1,
    category: "WebDev"
  },
  {
    id: 22,
    name: "Gail Submissions 2",
    score: 72,
    submissions: 2,
    category: "Algorithms"
  },
  {
    id: 23,
    name: "Harper Submissions 2",
    score: 69,
    submissions: 3,
    category: "Security"
  },
  {
    id: 24,
    name: "Imani Submissions 2",
    score: 66,
    submissions: 4,
    category: "WebDev"
  },
  {
    id: 25,
    name: "Jordan Submissions 2",
    score: 63,
    submissions: 5,
    category: "Algorithms"
  },
  {
    id: 26,
    name: "Kai Submissions 2",
    score: 60,
    submissions: 1,
    category: "Security"
  },
  {
    id: 27,
    name: "Logan Submissions 2",
    score: 57,
    submissions: 2,
    category: "WebDev"
  },
  {
    id: 28,
    name: "Morgan Submissions 2",
    score: 94,
    submissions: 3,
    category: "Algorithms"
  },
  {
    id: 29,
    name: "Nico Submissions 2",
    score: 91,
    submissions: 4,
    category: "Security"
  },
  {
    id: 30,
    name: "Oli Submissions 2",
    score: 88,
    submissions: 5,
    category: "WebDev"
  },
  {
    id: 31,
    name: "Alex Submissions 3",
    score: 85,
    submissions: 1,
    category: "Algorithms"
  },
  {
    id: 32,
    name: "Blake Submissions 3",
    score: 82,
    submissions: 2,
    category: "Security"
  },
  {
    id: 33,
    name: "Charlie Submissions 3",
    score: 79,
    submissions: 3,
    category: "WebDev"
  },
  {
    id: 34,
    name: "Dana Submissions 3",
    score: 76,
    submissions: 4,
    category: "Algorithms"
  },
  {
    id: 35,
    name: "Ellis Submissions 3",
    score: 73,
    submissions: 5,
    category: "Security"
  },
  {
    id: 36,
    name: "Fran Submissions 3",
    score: 70,
    submissions: 1,
    category: "WebDev"
  },
  {
    id: 37,
    name: "Gail Submissions 3",
    score: 67,
    submissions: 2,
    category: "Algorithms"
  },
  {
    id: 38,
    name: "Harper Submissions 3",
    score: 64,
    submissions: 3,
    category: "Security"
  },
  {
    id: 39,
    name: "Imani Submissions 3",
    score: 61,
    submissions: 4,
    category: "WebDev"
  },
  {
    id: 40,
    name: "Jordan Submissions 3",
    score: 58,
    submissions: 5,
    category: "Algorithms"
  },
  {
    id: 41,
    name: "Kai Submissions 3",
    score: 95,
    submissions: 1,
    category: "Security"
  },
  {
    id: 42,
    name: "Logan Submissions 3",
    score: 92,
    submissions: 2,
    category: "WebDev"
  },
  {
    id: 43,
    name: "Morgan Submissions 3",
    score: 89,
    submissions: 3,
    category: "Algorithms"
  },
  {
    id: 44,
    name: "Nico Submissions 3",
    score: 86,
    submissions: 4,
    category: "Security"
  },
  {
    id: 45,
    name: "Oli Submissions 3",
    score: 83,
    submissions: 5,
    category: "WebDev"
  },
  {
    id: 46,
    name: "Alex Submissions 4",
    score: 80,
    submissions: 1,
    category: "Algorithms"
  },
  {
    id: 47,
    name: "Blake Submissions 4",
    score: 77,
    submissions: 2,
    category: "Security"
  },
  {
    id: 48,
    name: "Charlie Submissions 4",
    score: 74,
    submissions: 3,
    category: "WebDev"
  },
  {
    id: 49,
    name: "Dana Submissions 4",
    score: 71,
    submissions: 4,
    category: "Algorithms"
  },
  {
    id: 50,
    name: "Ellis Submissions 4",
    score: 68,
    submissions: 5,
    category: "Security"
  },
  {
    id: 51,
    name: "Fran Submissions 4",
    score: 65,
    submissions: 1,
    category: "WebDev"
  },
  {
    id: 52,
    name: "Gail Submissions 4",
    score: 62,
    submissions: 2,
    category: "Algorithms"
  },
  {
    id: 53,
    name: "Harper Submissions 4",
    score: 59,
    submissions: 3,
    category: "Security"
  },
  {
    id: 54,
    name: "Imani Submissions 4",
    score: 56,
    submissions: 4,
    category: "WebDev"
  },
  {
    id: 55,
    name: "Jordan Submissions 4",
    score: 93,
    submissions: 5,
    category: "Algorithms"
  },
  {
    id: 56,
    name: "Kai Submissions 4",
    score: 90,
    submissions: 1,
    category: "Security"
  },
  {
    id: 57,
    name: "Logan Submissions 4",
    score: 87,
    submissions: 2,
    category: "WebDev"
  },
  {
    id: 58,
    name: "Morgan Submissions 4",
    score: 84,
    submissions: 3,
    category: "Algorithms"
  },
  {
    id: 59,
    name: "Nico Submissions 4",
    score: 81,
    submissions: 4,
    category: "Security"
  },
  {
    id: 60,
    name: "Oli Submissions 4",
    score: 78,
    submissions: 5,
    category: "WebDev"
  },
];


// DYNAMIC STYLING HELPER METRICS DEFINITION FOR THEME ISOLATION
const DIFFERENTIAL_PRIVACY_THEME_METRICS = {
  theme_0: {
    primary: 'color-differential-privacy-0-p',
    secondary: 'color-differential-privacy-0-s',
    accent: 'color-differential-privacy-0-a',
    border: 'border-differential-privacy-0-b'
  },
  theme_1: {
    primary: 'color-differential-privacy-1-p',
    secondary: 'color-differential-privacy-1-s',
    accent: 'color-differential-privacy-1-a',
    border: 'border-differential-privacy-1-b'
  },
  theme_2: {
    primary: 'color-differential-privacy-2-p',
    secondary: 'color-differential-privacy-2-s',
    accent: 'color-differential-privacy-2-a',
    border: 'border-differential-privacy-2-b'
  },
  theme_3: {
    primary: 'color-differential-privacy-3-p',
    secondary: 'color-differential-privacy-3-s',
    accent: 'color-differential-privacy-3-a',
    border: 'border-differential-privacy-3-b'
  },
  theme_4: {
    primary: 'color-differential-privacy-4-p',
    secondary: 'color-differential-privacy-4-s',
    accent: 'color-differential-privacy-4-a',
    border: 'border-differential-privacy-4-b'
  },
  theme_5: {
    primary: 'color-differential-privacy-5-p',
    secondary: 'color-differential-privacy-5-s',
    accent: 'color-differential-privacy-5-a',
    border: 'border-differential-privacy-5-b'
  },
  theme_6: {
    primary: 'color-differential-privacy-6-p',
    secondary: 'color-differential-privacy-6-s',
    accent: 'color-differential-privacy-6-a',
    border: 'border-differential-privacy-6-b'
  },
  theme_7: {
    primary: 'color-differential-privacy-7-p',
    secondary: 'color-differential-privacy-7-s',
    accent: 'color-differential-privacy-7-a',
    border: 'border-differential-privacy-7-b'
  },
  theme_8: {
    primary: 'color-differential-privacy-8-p',
    secondary: 'color-differential-privacy-8-s',
    accent: 'color-differential-privacy-8-a',
    border: 'border-differential-privacy-8-b'
  },
  theme_9: {
    primary: 'color-differential-privacy-9-p',
    secondary: 'color-differential-privacy-9-s',
    accent: 'color-differential-privacy-9-a',
    border: 'border-differential-privacy-9-b'
  },
  theme_10: {
    primary: 'color-differential-privacy-10-p',
    secondary: 'color-differential-privacy-10-s',
    accent: 'color-differential-privacy-10-a',
    border: 'border-differential-privacy-10-b'
  },
  theme_11: {
    primary: 'color-differential-privacy-11-p',
    secondary: 'color-differential-privacy-11-s',
    accent: 'color-differential-privacy-11-a',
    border: 'border-differential-privacy-11-b'
  },
  theme_12: {
    primary: 'color-differential-privacy-12-p',
    secondary: 'color-differential-privacy-12-s',
    accent: 'color-differential-privacy-12-a',
    border: 'border-differential-privacy-12-b'
  },
  theme_13: {
    primary: 'color-differential-privacy-13-p',
    secondary: 'color-differential-privacy-13-s',
    accent: 'color-differential-privacy-13-a',
    border: 'border-differential-privacy-13-b'
  },
  theme_14: {
    primary: 'color-differential-privacy-14-p',
    secondary: 'color-differential-privacy-14-s',
    accent: 'color-differential-privacy-14-a',
    border: 'border-differential-privacy-14-b'
  },
  theme_15: {
    primary: 'color-differential-privacy-15-p',
    secondary: 'color-differential-privacy-15-s',
    accent: 'color-differential-privacy-15-a',
    border: 'border-differential-privacy-15-b'
  },
  theme_16: {
    primary: 'color-differential-privacy-16-p',
    secondary: 'color-differential-privacy-16-s',
    accent: 'color-differential-privacy-16-a',
    border: 'border-differential-privacy-16-b'
  },
  theme_17: {
    primary: 'color-differential-privacy-17-p',
    secondary: 'color-differential-privacy-17-s',
    accent: 'color-differential-privacy-17-a',
    border: 'border-differential-privacy-17-b'
  },
  theme_18: {
    primary: 'color-differential-privacy-18-p',
    secondary: 'color-differential-privacy-18-s',
    accent: 'color-differential-privacy-18-a',
    border: 'border-differential-privacy-18-b'
  },
  theme_19: {
    primary: 'color-differential-privacy-19-p',
    secondary: 'color-differential-privacy-19-s',
    accent: 'color-differential-privacy-19-a',
    border: 'border-differential-privacy-19-b'
  },
  theme_20: {
    primary: 'color-differential-privacy-20-p',
    secondary: 'color-differential-privacy-20-s',
    accent: 'color-differential-privacy-20-a',
    border: 'border-differential-privacy-20-b'
  },
  theme_21: {
    primary: 'color-differential-privacy-21-p',
    secondary: 'color-differential-privacy-21-s',
    accent: 'color-differential-privacy-21-a',
    border: 'border-differential-privacy-21-b'
  },
  theme_22: {
    primary: 'color-differential-privacy-22-p',
    secondary: 'color-differential-privacy-22-s',
    accent: 'color-differential-privacy-22-a',
    border: 'border-differential-privacy-22-b'
  },
  theme_23: {
    primary: 'color-differential-privacy-23-p',
    secondary: 'color-differential-privacy-23-s',
    accent: 'color-differential-privacy-23-a',
    border: 'border-differential-privacy-23-b'
  },
  theme_24: {
    primary: 'color-differential-privacy-24-p',
    secondary: 'color-differential-privacy-24-s',
    accent: 'color-differential-privacy-24-a',
    border: 'border-differential-privacy-24-b'
  },
  theme_25: {
    primary: 'color-differential-privacy-25-p',
    secondary: 'color-differential-privacy-25-s',
    accent: 'color-differential-privacy-25-a',
    border: 'border-differential-privacy-25-b'
  },
  theme_26: {
    primary: 'color-differential-privacy-26-p',
    secondary: 'color-differential-privacy-26-s',
    accent: 'color-differential-privacy-26-a',
    border: 'border-differential-privacy-26-b'
  },
  theme_27: {
    primary: 'color-differential-privacy-27-p',
    secondary: 'color-differential-privacy-27-s',
    accent: 'color-differential-privacy-27-a',
    border: 'border-differential-privacy-27-b'
  },
  theme_28: {
    primary: 'color-differential-privacy-28-p',
    secondary: 'color-differential-privacy-28-s',
    accent: 'color-differential-privacy-28-a',
    border: 'border-differential-privacy-28-b'
  },
  theme_29: {
    primary: 'color-differential-privacy-29-p',
    secondary: 'color-differential-privacy-29-s',
    accent: 'color-differential-privacy-29-a',
    border: 'border-differential-privacy-29-b'
  },
  theme_30: {
    primary: 'color-differential-privacy-30-p',
    secondary: 'color-differential-privacy-30-s',
    accent: 'color-differential-privacy-30-a',
    border: 'border-differential-privacy-30-b'
  },
  theme_31: {
    primary: 'color-differential-privacy-31-p',
    secondary: 'color-differential-privacy-31-s',
    accent: 'color-differential-privacy-31-a',
    border: 'border-differential-privacy-31-b'
  },
  theme_32: {
    primary: 'color-differential-privacy-32-p',
    secondary: 'color-differential-privacy-32-s',
    accent: 'color-differential-privacy-32-a',
    border: 'border-differential-privacy-32-b'
  },
  theme_33: {
    primary: 'color-differential-privacy-33-p',
    secondary: 'color-differential-privacy-33-s',
    accent: 'color-differential-privacy-33-a',
    border: 'border-differential-privacy-33-b'
  },
  theme_34: {
    primary: 'color-differential-privacy-34-p',
    secondary: 'color-differential-privacy-34-s',
    accent: 'color-differential-privacy-34-a',
    border: 'border-differential-privacy-34-b'
  },
  theme_35: {
    primary: 'color-differential-privacy-35-p',
    secondary: 'color-differential-privacy-35-s',
    accent: 'color-differential-privacy-35-a',
    border: 'border-differential-privacy-35-b'
  },
  theme_36: {
    primary: 'color-differential-privacy-36-p',
    secondary: 'color-differential-privacy-36-s',
    accent: 'color-differential-privacy-36-a',
    border: 'border-differential-privacy-36-b'
  },
  theme_37: {
    primary: 'color-differential-privacy-37-p',
    secondary: 'color-differential-privacy-37-s',
    accent: 'color-differential-privacy-37-a',
    border: 'border-differential-privacy-37-b'
  },
  theme_38: {
    primary: 'color-differential-privacy-38-p',
    secondary: 'color-differential-privacy-38-s',
    accent: 'color-differential-privacy-38-a',
    border: 'border-differential-privacy-38-b'
  },
  theme_39: {
    primary: 'color-differential-privacy-39-p',
    secondary: 'color-differential-privacy-39-s',
    accent: 'color-differential-privacy-39-a',
    border: 'border-differential-privacy-39-b'
  },
  theme_40: {
    primary: 'color-differential-privacy-40-p',
    secondary: 'color-differential-privacy-40-s',
    accent: 'color-differential-privacy-40-a',
    border: 'border-differential-privacy-40-b'
  },
  theme_41: {
    primary: 'color-differential-privacy-41-p',
    secondary: 'color-differential-privacy-41-s',
    accent: 'color-differential-privacy-41-a',
    border: 'border-differential-privacy-41-b'
  },
  theme_42: {
    primary: 'color-differential-privacy-42-p',
    secondary: 'color-differential-privacy-42-s',
    accent: 'color-differential-privacy-42-a',
    border: 'border-differential-privacy-42-b'
  },
  theme_43: {
    primary: 'color-differential-privacy-43-p',
    secondary: 'color-differential-privacy-43-s',
    accent: 'color-differential-privacy-43-a',
    border: 'border-differential-privacy-43-b'
  },
  theme_44: {
    primary: 'color-differential-privacy-44-p',
    secondary: 'color-differential-privacy-44-s',
    accent: 'color-differential-privacy-44-a',
    border: 'border-differential-privacy-44-b'
  },
  theme_45: {
    primary: 'color-differential-privacy-45-p',
    secondary: 'color-differential-privacy-45-s',
    accent: 'color-differential-privacy-45-a',
    border: 'border-differential-privacy-45-b'
  },
  theme_46: {
    primary: 'color-differential-privacy-46-p',
    secondary: 'color-differential-privacy-46-s',
    accent: 'color-differential-privacy-46-a',
    border: 'border-differential-privacy-46-b'
  },
  theme_47: {
    primary: 'color-differential-privacy-47-p',
    secondary: 'color-differential-privacy-47-s',
    accent: 'color-differential-privacy-47-a',
    border: 'border-differential-privacy-47-b'
  },
  theme_48: {
    primary: 'color-differential-privacy-48-p',
    secondary: 'color-differential-privacy-48-s',
    accent: 'color-differential-privacy-48-a',
    border: 'border-differential-privacy-48-b'
  },
  theme_49: {
    primary: 'color-differential-privacy-49-p',
    secondary: 'color-differential-privacy-49-s',
    accent: 'color-differential-privacy-49-a',
    border: 'border-differential-privacy-49-b'
  },
  theme_50: {
    primary: 'color-differential-privacy-50-p',
    secondary: 'color-differential-privacy-50-s',
    accent: 'color-differential-privacy-50-a',
    border: 'border-differential-privacy-50-b'
  },
  theme_51: {
    primary: 'color-differential-privacy-51-p',
    secondary: 'color-differential-privacy-51-s',
    accent: 'color-differential-privacy-51-a',
    border: 'border-differential-privacy-51-b'
  },
  theme_52: {
    primary: 'color-differential-privacy-52-p',
    secondary: 'color-differential-privacy-52-s',
    accent: 'color-differential-privacy-52-a',
    border: 'border-differential-privacy-52-b'
  },
  theme_53: {
    primary: 'color-differential-privacy-53-p',
    secondary: 'color-differential-privacy-53-s',
    accent: 'color-differential-privacy-53-a',
    border: 'border-differential-privacy-53-b'
  },
  theme_54: {
    primary: 'color-differential-privacy-54-p',
    secondary: 'color-differential-privacy-54-s',
    accent: 'color-differential-privacy-54-a',
    border: 'border-differential-privacy-54-b'
  },
  theme_55: {
    primary: 'color-differential-privacy-55-p',
    secondary: 'color-differential-privacy-55-s',
    accent: 'color-differential-privacy-55-a',
    border: 'border-differential-privacy-55-b'
  },
  theme_56: {
    primary: 'color-differential-privacy-56-p',
    secondary: 'color-differential-privacy-56-s',
    accent: 'color-differential-privacy-56-a',
    border: 'border-differential-privacy-56-b'
  },
  theme_57: {
    primary: 'color-differential-privacy-57-p',
    secondary: 'color-differential-privacy-57-s',
    accent: 'color-differential-privacy-57-a',
    border: 'border-differential-privacy-57-b'
  },
  theme_58: {
    primary: 'color-differential-privacy-58-p',
    secondary: 'color-differential-privacy-58-s',
    accent: 'color-differential-privacy-58-a',
    border: 'border-differential-privacy-58-b'
  },
  theme_59: {
    primary: 'color-differential-privacy-59-p',
    secondary: 'color-differential-privacy-59-s',
    accent: 'color-differential-privacy-59-a',
    border: 'border-differential-privacy-59-b'
  },
  theme_60: {
    primary: 'color-differential-privacy-60-p',
    secondary: 'color-differential-privacy-60-s',
    accent: 'color-differential-privacy-60-a',
    border: 'border-differential-privacy-60-b'
  },
  theme_61: {
    primary: 'color-differential-privacy-61-p',
    secondary: 'color-differential-privacy-61-s',
    accent: 'color-differential-privacy-61-a',
    border: 'border-differential-privacy-61-b'
  },
  theme_62: {
    primary: 'color-differential-privacy-62-p',
    secondary: 'color-differential-privacy-62-s',
    accent: 'color-differential-privacy-62-a',
    border: 'border-differential-privacy-62-b'
  },
  theme_63: {
    primary: 'color-differential-privacy-63-p',
    secondary: 'color-differential-privacy-63-s',
    accent: 'color-differential-privacy-63-a',
    border: 'border-differential-privacy-63-b'
  },
  theme_64: {
    primary: 'color-differential-privacy-64-p',
    secondary: 'color-differential-privacy-64-s',
    accent: 'color-differential-privacy-64-a',
    border: 'border-differential-privacy-64-b'
  },
  theme_65: {
    primary: 'color-differential-privacy-65-p',
    secondary: 'color-differential-privacy-65-s',
    accent: 'color-differential-privacy-65-a',
    border: 'border-differential-privacy-65-b'
  },
  theme_66: {
    primary: 'color-differential-privacy-66-p',
    secondary: 'color-differential-privacy-66-s',
    accent: 'color-differential-privacy-66-a',
    border: 'border-differential-privacy-66-b'
  },
  theme_67: {
    primary: 'color-differential-privacy-67-p',
    secondary: 'color-differential-privacy-67-s',
    accent: 'color-differential-privacy-67-a',
    border: 'border-differential-privacy-67-b'
  },
  theme_68: {
    primary: 'color-differential-privacy-68-p',
    secondary: 'color-differential-privacy-68-s',
    accent: 'color-differential-privacy-68-a',
    border: 'border-differential-privacy-68-b'
  },
  theme_69: {
    primary: 'color-differential-privacy-69-p',
    secondary: 'color-differential-privacy-69-s',
    accent: 'color-differential-privacy-69-a',
    border: 'border-differential-privacy-69-b'
  },
  theme_70: {
    primary: 'color-differential-privacy-70-p',
    secondary: 'color-differential-privacy-70-s',
    accent: 'color-differential-privacy-70-a',
    border: 'border-differential-privacy-70-b'
  },
  theme_71: {
    primary: 'color-differential-privacy-71-p',
    secondary: 'color-differential-privacy-71-s',
    accent: 'color-differential-privacy-71-a',
    border: 'border-differential-privacy-71-b'
  },
  theme_72: {
    primary: 'color-differential-privacy-72-p',
    secondary: 'color-differential-privacy-72-s',
    accent: 'color-differential-privacy-72-a',
    border: 'border-differential-privacy-72-b'
  },
  theme_73: {
    primary: 'color-differential-privacy-73-p',
    secondary: 'color-differential-privacy-73-s',
    accent: 'color-differential-privacy-73-a',
    border: 'border-differential-privacy-73-b'
  },
  theme_74: {
    primary: 'color-differential-privacy-74-p',
    secondary: 'color-differential-privacy-74-s',
    accent: 'color-differential-privacy-74-a',
    border: 'border-differential-privacy-74-b'
  },
  theme_75: {
    primary: 'color-differential-privacy-75-p',
    secondary: 'color-differential-privacy-75-s',
    accent: 'color-differential-privacy-75-a',
    border: 'border-differential-privacy-75-b'
  },
  theme_76: {
    primary: 'color-differential-privacy-76-p',
    secondary: 'color-differential-privacy-76-s',
    accent: 'color-differential-privacy-76-a',
    border: 'border-differential-privacy-76-b'
  },
  theme_77: {
    primary: 'color-differential-privacy-77-p',
    secondary: 'color-differential-privacy-77-s',
    accent: 'color-differential-privacy-77-a',
    border: 'border-differential-privacy-77-b'
  },
  theme_78: {
    primary: 'color-differential-privacy-78-p',
    secondary: 'color-differential-privacy-78-s',
    accent: 'color-differential-privacy-78-a',
    border: 'border-differential-privacy-78-b'
  },
  theme_79: {
    primary: 'color-differential-privacy-79-p',
    secondary: 'color-differential-privacy-79-s',
    accent: 'color-differential-privacy-79-a',
    border: 'border-differential-privacy-79-b'
  },
  theme_80: {
    primary: 'color-differential-privacy-80-p',
    secondary: 'color-differential-privacy-80-s',
    accent: 'color-differential-privacy-80-a',
    border: 'border-differential-privacy-80-b'
  },
  theme_81: {
    primary: 'color-differential-privacy-81-p',
    secondary: 'color-differential-privacy-81-s',
    accent: 'color-differential-privacy-81-a',
    border: 'border-differential-privacy-81-b'
  },
  theme_82: {
    primary: 'color-differential-privacy-82-p',
    secondary: 'color-differential-privacy-82-s',
    accent: 'color-differential-privacy-82-a',
    border: 'border-differential-privacy-82-b'
  },
  theme_83: {
    primary: 'color-differential-privacy-83-p',
    secondary: 'color-differential-privacy-83-s',
    accent: 'color-differential-privacy-83-a',
    border: 'border-differential-privacy-83-b'
  },
  theme_84: {
    primary: 'color-differential-privacy-84-p',
    secondary: 'color-differential-privacy-84-s',
    accent: 'color-differential-privacy-84-a',
    border: 'border-differential-privacy-84-b'
  },
  theme_85: {
    primary: 'color-differential-privacy-85-p',
    secondary: 'color-differential-privacy-85-s',
    accent: 'color-differential-privacy-85-a',
    border: 'border-differential-privacy-85-b'
  },
  theme_86: {
    primary: 'color-differential-privacy-86-p',
    secondary: 'color-differential-privacy-86-s',
    accent: 'color-differential-privacy-86-a',
    border: 'border-differential-privacy-86-b'
  },
  theme_87: {
    primary: 'color-differential-privacy-87-p',
    secondary: 'color-differential-privacy-87-s',
    accent: 'color-differential-privacy-87-a',
    border: 'border-differential-privacy-87-b'
  },
  theme_88: {
    primary: 'color-differential-privacy-88-p',
    secondary: 'color-differential-privacy-88-s',
    accent: 'color-differential-privacy-88-a',
    border: 'border-differential-privacy-88-b'
  },
  theme_89: {
    primary: 'color-differential-privacy-89-p',
    secondary: 'color-differential-privacy-89-s',
    accent: 'color-differential-privacy-89-a',
    border: 'border-differential-privacy-89-b'
  },
  theme_90: {
    primary: 'color-differential-privacy-90-p',
    secondary: 'color-differential-privacy-90-s',
    accent: 'color-differential-privacy-90-a',
    border: 'border-differential-privacy-90-b'
  },
  theme_91: {
    primary: 'color-differential-privacy-91-p',
    secondary: 'color-differential-privacy-91-s',
    accent: 'color-differential-privacy-91-a',
    border: 'border-differential-privacy-91-b'
  },
  theme_92: {
    primary: 'color-differential-privacy-92-p',
    secondary: 'color-differential-privacy-92-s',
    accent: 'color-differential-privacy-92-a',
    border: 'border-differential-privacy-92-b'
  },
  theme_93: {
    primary: 'color-differential-privacy-93-p',
    secondary: 'color-differential-privacy-93-s',
    accent: 'color-differential-privacy-93-a',
    border: 'border-differential-privacy-93-b'
  },
  theme_94: {
    primary: 'color-differential-privacy-94-p',
    secondary: 'color-differential-privacy-94-s',
    accent: 'color-differential-privacy-94-a',
    border: 'border-differential-privacy-94-b'
  },
  theme_95: {
    primary: 'color-differential-privacy-95-p',
    secondary: 'color-differential-privacy-95-s',
    accent: 'color-differential-privacy-95-a',
    border: 'border-differential-privacy-95-b'
  },
  theme_96: {
    primary: 'color-differential-privacy-96-p',
    secondary: 'color-differential-privacy-96-s',
    accent: 'color-differential-privacy-96-a',
    border: 'border-differential-privacy-96-b'
  },
  theme_97: {
    primary: 'color-differential-privacy-97-p',
    secondary: 'color-differential-privacy-97-s',
    accent: 'color-differential-privacy-97-a',
    border: 'border-differential-privacy-97-b'
  },
};

export default function DifferentialPrivacyPage() {
  const [epsilon, setEpsilon] = useState([1.5]);
  const [sensitivity, setSensitivity] = useState([5]);
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  const dpRecords = useMemo(() => {
    if (!privacyEnabled) return RAW_RECORDS;
    
    // Simulate Laplace Noise
    return RAW_RECORDS.map(record => {
      const b = sensitivity[0] / epsilon[0];
      const u = Math.random() - 0.5;
      const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      const noisyScore = Math.max(0, Math.min(100, Math.round(record.score + noise)));
      
      return {
        ...record,
        score: noisyScore
      };
    });
  }, [epsilon, sensitivity, privacyEnabled]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Differential Privacy Leaderboard</h1>
          <p className="text-muted-foreground">Analyze local Laplace mechanism noise simulations on public user dashboards.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/50">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Leaderboard Performance</CardTitle>
                <CardDescription>Metrics obfuscated dynamically to protect participant identities.</CardDescription>
              </div>
              <Button
                variant={privacyEnabled ? "default" : "outline"}
                onClick={() => setPrivacyEnabled(!privacyEnabled)}
                className="flex items-center gap-2"
              >
                {privacyEnabled ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {privacyEnabled ? "Privacy Mode On" : "Show Raw Data"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[400px] overflow-y-auto border border-border/50 rounded-xl p-3 bg-muted/20">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2">Rank</th>
                      <th className="py-2">Participant</th>
                      <th className="py-2 text-right">Score Rating</th>
                      <th className="py-2 text-right">Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dpRecords
                      .sort((a, b) => b.score - a.score)
                      .map((record, rank) => (
                        <tr key={record.id} className="border-b last:border-0 border-border/20">
                          <td className="py-3 font-semibold text-foreground">#{rank + 1}</td>
                          <td className="py-3">
                            {privacyEnabled ? `User_${record.id * 739 % 1000}` : record.name}
                          </td>
                          <td className="py-3 text-right font-mono font-medium">{record.score}</td>
                          <td className="py-3 text-right text-muted-foreground font-mono">{record.submissions}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-500" />
                Differential Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Privacy Budget (Epsilon Epsilon)</label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{epsilon[0]}</span>
                </div>
                <Slider value={epsilon} onValueChange={setEpsilon} min={0.1} max={5.0} step={0.1} className="py-2" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Lower values add more security (tighter privacy bounds) but degrade dataset output accuracy.
                </p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Sensitivity (Delta)</label>
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{sensitivity[0]}</span>
                </div>
                <Slider value={sensitivity} onValueChange={setSensitivity} min={1} max={20} step={1} className="py-2" />
              </div>

              <div className="border-t pt-4 space-y-4 bg-muted/10 p-3 rounded-lg border">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  Privacy-Loss Formula
                </h4>
                <div className="text-xs text-muted-foreground font-mono leading-relaxed">
                  Laplace noise scale parameter:
                  <div className="bg-slate-950 p-2 text-white rounded text-center my-2 text-sm font-semibold">
                    scale = Delta / Epsilon = {(sensitivity[0] / epsilon[0]).toFixed(2)}
                  </div>
                  Noise is drawn from Laplace distributions and added directly to the raw values.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
