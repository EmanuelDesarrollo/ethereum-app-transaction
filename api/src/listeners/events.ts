import { parseAbi, type Hash } from "viem";
import { config } from "../config";
import { publicClient, walletClient } from "../chain";
import { confirmCheckoutSession, findPendingSessionByPayment } from "../checkout/service";

const erc20TransferAbi = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]);

const salesRegistryAbi = parseAbi([
  "function registrarVenta(address comercio, uint256 monto, string nota) external",
]);

/// Escucha transferencias del stablecoin hacia la wallet del comercio, las
/// hace coincidir con una sesión de checkout pendiente (mismo destinatario y
/// mismo monto exacto) y anota la venta en SalesRegistry. El pago en sí ya
/// ocurrió onchain como transferencia ERC-20 normal — este listener no mueve
/// fondos, solo detecta y registra.
export function startPaymentListener() {
  console.log(
    `[listener] escuchando transferencias de ${config.stablecoinAddress} hacia ${config.comercioAddress}...`,
  );

  return publicClient.watchContractEvent({
    address: config.stablecoinAddress,
    abi: erc20TransferAbi,
    eventName: "Transfer",
    args: { to: config.comercioAddress },
    poll: true,
    pollingInterval: 3000,
    onLogs: (logs) => {
      for (const log of logs) {
        void handleTransfer(log.args.to, log.args.value, log.transactionHash);
      }
    },
    onError: (err) => console.error("[listener] error viendo eventos:", err),
  });
}

async function handleTransfer(to: `0x${string}` | undefined, value: bigint | undefined, txHash: Hash) {
  if (!to || value === undefined) return;

  const session = findPendingSessionByPayment(to, value);
  if (!session) {
    console.log(`[listener] transferencia de ${value} a ${to} sin sesión pendiente que coincida — se ignora`);
    return;
  }

  console.log(`[listener] pago detectado para sesión ${session.id} (tx ${txHash}). Registrando venta onchain...`);

  try {
    const registrarVentaHash = await walletClient.writeContract({
      address: config.salesRegistryAddress,
      abi: salesRegistryAbi,
      functionName: "registrarVenta",
      args: [session.comercio, value, session.nota],
    });

    await publicClient.waitForTransactionReceipt({ hash: registrarVentaHash });

    confirmCheckoutSession(session.id, txHash);
    console.log(`[listener] venta registrada onchain (${registrarVentaHash}). Sesión ${session.id} confirmada.`);
  } catch (err) {
    console.error(`[listener] fallo registrando la venta de la sesión ${session.id}:`, err);
  }
}
