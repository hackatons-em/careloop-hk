import { createPatientFromMock } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/onboard/create — "Add yourself as a patient": create a fresh demo
// patient from a mock template, then the client redirects to /onboard/<id>.
export async function POST() {
  try {
    const patientId = await createPatientFromMock();
    return Response.json({ patientId });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not create patient" },
      { status: 500 },
    );
  }
}
