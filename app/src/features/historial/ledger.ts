import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "xmate_ledger_v1";

export type LedgerMovement = {
  id: string;
  tipo: "venta" | "pago";
  monto: number;
  moneda: string;
  nota?: string;
  txHash?: string;
  orderId?: string;
  createdAt: string;
};

export async function listarMovimientos(): Promise<LedgerMovement[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as LedgerMovement[]) : [];
}

export async function registrarMovimiento(input: Omit<LedgerMovement, "id" | "createdAt">): Promise<void> {
  const current = await listarMovimientos();
  const movement: LedgerMovement = {
    ...input,
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([movement, ...current].slice(0, 50)));
}
