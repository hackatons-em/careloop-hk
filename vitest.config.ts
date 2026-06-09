import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Playwright specs use *.spec.ts under e2e/ — never picked up here.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**"],
      exclude: ["lib/**/*.test.ts"],
    },
    // `server-only` throws unless imported in a React Server Component context.
    // Our server modules use it as a build-time guard (enforced by `next build`);
    // under vitest we stub it to a no-op so those modules stay importable in tests.
    alias: {
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
});
