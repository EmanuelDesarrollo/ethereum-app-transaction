import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";
import { HSK_CHAIN_ID, HSK_RPC_URL } from "../config";

export const hskChainTestnet: Chain = {
  id: HSK_CHAIN_ID,
  name: "HSK Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [HSK_RPC_URL] } },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://testnet-explorer.hskchain.net" },
  },
};

export const publicClient = createPublicClient({
  chain: hskChainTestnet,
  transport: http(HSK_RPC_URL),
});

export function createAccountWalletClient(account: PrivateKeyAccount) {
  return createWalletClient({ account, chain: hskChainTestnet, transport: http(HSK_RPC_URL) });
}
