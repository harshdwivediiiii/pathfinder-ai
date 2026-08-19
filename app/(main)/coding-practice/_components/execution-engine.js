"use client";

/**
 * Safely executes JavaScript code in a Sandboxed Web Worker.
 * Handles infinite loops via a 3-second timeout.
 */
export async function executeJavaScript(code, testCase) {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = function(e) {
        let logs = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        try {
          const { input } = e.data;
          
          // Inject user code
          ${code}
          
          if (typeof solution !== 'function') {
            throw new Error("You must define a function named 'solution(input)'");
          }

          const result = solution(input);
          self.postMessage({ success: true, result, logs });
        } catch (error) {
          self.postMessage({ success: false, error: error.toString(), logs });
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    
    let timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ success: false, error: 'Execution Timed Out (Possible Infinite Loop)', logs: [] });
    }, 3000);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(e.data);
    };

    worker.onerror = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ success: false, error: e.message, logs: [] });
    };

    worker.postMessage({ input: testCase.input });
  });
}

/**
 * Safely executes Python code via Pyodide (WASM).
 * Dynamically loads the Pyodide runtime from CDN.
 */
export async function executePython(code, testCase) {
  try {
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // We only want to load it once and reuse the instance for speed
    if (!window.pyodideInstance) {
      window.pyodideInstance = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      });
    }
    
    const pyodide = window.pyodideInstance;
    
    // Clear globals and set stdout
    let logs = [];
    pyodide.setStdout({ batched: (str) => logs.push(str) });
    pyodide.setStderr({ batched: (str) => logs.push(str) });
    
    // Define the test input
    // Assuming input is a primitive or array we can JSON parse in Python
    const inputStr = JSON.stringify(testCase.input);
    pyodide.runPython(`
import json
test_input = json.loads('${inputStr}')
`);

    // Run user code
    await pyodide.runPythonAsync(code);
    
    // Execute solution
    const checkCode = `
if 'solution' not in locals():
    raise Exception("You must define a function named 'solution(input)'")
result = solution(test_input)
import json
json.dumps(result)
`;
    
    const resultJsonStr = await pyodide.runPythonAsync(checkCode);
    const result = JSON.parse(resultJsonStr);
    
    return { success: true, result, logs };
  } catch (error) {
    return { success: false, error: error.toString(), logs: [] };
  }
}
