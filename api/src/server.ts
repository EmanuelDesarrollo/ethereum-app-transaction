import express from "express";
import cors from "cors";
import { config } from "./config";
import { checkoutRouter } from "./checkout/service";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/checkout", checkoutRouter);

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});
