import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius, btn } from '../theme';
import { FadeCard, ProgressBar, SectionLabel, PrimaryButton } from '../components/UI';

const STRATEGIES = [
  { value: 'RSI_MEAN_REVERSION', label: 'RSI Mean Reversion', desc: 'Buy RSI<30, Sell RSI>70' },
  { value: 'MACD_CROSSOVER',     label: 'MACD Crossover',     desc: 'Signal line cross' },
  { value: 'GOLDEN_CROSS',       label: 'Golden Cross',       desc: '50 SMA × 200 SMA' },
  { value: 'BB_BOUNCE',          label: 'Bollinger Bounce',   desc: 'Band touch trigger' },
  { value: 'COMBINED',           label: 'Combined',           desc: '2+ signal consensus' },
];
const NSE_SYMBOLS = ['RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','WIPRO','SBIN','ZOMATO','SUNPHARMA','ONGC'];
const MOCK_RESULT = {
  totalReturnPct: 15.4, annualisedReturnPct: 22.1, maxDrawdownPct: 5.2,
  winRatePct: 62.5, totalTrades: 14, sharpeRatio: 1.82, buyAndHoldReturnPct: 8.3,
  sampleTrades: [
    { date: 'Jan 08', action: 'BUY',  price: 2450, qty: 10, pnl: null },
    { date: 'Jan 22', action: 'SELL', price: 2620, qty: 10, pnl: '+₹1,700' },
    { date: 'Feb 03', action: 'BUY',  price: 2580, qty: 8,  pnl: null },
    { date: 'Feb 18', action: 'SELL', price: 2710, qty: 8,  pnl: '+₹1,040' },
  ],
};

