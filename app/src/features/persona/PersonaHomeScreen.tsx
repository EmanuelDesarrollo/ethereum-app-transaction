import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { usePersonaWallet } from "./usePersonaWallet";

type Props = NativeStackScreenProps<RootStackParamList, "PersonaHome">;

const marketCards = [
  { title: "Mood", value: "16", trend: "Fear+", color: "#b13a3a" },
  { title: "WBT", value: "+14.87%", trend: "Live", color: "#3f9142" },
  { title: "XLM", value: "+12.27%", trend: "Hot", color: "#3f9142" },
  { title: "ADA", value: "+3.96%", trend: "Up", color: "#3f9142" },
];

const cryptoRows = [
  { symbol: "BTC", name: "Bitcoin", amount: "0.00207624 BTC", value: "$122.21", change: "-0.67%", color: "#ff9f1a" },
  { symbol: "ETH", name: "Ethereum", amount: "0.0143228 ETH", value: "$22.60", change: "-0.26%", color: "#4d5488" },
  { symbol: "USDC", name: "Mock USDC", amount: "HSK testnet", value: "$1.00", change: "+0.14%", color: "#2f80ed" },
];

export function PersonaHomeScreen({ navigation }: Props) {
  const { account, balance, loading, busy, error, requestTestFunds } = usePersonaWallet();
  const visibleBalance = balance ? Number(balance).toFixed(2) : "0.00";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Preparando tu wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={[styles.roundIcon, styles.roundIconActive]}>
              <Ionicons name="person-outline" size={28} color="#fff" />
            </View>
            <View style={styles.roundIcon}>
              <Ionicons name="navigate-circle-outline" size={31} color="#08090a" />
            </View>
            <View style={styles.roundIcon}>
              <Ionicons name="search-outline" size={31} color="#08090a" />
            </View>
          </View>
          <View style={styles.roundIcon}>
            <Ionicons name="time-outline" size={31} color="#08090a" />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.balance}>
            ${visibleBalance}
            <Text style={styles.balanceCents}> mUSDC</Text>
          </Text>
          <View style={styles.changePill}>
            <Text style={styles.changePositive}>+1.26%</Text>
            <Text style={styles.changeText}> · Today</Text>
            <Ionicons name="chevron-forward" size={18} color="#08090a" />
          </View>
          <Text style={styles.address} numberOfLines={1}>
            {account?.address}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actionGrid}>
          <Pressable style={styles.actionCard} onPress={() => navigation.navigate("Scan")}>
            <Ionicons name="swap-vertical" size={31} color="#08090a" />
            <Text style={styles.actionLabel}>Transfer</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={requestTestFunds} disabled={busy}>
            {busy ? <ActivityIndicator color="#08090a" /> : <Ionicons name="repeat-outline" size={31} color="#08090a" />}
            <Text style={styles.actionLabel}>Swap</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={requestTestFunds} disabled={busy}>
            {busy ? <ActivityIndicator color="#08090a" /> : <Ionicons name="add" size={34} color="#08090a" />}
            <Text style={styles.actionLabel}>Buy</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Market</Text>
            <Ionicons name="chevron-forward" size={27} color="#6d6d6d" />
          </View>
          <View style={styles.trendingRow}>
            <Text style={styles.trending}>Trending</Text>
            <Ionicons name="chevron-down" size={20} color="#777" />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marketList}>
          {marketCards.map((item) => (
            <View key={item.title} style={styles.marketCard}>
              <View style={[styles.marketBadge, { borderColor: item.color }]}>
                <Text style={styles.marketBadgeText}>{item.value.replace("+", "")}</Text>
              </View>
              <Text style={styles.marketTitle}>{item.title}</Text>
              <Text style={[styles.marketTrend, { color: item.color }]}>{item.trend}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            Crypto <Text style={styles.sectionMuted}>(25)</Text>
          </Text>
          <Ionicons name="chevron-forward" size={27} color="#6d6d6d" />
        </View>

        <View style={styles.cryptoList}>
          {cryptoRows.map((item) => (
            <View key={item.symbol} style={styles.cryptoRow}>
              <View style={[styles.cryptoIcon, { backgroundColor: item.color }]}>
                <Text style={styles.cryptoSymbol}>{item.symbol.slice(0, 1)}</Text>
              </View>
              <View style={styles.cryptoInfo}>
                <Text style={styles.cryptoName}>{item.name}</Text>
                <Text style={styles.cryptoAmount}>{item.amount}</Text>
              </View>
              <View style={styles.cryptoValueBox}>
                <Text style={styles.cryptoValue}>{item.value}</Text>
                <Text style={[styles.cryptoChange, item.change.startsWith("-") ? styles.negative : styles.positive]}>
                  {item.change}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.navItemActive}>
          <Ionicons name="home" size={30} color="#08090a" />
          <Text style={styles.navTextActive}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="repeat-outline" size={28} color="#08090a" />
          <Text style={styles.navText}>Swap</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="analytics-outline" size={27} color="#08090a" />
          <Text style={styles.navText}>Earn</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="card-outline" size={28} color="#08090a" />
          <Text style={styles.navText}>Card</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff" },
  loadingText: { color: "#555", fontWeight: "700" },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 130 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 60 },
  topLeft: { flexDirection: "row", gap: 14 },
  roundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
  },
  roundIconActive: { backgroundColor: "#08090a" },
  hero: { alignItems: "center", marginBottom: 62 },
  balance: { color: "#000", fontSize: 56, fontWeight: "900", letterSpacing: 0 },
  balanceCents: { color: "#6c6c6c", fontSize: 28, fontWeight: "900" },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 22,
  },
  changePositive: { color: "#3f9142", fontSize: 24, fontWeight: "900" },
  changeText: { color: "#08090a", fontSize: 24, fontWeight: "700" },
  address: { color: "#9b9b9b", fontSize: 12, marginTop: 12, maxWidth: "90%" },
  error: { color: "#b91c1c", fontSize: 13, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  actionGrid: { flexDirection: "row", gap: 12, marginBottom: 34 },
  actionCard: {
    flex: 1,
    height: 110,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionLabel: { color: "#08090a", fontSize: 22, fontWeight: "900" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { color: "#08090a", fontSize: 32, fontWeight: "900" },
  sectionMuted: { color: "#737373" },
  trendingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trending: { color: "#777", fontSize: 24, fontWeight: "900" },
  marketList: { gap: 12, paddingBottom: 34 },
  marketCard: {
    width: 116,
    height: 132,
    borderRadius: 8,
    backgroundColor: "#fbfbfb",
    padding: 14,
    justifyContent: "flex-end",
  },
  marketBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  marketBadgeText: { color: "#08090a", fontSize: 18, fontWeight: "900" },
  marketTitle: { color: "#08090a", fontSize: 23, fontWeight: "900" },
  marketTrend: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  cryptoList: { marginTop: 20, gap: 20 },
  cryptoRow: { flexDirection: "row", alignItems: "center" },
  cryptoIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  cryptoSymbol: { color: "#fff", fontSize: 28, fontWeight: "900" },
  cryptoInfo: { flex: 1, marginLeft: 16 },
  cryptoName: { color: "#08090a", fontSize: 20, fontWeight: "900" },
  cryptoAmount: { color: "#777", fontSize: 17, marginTop: 4 },
  cryptoValueBox: { alignItems: "flex-end" },
  cryptoValue: { color: "#08090a", fontSize: 22, fontWeight: "900" },
  cryptoChange: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  negative: { color: "#b13a3a" },
  positive: { color: "#3f9142" },
  bottomNav: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 20,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(245,245,245,0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  navItemActive: {
    width: 92,
    height: 74,
    borderRadius: 34,
    backgroundColor: "#ededed",
    alignItems: "center",
    justifyContent: "center",
  },
  navItem: { alignItems: "center", justifyContent: "center", gap: 4 },
  navTextActive: { color: "#08090a", fontSize: 16, fontWeight: "900", marginTop: 2 },
  navText: { color: "#08090a", fontSize: 15, fontWeight: "800" },
});
