import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api, MOCK_SIGNALS } from '../api';
import { useStore } from '../store';
import { colors, card, typography } from '../theme';

type Tab = 'Overview' | 'Signals' | 'Rationale' | 'History';

const RISK_COLOR: Record<string, string> = { BUY: colors.emerald, SELL: colors.red, HOLD: colors.muted };
const KEY_RISKS: Record<string, string[]> = {
  BUY:  ['Global macro headwinds', 'Sector rotation risk', 'Earnings surprise risk'],
  SELL: ['Overbought technicals', 'Momentum exhaustion', 'Valuation premium risk'],
  HOLD: ['Range-bound market', 'Low volume uncertainty', 'Sector lagging benchmark'],
};

export function StockDetailScreen({ route, navigation }: any) {
  const { symbol } = route.params;
  const { accessToken } = useStore();
  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');
  const [qty, setQty] = useState('1');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [trading, setTrading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);

  useEffect(() => {
    api.signals.get(symbol, accessToken!)
      .then(s => { setSignal(s); setTradeType(s?.signal === 'SELL' ? 'SELL' : 'BUY'); })
      .catch(() => {
        const mock = MOCK_SIGNALS.find(s => s.symbol === symbol) ?? MOCK_SIGNALS[0];
        setSignal(mock);
        setTradeType(mock.signal === 'SELL' ? 'SELL' : 'BUY');
      })
      .finally(() => setLoading(false));
  }, [symbol]);

  const handleTrade = async () => {
    if (!accessToken || !signal) return;
    setTrading(true);
    try {
      await api.portfolio.trade({ symbol, type: tradeType, quantity: Number(qty), price: signal.currentPrice }, accessToken);
      setTradeSuccess(true);
      setTimeout(() => { setTradeSuccess(false); navigation.navigate('Portfolio'); }, 1800);
    } catch (e: any) { Alert.alert('Trade failed', e.message); }
    finally { setTrading(false); }
  };

  if (loading) return (
    <LinearGradient colors={['#050505', '#0a0804']} style={s.root}>
      <View style={s.center}><ActivityIndicator color={colors.gold} size="large" /></View>
    </LinearGradient>
  );

  if (!signal) return (
    <LinearGradient colors={['#050505', '#0a0804']} style={s.root}>
      <View style={s.center}><Text style={{ color: colors.red }}>Signal not found</Text></View>
    </LinearGradient>
  );

  const bullish = [signal.rsi < 30, signal.macd > 0, signal.suitabilityScore > 75, signal.changePercent > 0].filter(Boolean).length;
  const totalVal = Number(qty) * signal.currentPrice;
  const risks = KEY_RISKS[signal.signal] ?? KEY_RISKS.HOLD;

  return (
    <LinearGradient colors={['transparent', 'transparent']} style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <View>
            <View style={s.titleRow}>
              <Text style={s.symbol}>{signal.symbol}</Text>
              <View style={[s.badge, { borderColor: RISK_COLOR[signal.signal] + '40', backgroundColor: RISK_COLOR[signal.signal] + '15' }]}>
                <Text style={[s.badgeText, { color: RISK_COLOR[signal.signal] }]}>{signal.signal}</Text>
              </View>
            </View>
            <Text style={s.price}>₹{signal.currentPrice.toLocaleString('en-IN')}</Text>
            <Text style={[s.change, { color: signal.changePercent >= 0 ? colors.emerald : colors.red }]}>
              {signal.changePercent >= 0 ? '+' : ''}{signal.changePercent.toFixed(2)}% today
            </Text>
          </View>
          <View style={card.sm}>
            <Text style={typography.caption}>Confidence</Text>
            <Text style={[s.score, { color: colors.gold }]}>{signal.suitabilityScore}</Text>
            <Text style={typography.caption}>{bullish}/4 bullish</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {(['Overview', 'Signals', 'Rationale', 'History'] as Tab[]).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab content */}
        {tab === 'Overview' && (
          <View style={s.tabContent}>
            <View style={[card.glass, s.metricsGrid]}>
              {[
                { label: 'RSI (14)', value: signal.rsi.toFixed(1), color: signal.rsi < 30 ? colors.emerald : signal.rsi > 70 ? colors.red : colors.text, sub: signal.rsi < 30 ? 'Oversold' : signal.rsi > 70 ? 'Overbought' : 'Neutral' },
                { label: 'MACD', value: signal.macd.toFixed(3), color: signal.macd > 0 ? colors.emerald : colors.red, sub: signal.macd > 0 ? 'Bullish' : 'Bearish' },
                { label: 'Score', value: `${signal.suitabilityScore}/100`, color: colors.gold, sub: signal.suitabilityScore > 80 ? 'Strong fit' : 'Moderate' },
                { label: 'Alloc', value: `₹${(signal.suggestedAllocation / 1000).toFixed(0)}k`, color: colors.text, sub: 'Suggested' },
              ].map(({ label, value, color, sub }) => (
                <View key={label} style={s.metricCell}>
                  <Text style={typography.caption}>{label}</Text>
                  <Text style={[s.metricVal, { color }]}>{value}</Text>
                  <Text style={[typography.caption, { fontSize: 10 }]}>{sub}</Text>
                </View>
              ))}
            </View>
            <View style={[card.glass, { marginTop: 12 }]}>
              <Text style={[typography.label, { marginBottom: 10 }]}>Key Risks</Text>
              {risks.map((r, i) => (
                <View key={i} style={s.riskRow}>
                  <Text style={{ color: colors.red, fontSize: 10 }}>▲</Text>
                  <Text style={[typography.body, { fontSize: 13 }]}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'Rationale' && (
          <View style={[card.glass, s.tabContent]}>
            <View style={s.aiRow}>
              <View style={s.aiCircle}><Text style={s.aiLabel}>AI</Text></View>
              <View>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>AI Rationale Panel</Text>
                <Text style={typography.caption}>Signal analysis engine</Text>
              </View>
            </View>
            <View style={s.rationaleBox}>
              <Text style={[typography.body, { fontStyle: 'italic', color: colors.muted }]}>
                "{signal.rationale || `${signal.symbol} analysis: RSI at ${signal.rsi.toFixed(1)} ${signal.rsi < 30 ? 'is deeply oversold — mean reversion likely' : signal.rsi > 70 ? 'is overbought — pullback risk elevated' : 'is neutral'}. MACD ${signal.macd > 0 ? 'showing bullish momentum' : 'showing bearish momentum'}.`}"
              </Text>
            </View>
            <View style={s.rationaleMeta}>
              {[
                { label: 'Hold Period', value: '2–4 weeks' },
                { label: 'Target', value: `₹${(signal.currentPrice * 1.08).toFixed(0)}` },
                { label: 'Stop Loss', value: `₹${(signal.currentPrice * 0.95).toFixed(0)}` },
              ].map(({ label, value }) => (
                <View key={label} style={s.rationaleMetaItem}>
                  <Text style={typography.caption}>{label}</Text>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'Signals' && (
          <View style={[card.glass, s.tabContent]}>
            <Text style={[typography.label, { marginBottom: 14 }]}>Technical Indicators</Text>
            {[
              { name: 'RSI (14)', value: signal.rsi, max: 100, verdict: signal.rsi < 30 ? 'BUY' : signal.rsi > 70 ? 'SELL' : 'HOLD' },
              { name: 'Suitability Score', value: signal.suitabilityScore, max: 100, verdict: signal.suitabilityScore > 75 ? 'BUY' : signal.suitabilityScore > 40 ? 'HOLD' : 'SELL' },
              { name: 'Price Momentum', value: Math.max(0, Math.min(100, 50 + signal.changePercent * 10)), max: 100, verdict: signal.changePercent > 0 ? 'BUY' : 'SELL' },
            ].map(({ name, value, max, verdict }) => (
              <View key={name} style={{ marginBottom: 16 }}>
                <View style={s.indicatorRow}>
                  <Text style={[typography.body, { fontSize: 13 }]}>{name}</Text>
                  <View style={[s.badge, { borderColor: RISK_COLOR[verdict] + '40', backgroundColor: RISK_COLOR[verdict] + '15' }]}>
                    <Text style={[s.badgeText, { color: RISK_COLOR[verdict] }]}>{verdict}</Text>
                  </View>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${(value / max) * 100}%` as any, backgroundColor: verdict === 'BUY' ? colors.emerald : verdict === 'SELL' ? colors.red : colors.muted }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'History' && (
          <View style={[card.glass, s.tabContent]}>
            <Text style={[typography.label, { marginBottom: 14 }]}>Signal History</Text>
            {[
              { date: '15 May', sig: 'BUY',  price: (signal.currentPrice * 0.97).toFixed(0), rsi: '28.5' },
              { date: '10 May', sig: 'HOLD', price: (signal.currentPrice * 1.02).toFixed(0), rsi: '52.1' },
              { date: '5 May',  sig: 'SELL', price: (signal.currentPrice * 1.07).toFixed(0), rsi: '74.3' },
            ].map(({ date, sig, price, rsi }, i) => (
              <View key={i} style={s.historyRow}>
                <View style={[s.badge, { borderColor: RISK_COLOR[sig] + '40', backgroundColor: RISK_COLOR[sig] + '15' }]}>
                  <Text style={[s.badgeText, { color: RISK_COLOR[sig] }]}>{sig}</Text>
                </View>
                <Text style={[typography.body, { fontSize: 13 }]}>{date}</Text>
                <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>₹{Number(price).toLocaleString('en-IN')}</Text>
                  <Text style={typography.caption}>RSI {rsi}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Trade Panel */}
        <View style={[card.glass, s.tradePanel]}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18, marginBottom: 16 }}>Trade Simulation</Text>
          <View style={s.tradeToggle}>
            {(['BUY', 'SELL'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setTradeType(t)} style={[s.tradeToggleBtn,
                tradeType === t ? { backgroundColor: t === 'BUY' ? colors.emerald + '25' : colors.red + '25', borderColor: t === 'BUY' ? colors.emerald : colors.red } : {}]}>
                <Text style={[s.tradeToggleText, { color: tradeType === t ? (t === 'BUY' ? colors.emerald : colors.red) : colors.muted }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[typography.label, { marginTop: 12 }]}>QUANTITY</Text>
          <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={s.tradeInput} placeholderTextColor={colors.faint} />
          <View style={s.tradeSummaryRow}>
            <Text style={typography.caption}>Total value</Text>
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 16 }}>₹{totalVal.toLocaleString('en-IN')}</Text>
          </View>
          {tradeSuccess && (
            <View style={s.successBox}>
              <Text style={{ color: colors.emerald, fontWeight: '600' }}>✓ Order placed! Redirecting…</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleTrade} disabled={trading || tradeSuccess}
            style={[s.tradeBtn, { backgroundColor: tradeType === 'BUY' ? colors.emerald : colors.red }]}>
            {trading ? <ActivityIndicator color="#fff" /> : <Text style={s.tradeBtnText}>{tradeSuccess ? 'Done ✓' : `Place ${tradeType} Order`}</Text>}
          </TouchableOpacity>
          <Text style={[typography.caption, { textAlign: 'center', marginTop: 10 }]}>Virtual trade · No real funds</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 }, scroll: { paddingBottom: 60 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  symbol: { fontSize: 34, fontWeight: '700', color: colors.text },
  price: { fontSize: 26, fontWeight: '700', color: colors.gold },
  change: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  score: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabs: { paddingHorizontal: 16, gap: 4, marginBottom: 16 },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50, borderWidth: 1, borderColor: 'transparent' },
  tabActive: { borderColor: colors.gold + '50', backgroundColor: colors.gold + '15' },
  tabText: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  tabTextActive: { color: colors.gold, fontWeight: '700' },
  tabContent: { marginHorizontal: 16, marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metricCell: { width: '50%', paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', gap: 4 },
  metricVal: { fontSize: 20, fontWeight: '700' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  aiCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold + '20', borderWidth: 1, borderColor: colors.gold + '40', alignItems: 'center', justifyContent: 'center' },
  aiLabel: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  rationaleBox: { backgroundColor: colors.gold + '08', borderLeftWidth: 2, borderLeftColor: colors.gold + '50', padding: 14, borderRadius: 8, marginBottom: 16 },
  rationaleMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  rationaleMetaItem: { alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, flex: 1, marginHorizontal: 3 },
  indicatorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  tradePanel: { marginHorizontal: 16, marginBottom: 40 },
  tradeToggle: { flexDirection: 'row', gap: 10 },
  tradeToggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tradeToggleText: { fontWeight: '700', fontSize: 14 },
  tradeInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: colors.text, fontSize: 16, marginTop: 6 },
  tradeSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  successBox: { backgroundColor: colors.emerald + '15', borderWidth: 1, borderColor: colors.emerald + '40', borderRadius: 12, padding: 12, marginTop: 12, alignItems: 'center' },
  tradeBtn: { borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  tradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
});
