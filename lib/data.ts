"use client";

import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function dataUrl(path: string) {
  return `${BASE}/data/${path}`;
}

type State<T> = { data: T | null; error: string | null; loading: boolean };

const cache = new Map<string, unknown>();

/** Fetch a JSON file from /data with an in-memory cache (the pipeline rewrites these files, so no-store). */
export function useJson<T>(path: string | null): State<T> {
  const [state, setState] = useState<State<T>>(() => {
    const hit = path ? (cache.get(path) as T | undefined) : undefined;
    return { data: hit ?? null, error: null, loading: !!path && !hit };
  });

  useEffect(() => {
    if (!path) return;
    let alive = true;
    fetch(dataUrl(path), { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((d: T) => {
        cache.set(path, d);
        if (alive) setState({ data: d, error: null, loading: false });
      })
      .catch((e: Error) => alive && setState({ data: null, error: e.message, loading: false }));
    return () => {
      alive = false;
    };
  }, [path]);

  return state;
}
