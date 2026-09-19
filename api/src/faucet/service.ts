import { Router } from "express";
import { isAddress } from "viem";
import { publicClient, walletClient } from "../chain";

// Suficiente para que una wallet nueva llame faucet() en MockStablecoin y
// luego pague un cobro de prueba. Solo para la demo del hackathon.
const GAS_SPONSOR_AMOUNT = 20_000_000_000_000_000n; // 0.02 HSK

// Evita que la misma dirección pida gas repetidas veces y drene la wallet
// del backend durante la demo — no es control de abuso real.
const sponsoredAddresses = new Set<string>();

export const faucetRouter = Router();

faucetRouter.post("/gas", async (req, res) => {
  const { address } = req.body ?? {};

  if (typeof address !== "string" || !isAddress(address)) {
    return res.status(400).json({ error: "falta o es inválida la dirección (address)" });
  }

  const key = address.toLowerCase();
  if (sponsoredAddresses.has(key)) {
    return res.status(429).json({ error: "esta dirección ya recibió gas de prueba" });
  }

  try {
    const hash = await walletClient.sendTransaction({ to: address as `0x${string}`, value: GAS_SPONSOR_AMOUNT });
    await publicClient.waitForTransactionReceipt({ hash });
    sponsoredAddresses.add(key);
    return res.json({ txHash: hash });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});
