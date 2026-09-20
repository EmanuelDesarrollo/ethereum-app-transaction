import { Router } from "express";
import type { Hash } from "viem";
import type { CheckoutSession } from "../checkout/service";

export interface SaleReceipt {
  receiptId: string;
  orderId: string;
  sessionId: string;
  comercio: `0x${string}`;
  token: `0x${string}`;
  amount: string;
  monto: number;
  moneda: string;
  nota: string;
  txHash: Hash;
  registrarVentaTxHash?: Hash;
  confirmedAt: string;
}

const receipts = new Map<string, SaleReceipt>();

/// Agente de registro y soporte: guarda comprobantes e historial offchain. No
/// firma transacciones ni cambia informacion onchain.
export function guardarVentaConfirmada(
  session: CheckoutSession,
  txHash: Hash,
  registrarVentaTxHash?: Hash,
): SaleReceipt {
  const receipt: SaleReceipt = {
    receiptId: `receipt_${session.orderId}`,
    orderId: session.orderId,
    sessionId: session.id,
    comercio: session.comercio,
    token: session.token,
    amount: session.amount,
    monto: session.monto,
    moneda: session.moneda,
    nota: session.nota,
    txHash,
    registrarVentaTxHash,
    confirmedAt: new Date().toISOString(),
  };

  receipts.set(receipt.orderId, receipt);
  return receipt;
}

export function getReceipt(orderId: string): SaleReceipt | undefined {
  return receipts.get(orderId);
}

export function listReceipts(): SaleReceipt[] {
  return [...receipts.values()].sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
}

export function getDailySummary(day = new Date().toISOString().slice(0, 10)) {
  const ventas = listReceipts().filter((receipt) => receipt.confirmedAt.slice(0, 10) === day);
  const totalMinorUnits = ventas.reduce((sum, receipt) => sum + BigInt(receipt.amount), 0n);

  return {
    day,
    salesCount: ventas.length,
    totalMinorUnits: totalMinorUnits.toString(),
    ventas,
  };
}

export const soporteRouter = Router();

soporteRouter.get("/history", (_req, res) => {
  res.json({ ventas: listReceipts() });
});

soporteRouter.get("/summary/daily", (req, res) => {
  const day = typeof req.query.day === "string" ? req.query.day : undefined;
  res.json(getDailySummary(day));
});

soporteRouter.get("/receipts/:orderId", (req, res) => {
  const receipt = getReceipt(req.params.orderId);
  if (!receipt) {
    return res.status(404).json({ error: "comprobante no encontrado" });
  }
  return res.json(receipt);
});
