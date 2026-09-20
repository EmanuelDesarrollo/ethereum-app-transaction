import { Router } from "express";
import { PrivyClient } from "@privy-io/node";
import { isAddress } from "viem";
import { config } from "../config";
import { createUser, findUserByEmail, findUserByPrivyId, linkPrivyId, type AccountType, type User } from "../users/store";

function toProfile(user: User) {
  const { password, privyId, id, ...profile } = user;
  return { userId: id, ...profile };
}

export const authRouter = Router();

let privyClient: PrivyClient | undefined;

function getPrivyClient(): PrivyClient {
  if (!config.privyAppId || !config.privyAppSecret) {
    throw new Error("Faltan PRIVY_APP_ID y PRIVY_APP_SECRET en api/.env");
  }
  privyClient ??= new PrivyClient({ appId: config.privyAppId, appSecret: config.privyAppSecret });
  return privyClient;
}

function getPrivyEmail(user: { linked_accounts?: Array<{ type?: string; address?: string }> }): string | undefined {
  const account = user.linked_accounts?.find((item) => item.type === "email" && typeof item.address === "string");
  return account?.address?.trim().toLowerCase();
}

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

authRouter.post("/privy", async (req, res) => {
  const { accessToken, accountType, name, walletAddress, documentId, businessName, taxId, contactName } = req.body ?? {};

  if (typeof accessToken !== "string" || !accessToken) {
    return res.status(400).json({ error: "falta accessToken de Privy" });
  }

  try {
    const privy = getPrivyClient();
    const claims = await privy.utils().auth().verifyAccessToken(accessToken);
    const privyUser = await privy.users()._get(claims.user_id);
    const email = getPrivyEmail(privyUser);

    if (!email) {
      return res.status(400).json({ error: "la cuenta de Privy no tiene email verificado" });
    }

    const existingByPrivy = findUserByPrivyId(claims.user_id);
    if (existingByPrivy) return res.json(toProfile(existingByPrivy));

    const existingByEmail = findUserByEmail(email);
    if (existingByEmail) {
      const linked = linkPrivyId(existingByEmail.id, claims.user_id) ?? existingByEmail;
      return res.json(toProfile(linked));
    }

    if (accountType !== "person" && accountType !== "business") {
      return res.status(404).json({ error: "cuenta nueva: completa el registro como persona o empresa" });
    }
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "falta name para crear el perfil local" });
    }
    if (typeof walletAddress !== "string" || !isAddress(walletAddress)) {
      return res.status(400).json({ error: "falta o es invalida walletAddress" });
    }

    const user = createUser({
      accountType: accountType as AccountType,
      name: name.trim(),
      email,
      // Privy reemplaza la contraseña; este valor queda solo por compatibilidad
      // con el store demo y no se usa para autenticar este flujo.
      password: `privy:${claims.user_id}`,
      privyId: claims.user_id,
      walletAddress: walletAddress as `0x${string}`,
      documentId: typeof documentId === "string" ? documentId.trim() : undefined,
      businessName: typeof businessName === "string" ? businessName.trim() : undefined,
      taxId: typeof taxId === "string" ? taxId.trim() : undefined,
      contactName: typeof contactName === "string" ? contactName.trim() : undefined,
    });

    return res.status(201).json(toProfile(user));
  } catch (err) {
    return res.status(401).json({ error: (err as Error).message });
  }
});
