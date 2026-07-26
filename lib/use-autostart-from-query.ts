"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useAutostartFromQuery(
  paramValue: string,
  enabled: boolean,
  run: () => void | Promise<void>
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ranRef = useRef(false);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    if (ranRef.current || !enabled) return;
    if (searchParams.get("autostart") !== paramValue) return;

    ranRef.current = true;
    const path = window.location.pathname;
    router.replace(path, { scroll: false });
    void Promise.resolve(runRef.current());
  }, [enabled, paramValue, router, searchParams]);
}
