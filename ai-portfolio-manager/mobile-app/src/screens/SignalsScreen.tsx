import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { api, MOCK_SIGNALS } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius } from '../theme';
import {
  ScreenHeader, SectionLabel, SignalBadge, FadeCard,
  ProgressBar, EmptyState, PillFilter,
} from '../components/UI';

type Filter = 'ALL' | 'BUY' | 'HOLD' | 'SELL';

export function SignalsScreen({ navigation }: any) {
  const { accessToken } = useStore();
  const [signals,    setSignals]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<Filter>('ALL');

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await api.signals.list(accessToken!);
      setSignals(data?.length ? data : MOCK_SIGNALS);
    } catch {
      setSignals(MOCK_SIGNALS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (accessToken) load(); }, [accessToken]);

  const displayed  = filter === 'ALL' ? signals : signals.filter(s => s.signal === filter);
  const buyCount   = signals.filter(s => s.signal === 'BUY').length;

  if (loading) return (
    <View style={[s.root, s.center]}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={[type.caption, { marginTop: 12 }]}>Loading signals…</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.gold} />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={type.label}>AI Signal Engine</Text>
          <Text style={s.headline}>
            <Text style={{ color: colors.gold }}>{buyCount}</Text> buy signals
          </Text>
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          <PillFilter<Filter>
            options={['ALL', 'BUY', 'HOLD', 'SELL']}
            value={filter}
            onChange={setFilter}
          />
        </ScrollView>

        {/* Signal count badge */}
        <View style={s.countRow}>
          <Text style={type.caption}>{displayed.length} signals</Text>
          {filter !== 'ALL' && (
            <TouchableOpacity onPress={() => setFilter('ALL')} activeOpacity={0.7}>
              <Text style={[type.caption, { color: colors.gold }]}>Clear filter ×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cards */}
        {displayed.length === 0 ? (
          <EmptyState message={`No ${filter.toLowerCase()} signals`} cta="Show all" onCta={() => setFilter('ALL')} />
        ) : (
          <View style={s.cards}>
            {displayed.map((sig, i) => {
              const bullishCount = [sig.rsi < 30, sig.macd > 0, sig.suitabilityScore > 75, sig.changePercent > 0].filter(Boolean).length;
              const isPos = sig.changePercent >= 0;
              return (
                <FadeCard key={sig.symbol} delay={i * 35}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => navigation.navigate('StockDetail', { symbol: sig.symbol })}
                    style={[card.glass, s.sigCard]}
                  >
                    {/* Top Row */}
                    <View style={s.topRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.symbol}>{sig.symbol}</Text>
                        <Text style={[type.body, { fontSize: 13, marginTop: 2, color: isPos ? colors.emerald : colors.red }]}>
                          ₹{sig.currentPrice?.toLocaleString('en-IN')} {'  '}
                          <Text style={{ fontWeight: '600' }}>{isPos ? '+' : ''}{sig.changePercent?.toFixed(2)}%</Text>
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <SignalBadge signal={sig.signal} />
                        <Text style={type.caption}>{bullishCount}/4 bullish</Text>
                      </View>
                    </View>

                    {/* Rationale */}
                    {sig.rationale ? (
                      <View style={s.rationaleWrap}>
                        <Text style={s.rationale} numberOfLines={2}>{sig.rationale}</Text>
                      </View>
                    ) : null}

                    {/* Metrics */}
                    <View style={s.metrics}>
                      {[
                        { label: 'RSI',   value: sig.rsi?.toFixed(1),                       color: sig.rsi < 30 ? colors.emerald : sig.rsi > 70 ? colors.red : colors.textDim },
                        { label: 'Score', value: `${sig.suitabilityScore}`,                  color: colors.gold },
                        { label: 'Alloc', value: `₹${(sig.suggestedAllocation / 1000).toFixed(0)}k`, color: colors.text },
                        { label: 'MACD',  value: sig.macd >= 0 ? 'Positive' : 'Negative',   color: sig.macd >= 0 ? colors.emerald : colors.red },
                      ].map(({ label, value, color }) => (
                        <View key={label} style={s.metric}>
                          <Text style={type.caption}>{label}</Text>
                          <Text style={[s.metricVal, { color }]}>{value}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Confidence bar */}
                    <ProgressBar value={sig.suitabilityScore} height={3} />
                  </TouchableOpacity>
                </FadeCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { paddingBottom: 120 },
  center:       { alignItems: 'center', justifyContent: 'center' },
  header:       { paddingHorizontal: space.screenX, paddingTop: space.screenH, paddingBottom: space.xl },
  headline:     { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 6, letterSpacing: -0.8 },
  filterRow:    { paddingHorizontal: space.screenX, gap: 8, paddingBottom: space.lg, flexDirection: 'row' },
  countRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.screenX, marginBottom: space.md },
  cards:        { paddingHorizontal: space.screenX, gap: 12 },
  sigCard:      { padding: 18 },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  symbol:       { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  rationaleWrap:{ borderLeftWidth: 2, borderLeftColor: colors.borderGold, paddingLeft: 12, marginBottom: 14 },
  rationale:    { fontSize: 12, color: colors.muted, lineHeight: 18 },
  metrics:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metric:       { alignItems: 'center', gap: 4 },
  metricVal:    { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
});
