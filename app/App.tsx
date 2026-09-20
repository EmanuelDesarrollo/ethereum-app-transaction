import { PrivyProvider } from "@privy-io/expo";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from "./src/core/privy";

export default function App() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
      <RootNavigator />
    </PrivyProvider>
  );
}
