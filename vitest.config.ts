import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    // `server-only` throws unless imported in a React Server Component context.
    // Our server modules use it as a build-time guard (enforced by `next build`);
    // under vitest we stub it to a no-op so those modules stay importable in tests.
    alias: {
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
});
