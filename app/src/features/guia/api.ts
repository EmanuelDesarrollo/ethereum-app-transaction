import { API_BASE_URL } from "../../core/config";
import type { GuideResponse, TourModo } from "../../core/api/types";

export async function sendGuideMessage(input: {
  mensaje: string;
  conversationId?: string;
  modoActual?: TourModo;
}): Promise<GuideResponse> {
  const res = await fetch(`${API_BASE_URL}/agent/guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error ?? "No pude contactar al guia.");
  }
  return body as GuideResponse;
}
