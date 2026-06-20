const { execSync } = require('child_process');
try {
  const output = execSync('git log -p -n 5 lib/env.js', { encoding: 'utf8' });
  console.log(output);
} catch (e) {
  console.error(e);
}
