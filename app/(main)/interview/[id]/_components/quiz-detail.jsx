"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DownloadPdf from "@/components/Download-pdf";

export default function QuizDetail({ assessment }) {
  const router = useRouter();

  const correctCount = assessment.questions.filter((q) => q.isCorrect).length;
  const totalCount = assessment.questions.length;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/interview")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-title flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Quiz Results
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(assessment.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
            </p>
          </div>
        </div>

        <DownloadPdf
          contentRefId="quiz-detail-content"
          fileName={`quiz-${assessment.category.toLowerCase()}-${format(new Date(assessment.createdAt), "yyyy-MM-dd")}.pdf`}
          label="Download PDF"
        />
      </div>

      {/* Printable content area */}
      <div id="quiz-detail-content" className="space-y-6">
        {/* Score overview card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Score Overview</CardTitle>
              <Badge variant="secondary">{assessment.category}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-bold">{assessment.quizScore.toFixed(1)}%</h3>
              <Progress value={assessment.quizScore} className="h-3" />
            </div>

            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                {correctCount} correct
              </div>
              <div className="flex items-center gap-1 text-red-500">
                <XCircle className="h-5 w-5" />
                {totalCount - correctCount} wrong
              </div>
            </div>

            {/* Improvement tip */}
            {assessment.improvementTip && (
              <div className="flex items-start gap-3 bg-muted p-4 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Improvement Tip</p>
                  <p className="text-sm text-muted-foreground">{assessment.improvementTip}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question review */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Question Review</h2>
          {assessment.questions.map((q, index) => (
            <Card
              key={index}
              className={q.isCorrect ? "border-green-200 dark:border-green-900/50" : "border-red-200 dark:border-red-900/50"}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">
                    <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
                    {q.question}
                  </p>
                  {q.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Your answer: </span>
                  <span className={q.isCorrect ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {q.userAnswer || "No answer"}
                  </span>
                </div>
                {!q.isCorrect && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="text-green-600 font-medium">{q.answer}</span>
                  </div>
                )}
                <div className="bg-muted p-3 rounded-lg mt-2">
                  <p className="text-sm font-medium">Explanation</p>
                  <p className="text-sm text-muted-foreground">{q.explanation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions (not included in PDF) */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/interview")} className="flex-1">
          Back to Interview Prep
        </Button>
        <Button onClick={() => router.push("/interview/mock")} className="flex-1">
          Start New Quiz
        </Button>
      </div>
    </div>
  );
}
