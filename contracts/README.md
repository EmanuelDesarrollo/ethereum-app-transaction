# Contratos — tienda-stablecoin-pay

Foundry project con dos contratos para la demo en HSK Chain testnet:

- `src/SalesRegistry.sol` — anota ventas confirmadas onchain (sin custodia de fondos).
- `src/MockStablecoin.sol` — ERC-20 de prueba (6 decimales, `faucet()` público) usado
  como stablecoin en la demo, ya que no se encontró una dirección oficial de
  USDC/USDT verificable en HSK Chain testnet.

## Setup

```shell
cp .env.example .env   # completa PRIVATE_KEY (wallet del backend, con HSK testnet)
forge build
forge test
```

## Deploy en HSK Chain testnet

```shell
forge script script/Deploy.s.sol --rpc-url hsk_testnet --broadcast \
  --verify --verifier blockscout --verifier-url https://testnet-explorer.hskchain.net/api
```

Guarda las direcciones que imprime el script (`SalesRegistry`, `MockStablecoin`) — el
backend (`api/`) las necesita en su `.env`.

Red: HSK Chain Testnet — chain ID `133`, RPC `https://testnet.hsk.xyz`,
explorer `https://testnet-explorer.hskchain.net`. Faucet de HSK (gas): https://hskchain.net/faucet.

## Direcciones ya desplegadas y verificadas (HSK Chain testnet)

- `SalesRegistry`: [`0x47a1e2F914C6aB7523804c8eD2fE76df149735e0`](https://testnet-explorer.hskchain.net/address/0x47a1e2f914c6ab7523804c8ed2fe76df149735e0)
- `MockStablecoin` (mUSDC): [`0x59e12F42dE357De29AA810E27C0c02650Ea66e85`](https://testnet-explorer.hskchain.net/address/0x59e12f42de357de29aa810e27c0c02650ea66e85)
- Owner / deployer: `0xAb8856123BD6c2c1107bc87F74B0D42c942510d5`
