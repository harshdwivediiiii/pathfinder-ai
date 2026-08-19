export function createOutputRules(rules) {
  return rules;
}
const JSON_OUTPUT_PREFIX = "Provide the output in the following JSON format ONLY:";

export function createJsonOutputRules(schema) {
  return `${JSON_OUTPUT_PREFIX}\n${schema}`;
}