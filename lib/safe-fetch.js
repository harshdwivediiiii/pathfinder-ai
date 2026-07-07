import dns from "dns/promises";
import net from "net";
import {
  URL_FETCH_TIMEOUT_MS,
  URL_FETCH_MAX_BYTES,
  URL_FETCH_MAX_LENGTH,
} from "./input-limits.js";
import { createErrorResponse } from "./action-errors.js";
import { logActionError } from "./action-logger.js";

// Manually classify private/reserved IPs since no external lib is available
function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    return (
      parts[0] === 10 || // 10.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
      parts[0] === 127 || // Loopback
      (parts[0] === 169 && parts[1] === 254) || // Link-local (Cloud Metadata)
      parts[0] === 0 // Unspecified
    );
  } else if (net.isIPv6(ip)) {
    const lowerIp = ip.toLowerCase();
    if (lowerIp === "::1" || lowerIp === "::") return true;
    if (
      lowerIp.startsWith("fe80:") ||
      lowerIp.startsWith("fc00:") ||
      lowerIp.startsWith("fd00:")
    )
      return true;
    // Unwrap IPv4-mapped IPv6
    if (lowerIp.startsWith("::ffff:")) {
      const ipv4 = ip.split(":").pop();
      return isPrivateIP(ipv4);
    }
  }
  return false;
}

// Ensure ALL resolved DNS records for the hostname are safe
async function isSafeHostname(hostname) {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateIP(record.address)) {
        return false;
      }
    }
    return true;
  } catch (err) {
    return false; // Fail securely if DNS fails
  }
}

export async function safeFetch(urlString, options = {}, redirectCount = 0) {
  if (redirectCount > 5) {
    return createErrorResponse("Too many redirects");
  }

  if (!urlString || urlString.length > URL_FETCH_MAX_LENGTH) {
    return createErrorResponse("URL exceeds maximum length");
  }

  let url;
  try {
    url = new URL(urlString);
  } catch {
    return createErrorResponse("Invalid URL format");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return createErrorResponse("Only HTTP and HTTPS protocols are allowed");
  }

  // Optional Env Allowlist Check (mirroring lib/cors.js)
  if (process.env.ALLOWED_JOB_HOSTS) {
    const allowedHosts = new Set(process.env.ALLOWED_JOB_HOSTS.split(","));
    if (!allowedHosts.has(url.hostname)) {
      return createErrorResponse("Host is not in the allowed list");
    }
  }

  const isSafe = await isSafeHostname(url.hostname);
  if (!isSafe) {
    await logActionError("SSRF_BLOCKED", "Blocked attempt to reach restricted IP", { url: urlString });
    return createErrorResponse("URL resolves to a restricted internal network");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);

  try {
    const fetchOptions = {
      ...options,
      redirect: "manual", // Prevent blind redirect following
      signal: controller.signal,
    };

    const response = await fetch(url.toString(), fetchOptions);

    // Manual redirect handling for DNS-rebinding defense
    if (
      response.status >= 300 &&
      response.status <= 308 &&
      response.headers.has("location")
    ) {
      clearTimeout(timeoutId);
      const nextUrl = new URL(response.headers.get("location"), url.toString()).toString();
      return safeFetch(nextUrl, options, redirectCount + 1);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > URL_FETCH_MAX_BYTES) {
      return createErrorResponse("Response exceeds maximum allowed size");
    }

    // Stream to catch sizes if Content-Length is missing/spoofed
    const reader = response.body.getReader();
    let receivedLength = 0;
    let chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedLength += value.length;
      
      if (receivedLength > URL_FETCH_MAX_BYTES) {
        reader.cancel();
        return createErrorResponse("Response stream exceeded maximum allowed size");
      }
      chunks.push(value);
    }

    const bodyArray = new Uint8Array(receivedLength);
    let position = 0;
    for (let chunk of chunks) {
      bodyArray.set(chunk, position);
      position += chunk.length;
    }

    const text = new TextDecoder("utf-8").decode(bodyArray);
    return { success: true, text, status: response.status };

  } catch (error) {
    if (error.name === "AbortError") {
      return createErrorResponse("Network request timed out");
    }
    return createErrorResponse("Network request failed");
  } finally {
    clearTimeout(timeoutId);
  }
}