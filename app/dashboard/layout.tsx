import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";
import { DashboardTopNav } from "@/components/dashboard-top-nav";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: claimsData } = await supabase.auth.getClaims();
  const email =
    typeof claimsData?.claims?.email === "string"
      ? claimsData.claims.email
      : null;

  if (!email) {
    redirect("/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="app-mesh pointer-events-none fixed inset-0" aria-hidden />
      <div
        className="marketing-grid pointer-events-none fixed inset-0 opacity-25"
        aria-hidden
      />
      <DashboardTopNav email={email} />
      <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-6 sm:px-8">
        <Suspense fallback={null}>
          <DashboardBreadcrumbs />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
