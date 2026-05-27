const CITATION_REGEX =
  /\[(Page\s+\d+|Section\s+[\d.]+|Source\s+#\d+)\]/g;

export function parseCitations(text = "") {
  const parts = [];
  let lastIndex = 0;

  text.replace(CITATION_REGEX, (match, citation, offset) => {
    if (offset > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, offset),
      });
    }

    parts.push({
      type: "citation",
      content: citation,
    });

    lastIndex = offset + match.length;
  });

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return parts;
}