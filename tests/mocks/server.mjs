import { setupServer } from "msw/node";

import { handlers } from "./handlers.mjs";

export const server = setupServer(...handlers);