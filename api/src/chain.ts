import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "./config";

export const hskChainTestnet: Chain = {
  id: config.hskChainId,
  name: "HSK Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [config.hskRpcUrl] } },
};

export const publicClient = createPublicClient({ chain: hskChainTestnet, transport: http(config.hskRpcUrl) });

export const backendAccount = privateKeyToAccount(config.backendPrivateKey);

export const walletClient = createWalletClient({
  account: backendAccount,
  chain: hskChainTestnet,
  transport: http(config.hskRpcUrl),
});
