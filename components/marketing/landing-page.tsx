import {
  BookOpen,
  BrainCircuit,
  FileText,
  Layers,
  MessageCircle,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Bring in your PDFs",
    description:
      "Drop readings into a subject folder. Everything stays organized by course or topic.",
    icon: Upload,
  },
  {
    n: "02",
    title: "Build your workspace",
    description:
      "Text extraction unlocks summaries, grounded Q&A, and study tools tied to the source.",
    icon: Layers,
  },
  {
    n: "03",
    title: "Practice until it sticks",
    description:
      "Turn the same material into quizzes and flashcards built for active recall.",
    icon: BrainCircuit,
  },
] as const;

const FEATURES = [
  {
    title: "Structured summaries",
    description: "Markdown study notes generated from extracted text.",
    icon: Sparkles,
  },
  {
    title: "Grounded Q&A",
    description: "Ask questions answered from the document, not a blank chat.",
    icon: MessageCircle,
  },
  {
    title: "Quizzes",
    description: "Multiple-choice review with explanations for what you missed.",
    icon: BookOpen,
  },
  {
    title: "Flashcards",
    description: "Flip through term and definition decks from your PDF.",
    icon: FileText,
  },
] as const;

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="app-mesh pointer-events-none fixed inset-0" aria-hidden />
      <div
        className="marketing-grid pointer-events-none fixed inset-0 opacity-40"
        aria-hidden
      />

      <SiteHeader />

      <main className="relative mx-auto max-w-6xl px-4 sm:px-8">
        <section className="flex flex-col items-center pb-20 pt-16 text-center sm:pt-24">
          <p className="feature-pill mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest">
              Intelligent study workspace
            </span>
          </p>
          <h1 className="font-display max-w-3xl text-4xl leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
            Meet KnowledgeOS — turn any PDF into notes, answers, and practice.
          </h1>
          <p className="page-lead mx-auto mt-6 max-w-xl text-base sm:text-lg">
            Drop in a reading and get a calm workspace with summaries, grounded
            Q&amp;A, quizzes, and flashcards — one loop from understanding to
            memory.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="hero-glow min-w-[11rem]">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card · Free tier Gemini limits apply
          </p>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl sm:text-3xl">
              From source to real understanding
            </h2>
            <p className="page-lead mt-3 text-base">
              Three steps from scattered readings to active recall.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <article key={step.n} className="step-card text-left">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{step.n}</span>
                  <step.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
                <h3 className="font-display text-lg">{step.title}</h3>
                <p className="section-lead mt-2">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl sm:text-3xl">
              See the learning loop in action
            </h2>
            <p className="page-lead mt-3">
              Raw material becomes a complete path from reading to recall.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="glass-panel flex gap-4 p-6 text-left motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-muted/80">
                  <feature.icon className="h-4 w-4 text-foreground" aria-hidden />
                </div>
                <div>
                  <h3 className="section-title text-base">{feature.title}</h3>
                  <p className="section-lead mt-1">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-24 mt-4">
          <div className="glass-panel hero-glow mx-auto max-w-3xl px-6 py-14 text-center sm:px-12">
            <h2 className="font-display text-2xl sm:text-3xl">
              Make progress on what you want to master, today
            </h2>
            <p className="page-lead mx-auto mt-4 max-w-md text-base">
              Create your first subject, upload a PDF, and open a study session
              in minutes.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/signup">Start for free</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
