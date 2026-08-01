'use client';
import { useEffect } from 'react';

export default function InterviewError({ error, reset }) {
  useEffect(() => {
    console.error('Interview prep generation error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-6">
      <h2 className="text-xl font-semibold text-destructive">
        Something went wrong generating your interview prep
      </h2>
      <p className="text-muted-foreground text-sm max-w-md">
        This might be a temporary issue with the AI service. Your inputs have not been lost.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
