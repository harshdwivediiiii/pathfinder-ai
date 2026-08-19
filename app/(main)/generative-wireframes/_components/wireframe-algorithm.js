/**
 * Simulates a generative AI model that accepts a JSON schema of a backend API
 * and synthesizes responsive UI wireframe code (React/Tailwind).
 */

export function synthesizeWireframe(apiSchema) {
    if (!apiSchema || !apiSchema.endpoints || !Array.isArray(apiSchema.endpoints)) {
        throw new Error("Invalid API schema: must contain an 'endpoints' array.");
    }

    let reactCode = `import React, { useState, useEffect } from 'react';\n\nexport default function GeneratedWireframe() {\n`;
    
    // Generate State variables for GET endpoints
    const getEndpoints = apiSchema.endpoints.filter(ep => ep.method.toUpperCase() === 'GET');
    getEndpoints.forEach(ep => {
        const stateName = ep.name.replace(/[^a-zA-Z0-9]/g, '');
        reactCode += `  const [${stateName}Data, set${stateName}Data] = useState(null);\n`;
    });

    reactCode += `\n  return (\n    <div className="p-8 max-w-4xl mx-auto space-y-8 bg-gray-50 min-h-screen">\n`;
    reactCode += `      <h1 className="text-3xl font-bold text-gray-900">${apiSchema.title || 'Generated Dashboard'}</h1>\n`;

    // Generate UI components for each endpoint
    apiSchema.endpoints.forEach(ep => {
        const method = ep.method.toUpperCase();
        reactCode += `\n      {/* UI for ${method} ${ep.path} */}\n`;
        reactCode += `      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">\n`;
        reactCode += `        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">\n`;
        
        const methodColor = method === 'GET' ? 'bg-blue-100 text-blue-700' : 
                            method === 'POST' ? 'bg-green-100 text-green-700' : 
                            method === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
                            
        reactCode += `          <span className="text-xs font-bold px-2 py-1 rounded ${methodColor}">${method}</span>\n`;
        reactCode += `          ${ep.name}\n`;
        reactCode += `        </h2>\n`;

        if (method === 'GET') {
            reactCode += `        <div className="animate-pulse flex space-x-4">\n`;
            reactCode += `          <div className="flex-1 space-y-4 py-1">\n`;
            reactCode += `            <div className="h-4 bg-slate-200 rounded w-3/4"></div>\n`;
            reactCode += `            <div className="space-y-2">\n`;
            reactCode += `              <div className="h-4 bg-slate-200 rounded"></div>\n`;
            reactCode += `              <div className="h-4 bg-slate-200 rounded w-5/6"></div>\n`;
            reactCode += `            </div>\n`;
            reactCode += `          </div>\n`;
            reactCode += `        </div>\n`;
        } else if (method === 'POST' || method === 'PUT') {
            reactCode += `        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>\n`;
            if (ep.payloadSchema) {
                Object.keys(ep.payloadSchema).forEach(key => {
                    const type = ep.payloadSchema[key];
                    const inputType = type === 'number' ? 'number' : 'text';
                    reactCode += `          <div>\n`;
                    reactCode += `            <label className="block text-sm font-medium text-gray-700 capitalize">${key}</label>\n`;
                    reactCode += `            <input type="${inputType}" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" placeholder="Enter ${key}" />\n`;
                    reactCode += `          </div>\n`;
                });
            }
            reactCode += `          <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">Submit</button>\n`;
            reactCode += `        </form>\n`;
        } else if (method === 'DELETE') {
             reactCode += `        <button className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">Delete Resource</button>\n`;
        }

        reactCode += `      </div>\n`;
    });

    reactCode += `    </div>\n  );\n}\n`;

    return {
        success: true,
        generatedCode: reactCode,
        componentCount: apiSchema.endpoints.length
    };
}
