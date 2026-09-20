import { API_BASE_URL } from "../config";
import type { AgentMessageResponse, CheckoutSessionResponse, GuideResponse, Moneda, TourModo } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error ?? `Error ${res.status} llamando a ${path}`);
  }
  return body as T;
}

export function sendAgentMessage(mensaje: string, conversationId?: string): Promise<AgentMessageResponse> {
  return request<AgentMessageResponse>("/agent/message", {
    method: "POST",
    body: JSON.stringify({ mensaje, conversationId }),
  });
}

export function sendGuideMessage(input: {
  mensaje: string;
  conversationId?: string;
  modoActual?: TourModo;
}): Promise<GuideResponse> {
  return request<GuideResponse>("/agent/guide", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCheckoutSession(sessionId: string): Promise<CheckoutSessionResponse> {
  return request<CheckoutSessionResponse>(`/checkout/${sessionId}`);
}

export function createCheckoutSession(input: {
  monto: number;
  moneda: Moneda;
  nota?: string;
}): Promise<CheckoutSessionResponse> {
  return request<CheckoutSessionResponse>("/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/// Fondea con HSK de gas una wallet nueva de la persona para que pueda pagar
/// (llamar faucet() y enviar el transfer). Solo existe para la demo del
/// hackathon — en producción la persona llegaría con fondos propios.
export function requestGasSponsorship(address: `0x${string}`): Promise<{ txHash: `0x${string}` }> {
  return request<{ txHash: `0x${string}` }>("/faucet/gas", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}
