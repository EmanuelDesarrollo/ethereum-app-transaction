import { Router } from "express";
import { isAddress } from "viem";
import { createUser, findUserByEmail, type AccountType, type User } from "../users/store";

function toProfile(user: User) {
  const { password, id, ...profile } = user;
  return { userId: id, ...profile };
}

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const { accountType, name, email, password, walletAddress, documentId, businessName, taxId, contactName } =
    req.body ?? {};

  if (accountType !== "person" && accountType !== "business") {
    return res.status(400).json({ error: "accountType debe ser person o business" });
  }
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "falta name" });
  }
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "email invalido" });
  }
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ error: "falta password" });
  }
  if (typeof walletAddress !== "string" || !isAddress(walletAddress)) {
    return res.status(400).json({ error: "falta o es invalida walletAddress" });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "ese correo ya tiene cuenta" });
  }

  const user = createUser({
    accountType: accountType as AccountType,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    walletAddress: walletAddress as `0x${string}`,
    documentId: typeof documentId === "string" ? documentId.trim() : undefined,
    businessName: typeof businessName === "string" ? businessName.trim() : undefined,
    taxId: typeof taxId === "string" ? taxId.trim() : undefined,
    contactName: typeof contactName === "string" ? contactName.trim() : undefined,
  });

  return res.status(201).json(toProfile(user));
});

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "faltan email y password" });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "correo o contraseña incorrectos" });
  }

  return res.json(toProfile(user));
});
