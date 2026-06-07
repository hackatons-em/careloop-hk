import QRCode from "qrcode";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getPatient } from "@/lib/store";
import { getPatientPhone } from "@/lib/conversation";

export const dynamic = "force-dynamic";

const NUMBER = process.env.CARELOOP_WHATSAPP_SANDBOX_NUMBER ?? "14155238886";
const JOIN_CODE = process.env.CARELOOP_WHATSAPP_JOIN_CODE ?? "bell-iron";

// Personalised onboarding for ONE patient — a single QR. Its message carries
// "careloop-link:<patientId>" (unique per patient), so the inbound webhook binds
// the sender's number to exactly this patient. The Twilio sandbox needs a
// one-time-per-phone "join <code>" first (Twilio consumes it; it never reaches
// us) — in production there is no join, so it is genuinely one scan.
export default async function PatientOnboardPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const patient = await getPatient(patientId);
  if (!patient) notFound();

  const taken = await getPatientPhone(patientId);
  const display = `+${NUMBER.replace(/^\+/, "")}`;
  const joinText = `join ${JOIN_CODE}`;
  const registerText = `careloop-link:${patientId}`;
  const registerUrl = `https://wa.me/${NUMBER}?text=${encodeURIComponent(registerText)}`;
  const registerQr = await QRCode.toString(registerUrl, { type: "svg", margin: 1, width: 240 });

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <Link
        href={`/patients/${patientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to {patient.name}
      </Link>

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {taken ? patient.name : `Connect ${patient.name} on WhatsApp`}
        </h1>
        {!taken && (
          <p className="mt-1 text-sm text-muted-foreground">
            One scan. Send the pre-filled message — done. No app to install.
          </p>
        )}
      </div>

      {taken ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-foreground">Already connected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.name} is already linked to a phone — each patient connects to exactly one number.
            To onboard someone new, add a fresh demo patient.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/40 bg-card p-6 ring-1 ring-primary/10">
            <div
              className="rounded-xl bg-white p-3 [&>svg]:size-56"
              dangerouslySetInnerHTML={{ __html: registerQr }}
            />
            <p className="text-center text-sm text-muted-foreground">
              Scan to open WhatsApp — the message is already typed. Just hit send, and your number is
              linked to <span className="font-medium text-foreground">{patient.name}</span>. Your
              daily check-in arrives right here.
            </p>
          </div>

          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
            First time messaging CareLoop on this phone? WhatsApp will ask you to send “
            <span className="font-medium text-foreground">{joinText}</span>” to {display} once — then
            scan again. That join is one-time per phone (in production there is no join — one scan).
          </p>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        CareLoop is monitoring support — not a diagnosis or treatment tool.
      </p>
    </div>
  );
}
