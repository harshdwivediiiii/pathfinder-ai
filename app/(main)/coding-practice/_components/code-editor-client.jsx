"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { executeJavaScript, executePython } from "./execution-engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Sample Problem Data
const PROBLEM = {
  title: "Two Sum",
  description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
  examples: [
    { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
    { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] },
  ],
  hiddenTestCases: [
    { input: { nums: [3, 3], target: 6 }, expected: [0, 1] },
    { input: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
    { input: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
  ]
};

const DEFAULT_CODE = {
  javascript: "/**\n * @param {Object} input\n * @param {number[]} input.nums\n * @param {number} input.target\n * @return {number[]}\n */\nfunction solution(input) {\n  const { nums, target } = input;\n  // Write your solution here\n  \n}",
  python: "def solution(input):\n    nums = input['nums']\n    target = input['target']\n    # Write your solution here\n    return []"
};

export default function CodeEditorClient() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const handleLanguageChange = (val) => {
    setLanguage(val);
    setCode(DEFAULT_CODE[val]);
    setResults(null);
  };

  const runCode = async () => {
    setIsRunning(true);
    setResults(null);
    
    let passedCount = 0;
    const testResults = [];

    // Run against hidden test cases
    for (let i = 0; i < PROBLEM.hiddenTestCases.length; i++) {
      const testCase = PROBLEM.hiddenTestCases[i];
      let res;
      
      if (language === "javascript") {
        res = await executeJavaScript(code, testCase);
      } else {
        res = await executePython(code, testCase);
      }

      if (!res.success) {
        testResults.push({
          id: i + 1,
          passed: false,
          error: res.error,
          logs: res.logs
        });
        continue;
      }

      // Check result loosely via stringify for simplicity
      const isCorrect = JSON.stringify(res.result) === JSON.stringify(testCase.expected);
      if (isCorrect) passedCount++;
      
      testResults.push({
        id: i + 1,
        passed: isCorrect,
        expected: testCase.expected,
        actual: res.result,
        logs: res.logs
      });
    }

    setResults({
      passed: passedCount,
      total: PROBLEM.hiddenTestCases.length,
      details: testResults
    });
    
    setIsRunning(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row gap-4 p-4">
      {/* Problem Description */}
      <Card className="w-full md:w-1/3 flex flex-col">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>{PROBLEM.title}</CardTitle>
          <CardDescription>Algorithms & Data Structures</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm">{PROBLEM.description}</p>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Examples:</h4>
            {PROBLEM.examples.map((ex, i) => (
              <div key={i} className="bg-muted p-3 rounded-md text-xs font-mono space-y-1">
                <div><span className="text-muted-foreground">Input:</span> {JSON.stringify(ex.input)}</div>
                <div><span className="text-muted-foreground">Output:</span> {JSON.stringify(ex.output)}</div>
              </div>
            ))}
          </div>

          {results && (
            <div className="mt-8 border-t pt-4">
              <h4 className="font-semibold text-sm mb-4">Test Results</h4>
              <Badge variant={results.passed === results.total ? "default" : "destructive"} className="mb-4">
                {results.passed} / {results.total} Passed
              </Badge>
              <div className="space-y-3">
                {results.details.map((r, i) => (
                  <div key={i} className="border rounded-md p-3 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      {r.passed ? <CheckCircle2 className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-red-500"/>}
                      <span className="font-semibold">Test Case {r.id}</span>
                    </div>
                    {!r.passed && !r.error && (
                      <div className="space-y-1 mt-2 text-muted-foreground font-mono">
                        <div>Expected: {JSON.stringify(r.expected)}</div>
                        <div>Actual: {JSON.stringify(r.actual)}</div>
                      </div>
                    )}
                    {r.error && (
                      <div className="text-red-500 mt-2 whitespace-pre-wrap font-mono break-words">{r.error}</div>
                    )}
                    {r.logs?.length > 0 && (
                      <div className="mt-2 text-muted-foreground">
                        <span className="font-semibold">Stdout:</span>
                        <div className="bg-muted p-2 rounded-sm mt-1 whitespace-pre-wrap font-mono">
                          {r.logs.map((log, idx) => <div key={idx}>{log}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Editor */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b bg-muted/20 py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript (Node.js)</SelectItem>
              <SelectItem value="python">Python (Pyodide WASM)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={runCode} disabled={isRunning} size="sm">
            {isRunning ? (
              <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</span>
            ) : (
              <span className="flex items-center"><Play className="mr-2 h-4 w-4" /> Run Code</span>
            )}
          </Button>
        </CardHeader>
        <div className="flex-1 overflow-y-auto">
          <CodeMirror
            value={code}
            height="100%"
            extensions={[language === "javascript" ? javascript({ jsx: true }) : python()]}
            onChange={(value) => setCode(value)}
            theme="dark"
            className="h-full text-sm font-mono"
          />
        </div>
      </Card>
    </div>
  );
}
