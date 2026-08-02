import "server-only";

let _resendPromise;

function getResend() {
  if (!_resendPromise) {
    _resendPromise = import("resend").then(({ Resend }) => {
    .catch(err => console.error(err))