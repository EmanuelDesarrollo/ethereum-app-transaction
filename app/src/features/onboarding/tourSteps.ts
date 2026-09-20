export type AppRole = "comercio" | "persona";

export type TourStep = {
  id: string;
  titulo: string;
  texto: string;
  pantalla: string;
  target: string;
};

export const TOUR: Record<AppRole, TourStep[]> = {
  comercio: [
    {
      id: "qr",
      titulo: "Genera tu QR",
      texto: "Escribe el monto y la nota. El QR sale al instante para cobrar con stablecoin.",
      pantalla: "ComercioChat",
      target: "qr-card",
    },
    {
      id: "chat",
      titulo: "Cobra hablando",
      texto: 'Tambien puedes escribir "cobrale 15 dolares a Ana" y el agente arma el cobro.',
      pantalla: "ComercioChat",
      target: "input-chat",
    },
    {
      id: "confirm",
      titulo: "Confirmacion onchain",
      texto: "Cuando el pago se confirme en HSK Chain veras el estado verde. No tienes que hacer nada mas.",
      pantalla: "ComercioChat",
      target: "estado-pago",
    },
  ],
  persona: [
    {
      id: "wallet",
      titulo: "Tu wallet es tuya",
      texto: "La llave privada se guarda solo en tu telefono. Nadie mas la tiene.",
      pantalla: "PersonaWallet",
      target: "saldo",
    },
    {
      id: "faucet",
      titulo: "Fondos de prueba",
      texto: "Usa Buy o Swap para pedir gas y mUSDC de demo antes del primer pago.",
      pantalla: "PersonaWallet",
      target: "btn-faucet",
    },
    {
      id: "scan",
      titulo: "Escanear y pagar",
      texto: "Toca Transfer, apunta al QR del comercio, revisa el monto y confirma.",
      pantalla: "PersonaScanner",
      target: "btn-escanear",
    },
  ],
};
