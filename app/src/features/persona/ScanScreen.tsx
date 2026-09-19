import { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import type { CheckoutPayload } from "../../core/api/types";

type Props = NativeStackScreenProps<RootStackParamList, "Scan">;

export function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string>();

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos acceso a la cámara para escanear el QR de pago.</Text>
        <Button title="Dar permiso" onPress={requestPermission} />
      </View>
    );
  }

  const handleScan = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    try {
      const payload = JSON.parse(result.data) as CheckoutPayload;
      if (payload.type !== "tienda-stablecoin-pay/v1") {
        throw new Error("este QR no es un cobro de tienda-stablecoin-pay");
      }
      navigation.replace("PayConfirm", { payload });
    } catch (err) {
      setError((err as Error).message);
      setTimeout(() => {
        setScanned(false);
        setError(undefined);
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#fff" },
  text: { textAlign: "center" },
  errorBanner: { position: "absolute", bottom: 40, left: 24, right: 24, backgroundColor: "#b91c1c", padding: 16, borderRadius: 8 },
  errorText: { color: "#fff", textAlign: "center" },
});
