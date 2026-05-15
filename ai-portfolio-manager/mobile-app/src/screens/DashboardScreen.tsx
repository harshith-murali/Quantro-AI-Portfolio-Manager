import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius } from '../theme';
import {
  ScreenHeader, StatCard, SectionLabel, SignalBadge,
  MarketBadge, FadeCard, ProgressBar, EmptyState,
} from '../components/UI';

const { width } = Dimensions.get('window');

function isMarketOpen() {
  const now = new Date();
  const d = now.getDay();
  if (d === 0 || d === 6) return false;
  const h = now.getHours(), m = now.getMinutes();
  return (h > 9 || (h === 9 && m >= 15)) && (h < 15 || (h === 15 && m < 30));
}

export function DashboardScreen({ navigation }: any) {
  const { accessToken, user, setUser } = useStore();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [signals,   setSignals]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    Promise.allSettled([
      api.profile.get(accessToken).then((d) => setUser(d.profile ?? d)).catch(() => {}),
      api.portfolio.summary(accessToken).then((d) => setPortfolio(d.summary ?? d)).catch(() => {}),
      api.dashboard.summary(accessToken).then((d) => {
        if (d?.topMovers) setSignals(d.topMovers);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [accessToken]);

  const marketOpen  = isMarketOpen();
  const totalValue  = portfolio?.totalValue ?? 0;
  const totalPnl    = (portfolio?.unrealisedPnl ?? 0) + (portfolio?.realisedPnl ?? 0);
  const buySignals  = signals.filter(s => s.signal === 'BUY');
  const cash        = portfolio?.virtualCash ?? 100000;

  if (loading) return (
    <View style={[s.root, s.center]}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={[type.caption, { marginTop: 12 }]}>Loading portfolio…</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ flex: 1 }}>
            <Text style={type.label}>Overview</Text>
            <Text style={s.greeting}>
              Hey, <Text style={{ color: colors.gold }}>{user?.name?.split(' ')[0] ?? 'Investor'}</Text>
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MarketBadge open={marketOpen} />
            <TouchableOpacity 
              onPress={() => navigation.navigate('Profile')}
              style={s.profileBtn}
            >
              <Text style={s.profileInitial}>{user?.name?.[0] ?? 'U'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Portfolio Card */}
        <FadeCard delay={0} style={[s.heroCard]}>
          <LinearGradient
            colors={['rgba(207,171,103,0.07)', 'rgba(207,171,103,0.02)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={type.label}>Total Portfolio Value</Text>
          <Text style={s.heroValue}>₹{totalValue.toLocaleString('en-IN')}</Text>
          <View style={s.heroRow}>
            <View style={[s.pnlBadge, { backgroundColor: totalPnl >= 0 ? colors.emeraldDim : colors.redDim, borderColor: (totalPnl >= 0 ? colors.emerald : colors.red) + '40' }]}>
              <Text style={[s.pnlText, { color: totalPnl >= 0 ? colors.emerald : colors.red }]}>
                {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN')} P&L
              </Text>
            </View>
            <Text style={[type.caption, { marginLeft: 'auto' as any }]}>
              {buySignals.length} active signals
            </Text>
          </View>
        </FadeCard>

        {/* KPI Row */}
        <FadeCard delay={60}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kpiRow}>
            <StatCard label="Cash" value={`₹${(cash / 1000).toFixed(0)}k`} valueColor={colors.gold} style={s.kpiCard} />
            <StatCard label="Buy Signals" value={String(buySignals.length)} valueColor={colors.emerald} style={s.kpiCard} />
            <StatCard label="Holdings" value={String(portfolio?.holdings?.length ?? 0)} style={s.kpiCard} />
            <StatCard label="Nifty 50" value="23,689" sub="+1.18%" style={s.kpiCard} />
          </ScrollView>
        </FadeCard>

        {/* Performance Chart */}
        <FadeCard delay={100} style={s.section}>
          <SectionLabel text="Performance vs Benchmark" />
          <View style={[card.glass, s.chartWrap]}>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: colors.gold }]} />
                <Text style={type.caption}>Portfolio</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: colors.emerald, opacity: 0.6 }]} />
                <Text style={type.caption}>Nifty 50</Text>
              </View>
            </View>
            <LineChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  { data: [100, 110, 105, 125, 140, 165], color: (o = 1) => `rgba(207,171,103,${o})`, strokeWidth: 2.5 },
                  { data: [100, 103, 108, 115, 118, 122], color: (o = 1) => `rgba(52,211,153,${o * 0.6})`, strokeWidth: 1.5 },
                ],
              }}
              width={width - 80}
              height={160}
              withDots={false}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLabels={true}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (o = 1) => `rgba(255,255,255,${o * 0.4})`,
                labelColor: (o = 1) => `rgba(244,239,230,${o * 0.35})`,
                propsForBackgroundLines: { strokeWidth: 1, stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '4 4' },
                propsForDots: { r: '0' },
              }}
              bezier
              style={{ marginLeft: -16, borderRadius: 12 }}
            />
          </View>
        </FadeCard>

        {/* Top Signals */}
        <FadeCard delay={140} style={s.section}>
          <SectionLabel text="Top Signals" action="See all →" onAction={() => navigation.navigate('Signals')} />
          {buySignals.length === 0 ? (
            <EmptyState message="No buy signals active right now" cta="Refresh signals →" onCta={() => {}} />
          ) : (
            <View style={s.cards}>
              {buySignals.slice(0, 3).map((sig, i) => (
                <FadeCard key={sig.symbol} delay={160 + i * 40}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => navigation.navigate('Signals')}
                    style={[card.glass, s.sigCard]}
                  >
                    <View style={s.sigRow}>
                      <View>
                        <Text style={s.sigSymbol}>{sig.symbol}</Text>
                        <Text style={[type.caption, { marginTop: 2 }]}>Score {sig.suitabilityScore}/100</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <SignalBadge signal={sig.signal} />
                        <Text style={[type.caption, { color: sig.changePercent >= 0 ? colors.emerald : colors.red }]}>
                          {sig.changePercent >= 0 ? '+' : ''}{sig.changePercent?.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    <ProgressBar value={sig.suitabilityScore} />
                  </TouchableOpacity>
                </FadeCard>
              ))}
            </View>
          )}
        </FadeCard>

        {/* Holdings */}
        <FadeCard delay={200} style={s.section}>
          <SectionLabel text="Holdings" action="Portfolio →" onAction={() => navigation.navigate('Portfolio')} />
          {portfolio?.holdings?.length > 0 ? (
            <View style={card.glass}>
              {portfolio.holdings.slice(0, 4).map((h: any, i: number) => (
                <View key={h.symbol} style={[s.holdRow, i > 0 && s.holdBorder]}>
                  <View>
                    <Text style={s.sigSymbol}>{h.symbol}</Text>
                    <Text style={type.caption}>{h.quantity} shares</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[type.body, { color: colors.text, fontWeight: '600' }]}>
                      ₹{(h.currentPrice * h.quantity).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[type.caption, { color: h.unrealisedPnl >= 0 ? colors.emerald : colors.red }]}>
                      {h.unrealisedPnl >= 0 ? '+' : ''}₹{h.unrealisedPnl?.toFixed(0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState message="No open positions" cta="Browse signals →" onCta={() => navigation.navigate('Signals')} />
          )}
        </FadeCard>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { paddingBottom: 120 },
  center:     { alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: space.screenX, paddingTop: space.screenH, paddingBottom: space.xl },
  greeting:   { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 4, letterSpacing: -0.5 },

  heroCard:   { marginHorizontal: space.screenX, marginBottom: space.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderGold, borderRadius: 22, padding: 22, overflow: 'hidden' },
  heroValue:  { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -1.5, marginVertical: 8 },
  heroRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  pnlBadge:   { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  pnlText:    { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  kpiRow:     { paddingHorizontal: space.screenX, gap: 10, paddingBottom: space.lg },
  kpiCard:    { minWidth: 120 },

  section:    { paddingHorizontal: space.screenX, marginBottom: space.xl },

  chartWrap:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, overflow: 'hidden' },
  legendRow:  { flexDirection: 'row', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 20, height: 2, borderRadius: 1 },

  cards:      { gap: 10 },
  sigCard:    { padding: 16 },
  sigRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sigSymbol:  { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.goldDim, borderSize: 1, borderColor: colors.gold + '40', alignItems: 'center', justifyContent: 'center' },
  profileInitial: { color: colors.gold, fontWeight: '800', fontSize: 14 },

  holdRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  holdBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
});
