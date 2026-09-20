import { useEffect, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { useTour } from "./TourProvider";

interface Props extends ViewProps {
  name: string;
}

export function TourTarget({ name, children, ...rest }: Props) {
  const ref = useRef<View>(null);
  const { registrar } = useTour();

  useEffect(() => {
    registrar(name, ref.current);
    return () => registrar(name, null);
  }, [name, registrar]);

  return (
    <View ref={ref} collapsable={false} {...rest}>
      {children}
    </View>
  );
}
