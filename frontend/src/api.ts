import type { Profile } from "./types";

// Same-origin in production; Vite proxies /api to the backend during dev.
async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export interface Health {
  status: string;
  app: string;
}

export const api = {
  health: () => getJSON<Health>("/api/health"),
  profiles: () => getJSON<Profile[]>("/api/profiles"),
};
