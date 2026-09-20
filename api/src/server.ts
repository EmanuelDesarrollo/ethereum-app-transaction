import express from "express";
import cors from "cors";
import { config } from "./config";
import { checkoutRouter } from "./checkout/service";
import { agentRouter } from "./agent/router";
import { faucetRouter } from "./faucet/service";
import { startPaymentListener } from "./listeners/events";
import { soporteRouter } from "./agents/registroSoporteAgent";
import { guiaRouter } from "./agents/guiaAgent";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/checkout", checkoutRouter);
app.use("/agent", agentRouter);
app.use("/agent", guiaRouter);
app.use("/faucet", faucetRouter);
app.use("/support", soporteRouter);

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});

startPaymentListener();