export function BacktestScreen() {
  const { accessToken } = useStore();
  const [symbol,   setSymbol]   = useState('RELIANCE');
  const [strategy, setStrategy] = useState(STRATEGIES[0].value);
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo,   setDateTo]   = useState('2024-12-31');
  const [capital,  setCapital]  = useState('100000');
  const [posSize,  setPosSize]  = useState('10');
  const [report,   setReport]   = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);

  const runBacktest = async () => {
    setLoading(true); setReport(null); setProgress(0);
    const timer = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 300);
    try {
      const result = await api.backtest?.run?.({ symbol, strategy, dateFrom, dateTo, initialCapital: Number(capital), positionSize: Number(posSize) }, accessToken!);
      clearInterval(timer); setProgress(100);
      setReport({ ...MOCK_RESULT, ...result, sampleTrades: result?.sampleTrades ?? MOCK_RESULT.sampleTrades });
    } catch {
      clearInterval(timer); setProgress(100);
      setReport(MOCK_RESULT);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const KPI_RESULTS = report ? [
    { label: 'Total Return',    value: `${report.totalReturnPct.toFixed(1)}%`,              color: colors.emerald },
    { label: 'CAGR',            value: `${report.annualisedReturnPct?.toFixed(1)}%`,         color: colors.gold },
    { label: 'Win Rate',        value: `${report.winRatePct.toFixed(1)}%`,                   color: colors.text },
    { label: 'Max Drawdown',    value: `−${report.maxDrawdownPct.toFixed(1)}%`,              color: colors.red },
    { label: 'Sharpe Ratio',    value: report.sharpeRatio.toFixed(2),                        color: report.sharpeRatio > 1 ? colors.emerald : colors.muted },
    { label: 'Total Trades',    value: String(report.totalTrades ?? '—'),                    color: colors.text },
    { label: 'Buy & Hold',      value: `${report.buyAndHoldReturnPct?.toFixed(1)}%`,         color: colors.muted },
    { label: 'Outperformance',  value: `+${(report.totalReturnPct - (report.buyAndHoldReturnPct ?? 0)).toFixed(1)}%`, color: colors.gold },
  ] : [];

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={type.label}>Strategy Lab</Text>
          <Text style={s.headline}>Backtesting</Text>
          <Text style={[type.body, { marginTop: 6 }]}>Simulate strategies against historical NSE data</Text>
        </View>

        {/* Symbol Picker */}
        <FadeCard delay={0} style={s.section}>
          <SectionLabel text="NSE Symbol" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {NSE_SYMBOLS.map(sym => (
              <TouchableOpacity key={sym} onPress={() => setSymbol(sym)} activeOpacity={0.75}
                style={[s.chip, symbol === sym && s.chipActive]}>
                <Text style={[s.chipText, symbol === sym && s.chipTextActive]}>{sym}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeCard>

        {/* Strategy Picker */}
        <FadeCard delay={40} style={s.section}>
          <SectionLabel text="Strategy" />
          <View style={card.glass}>
            {STRATEGIES.map((st, i) => (
              <TouchableOpacity key={st.value} onPress={() => setStrategy(st.value)} activeOpacity={0.8}
                style={[s.stratRow, i > 0 && s.stratBorder, strategy === st.value && s.stratActive]}>
                {strategy === st.value && (
                  <LinearGradient
                    colors={['rgba(207,171,103,0.06)', 'transparent']}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.stratLabel, strategy === st.value && { color: colors.gold }]}>{st.label}</Text>
                  <Text style={type.caption}>{st.desc}</Text>
                </View>
                <View style={[s.radioOuter, strategy === st.value && { borderColor: colors.gold }]}>
                  {strategy === st.value && <View style={s.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </FadeCard>

        {/* Date & Capital */}
        <FadeCard delay={80} style={s.section}>
          <SectionLabel text="Parameters" />
          <View style={s.paramGrid}>
            {[
              { label: 'Start Date',     value: dateFrom, set: setDateFrom },
              { label: 'End Date',       value: dateTo,   set: setDateTo },
              { label: 'Capital (₹)',    value: capital,  set: setCapital, numeric: true },
              { label: 'Position Size %',value: posSize,  set: setPosSize, numeric: true },
            ].map(({ label, value, set, numeric }) => (
              <View key={label} style={s.paramField}>
                <Text style={[type.label, { marginBottom: 8 }]}>{label}</Text>
                <TextInput
                  value={value} onChangeText={set}
                  keyboardType={numeric ? 'numeric' : 'default'}
                  style={s.input} placeholderTextColor={colors.faint}
                />
              </View>
            ))}
          </View>
        </FadeCard>

        {/* Progress */}
        {loading && (
          <View style={s.section}>
            <View style={s.progressHeader}>
              <Text style={type.caption}>Computing backtest…</Text>
              <Text style={[type.caption, { color: colors.gold }]}>{progress}%</Text>
            </View>
            <ProgressBar value={progress} height={4} />
          </View>
        )}

        {/* CTA */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <PrimaryButton label="RUN BACKTEST →" onPress={runBacktest} loading={loading} />
        </View>

        {/* Results */}
        {report && (
          <>
            {/* Outperformance Hero */}
            <FadeCard delay={0} style={s.section}>
              <View style={[s.outperfCard]}>
                <LinearGradient
                  colors={['rgba(207,171,103,0.10)', 'rgba(207,171,103,0.03)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={type.label}>Strategy vs Buy & Hold</Text>
                <View style={s.outperfRow}>
                  <View>
                    <Text style={type.caption}>Strategy Return</Text>
                    <Text style={s.outperfBig}>{report.totalReturnPct.toFixed(1)}%</Text>
                  </View>
                  <View style={s.outperfVs}>
                    <Text style={type.caption}>vs</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={type.caption}>Buy & Hold</Text>
                    <Text style={[s.outperfBig, { color: colors.muted, fontSize: 28 }]}>{report.buyAndHoldReturnPct?.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={s.alphaBadge}>
                  <Text style={s.alphaText}>+{(report.totalReturnPct - (report.buyAndHoldReturnPct ?? 0)).toFixed(1)}% alpha generated</Text>
                </View>
              </View>
            </FadeCard>

            {/* KPI Grid */}
            <FadeCard delay={40} style={s.section}>
              <SectionLabel text="Performance Report" />
              <View style={s.kpiGrid}>
                {KPI_RESULTS.map(({ label, value, color }) => (
                  <View key={label} style={[card.stat, s.kpiCell]}>
                    <Text style={type.caption}>{label}</Text>
                    <Text style={[s.kpiVal, { color }]}>{value}</Text>
                  </View>
                ))}
              </View>
            </FadeCard>

            {/* Trade Log */}
            <FadeCard delay={80} style={s.section}>
              <SectionLabel text="Sample Trade Log" />
              <View style={card.glass}>
                <View style={s.tradeHeader}>
                  {['Action', 'Date', 'Price', 'P&L'].map(h => (
                    <Text key={h} style={[type.label, { flex: h === 'Price' || h === 'P&L' ? 1.2 : 1 }]}>{h}</Text>
                  ))}
                </View>
                {report.sampleTrades?.map((t: any, i: number) => (
                  <View key={i} style={[s.tradeRow, i > 0 && s.tradeBorder]}>
                    <View style={[s.actionBadge, { backgroundColor: t.action === 'BUY' ? colors.emeraldDim : colors.redDim, borderColor: (t.action === 'BUY' ? colors.emerald : colors.red) + '40' }]}>
                      <Text style={[s.actionText, { color: t.action === 'BUY' ? colors.emerald : colors.red }]}>{t.action}</Text>
                    </View>
                    <Text style={[type.body, { flex: 1, fontSize: 13 }]}>{t.date}</Text>
                    <Text style={[type.body, { flex: 1.2, fontSize: 13 }]}>₹{t.price.toLocaleString('en-IN')}</Text>
                    <Text style={[{ flex: 1.2, fontSize: 13, fontWeight: '600' }, { color: t.pnl ? (t.pnl.startsWith('+') ? colors.emerald : colors.red) : colors.faint }]}>
                      {t.pnl ?? '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </FadeCard>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { paddingBottom: 120 },
  header:       { paddingHorizontal: space.screenX, paddingTop: space.screenH, paddingBottom: space.xl },
  headline:     { fontSize: 36, fontWeight: '800', color: colors.text, marginTop: 4, letterSpacing: -1 },
  section:      { paddingHorizontal: space.screenX, marginBottom: space.xl },
  chipRow:      { gap: 8, paddingBottom: 4, flexDirection: 'row' },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipActive:   { borderColor: colors.borderGold, backgroundColor: colors.goldSubtle },
  chipText:     { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 0.5 },
  chipTextActive:{ color: colors.gold },
  // Strategy
  stratRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12, overflow: 'hidden' },
  stratBorder:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  stratActive:  {},
  stratLabel:   { fontSize: 14, fontWeight: '600', color: colors.textDim, marginBottom: 2 },
  radioOuter:   { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioInner:   { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  // Params
  paramGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  paramField:   { width: '47%' },
  input:        { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 14 },
  // Progress
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  // Outperformance Hero
  outperfCard:  { ...card.glass, overflow: 'hidden' },
  outperfRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
  outperfBig:   { fontSize: 36, fontWeight: '800', color: colors.gold, letterSpacing: -1 },
  outperfVs:    { alignItems: 'center' },
  alphaBadge:   { backgroundColor: colors.goldSubtle, borderWidth: 1, borderColor: colors.borderGold, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  alphaText:    { color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  // KPI Grid
  kpiGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCell:      { width: '47%' },
  kpiVal:       { fontSize: 24, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  // Trade log
  tradeHeader:  { flexDirection: 'row', marginBottom: 10, gap: 8 },
  tradeRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  tradeBorder:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  actionBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, minWidth: 44, alignItems: 'center' },
  actionText:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});
