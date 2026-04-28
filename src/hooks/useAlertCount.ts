"use client";

import { useEffect, useState } from "react";

export function useAlertCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/alerts");
        const data = await res.json();
        if (cancelled) return;
        const total =
          (data?.outOfStock?.length ?? 0) +
          (data?.lowStock?.length ?? 0) +
          (data?.expired?.length ?? 0) +
          (data?.expiringSoon?.length ?? 0);
        setCount(total);
      } catch {
        // ignore
      }
    };

    load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}
