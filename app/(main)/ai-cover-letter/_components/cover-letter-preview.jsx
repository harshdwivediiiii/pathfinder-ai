"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const CoverLetterPreview = ({ content }) => {
  return (
    <div
      id="cover-letter-content"
      className="prose prose-sm max-w-none py-4"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default CoverLetterPreview;