const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, '../actions');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('import { handleServerError }')) {
    // Add import right after "use server"; or at the top
    if (content.includes('"use server";')) {
      content = content.replace('"use server";', '"use server";\nimport { handleServerError } from "@/lib/error-handler";');
    } else if (content.includes("'use server';")) {
      content = content.replace("'use server';", "'use server';\nimport { handleServerError } from \"@/lib/error-handler\";");
    } else {
      content = 'import { handleServerError } from "@/lib/error-handler";\n' + content;
    }
  }

  const fileName = path.basename(filePath, '.js');

  // Regex to match catch block: `catch (error) { ... }`
  // We use `[\s\S]*?` to match across multiple lines inside the catch block.
  // The negative lookahead `(?!\s*catch)` prevents it from matching across multiple catch blocks incorrectly.
  // We match from `catch (xyz) {` until the next `}` that ends the block.
  // This is a bit naive for deeply nested blocks, but our actions generally have very flat catch blocks.
  
  // Actually, instead of regex, let's use a simple state machine to find the matching closing brace.
  
  let newContent = "";
  let i = 0;
  
  while (i < content.length) {
    const catchIndex = content.indexOf('catch', i);
    if (catchIndex === -1) {
      newContent += content.substring(i);
      break;
    }
    
    // find opening parenthesis
    const openParen = content.indexOf('(', catchIndex);
    const closeParen = content.indexOf(')', openParen);
    const errVar = content.substring(openParen + 1, closeParen).trim();
    
    // find opening brace
    const openBrace = content.indexOf('{', closeParen);
    
    // find matching closing brace
    let braceCount = 1;
    let curr = openBrace + 1;
    while (braceCount > 0 && curr < content.length) {
      if (content[curr] === '{') braceCount++;
      if (content[curr] === '}') braceCount--;
      curr++;
    }
    const closeBrace = curr - 1;
    
    newContent += content.substring(i, openBrace + 1);
    newContent += `\n    return handleServerError(${errVar}, "${fileName}");\n  }`;
    
    i = closeBrace + 1;
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Refactored: ${fileName}`);
  }
}

const files = fs.readdirSync(actionsDir).filter(f => f.endsWith('.js'));
for (const file of files) {
  try {
    refactorFile(path.join(actionsDir, file));
  } catch (err) {
    console.error("Error in", file, err);
  }
}
