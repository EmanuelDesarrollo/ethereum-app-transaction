import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} (revisa .env / .env.example)`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  hskRpcUrl: requireEnv("HSK_RPC_URL"),
  hskChainId: Number(requireEnv("HSK_CHAIN_ID")),
  salesRegistryAddress: requireEnv("SALES_REGISTRY_ADDRESS") as `0x${string}`,
  stablecoinAddress: requireEnv("STABLECOIN_ADDRESS") as `0x${string}`,
  stablecoinDecimals: Number(process.env.STABLECOIN_DECIMALS ?? 6),
  comercioAddress: requireEnv("COMERCIO_ADDRESS") as `0x${string}`,
};
