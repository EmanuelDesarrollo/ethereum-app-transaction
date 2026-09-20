import { API_BASE_URL } from "../config";
import type {
  AgentMessageResponse,
  CheckoutSessionResponse,
  GuideResponse,
  Moneda,
  ReceiveQrResponse,
  RegisterInput,
  TourModo,
  UserProfile,
} from "./types";

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

export function sendAgentMessage(
  mensaje: string,
  comercio: `0x${string}`,
  conversationId?: string,
): Promise<AgentMessageResponse> {
  return request<AgentMessageResponse>("/agent/message", {
    method: "POST",
    body: JSON.stringify({ mensaje, comercio, conversationId }),
  });
}

export function registerUser(input: RegisterInput): Promise<UserProfile> {
  return request<UserProfile>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(email: string, password: string): Promise<UserProfile> {
  return request<UserProfile>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
  comercio: `0x${string}`;
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

export function createReceiveQr(address: `0x${string}`): Promise<ReceiveQrResponse> {
  return request<ReceiveQrResponse>("/wallet/receive-qr", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}
