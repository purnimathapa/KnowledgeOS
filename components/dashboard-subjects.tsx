"use client";

import { BookOpen } from "lucide-react";

import { AddSubjectDialog } from "@/components/add-subject-dialog";
import { EmptyState } from "@/components/empty-state";
import { SubjectCardItem } from "@/components/subject-card-item";
import type { Subject } from "@/types";

type DashboardSubjectsProps = {
  subjects: Subject[];
};

export function DashboardSubjects({ subjects }: DashboardSubjectsProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="section-title">Your subjects</h2>
          <p className="section-lead">
            {subjects.length === 0
              ? "Add your first subject to get started."
              : `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <AddSubjectDialog />
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Create a folder for each course — PDFs, summaries, and practice tools stay grouped by topic."
          action={<AddSubjectDialog />}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <SubjectCardItem subject={subject} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
