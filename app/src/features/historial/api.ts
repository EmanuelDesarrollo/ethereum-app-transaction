import { API_BASE_URL } from "../../core/config";
import type { LedgerMovement } from "./ledger";

type BackendReceipt = {
  orderId: string;
  monto: number;
  moneda: string;
  nota?: string;
  txHash?: string;
  confirmedAt: string;
};

export async function fetchBackendHistory(): Promise<LedgerMovement[]> {
  const response = await fetch(`${API_BASE_URL}/support/history`);
  if (!response.ok) return [];
  const body = (await response.json()) as { ventas?: BackendReceipt[] };
  return (body.ventas ?? []).map((receipt) => ({
    id: `backend_${receipt.orderId}`,
    tipo: "venta",
    monto: receipt.monto,
    moneda: receipt.moneda,
    nota: receipt.nota,
    txHash: receipt.txHash,
    orderId: receipt.orderId,
    createdAt: receipt.confirmedAt,
  }));
}
