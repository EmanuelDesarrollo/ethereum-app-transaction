import type { CheckoutPayload } from "../api/types";

const PAYLOAD_TYPE = "tienda-stablecoin-pay/v1";
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function assertAddress(value: string | null, field: string): `0x${string}` {
  if (!value || !ADDRESS_RE.test(value)) {
    throw new Error(`campo ${field} invalido en el QR`);
  }
  return value as `0x${string}`;
}

function parsePositiveInteger(value: string | null, field: string): string {
  if (!value || !/^[0-9]+$/.test(value) || BigInt(value) <= 0n) {
    throw new Error(`campo ${field} invalido en el QR`);
  }
  return value;
}

export function parseCheckoutQr(data: string): CheckoutPayload {
  const trimmed = data.trim();

  if (trimmed.startsWith("{")) {
    const payload = JSON.parse(trimmed) as CheckoutPayload;
    if (payload.type !== PAYLOAD_TYPE) {
      throw new Error("este QR no es un cobro de tienda-stablecoin-pay");
    }
    return payload;
  }

  const match = trimmed.match(/^ethereum:(0x[a-fA-F0-9]{40})(?:@([0-9]+))?\/transfer\?(.*)$/);
  if (!match) {
    throw new Error("este QR no es un pago ERC-20 EIP-681 compatible");
  }

  const [, token, chainIdRaw, query] = match;
  const params = new URLSearchParams(query);
  const amount = parsePositiveInteger(params.get("uint256"), "uint256");
  const chainId = chainIdRaw ? Number(chainIdRaw) : 1;
  const decimals = Number(params.get("tienda_decimals") ?? 6);

  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("chainId invalido en el QR");
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new Error("decimals invalido en el QR");
  }

  return {
    type: PAYLOAD_TYPE,
    sessionId: params.get("tienda_session") ?? "",
    orderId: params.get("tienda_order") ?? params.get("tienda_session") ?? "",
    chainId,
    token: assertAddress(token, "token"),
    decimals,
    to: assertAddress(params.get("address"), "address"),
    amount,
    nota: params.get("tienda_note") ?? "",
  };
}
