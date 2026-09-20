import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(__dirname, "../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} (revisa .env / .env.example)`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  privyAppId: process.env.PRIVY_APP_ID,
  privyAppSecret: process.env.PRIVY_APP_SECRET,
  hskRpcUrl: requireEnv("HSK_RPC_URL"),
  hskChainId: Number(requireEnv("HSK_CHAIN_ID")),
  salesRegistryAddress: requireEnv("SALES_REGISTRY_ADDRESS") as `0x${string}`,
  stablecoinAddress: requireEnv("STABLECOIN_ADDRESS") as `0x${string}`,
  stablecoinDecimals: Number(process.env.STABLECOIN_DECIMALS ?? 6),
  comercioAddress: requireEnv("COMERCIO_ADDRESS") as `0x${string}`,
  // Wallet owner de SalesRegistry — el listener la usa para llamar registrarVenta()
  // cuando detecta un pago confirmado onchain.
  backendPrivateKey: requireEnv("PRIVATE_KEY") as `0x${string}`,
};
