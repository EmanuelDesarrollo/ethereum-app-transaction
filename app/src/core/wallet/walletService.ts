import "react-native-get-random-values";
import * as SecureStore from "expo-secure-store";
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { parseAbi } from "viem";
import { publicClient, createAccountWalletClient } from "./chain";
import { STABLECOIN_ADDRESS, STABLECOIN_DECIMALS } from "../config";
import type { CheckoutPayload } from "../api/types";

function walletStorageKey(userId: string): string {
  return `wallet_${userId}`;
}

const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function faucet()",
]);

const cachedAccounts = new Map<string, PrivateKeyAccount>();

/// La llave privada nunca sale del dispositivo: vive solo en Keychain (iOS) /
/// Keystore (Android) vía expo-secure-store, una por usuario registrado (así
/// dos cuentas en el mismo dispositivo tienen wallets distintas). Si no
/// existe, se genera una vez y se guarda ahí mismo.
export async function getOrCreateAccount(userId: string): Promise<PrivateKeyAccount> {
  const cached = cachedAccounts.get(userId);
  if (cached) return cached;

  const key = walletStorageKey(userId);
  let privateKey = await SecureStore.getItemAsync(key);
  if (!privateKey) {
    privateKey = generatePrivateKey();
    await SecureStore.setItemAsync(key, privateKey);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  cachedAccounts.set(userId, account);
  return account;
}

/// Genera (sin guardar) un par de llaves nuevo — se usa al registrar una
/// cuenta: primero se obtiene la dirección para mandarla al backend, y solo
/// al recibir el userId real se persiste la llave privada bajo ese id.
export function generateWallet(): { address: `0x${string}`; privateKey: `0x${string}` } {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { address: account.address, privateKey };
}

export async function persistWalletForUser(userId: string, privateKey: `0x${string}`): Promise<PrivateKeyAccount> {
  await SecureStore.setItemAsync(walletStorageKey(userId), privateKey);
  const account = privateKeyToAccount(privateKey);
  cachedAccounts.set(userId, account);
  return account;
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
