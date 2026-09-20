# Documentación técnica — tienda-stablecoin-pay

## Tracks

- **EAG → Real-World Ethereum Applications.** El caso de uso es un comercio
  real (tienda de ropa que ya vende online) cobrando en stablecoin sin fricción
  para el cliente: no necesita saber qué es una wallet ni una red, solo
  escanea un QR.
- **HSK Chain (HashKey Chain) → Stablecoins.** Todo el movimiento de valor pasa
  por una transferencia ERC-20 de stablecoin en HSK Chain testnet.

## Caso de uso

1. El comercio dice o escribe: *"cóbrale 15 dólares a Ana por la camisa azul"*.
2. El agente (Claude Sonnet 5, function calling) extrae `{monto, moneda, nota}`
   y pide la herramienta `crear_cobro`. Si falta el monto o la moneda, pregunta
   antes de actuar — nunca asume.
3. El backend genera una sesión de cobro y un QR (nunca el modelo ejecuta el
   cobro directamente).
4. Ana escanea el QR con su rol de "persona" en la misma app — su wallet local
   firma la transferencia ERC-20 y la transmite a HSK Chain testnet.
5. Un listener del backend detecta la transferencia (evento `Transfer` del
   token, filtrado por destinatario) y llama `registrarVenta()` en
   `SalesRegistry`.
6. El comercio ve la confirmación en segundos (polling de
   `GET /checkout/:id`).

## Arquitectura

Ver el árbol completo en `README.md`. Puntos de diseño relevantes:

### Litmus test onchain/offchain

Solo una cosa vive onchain: el **registro permanente y verificable** de que una
venta ocurrió (`SalesRegistry.registrarVenta`). Es un compromiso que vale la
pena anotar de forma censura-resistente. Todo lo demás — sesiones de checkout,
historial de conversación del agente, estado "pending/confirmed" — es
efímero y vive en memoria del backend, porque cambia constantemente y no
necesita ni composabilidad ni resistencia a censura.

El pago en sí **no pasa por un contrato de custodia**: es una transferencia
ERC-20 normal, directa entre wallets. `SalesRegistry` solo anota que ocurrió,
después de que ya ocurrió.

### Por qué dos contratos y no uno

`SalesRegistry.sol` es exactamente lo que pide el alcance del hackathon: sin
lógica de custodia, sin roles complejos, sin historial crediticio. `owner`
(el backend) es el único que puede llamar `registrarVenta`.

`MockStablecoin.sol` se agregó porque no encontramos una dirección oficial y
verificable de USDC/USDT en HSK Chain testnet — la documentación oficial solo
lista tokens bridged en *mainnet*, y una de esas direcciones ni siquiera tenía
el largo correcto de una dirección Ethereum. Para no arriesgar la demo a una
dirección incorrecta, desplegamos un ERC-20 propio de 6 decimales con
`faucet()` público. Sigue dentro del rango "0-2 contratos para un MVP".

### Arquitectura multiagente

`POST /agent/message` usa un loop manual de tool-use (no el tool runner beta del
SDK) para que quede explícito en el código que **el modelo nunca ejecuta el
cobro**: solo puede pedir la tool `crear_cobro`. El backend enruta esa petición
al **Agente de cobros** (`api/src/agents/cobrosAgent.ts`), que crea el `orderId`,
convierte el monto a unidades del token, genera el QR y fija el vencimiento.
Las conversaciones viven en memoria por `conversationId`, lo que permite el
flujo "falta un dato → el agente pregunta → el comercio responde → se completa
el cobro".

El listener onchain usa el **Agente verificador**
(`api/src/agents/verificadorAgent.ts`) para revisar el `Transfer` ERC-20 que
representa el pago: token correcto, receptor correcto, monto exacto,
`orderId/sessionId` pendiente y transacciones duplicadas. Este agente es de solo
lectura; no firma ni mueve fondos.

Cuando el pago ya fue verificado y el registro determinístico en
`SalesRegistry` finaliza, el **Agente de registro y soporte**
(`api/src/agents/registroSoporteAgent.ts`) guarda el comprobante offchain,
historial y resumen diario. Este agente no cambia información onchain.

```text
Comercio -> Agente de cobros -> QR/orderId
Persona -> paga ERC-20 -> HSK Chain
Listener -> Agente verificador -> registro deterministico en SalesRegistry
         -> Agente de registro y soporte -> comprobante/historial/resumen
```

Como hardening de conocimiento Ethereum para agentes, el proyecto documenta el
uso de [`EthSkills`](ethskills.md): un conjunto de skills en Markdown que
corrigen errores comunes de LLMs sobre gas, costos, x402, ERC-8004, direcciones
de contratos, seguridad, testing e indexación. También fija la convención de
escritura "onchain" sin guion.

### Wallet no-custodial

La app genera una llave privada con `viem` (`generatePrivateKey`) la primera
vez que alguien entra al rol Persona, y la guarda **solo** en
`expo-secure-store` (Keychain en iOS, Keystore en Android). Nunca se envía al
backend ni sale del dispositivo. Pagar es firmar y transmitir un `transfer`
ERC-20 localmente — el backend nunca ve la llave ni firma en nombre de la
persona.

### Deviación de infraestructura: `POST /faucet/gas`

Una wallet de persona recién generada no tiene HSK para pagar gas, así que no
puede ni llamar `faucet()` en `MockStablecoin` ni pagar. Agregamos un endpoint
que usa la wallet del backend para mandar una pequeña cantidad de HSK (0.02,
una sola vez por dirección) a wallets nuevas. Es exclusivamente un helper de
demo — en producción la persona llegaría con su propia wallet ya fondeada.

## Roadmap (Fase 2 — no construido en este hackathon)

- **Off-ramp real a banco.** Integración con un proveedor tipo Bitso o
  Transak: la persona paga en stablecoin, el comercio recibe pesos/dólares en
  su cuenta bancaria automáticamente vía un webhook de confirmación.
- **NFC.** Emisor+receptor en Android, solo emisor en iOS — acercar los
  teléfonos en vez de escanear un QR.
- **Historial crediticio / reporte de ingresos.** Cada venta registrada
  onchain en `SalesRegistry` es un dato verificable de ingresos reales del
  comercio — base para microcréditos sin depender de un buró tradicional.
- **Machine Payment Protocol (MPP) / x402.** Pagos autónomos agente-a-agente
  — por ejemplo, un agente de compras del cliente pagándole directo al agente
  cajero del comercio, sin intervención humana en ninguno de los dos lados.
- **Entrada de voz.** Reconocimiento de voz nativo del dispositivo convierte a
  texto antes de llegar al agente — mismo endpoint `POST /agent/message`, no
  cambia la arquitectura. Quedó fuera de este hackathon por tiempo, no por
  diseño.
