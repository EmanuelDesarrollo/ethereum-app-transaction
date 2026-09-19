import { useCallback, useEffect, useState } from "react";
import type { PrivateKeyAccount } from "viem/accounts";
import {
  getOrCreateAccount,
  getStablecoinBalance,
  formatStablecoinAmount,
  requestTestStablecoin,
} from "../../core/wallet/walletService";
import { requestGasSponsorship } from "../../core/api/client";

export function usePersonaWallet() {
  const [account, setAccount] = useState<PrivateKeyAccount>();
  const [balance, setBalance] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const refreshBalance = useCallback(async (address: `0x${string}`) => {
    const units = await getStablecoinBalance(address);
    setBalance(formatStablecoinAmount(units));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const acc = await getOrCreateAccount();
        setAccount(acc);
        await refreshBalance(acc.address);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshBalance]);

  const requestTestFunds = useCallback(async () => {
    if (!account) return;
    setBusy(true);
    setError(undefined);
    try {
      // Sponsorea gas (una vez por dirección) y luego mintea stablecoin de
      // prueba — la persona necesita ambas cosas para poder pagar después.
      try {
        await requestGasSponsorship(account.address);
      } catch (err) {
        // Si ya fue sponsoreada antes (429), seguimos: puede que ya tenga gas.
        console.log("gas sponsorship:", (err as Error).message);
      }
      await requestTestStablecoin(account);
      await refreshBalance(account.address);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [account, refreshBalance]);

  return { account, balance, loading, busy, error, requestTestFunds, refreshBalance };
}
