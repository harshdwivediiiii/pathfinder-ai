import { describe, expect, it } from "vitest";
import { normalizePortfolioContent } from "../lib/misc/portfolio-content.js";

describe("normalizePortfolioContent", () => {
  it("strips unsafe project link and image URL schemes", () => {
    const normalized = normalizePortfolioContent({
      projects: [
        {
          name: "Unsafe project",
          link: "javascript:alert(document.domain)",
          image: "data:text/html,<script>alert(1)</script>",
          techStack: "React, Prisma",
        },
      ],
    });

    expect(normalized.projects[0]).toEqual(
      expect.objectContaining({
        link: "",
        image: "",
        techStack: ["React", "Prisma"],
      })
    );
  });

  it("keeps http and https project URLs", () => {
    const normalized = normalizePortfolioContent({
      projects: [
        {
          name: "Safe project",
          link: "https://example.com/project",
          image: "http://cdn.example.com/image.png",
          techStack: ["Next.js"],
        },
      ],
    });

    expect(normalized.projects[0]).toEqual(
      expect.objectContaining({
        link: "https://example.com/project",
        image: "http://cdn.example.com/image.png",
        techStack: ["Next.js"],
      })
    );
  });
});
