import CitationChip from "./citation-chip";
import { parseCitations } from "@/lib/citations/parse-citations";

export default function CitationRenderer({ text }) {
  const parts = parseCitations(text);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "citation") {
          return (
            <CitationChip
              key={index}
              citation={part.content}
            />
          );
        }

        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
}