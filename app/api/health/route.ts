export const dynamic = "force-dynamic";

// GET /api/health — uptime probe target (no DB call, no status leakage).
export async function GET() {
  return Response.json({
    ok: true,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  });
}
