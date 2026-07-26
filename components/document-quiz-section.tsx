"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentReveal } from "@/components/motion/content-reveal";
import { QuizProgressRuler } from "@/components/quiz-progress-ruler";
import { formatGroqError } from "@/lib/groq-errors";
import { useAutostartFromQuery } from "@/lib/use-autostart-from-query";
import { cn } from "@/lib/utils";
import type { Document, Quiz, QuizQuestion } from "@/types";

type DocumentQuizSectionProps = {
  document: Document;
  initialQuiz: Quiz | null;
};

type QuizPhase = "idle" | "generating" | "taking" | "results";

export function DocumentQuizSection({
  document,
  initialQuiz,
}: DocumentQuizSectionProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz);
  const [phase, setPhase] = useState<QuizPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const canGenerate =
    document.status === "ready" && Boolean(document.extracted_text?.trim());

  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);
  const currentQuestion = questions[currentIndex];

  const score = useMemo(() => {
    if (!questions.length) return 0;
    return questions.reduce((total, question, index) => {
      return answers[index] === question.correct_index ? total + 1 : total;
    }, 0);
  }, [answers, questions]);

  async function handleGenerateQuiz() {
    setError(null);
    setPhase("generating");
    setAnswers({});
    setCurrentIndex(0);

    try {
      const response = await fetch(`/api/documents/${document.id}/quiz`, {
        method: "POST",
        credentials: "include",
      });

      const body = (await response.json().catch(() => null)) as {
        id?: string;
        questions?: QuizQuestion[];
        error?: string;
      } | null;

      if (!response.ok || !body?.questions?.length) {
        const message = formatGroqError(body?.error ?? "Failed to generate quiz.");
        setError(message);
        toast.error("Quiz generation failed", { description: message });
        setPhase("idle");
        return;
      }

      setQuiz({
        id: body.id ?? quiz?.id ?? document.id,
        document_id: document.id,
        questions: body.questions,
        created_at: quiz?.created_at ?? new Date().toISOString(),
      });
      toast.success("Quiz generated");
      setPhase("taking");
    } catch {
      const message = "Failed to generate quiz.";
      setError(message);
      toast.error(message);
      setPhase("idle");
    }
  }

  function handleStartQuiz() {
    if (!questions.length) return;
    setAnswers({});
    setCurrentIndex(0);
    setPhase("taking");
  }

  function handleNext() {
    if (answers[currentIndex] === undefined) return;

    if (currentIndex >= questions.length - 1) {
      setPhase("results");
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  const wrongAnswers = questions
    .map((question, index) => ({ question, index, selected: answers[index] }))
    .filter(
      (entry) =>
        entry.selected !== undefined &&
        entry.selected !== entry.question.correct_index
    );

  const quizCompletedCount =
    phase === "results"
      ? questions.length
      : Object.keys(answers).length;

  const showQuizProgress =
    (phase === "taking" || phase === "results") && questions.length > 0;

  useAutostartFromQuery("quiz", canGenerate, () => {
    if (quiz?.questions?.length) {
      handleStartQuiz();
    } else {
      void handleGenerateQuiz();
    }
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="section-title">Quiz</h2>
          <p className="section-lead">
            Generate multiple-choice questions from this document.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {quiz && phase !== "taking" && phase !== "results" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleStartQuiz}
              disabled={!questions.length}
            >
              Start quiz
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!canGenerate || phase === "generating" || phase === "taking"}
            onClick={handleGenerateQuiz}
          >
            {phase === "generating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate quiz"
            )}
          </Button>
        </div>
      </div>

      {!canGenerate ? (
        <p className="section-lead">
          Available after text extraction finishes (status: ready).
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {phase === "generating" ? (
        <div className="space-y-3 rounded-lg bg-muted/50 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating quiz…
          </div>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : null}

      {phase === "taking" && currentQuestion ? (
        <ContentReveal revealKey={`${quiz?.id ?? document.id}-taking`}>
          <div className="space-y-6 rounded-lg bg-muted/40 p-6">
            {showQuizProgress ? (
              <QuizProgressRuler
                total={questions.length}
                completed={quizCompletedCount}
              />
            ) : null}
            <p className="section-lead">
              Question {currentIndex + 1} of {questions.length}
            </p>
          <p className="font-medium">{currentQuestion.question}</p>

          <RadioGroup
            value={
              answers[currentIndex] !== undefined
                ? String(answers[currentIndex])
                : undefined
            }
            onValueChange={(value) =>
              setAnswers((prev) => ({
                ...prev,
                [currentIndex]: Number(value),
              }))
            }
            className="space-y-2"
          >
            {currentQuestion.options.map((option, optionIndex) => {
              const optionId = `q${currentIndex}-option-${optionIndex}`;
              const selected = answers[currentIndex] === optionIndex;
              return (
                <div
                  key={optionId}
                  className={cn(
                    "flex items-start gap-3 rounded-lg bg-background/80 px-4 py-3",
                    selected && "ring-1 ring-primary/40"
                  )}
                >
                  <RadioGroupItem
                    value={String(optionIndex)}
                    id={optionId}
                    className="mt-0.5"
                  />
                  <Label htmlFor={optionId} className="cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          <Button
            type="button"
            onClick={handleNext}
            disabled={answers[currentIndex] === undefined}
            className="w-full sm:w-auto"
          >
            {currentIndex >= questions.length - 1 ? "See results" : "Next"}
          </Button>
        </div>
        </ContentReveal>
      ) : null}

      {phase === "results" && questions.length > 0 ? (
        <ContentReveal revealKey={`${quiz?.id ?? document.id}-results-${score}`}>
        <div className="space-y-6 rounded-lg bg-muted/40 p-6">
          {showQuizProgress ? (
            <QuizProgressRuler
              total={questions.length}
              completed={questions.length}
            />
          ) : null}
          <div className="space-y-1">
            <h3 className="font-medium">Results</h3>
            <p className="section-lead font-mono">
              You scored {score} out of {questions.length} (
              {Math.round((score / questions.length) * 100)}%).
            </p>
          </div>

          {wrongAnswers.length > 0 ? (
            <div className="space-y-4">
              <h4 className="section-title">Review incorrect answers</h4>
              {wrongAnswers.map(({ question, index, selected }) => (
                <div
                  key={`${index}-${question.question}`}
                  className="rounded-lg bg-background/80 p-4"
                >
                  <p className="font-medium">{question.question}</p>
                  <p className="section-lead mt-2">
                    Your answer: {question.options[selected!]}
                  </p>
                  <p className="section-lead">
                    Correct answer: {question.options[question.correct_index]}
                  </p>
                  <p className="mt-2">{question.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="section-lead">
              Perfect score — no incorrect answers to review.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleStartQuiz}>
              Retake quiz
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPhase("idle")}>
              Done
            </Button>
          </div>
        </div>
        </ContentReveal>
      ) : null}

      {phase === "idle" && quiz && questions.length > 0 ? (
        <p className="section-lead">
          <span className="display-emphasis">{questions.length} questions</span>{" "}
          are loaded — hit Start quiz when you want a scored run.
        </p>
      ) : null}

      {phase === "idle" && !quiz && canGenerate ? (
        <p className="section-lead">
          No quiz yet. Generate multiple-choice questions from this reading when
          you are ready to test yourself.
        </p>
      ) : null}
    </section>
  );
}
