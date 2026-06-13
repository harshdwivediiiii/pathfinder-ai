const fs = require('fs');
const path = require('path');

function extractJobScraper() {
  const transcriptPath = process.env.TRANSCRIPT_PATH || path.join(__dirname, 'transcript.jsonl');
  const targetPath = process.env.TARGET_PATH || path.join(__dirname, 'actions', 'job-scraper.js');

  if (!fs.existsSync(transcriptPath)) {
    console.error(`Transcript file not found at: ${transcriptPath}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');
  for (const line of lines) {
    if (line.includes('job-scraper.js') && line.includes('parseJobUrl') && line.includes('JSDOM')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.function.name === 'write_to_file' || tc.function.name === 'replace_file_content') {
              const args = JSON.parse(tc.function.arguments);
              if (args.TargetFile && args.TargetFile.includes('job-scraper.js') && args.CodeContent) {
                fs.writeFileSync(targetPath, args.CodeContent);
                console.log('Restored job-scraper.js to', targetPath);
                return;
              }
            }
          }
        }
      } catch(e) {
        // ignore parsing errors
      }
    }
  }
  console.log('Not found');
}

extractJobScraper();
