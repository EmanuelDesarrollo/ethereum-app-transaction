// IMPORTANTE: en un dispositivo físico "localhost" apunta al propio teléfono,
// no a tu computadora. Cambia esto a la IP de tu computadora en la red local
// (ej. "http://192.168.1.42:3000") antes de probar en un dispositivo real.
// En el emulador de Android usa "http://10.0.2.2:3000".
// IP de LAN del Mac — funciona tanto desde el simulador como desde un
// iPhone físico en la misma WiFi (localhost solo funciona en el simulador).
export const API_BASE_URL = "http://192.168.1.159:3000";

// HSK Chain testnet (ver contracts/README.md)
export const HSK_CHAIN_ID = 133;
export const HSK_RPC_URL = "https://testnet.hsk.xyz";
export const STABLECOIN_ADDRESS = "0x59e12F42dE357De29AA810E27C0c02650Ea66e85" as const;
export const STABLECOIN_DECIMALS = 6;

// Explorador público (Blockscout) de HSK Chain testnet — para mostrar prueba
// verificable de que las transacciones son reales, no simuladas.
export const HSK_EXPLORER_URL = "https://testnet-explorer.hskchain.net";
