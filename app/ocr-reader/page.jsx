import React from "react";
import OCRReader from "@/components/ocr-reader";

export const metadata = {
  title: "OCR Text Reader | PathFinder AI",
  description: "Extract text from images using your camera and read it aloud.",
};

export default function OCRReaderPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          OCR Text Reader
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Use your device camera to capture printed text and have it spoken aloud. 
          Perfect for reading signs, notices, or documents.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <OCRReader />
      </div>
    </div>
  );
}
