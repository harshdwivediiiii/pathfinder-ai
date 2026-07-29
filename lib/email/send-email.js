import "server-only";

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
  const resend = await getResend();
  return resend.emails.send({
    from: "PathFinder AI <notifications@yourdomain.com>", // update once domain is verified in Resend
    to,
    subject,
    html,
  });
}
