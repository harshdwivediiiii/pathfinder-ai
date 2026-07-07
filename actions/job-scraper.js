"use server";
import { handleServerError } from "@/lib/error-handler";

import { auth } from "@clerk/nextjs/server";
import { generateGeminiContent } from "@/lib/gemini";
import { JSDOM } from "jsdom";
import { buildSecurePrompt } from "@/lib/prompt-safety";
import { parseAIJson } from "@/lib/validate";

import { safeFetch } from "../lib/safe-fetch.js";
import { checkRateLimit } from "../lib/rate-limit-actions.js";

export async function parseJobUrl(url) {
  const { userId } = await auth();
  if (!userId) return { success: false, errors: { _form: ["Unauthorized"] } };

  await checkRateLimit(userId, "jobScraper");

  try {
    const response = await safeFetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.success) {
      return fetchResult;
    }

    if (fetchResult.status !== 200) {
      return {
        success: false,
        errors: { _form: [`Fetch failed with status ${fetchResult.status}`] },
      };
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove scripts, styles, etc.
    const elementsToRemove = document.querySelectorAll(
      "script, style, noscript, iframe, img, svg",
    );
    elementsToRemove.forEach((el) => el.remove());

    const textContent = document.body.textContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // Limit to 15k chars

    const prompt = buildSecurePrompt({
      context:
        "You are an expert ATS and job parser. Extract the job details from the scraped raw text.",
      task: `Analyze the provided raw text from a job posting and extract the following:
      1. Company Name
      2. Job Title
      3. Location (City, State/Country, or Remote)
      4. Salary or Salary Range (if available)
      5. Full Job Description (Cleaned up, readable format)
      
      Respond strictly in the following JSON format:
      {
        "companyName": "...",
        "jobTitle": "...",
        "location": "...",
        "salary": "...",
        "jobDescription": "..."
      }`,
      untrustedData: [
        { label: "scrapedText", value: textContent, maxLength: 15000 },
      ],
    });

    const aiResult = await generateGeminiContent(prompt);
    const parsedData = parseAIJson(aiResult.response.text());

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    return handleServerError(error, "job-scraper");
  }
}
