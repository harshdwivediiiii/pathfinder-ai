import "server-only";

let _inngestPromise;

export function getInngest() {
  if (!_inngestPromise) {
    _inngestPromise = import("inngest").then(({ Inngest }) => {
    .catch(err => console.error(err))