import "server-only";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
}

let _resendPromise;

function getResend() {
  if (!_resendPromise) {
    _resendPromise = import("resend").then(({ Resend }) => {
      return new Resend(process.env.RESEND_API_KEY);
    });
  }
  return _resendPromise;
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!isValidEmail(to)) {
    throw new Error(`Invalid recipient email address: "${to}"`);
  }
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    throw new Error("Email subject is required and must be a non-empty string");
  }
  if (!html || typeof html !== "string" || !html.trim()) {
    throw new Error("Email html body is required and must be a non-empty string");
  }
  const resend = await getResend();
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "PathFinder AI <notifications@yourdomain.com>",
    to,
    subject,
    html,
  });
}
