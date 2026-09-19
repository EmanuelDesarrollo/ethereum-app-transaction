import { Router } from "express";
import QRCode from "qrcode";
import { randomUUID } from "node:crypto";
import { config } from "../config";

export type Moneda = "USDC" | "USDT";
export type CheckoutStatus = "pending" | "confirmed" | "expired";

export interface CheckoutSession {
  id: string;
  monto: number;
  moneda: Moneda;
  nota: string;
  comercio: `0x${string}`;
  token: `0x${string}`;
  decimals: number;
  amount: string;
  chainId: number;
  status: CheckoutStatus;
  createdAt: string;
  expiresAt: string;
  txHash?: `0x${string}`;
  confirmedAt?: string;
}

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

const SESSION_TTL_MS = 15 * 60 * 1000;
const MONEDAS_VALIDAS: Moneda[] = ["USDC", "USDT"];

// Almacén en memoria — suficiente para la demo del hackathon (sesiones se
// pierden si el backend se reinicia; no hay persistencia entre procesos).
const sessions = new Map<string, CheckoutSession>();

/// Convierte un monto en dólares (ej. 15.5) a la unidad mínima del token
/// (ej. 15500000 para 6 decimales) sin errores de precisión de floating point.
export function toTokenUnits(monto: number, decimals: number): bigint {
  const [whole, frac = ""] = monto.toString().split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

export function createCheckoutSession(input: { monto: number; moneda: Moneda; nota?: string }): CheckoutSession {
  if (!Number.isFinite(input.monto) || input.monto <= 0) {
    throw new Error("monto invalido: debe ser un numero mayor a 0");
  }
  if (!MONEDAS_VALIDAS.includes(input.moneda)) {
    throw new Error(`moneda invalida: debe ser ${MONEDAS_VALIDAS.join(" o ")}`);
  }

  const now = new Date();
  const session: CheckoutSession = {
    id: randomUUID(),
    monto: input.monto,
    moneda: input.moneda,
    nota: input.nota ?? "",
    comercio: config.comercioAddress,
    // Demo: un solo MockStablecoin en HSK testnet cubre ambos símbolos porque
    // no existe una dirección oficial de USDC/USDT verificable en esta red.
    token: config.stablecoinAddress,
    decimals: config.stablecoinDecimals,
    amount: toTokenUnits(input.monto, config.stablecoinDecimals).toString(),
    chainId: config.hskChainId,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };

  sessions.set(session.id, session);
  return session;
}

export function getCheckoutSession(id: string): CheckoutSession | undefined {
  return sessions.get(id);
}

export function confirmCheckoutSession(id: string, txHash: `0x${string}`): CheckoutSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.status = "confirmed";
  session.txHash = txHash;
  session.confirmedAt = new Date().toISOString();
  return session;
}

/// Busca la sesión pendiente que coincide con un pago recibido onchain
/// (mismo destinatario y mismo monto exacto). La usa el listener de eventos.
export function findPendingSessionByPayment(to: `0x${string}`, amount: bigint): CheckoutSession | undefined {
  for (const session of sessions.values()) {
    if (
      session.status === "pending" &&
      session.comercio.toLowerCase() === to.toLowerCase() &&
      BigInt(session.amount) === amount
    ) {
      return session;
    }
  }
  return undefined;
}

export function buildCheckoutPayload(session: CheckoutSession): CheckoutPayload {
  return {
    type: "tienda-stablecoin-pay/v1",
    sessionId: session.id,
    chainId: session.chainId,
    token: session.token,
    decimals: session.decimals,
    to: session.comercio,
    amount: session.amount,
    nota: session.nota,
  };
}

async function buildQrDataUrl(session: CheckoutSession): Promise<string> {
  const payload = buildCheckoutPayload(session);
  return QRCode.toDataURL(JSON.stringify(payload));
}

export const checkoutRouter = Router();

checkoutRouter.post("/", async (req, res) => {
  const { monto, moneda, nota } = req.body ?? {};

  if (monto === undefined || moneda === undefined) {
    return res.status(400).json({ error: "faltan campos requeridos: monto y moneda" });
  }

  try {
    const session = createCheckoutSession({ monto: Number(monto), moneda, nota });
    const qrDataUrl = await buildQrDataUrl(session);
    return res.status(201).json({
      sessionId: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      payload: buildCheckoutPayload(session),
      qrDataUrl,
    });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

checkoutRouter.get("/:id", async (req, res) => {
  const session = getCheckoutSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "sesion de cobro no encontrada" });
  }

  const qrDataUrl = session.status === "pending" ? await buildQrDataUrl(session) : undefined;
  return res.json({
    sessionId: session.id,
    status: session.status,
    monto: session.monto,
    moneda: session.moneda,
    nota: session.nota,
    expiresAt: session.expiresAt,
    txHash: session.txHash,
    confirmedAt: session.confirmedAt,
    payload: buildCheckoutPayload(session),
    qrDataUrl,
  });
});
