import * as SecureStore from "expo-secure-store";
import type { AccountType } from "./api/types";

const SESSION_STORAGE_KEY = "tienda_stablecoin_session";

export interface Session {
  userId: string;
  name: string;
  email: string;
  accountType: AccountType;
  walletAddress: `0x${string}`;
}

export async function getSession(): Promise<Session | undefined> {
  const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Session) : undefined;
}

export async function setSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function updateSession(patch: Partial<Session>): Promise<void> {
  const current = await getSession();
  await setSession({ ...current, ...patch } as Session);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
