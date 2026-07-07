export function withParsedData(field, parsedData) {
  return {
    [field]: parsedData,
  };
}