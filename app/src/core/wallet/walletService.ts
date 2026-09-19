import "react-native-get-random-values";
import * as SecureStore from "expo-secure-store";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { parseAbi } from "viem";
import { publicClient, createAccountWalletClient } from "./chain";
import { STABLECOIN_ADDRESS, STABLECOIN_DECIMALS } from "../config";
import type { CheckoutPayload } from "../api/types";

const PRIVATE_KEY_STORAGE_KEY = "persona_wallet_private_key";

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function faucet()",
]);

let cachedAccount: PrivateKeyAccount | undefined;

/// La llave privada nunca sale del dispositivo: vive solo en Keychain (iOS) /
/// Keystore (Android) vía expo-secure-store. Si no existe, se genera una vez
/// y se guarda ahí mismo.
export async function getOrCreateAccount(): Promise<PrivateKeyAccount> {
  if (cachedAccount) return cachedAccount;

  let privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
  if (!privateKey) {
    privateKey = generatePrivateKey();
    await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, privateKey);
  }

  cachedAccount = privateKeyToAccount(privateKey as `0x${string}`);
  return cachedAccount;
}

export async function getStablecoinBalance(address: `0x${string}`): Promise<bigint> {
  return publicClient.readContract({
    address: STABLECOIN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

export function formatStablecoinAmount(units: bigint): string {
  const divisor = 10n ** BigInt(STABLECOIN_DECIMALS);
  const whole = units / divisor;
  const frac = units % divisor;
  return `${whole}.${frac.toString().padStart(STABLECOIN_DECIMALS, "0").slice(0, 2)}`;
}

/// Mintea stablecoin de prueba a la wallet de la persona (requiere que ya
/// tenga HSK para gas — ver requestGasSponsorship en core/api/client.ts).
export async function requestTestStablecoin(account: PrivateKeyAccount): Promise<`0x${string}`> {
  const walletClient = createAccountWalletClient(account);
  const hash = await walletClient.writeContract({
    address: STABLECOIN_ADDRESS,
    abi: erc20Abi,
    functionName: "faucet",
    args: [],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/// Paga un cobro escaneado: transferencia ERC-20 normal, firmada localmente,
/// directo a la wallet del comercio. Nada pasa por el backend hasta que el
/// listener detecta la transferencia onchain.
export async function payCheckout(account: PrivateKeyAccount, payload: CheckoutPayload): Promise<`0x${string}`> {
  const walletClient = createAccountWalletClient(account);
  const hash = await walletClient.writeContract({
    address: payload.token,
    abi: erc20Abi,
    functionName: "transfer",
    args: [payload.to, BigInt(payload.amount)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
