import * as SecureStore from "expo-secure-store";
import type { TourModo } from "./tourSteps";

const KEY = (modo: TourModo) => `xmate_tour_${modo}_v1`;

export async function tourVisto(modo: TourModo): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEY(modo))) === "done";
  } catch {
    return true;
  }
}

export async function marcarTourVisto(modo: TourModo): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY(modo), "done");
  } catch {
    // El tour nunca debe romper el flujo principal.
  }
}

export async function reiniciarTour(modo: TourModo): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY(modo));
  } catch {
    // ignorado a propósito
  }
}

export async function reiniciarTours(): Promise<void> {
  await Promise.all([reiniciarTour("cobrar"), reiniciarTour("pagar")]);
}
