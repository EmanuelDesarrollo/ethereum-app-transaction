import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;
type AuthMode = "landing" | "login" | "register" | "welcome";
type AuthState = { status: "idle" } | { status: "loading" } | { status: "error"; message: string };
type AccountType = "person" | "business";

const USERS_STORAGE_KEY = "tienda_stablecoin_users";
const SESSION_STORAGE_KEY = "tienda_stablecoin_session";
const DEMO_PERSON_EMAIL = "juem@gmail.com";
const DEMO_PERSON_PASSWORD = "1234";
const DEMO_PERSON_NAME = "Juan Emilio";
const DEMO_PERSON_DOCUMENT = "1000000000";

type DemoUser = {
  name: string;
  email: string;
  password: string;
};

async function loadUsers(): Promise<DemoUser[]> {
  const raw = await SecureStore.getItemAsync(USERS_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as DemoUser[]) : [];
}

async function saveUsers(users: DemoUser[]) {
  await SecureStore.setItemAsync(USERS_STORAGE_KEY, JSON.stringify(users));
}

function MiniDashboard() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.dashboardTop}>
        <View>
          <Text style={styles.dashboardHello}>Hola de nuevo</Text>
          <Text style={styles.dashboardMuted}>Balance disponible</Text>
        </View>
        <View style={styles.dashboardDot} />
      </View>
      <Text style={styles.balance}>$8790.0000</Text>
      <Text style={styles.balanceChange}>+ 3.65% hoy</Text>
      <View style={styles.actionsRow}>
        <View style={styles.actionCircle}>
          <Text style={styles.actionText}>QR</Text>
        </View>
        <View style={styles.actionCircle}>
          <Text style={styles.actionText}>Pay</Text>
        </View>
        <View style={styles.actionCircle}>
          <Text style={styles.actionText}>Tx</Text>
        </View>
      </View>
    </View>
  );
}

