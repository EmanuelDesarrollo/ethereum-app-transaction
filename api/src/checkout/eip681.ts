import type { CheckoutPayload } from "./service";

export function buildEip681PaymentUri(payload: CheckoutPayload): string {
  const params = new URLSearchParams({
    address: payload.to,
    uint256: payload.amount,
  });

  if (payload.sessionId) params.set("tienda_session", payload.sessionId);
  if (payload.orderId) params.set("tienda_order", payload.orderId);
  if (payload.nota) params.set("tienda_note", payload.nota);
  params.set("tienda_decimals", String(payload.decimals));

  return `ethereum:${payload.token}@${payload.chainId}/transfer?${params.toString()}`;
}
