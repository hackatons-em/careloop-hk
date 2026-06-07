import QRCode from "qrcode";

export const dynamic = "force-dynamic";

// Twilio sandbox number + join code (overridable; defaults from the sandbox).
const NUMBER = process.env.CARELOOP_WHATSAPP_SANDBOX_NUMBER ?? "14155238886";
const JOIN_CODE = process.env.CARELOOP_WHATSAPP_JOIN_CODE ?? "bell-iron";

// Onboarding, two explicit steps:
//   1. Scan the QR -> WhatsApp opens with "join <code>" prefilled -> send it.
//      (This is the sandbox opt-in; it goes to Twilio, not our webhook.)
//   2. Send ONE more message -> THAT is the first inbound our webhook sees, so it
//      captures the number and registers the patient. A scan alone tells us
//      nothing — WhatsApp only reveals the number once the person messages us.
export default async function OnboardPage() {
  const joinText = `join ${JOIN_CODE}`;
  const waUrl = `https://wa.me/${NUMBER}?text=${encodeURIComponent(joinText)}`;
  const qrSvg = await QRCode.toString(waUrl, { type: "svg", margin: 1, width: 240 });
  const displayNumber = `+${NUMBER.replace(/^\+/, "")}`;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Activate your CareLoop check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two quick steps in WhatsApp — no app to install, no account.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <div
          className="rounded-xl bg-white p-3 [&>svg]:size-56"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="text-xs text-muted-foreground">Scan to open WhatsApp to {displayNumber}</p>
      </div>

      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            1
          </span>
          <div className="text-sm">
            <p className="font-medium text-foreground">Scan the QR and hit send</p>
            <p className="mt-0.5 text-muted-foreground">
              WhatsApp opens with “<span className="font-medium text-foreground">{joinText}</span>”
              already typed. Just send it — this connects you to CareLoop.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            2
          </span>
          <div className="text-sm">
            <p className="font-medium text-foreground">Write your first message</p>
            <p className="mt-0.5 text-muted-foreground">
              Reply with how you feel today — type, or send a Cantonese voice note (e.g.
              “今日有啲氣促，對腳腫咗”). CareLoop replies telling you which patient you are, and your
              patient goes live on the nurse dashboard.
            </p>
          </div>
        </li>
      </ol>

      <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Why two messages? The first connects you to the WhatsApp sandbox; the second is the first one
        CareLoop actually receives, so it learns your number (a scan alone never reveals it). From
        then on, CareLoop sends you the daily check-in first — you just reply.
      </p>

      <p className="text-center text-xs text-muted-foreground">
        CareLoop is monitoring support — not a diagnosis or treatment tool.
      </p>
    </div>
  );
}
