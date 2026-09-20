import type { Hash } from "viem";
import { config } from "../config";
import { findPendingSessionByPayment, type CheckoutSession } from "../checkout/service";

const processedTxHashes = new Set<string>();

export type PaymentVerification =
  | {
      ok: true;
      session: CheckoutSession;
      txHash: Hash;
      explanation: string;
    }
  | {
      ok: false;
      reason: string;
      explanation: string;
    };

export interface VerifyPaymentInput {
  token: `0x${string}`;
  to?: `0x${string}`;
  value?: bigint;
  txHash: Hash;
}

/// Agente verificador: solo lee y valida el pago detectado onchain. No firma,
/// no mueve dinero y no escribe en contratos.
export function verificarPago(input: VerifyPaymentInput): PaymentVerification {
  if (input.token.toLowerCase() !== config.stablecoinAddress.toLowerCase()) {
    return {
      ok: false,
      reason: "wrong_token",
      explanation: `El token ${input.token} no coincide con el stablecoin esperado ${config.stablecoinAddress}.`,
    };
  }

  if (!input.to || input.value === undefined) {
    return {
      ok: false,
      reason: "missing_event_data",
      explanation: "El evento Transfer no trae receptor o monto; no se puede verificar el pago.",
    };
  }

  if (processedTxHashes.has(input.txHash.toLowerCase())) {
    return {
      ok: false,
      reason: "duplicate_tx",
      explanation: `La transacción ${input.txHash} ya fue procesada; se rechaza para evitar doble registro.`,
    };
  }

  const session = findPendingSessionByPayment(input.to, input.value);
  if (!session) {
    return {
      ok: false,
      reason: "order_not_found",
      explanation:
        "No hay una orden pendiente con el mismo receptor y monto exacto. Puede ser un pago vencido, duplicado o de otro QR.",
    };
  }

  processedTxHashes.add(input.txHash.toLowerCase());

  return {
    ok: true,
    session,
    txHash: input.txHash,
    explanation: `Pago verificado para orderId ${session.orderId}: token, monto y receptor coinciden.`,
  };
}
