// No-op stub for the `server-only` package under vitest.
//
// `server-only` deliberately throws unless it is imported in a React Server
// Component context (it has no plain-Node export). Our server modules
// (lib/supabase.ts) import it as a BUILD-TIME guard — `next build` fails if a
// Client Component ever pulls them in. Vitest runs in plain Node, so we alias
// `server-only` to this empty module (see vitest.config.ts) to keep those
// modules importable in tests. The real guarantee is unchanged: it is still
// enforced by the production build.
export {};
