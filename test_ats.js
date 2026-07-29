const { getATSAnalyses } = require('./actions/ats');
async function run() {
  try {
    await getATSAnalyses();
    console.info("SUCCESS");
  } catch(e) {
    console.error("ERROR", e);
  }
}
run();

