import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useTour } from "./TourProvider";
import { tourVisto } from "./storage";
import type { TourModo } from "./tourSteps";

export function useAutoTour(modo: TourModo) {
  const enfocada = useIsFocused();
  const { iniciarTour, tourActivo } = useTour();

  useEffect(() => {
    if (!enfocada || tourActivo) return;
    let cancelado = false;

    void (async () => {
      const visto = await tourVisto(modo);
      setTimeout(() => {
        if (!visto && !cancelado) iniciarTour(modo);
      }, 450);
    })();

    return () => {
      cancelado = true;
    };
  }, [enfocada, modo, tourActivo, iniciarTour]);
}
