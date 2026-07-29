import "server-only";

let _inngestPromise;

export function getInngest() {
  if (!_inngestPromise) {
    _inngestPromise = import("inngest").then(({ Inngest }) => {
      return new Inngest({
        id: "career-coach",
        name: "Career Coach",
        eventKey: process.env.INNGEST_EVENT_KEY,
      });
    }).catch(err => console.error("[Inngest] Dynamic import failed:", err));
  }
  return _inngestPromise;
}
