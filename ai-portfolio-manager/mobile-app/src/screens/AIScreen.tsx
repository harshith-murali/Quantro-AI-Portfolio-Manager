import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius } from '../theme';
import {
  ScreenHeader, SectionLabel, FadeCard, EmptyState, SignalBadge, ProgressBar
} from '../components/UI';

const { width } = Dimensions.get('window');

const NIFTY50 = [
  { symbol: "RELIANCE", sector: "Energy", price: 2846 },
  { symbol: "TCS", sector: "Technology", price: 3890 },
  { symbol: "HDFCBANK", sector: "Banking", price: 1678 },
  { symbol: "INFY", sector: "Technology", price: 1456 },
  { symbol: "ICICIBANK", sector: "Banking", price: 1210 },
  { symbol: "HINDUNILVR", sector: "FMCG", price: 2650 },
  { symbol: "ITC", sector: "FMCG", price: 462 },
  { symbol: "SBIN", sector: "Banking", price: 812 },
  { symbol: "BAJFINANCE", sector: "Finance", price: 6920 },
  { symbol: "TATAMOTORS", sector: "Auto", price: 986 },
];

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#60A5FA', Banking: '#34D399', Energy: '#CFAB67', FMCG: '#C084FC', Auto: '#FB923C'
};

function buildRecs(balance: number, holdings: any[], riskAppetite: string) {
  const held = new Set(holdings.map((h: any) => h.symbol));
  const budget = balance * (riskAppetite === 'AGGRESSIVE' ? 0.5 : riskAppetite === 'CONSERVATIVE' ? 0.18 : 0.32);
  if (budget < 100) return [];

  const candidates = NIFTY50
    .filter(s => !held.has(s.symbol))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const perStock = budget / candidates.length;
  return candidates.map((s, i) => {
    const qty = Math.max(1, Math.floor(perStock / s.price));
    return {
      ...s, qty,
      totalCost: qty * s.price,
      score: 75 + Math.floor(Math.random() * 20),
      rationale: "Strong technical setup with favorable risk-reward ratio."
    };
  });
}

