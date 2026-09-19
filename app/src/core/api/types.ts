export type Moneda = "USDC" | "USDT";
export type CheckoutStatus = "pending" | "confirmed" | "expired";

export interface CheckoutPayload {
  type: "tienda-stablecoin-pay/v1";
  sessionId: string;
  chainId: number;
  token: `0x${string}`;
  decimals: number;
  to: `0x${string}`;
  amount: string;
  nota: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  status: CheckoutStatus;
  monto?: number;
  moneda?: Moneda;
  nota?: string;
  expiresAt: string;
  txHash?: `0x${string}`;
  confirmedAt?: string;
  payload: CheckoutPayload;
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
