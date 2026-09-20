import QRCode from "qrcode";
import { buildEip681PaymentUri } from "../checkout/eip681";
import {
  buildCheckoutPayload,
  createCheckoutSession,
  type CheckoutPayload,
  type CheckoutSession,
  type Moneda,
} from "../checkout/service";

export interface CobroCreado {
  orderId: string;
  sessionId: string;
  qrDataUrl: string;
  payload: CheckoutPayload;
  session: CheckoutSession;
  expiresAt: string;
}

export interface CrearCobroInput {
  monto: number;
  moneda: Moneda;
  nota?: string;
  comercio: `0x${string}`;
}

/// Agente de cobros: entiende la intención de cobro a través del LLM, pero la
/// creación real de orden/QR queda en código determinístico del backend.
export async function crearCobro(input: CrearCobroInput): Promise<CobroCreado> {
  const session = createCheckoutSession(input);
  const payload = buildCheckoutPayload(session);
  const qrDataUrl = await QRCode.toDataURL(buildEip681PaymentUri(payload));

  return {
    orderId: session.orderId,
    sessionId: session.id,
    qrDataUrl,
    payload,
    session,
    expiresAt: session.expiresAt,
  };
}