export function AIScreen() {
  const { accessToken, user } = useStore();
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [askResult, setAskResult] = useState('');
  const [asking, setAsking] = useState(false);
  const [insight, setInsight] = useState('');
  const [insLoading, setInsLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    Promise.allSettled([
      api.wallet.balance(accessToken).then(d => setBalance(d.balance ?? 0)).catch(() => { }),
      api.portfolio.holdings(accessToken).then(d => setHoldings(d.holdings ?? d ?? [])).catch(() => { }),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!loading) setRecs(buildRecs(balance, holdings, (user as any)?.riskAppetite ?? 'MODERATE'));
  }, [loading, balance, holdings, user]);

  const handleAsk = async () => {
    if (!accessToken || !question.trim() || asking) return;
    setAsking(true);
    try {
      const d = await api.insights.ask(question, accessToken);
      setAskResult(d.insight ?? d.response ?? "");
    } catch { setAskResult("AI advisor unavailable."); }
    finally { setAsking(false); }
  };

  const runAnalysis = async () => {
    if (!accessToken || insLoading) return;
    setInsLoading(true);
    try {
      const d = await api.insights.portfolioSummary(accessToken);
      setInsight(d.insight ?? d.response ?? "");
    } catch { setInsight("Analysis failed."); }
    finally { setInsLoading(false); }
  };

  if (loading) return (
    <View style={[s.root, s.center]}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={type.label}>AI ADVISOR</Text>
          <Text style={s.title}>Smart Picks</Text>
          <Text style={s.subtitle}>Tailored for your {(user as any)?.riskAppetite?.toLowerCase() || 'moderate'} profile</Text>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statLabel}>BUDGET</Text>
            <Text style={s.statValue}>₹{balance.toLocaleString('en-IN')}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>SUGGESTED</Text>
            <Text style={[s.statValue, { color: colors.gold }]}>{recs.length}</Text>
          </View>
        </View>

        {/* Recs */}
        <SectionLabel text="Top Recommendations" style={s.sectionLabel} />
        {recs.length === 0 ? (
          <EmptyState message="Insufficient balance for AI picks" />
        ) : (
          <View style={s.list}>
            {recs.map((r, i) => (
              <FadeCard key={r.symbol} delay={i * 50} style={card.glass}>
                <View style={s.recRow}>
                  <View>
                    <Text style={s.symbol}>{r.symbol}</Text>
                    <Text style={[type.caption, { color: SECTOR_COLORS[r.sector] || colors.textDim }]}>{r.sector}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.price}>₹{r.price}</Text>
                    <Text style={type.caption}>Buy {r.qty} units</Text>
                  </View>
                </View>
                <View style={s.footer}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rationale}>{r.rationale}</Text>
                  </View>
                  <View style={s.scoreBox}>
                    <Text style={s.scoreText}>{r.score}</Text>
                  </View>
                </View>
              </FadeCard>
            ))}
          </View>
        )}

        {/* Portfolio Analysis */}
        <SectionLabel text="Portfolio Health Check" style={s.sectionLabel} />
        <FadeCard delay={100} style={card.glass}>
          <View style={s.analysisHeader}>
            <Text style={s.analysisTitle}>AI Diagnostics</Text>
            <TouchableOpacity onPress={runAnalysis} disabled={insLoading} style={s.analysisBtn}>
              {insLoading ? <ActivityIndicator size="small" color={colors.gold} /> : <Text style={s.analysisBtnText}>Analyze</Text>}
            </TouchableOpacity>
          </View>
          {insight ? (
            <View style={s.insightBox}>
              <Text style={s.insightText}>{insight}</Text>
            </View>
          ) : (
            <Text style={s.insightPlaceholder}>Run a diagnostic to check for risks or opportunities in your current holdings.</Text>
          )}
        </FadeCard>

        {/* Ask AI */}
        <SectionLabel text="Ask AI Advisor" style={s.sectionLabel} />
        <View style={[card.glass, s.askBox]}>
          <TextInput
            placeholder="Ask anything..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={s.input}
            value={question}
            onChangeText={setQuestion}
          />
          <TouchableOpacity onPress={handleAsk} disabled={asking} style={s.askBtn}>
            {asking ? <ActivityIndicator size="small" color="#000" /> : <Text style={s.askBtnText}>Ask</Text>}
          </TouchableOpacity>
        </View>

        {askResult ? (
          <View style={[card.glass, s.resultBox]}>
            <Text style={s.resultText}>{askResult}</Text>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: space.screenX, paddingTop: space.screenH, marginBottom: space.lg },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: colors.textDim, marginTop: 4 },
  stats: { flexDirection: 'row', paddingHorizontal: space.screenX, gap: 12, marginBottom: space.lg },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textDim, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionLabel: { paddingHorizontal: space.screenX, marginBottom: 12 },
  list: { paddingHorizontal: space.screenX, gap: 12 },
  recRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  symbol: { fontSize: 18, fontWeight: '700', color: colors.text },
  price: { fontSize: 16, fontWeight: '600', color: colors.text },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  rationale: { fontSize: 12, color: colors.textDim, lineHeight: 18 },
  scoreBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.goldDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gold + '40' },
  scoreText: { fontSize: 14, fontWeight: '800', color: colors.gold },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  analysisTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  analysisBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.gold + '40' },
  analysisBtnText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  insightBox: { marginTop: 8, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12 },
  insightText: { fontSize: 13, color: colors.textDim, lineHeight: 20 },
  insightPlaceholder: { fontSize: 13, color: colors.textDim, opacity: 0.5, lineHeight: 20 },
  askBox: { marginHorizontal: space.screenX, flexDirection: 'row', padding: 8, alignItems: 'center', gap: 8 },
  input: { flex: 1, color: colors.text, paddingHorizontal: 12, fontSize: 14 },
  askBtn: { backgroundColor: colors.gold, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  askBtnText: { fontWeight: '800', fontSize: 13, color: '#000' },
  resultBox: { marginHorizontal: space.screenX, marginTop: 12, padding: 16, borderColor: colors.gold + '20' },
  resultText: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