export function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [accountType, setAccountType] = useState<AccountType>("person");
  const [name, setName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<AuthState>({ status: "idle" });
  const [welcomeName, setWelcomeName] = useState("de vuelta");

  const isRegister = mode === "register";

  const resetState = (nextMode: AuthMode) => {
    setMode(nextMode);
    setState({ status: "idle" });
    if (nextMode === "login") {
      setEmail(DEMO_PERSON_EMAIL);
      setPassword(DEMO_PERSON_PASSWORD);
    }
    if (nextMode === "register") {
      setAccountType("person");
      setName(DEMO_PERSON_NAME);
      setDocumentId(DEMO_PERSON_DOCUMENT);
      setBusinessName("");
      setTaxId("");
      setContactName("");
      setEmail(DEMO_PERSON_EMAIL);
      setPassword(DEMO_PERSON_PASSWORD);
    }
  };

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanDocumentId = documentId.trim();
    const cleanBusinessName = businessName.trim();
    const cleanTaxId = taxId.trim();
    const cleanContactName = contactName.trim();

    if (
      !cleanEmail ||
      !password ||
      (isRegister && accountType === "person" && (!cleanName || !cleanDocumentId)) ||
      (isRegister && accountType === "business" && (!cleanBusinessName || !cleanTaxId || !cleanContactName))
    ) {
      setState({ status: "error", message: "Completa todos los campos." });
      return;
    }
    if (!cleanEmail.includes("@")) {
      setState({ status: "error", message: "Ingresa un correo valido." });
      return;
    }

    setState({ status: "loading" });
    try {
      if (!isRegister && cleanEmail === DEMO_PERSON_EMAIL && password === DEMO_PERSON_PASSWORD) {
        await SecureStore.setItemAsync(
          SESSION_STORAGE_KEY,
          JSON.stringify({ email: DEMO_PERSON_EMAIL, name: DEMO_PERSON_NAME, accountType: "person" }),
        );
        setWelcomeName(DEMO_PERSON_NAME);
        setMode("welcome");
        setState({ status: "idle" });
        return;
      }

      if (isRegister && accountType === "person") {
        if (
          cleanName !== DEMO_PERSON_NAME ||
          cleanDocumentId !== DEMO_PERSON_DOCUMENT ||
          cleanEmail !== DEMO_PERSON_EMAIL ||
          password !== DEMO_PERSON_PASSWORD
        ) {
          setState({ status: "error", message: "La persona natural demo ya viene con los datos de prueba." });
          return;
        }
        await SecureStore.setItemAsync(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            email: DEMO_PERSON_EMAIL,
            name: DEMO_PERSON_NAME,
            documentId: DEMO_PERSON_DOCUMENT,
            accountType: "person",
          }),
        );
        setWelcomeName(DEMO_PERSON_NAME);
        setMode("welcome");
        setState({ status: "idle" });
        return;
      }

      const users = await loadUsers();
      const existing = users.find((user) => user.email === cleanEmail);

      if (isRegister) {
        if (existing) {
          setState({ status: "error", message: "Ese correo ya tiene cuenta." });
          return;
        }
        const userName = accountType === "person" ? DEMO_PERSON_NAME : cleanBusinessName;
        const user: DemoUser = { name: userName, email: cleanEmail, password };
        await saveUsers([...users, user]);
        await SecureStore.setItemAsync(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            email: user.email,
            name: user.name,
            taxId: cleanTaxId,
            contactName: cleanContactName,
            accountType,
          }),
        );
        setWelcomeName(user.name);
        setMode("welcome");
        setState({ status: "idle" });
        return;
      }

      if (!existing || existing.password !== password) {
        setState({ status: "error", message: "Correo o contraseña incorrectos." });
        return;
      }

      await SecureStore.setItemAsync(
        SESSION_STORAGE_KEY,
        JSON.stringify({ email: existing.email, name: existing.name, accountType: "business" }),
      );
      setWelcomeName(existing.name || "de vuelta");
      setMode("welcome");
      setState({ status: "idle" });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  };

  if (mode === "welcome") {
    return (
      <SafeAreaView style={styles.safeAreaLight}>
        <View style={styles.welcomeContainer}>
          <MiniDashboard />
          <View style={styles.welcomeSheet}>
            <View style={styles.welcomeBadge}>
              <Text style={styles.welcomeBadgeText}>OK</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome back, {welcomeName}</Text>
            <Text style={styles.welcomeSubtitle}>Tu wallet esta lista para cobrar o pagar con stablecoins.</Text>
            <Pressable style={styles.darkButton} onPress={() => navigation.replace("RoleSelect")}>
              <Text style={styles.darkButtonText}>Entrar a Tienda Pay</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === "landing") {
    return (
      <SafeAreaView style={styles.safeAreaLight}>
        <View style={styles.landing}>
          <View style={styles.topLinkRow}>
            <Pressable onPress={() => resetState("login")}>
              <Text style={styles.topLink}>Login</Text>
            </Pressable>
          </View>

          <View style={styles.centerBrand}>
            <Text style={styles.logoText}>Tienda Pay</Text>
            <Text style={styles.bigWord}>X-Mate</Text>
            <Text style={styles.caption}>Enter the demo flow for stablecoin payments</Text>
          </View>

          <View style={styles.bottomActions}>
            <Pressable style={styles.darkButton} onPress={() => resetState("register")}>
              <Text style={styles.darkButtonText}>Crear cuenta</Text>
            </Pressable>
            <Pressable style={styles.lightButton} onPress={() => resetState("login")}>
              <Text style={styles.lightButtonText}>Ingresar</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaLight}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.formContainer}>
        <View style={styles.formStage}>
          <View style={styles.formPanel}>
            <Text style={styles.formTitle}>{isRegister ? "Create Wallet" : "Welcome Back"}</Text>
            <Text style={styles.formSubtitle}>
              {isRegister
                ? "Elige si la wallet sera para persona natural o empresa."
                : "Ingresa con la cuenta demo de persona natural."}
            </Text>

            <View style={styles.formFields}>
              {isRegister ? (
                <View style={styles.accountSwitch}>
                  <Pressable
                    style={[styles.accountOption, accountType === "person" && styles.accountOptionActive]}
                    onPress={() => {
                      setAccountType("person");
                      setName(DEMO_PERSON_NAME);
                      setDocumentId(DEMO_PERSON_DOCUMENT);
                      setBusinessName("");
                      setTaxId("");
                      setContactName("");
                      setEmail(DEMO_PERSON_EMAIL);
                      setPassword(DEMO_PERSON_PASSWORD);
                      setState({ status: "idle" });
                    }}
                  >
                    <Text
                      style={[styles.accountOptionText, accountType === "person" && styles.accountOptionTextActive]}
                    >
                      Persona natural
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.accountOption, accountType === "business" && styles.accountOptionActive]}
                    onPress={() => {
                      setAccountType("business");
                      setName("");
                      setDocumentId("");
                      setBusinessName("");
                      setTaxId("");
                      setContactName("");
                      setEmail("");
                      setPassword("");
                      setState({ status: "idle" });
                    }}
                  >
                    <Text
                      style={[styles.accountOptionText, accountType === "business" && styles.accountOptionTextActive]}
                    >
                      Empresa
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {isRegister ? (
                accountType === "person" ? (
                  <>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Nombre completo"
                      placeholderTextColor="#8f969d"
                      style={styles.input}
                      autoCapitalize="words"
                      editable={false}
                    />
                    <TextInput
                      value={documentId}
                      onChangeText={setDocumentId}
                      placeholder="Documento de identidad"
                      placeholderTextColor="#8f969d"
                      style={styles.input}
                      keyboardType="number-pad"
                      editable={false}
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="Razon social"
                      placeholderTextColor="#8f969d"
                      style={styles.input}
                      autoCapitalize="words"
                    />
                    <TextInput
                      value={taxId}
                      onChangeText={setTaxId}
                      placeholder="NIT / identificacion tributaria"
                      placeholderTextColor="#8f969d"
                      style={styles.input}
                    />
                    <TextInput
                      value={contactName}
                      onChangeText={setContactName}
                      placeholder="Nombre del representante"
                      placeholderTextColor="#8f969d"
                      style={styles.input}
                      autoCapitalize="words"
                    />
                  </>
                )
              ) : null}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electronico"
                placeholderTextColor="#8f969d"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isRegister || accountType === "business"}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contrasena"
                placeholderTextColor="#8f969d"
                style={styles.input}
                secureTextEntry
                editable={!isRegister || accountType === "business"}
              />
            </View>

            {state.status === "error" ? <Text style={styles.error}>{state.message}</Text> : null}

            <View style={styles.formActions}>
              <Pressable style={styles.darkButton} onPress={submit} disabled={state.status === "loading"}>
                {state.status === "loading" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.darkButtonText}>{isRegister ? "Create" : "Login"}</Text>
                )}
              </Pressable>

              <Pressable style={styles.backButton} onPress={() => resetState("landing")}>
                <Text style={styles.backButtonText}>Regresar</Text>
              </Pressable>

              <Pressable style={styles.switchMode} onPress={() => resetState(isRegister ? "login" : "register")}>
                <Text style={styles.switchModeText}>{isRegister ? "Ya tengo cuenta" : "Crear cuenta nueva"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaLight: { flex: 1, backgroundColor: "#f5f8f7" },
  landing: { flex: 1, paddingHorizontal: 28, paddingTop: 18, paddingBottom: 32 },
  topLinkRow: { alignItems: "center", minHeight: 40 },
  topLink: { color: "#202326", fontSize: 13, fontWeight: "700" },
  centerBrand: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#7e858b", fontSize: 13, fontWeight: "700", marginBottom: 92 },
  bigWord: { color: "#08090a", fontSize: 38, fontWeight: "900", letterSpacing: 0 },
  caption: { color: "#646b72", fontSize: 12, textAlign: "center", marginTop: 8 },
  bottomActions: { gap: 12 },
  darkButton: {
    backgroundColor: "#08090a",
    borderRadius: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  darkButtonText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  lightButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#08090a",
    borderRadius: 8,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  lightButtonText: { color: "#08090a", fontSize: 14, fontWeight: "900" },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formStage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formPanel: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    justifyContent: "center",
  },
  formTitle: { color: "#08090a", fontSize: 31, fontWeight: "900", marginBottom: 12, textAlign: "center" },
  formSubtitle: { color: "#646b72", fontSize: 13, lineHeight: 19, marginBottom: 18, textAlign: "center" },
  formFields: { gap: 10, marginBottom: 12 },
  accountSwitch: {
    flexDirection: "row",
    backgroundColor: "#e9efed",
    borderRadius: 8,
    padding: 4,
  },
  accountOption: {
    flex: 1,
    minHeight: 38,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  accountOptionActive: { backgroundColor: "#08090a" },
  accountOptionText: { color: "#606970", fontSize: 12, fontWeight: "900" },
  accountOptionTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5e8",
    borderRadius: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    color: "#08090a",
    fontSize: 14,
  },
  error: { color: "#b91c1c", fontSize: 12, fontWeight: "800", marginBottom: 10 },
  formActions: { gap: 10, marginTop: 2 },
  switchMode: { alignItems: "center", paddingTop: 4 },
  switchModeText: { color: "#3d454d", fontSize: 13, fontWeight: "800" },
  backButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cfd8dc",
    borderRadius: 8,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "#08090a", fontSize: 14, fontWeight: "900" },
  welcomeContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "#dfe5e3" },
  dashboard: { flex: 1, paddingHorizontal: 28, paddingTop: 58, opacity: 0.72 },
  dashboardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 },
  dashboardHello: { color: "#08090a", fontSize: 16, fontWeight: "900" },
  dashboardMuted: { color: "#5f676d", fontSize: 12, marginTop: 4 },
  dashboardDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#08090a" },
  balance: { color: "#08090a", fontSize: 34, fontWeight: "900" },
  balanceChange: { color: "#0f8f42", fontSize: 13, fontWeight: "800", marginTop: 6 },
  actionsRow: { flexDirection: "row", gap: 22, marginTop: 28 },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#08090a",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  welcomeSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 34,
    alignItems: "center",
  },
  welcomeBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#42e86f",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  welcomeBadgeText: { color: "#08090a", fontSize: 13, fontWeight: "900" },
  welcomeTitle: { color: "#08090a", fontSize: 21, fontWeight: "900", textAlign: "center" },
  welcomeSubtitle: { color: "#646b72", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8, marginBottom: 22 },
});
