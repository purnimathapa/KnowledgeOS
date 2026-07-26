import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardWorkspace } from "@/components/dashboard-workspace";
import type { Subject } from "@/types";
import { createClient } from "@/utils/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{ subject?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { subject: initialSubjectId } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load subjects:", error.message);
  }

  if (!userId) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div className="page-lead">Loading workspace…</div>}>
      <DashboardWorkspace
        subjects={(subjects ?? []) as Subject[]}
        userId={userId}
        initialSubjectId={initialSubjectId ?? null}
      />
    </Suspense>
  );
}
