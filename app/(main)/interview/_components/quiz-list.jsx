"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

const CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "Technical", label: "Technical" },
  { value: "Behavioral", label: "Behavioral" },
  { value: "Situational", label: "Situational" },
];

export default function QuizList({ assessments }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const filteredAssessments = useMemo(() => {
    if (!assessments) return [];
    if (filter === "all") return assessments;

    return assessments.filter(
      (assessment) => assessment.category === filter
    );
  }, [assessments, filter]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="gradient-title text-3xl md:text-4xl">
              Recent Quizzes
            </CardTitle>

            <CardDescription>
              Review your past quiz performance
            </CardDescription>
          </div>

          <Button
            className="w-full md:w-auto"
            onClick={() => router.push("/interview/mock")}
          >
            Start New Quiz
          </Button>
        </div>

        <Tabs
          value={filter}
          onValueChange={setFilter}
          className="mt-4"
        >
          <TabsList className="flex flex-wrap">
            {CATEGORY_FILTERS.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {filteredAssessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl text-muted-foreground">
            <p className="text-lg font-semibold">
              No quizzes found
            </p>

            <p className="text-sm mt-2">
              {filter === "all"
                ? "Take your first quiz to see results here"
                : `No ${filter.toLowerCase()} quizzes yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments.map((assessment, i) => {
              const correctCount =
                assessment.questions.filter(
                  (q) => q.isCorrect
                ).length;

              const totalCount =
                assessment.questions.length;

              return (
                <Card
                  key={assessment.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    router.push(`/interview/${assessment.id}`)
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="gradient-title text-2xl">
                        Quiz {i + 1}
                      </CardTitle>

                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <CardDescription className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span>
                          Score: {assessment.quizScore.toFixed(1)}%
                        </span>

                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {assessment.category}
                        </Badge>
                      </div>

                      <div>
                        {format(
                          new Date(assessment.createdAt),
                          "MMMM dd, yyyy HH:mm"
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        {correctCount} correct
                      </div>

                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-4 w-4" />
                        {totalCount - correctCount} wrong
                      </div>

                      <span className="text-muted-foreground">
                        {totalCount} questions
                      </span>
                    </div>

                    {assessment.improvementTip && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        💡 {assessment.improvementTip}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}