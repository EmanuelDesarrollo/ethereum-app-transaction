export type Moneda = "USDC" | "USDT";
export type CheckoutStatus = "pending" | "confirmed" | "expired";

export interface CheckoutPayload {
  type: "tienda-stablecoin-pay/v1";
  sessionId: string;
  orderId: string;
  chainId: number;
  token: `0x${string}`;
  decimals: number;
  to: `0x${string}`;
  amount: string;
  nota: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  orderId: string;
  status: CheckoutStatus;
  monto?: number;
  moneda?: Moneda;
  nota?: string;
  expiresAt: string;
  txHash?: `0x${string}`;
  confirmedAt?: string;
  payload: CheckoutPayload;
  paymentUri?: string;
  qrDataUrl?: string;
}

export interface AgentMessageResponse {
  conversationId: string;
  respuesta: string;
  cobro?: {
    sessionId: string;
    qrDataUrl: string;
    payload: CheckoutPayload;
  };
}

export type TourModo = "cobrar" | "pagar";

export type GuideAction =
  | { type: "navigate"; tab: "Cobrar" | "Pagar" | "Historial" }
  | { type: "start_tour"; modo: TourModo; desdePaso?: string }
  | { type: "handoff_cobros"; mensaje: string };

export interface GuideResponse {
  conversationId: string;
  respuesta: string;
  acciones: GuideAction[];
}
