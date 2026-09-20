import { Router } from "express";
import QRCode from "qrcode";
import { isAddress } from "viem";
import { config } from "../config";

export const receiveQrRouter = Router();

receiveQrRouter.post("/receive-qr", async (req, res) => {
  const { address } = req.body ?? {};

  if (typeof address !== "string" || !isAddress(address)) {
    return res.status(400).json({ error: "falta o es invalida la direccion de la wallet" });
  }

  const payload = {
    type: "xmate-receive/v1",
    chainId: config.hskChainId,
    token: config.stablecoinAddress,
    symbol: "mUSDC",
    decimals: config.stablecoinDecimals,
    to: address,
  };

  const qrDataUrl = await QRCode.toDataURL(address);
  return res.json({ qrDataUrl, payload });
});
