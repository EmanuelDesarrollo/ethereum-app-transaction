import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppRole } from "./tourSteps";

const doneKey = (rol: AppRole) => `onboarding_v1_${rol}`;
const stepKey = (rol: AppRole) => `onboarding_v1_${rol}_step`;

export async function necesitaTour(rol: AppRole): Promise<boolean> {
  return (await AsyncStorage.getItem(doneKey(rol))) !== "done";
}

export async function marcarTourCompleto(rol: AppRole): Promise<void> {
  await AsyncStorage.setItem(doneKey(rol), "done");
  await AsyncStorage.setItem(stepKey(rol), "0");
}

export async function obtenerPasoTour(rol: AppRole): Promise<number> {
  const raw = await AsyncStorage.getItem(stepKey(rol));
  const step = raw ? Number(raw) : 0;
  return Number.isInteger(step) && step >= 0 ? step : 0;
}

export async function guardarPasoTour(rol: AppRole, paso: number): Promise<void> {
  await AsyncStorage.setItem(stepKey(rol), String(paso));
}

export async function reiniciarTour(rol: AppRole, paso = 0): Promise<void> {
  await AsyncStorage.setItem(doneKey(rol), "pending");
  await AsyncStorage.setItem(stepKey(rol), String(paso));
}
