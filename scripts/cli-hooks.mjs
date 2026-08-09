/**
 * Node ESM loader hooks for maintenance CLIs.
 * Stubs `server-only`, resolves `@/*` aliases, and adds `.js` extensions
 * so Next.js-oriented modules can be imported from plain Node.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const hooksDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(hooksDir, "..");
const emptyStubUrl = pathToFileURL(path.join(hooksDir, "empty-module.mjs")).href;

function looksLikeRelative(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function hasKnownExtension(specifier) {
  return /\.(?:js|mjs|cjs|json|node|ts|tsx|jsx)$/.test(specifier);
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only" || specifier === "client-only") {
    return {
      shortCircuit: true,
      url: emptyStubUrl,
      format: "module",
    };
  }

  let nextSpecifier = specifier;

  if (specifier.startsWith("@/")) {
    nextSpecifier = pathToFileURL(path.join(projectRoot, specifier.slice(2))).href;
  }

  if (
    (looksLikeRelative(nextSpecifier) || nextSpecifier.startsWith("file://")) &&
    !hasKnownExtension(nextSpecifier)
  ) {
    try {
      return await nextResolve(`${nextSpecifier}.js`, context);
    } catch {
      try {
        return await nextResolve(`${nextSpecifier}/index.js`, context);
      } catch {
        // fall through to default resolution
      }
    }
  }

  return nextResolve(nextSpecifier, context);
}
