import "server-only";

import { headers } from "next/headers";

export async function getApplicationBaseUrl() {
  const configured = process.env.APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/u, "");
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Não foi possível determinar a URL da aplicação.");
  }

  return `${protocol}://${host}`;
}
