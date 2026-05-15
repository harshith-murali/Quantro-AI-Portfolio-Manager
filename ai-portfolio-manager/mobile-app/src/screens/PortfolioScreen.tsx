import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius, btn } from '../theme';
import { SectionLabel, StatCard, FadeCard, ProgressBar, EmptyState, PrimaryButton } from '../components/UI';

const SECTOR_COLORS: Record<string, string> = {
  IT: colors.gold, Banking: colors.blue, Energy: colors.emerald,
  FMCG: '#f472b6', Pharma: '#a78bfa', Other: colors.faint,
};
const SECTOR_MAP: Record<string, string> = {
  TCS: 'IT', INFY: 'IT', WIPRO: 'IT', HCLTECH: 'IT',
  HDFCBANK: 'Banking', ICICIBANK: 'Banking', SBIN: 'Banking',
  RELIANCE: 'Energy', ONGC: 'Energy',
  HINDUNILVR: 'FMCG', ITC: 'FMCG',
  SUNPHARMA: 'Pharma', DRREDDY: 'Pharma',
};

export function PortfolioScreen() {
  const { accessToken, portfolio, setPortfolio } = useStore();
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<'BUY' | 'SELL' | null>(null);
  const [symbol,       setSymbol]       = useState('');
  const [qty,          setQty]          = useState('');
  const [tradeMsg,     setTradeMsg]     = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api.portfolio.summary(accessToken).then(setPortfolio).catch(() => {}).finally(() => setLoading(false));
  }, [accessToken]);

  const handleTrade = async () => {
    if (!symbol || !qty) { Alert.alert('Error', 'Fill symbol and quantity'); return; }
    setTradeLoading(true);
    try {
      await api.portfolio.trade({ symbol: symbol.toUpperCase(), action: modal, quantity: Number(qty) }, accessToken!);
      setTradeMsg('Order placed successfully');
      setTimeout(() => { setModal(null); setTradeMsg(''); setSymbol(''); setQty(''); }, 1800);
    } catch (e: any) {
      setTradeMsg(e.message ?? 'Trade failed');
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) return (
    <View style={[s.root, s.center]}>
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );

  const totalPnl   = (portfolio?.unrealisedPnl ?? 0) + (portfolio?.realisedPnl ?? 0);
  const holdings   = portfolio?.holdings ?? [];
  const sectorAlloc = holdings.reduce((acc: any, h: any) => {
    const sec = SECTOR_MAP[h.symbol] ?? 'Other';
    acc[sec] = (acc[sec] ?? 0) + h.currentPrice * h.quantity;
    return acc;
  }, {} as Record<string, number>);
  const totalAlloc = Object.values(sectorAlloc).reduce((s: any, v: any) => s + v, 0) as number;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={type.label}>Virtual Portfolio</Text>
            <Text style={s.totalValue}>₹{(portfolio?.totalValue ?? 0).toLocaleString('en-IN')}</Text>
            <Text style={[s.pnl, { color: totalPnl >= 0 ? colors.emerald : colors.red }]}>
              {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN')} total P&L
            </Text>
          </View>
          <View style={s.tradeBtns}>
            <TouchableOpacity onPress={() => { setModal('BUY'); setSymbol(''); setQty(''); setTradeMsg(''); }}
              style={[s.tradeBtn, { borderColor: colors.emerald + '50', backgroundColor: colors.emeraldDim }]}
              activeOpacity={0.78}>
              <Text style={[s.tradeBtnText, { color: colors.emerald }]}>+ Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setModal('SELL'); setSymbol(''); setQty(''); setTradeMsg(''); }}
              style={[s.tradeBtn, { borderColor: colors.red + '50', backgroundColor: colors.redDim }]}
              activeOpacity={0.78}>
              <Text style={[s.tradeBtnText, { color: colors.red }]}>− Sell</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Strip */}
        <FadeCard delay={0}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kpiRow}>
            <StatCard label="Unrealised" value={`${(portfolio?.unrealisedPnl ?? 0) >= 0 ? '+' : ''}₹${Math.abs(portfolio?.unrealisedPnl ?? 0).toLocaleString('en-IN')}`} valueColor={(portfolio?.unrealisedPnl ?? 0) >= 0 ? colors.emerald : colors.red} style={s.kpiCard} />
            <StatCard label="Realised"   value={`${(portfolio?.realisedPnl ?? 0) >= 0 ? '+' : ''}₹${Math.abs(portfolio?.realisedPnl ?? 0).toLocaleString('en-IN')}`}  valueColor={(portfolio?.realisedPnl ?? 0) >= 0 ? colors.emerald : colors.red}   style={s.kpiCard} />
            <StatCard label="Cash"       value={`₹${((portfolio?.virtualCash ?? 100000) / 1000).toFixed(0)}k`}                                                                  valueColor={colors.gold}                                                    style={s.kpiCard} />
          </ScrollView>
        </FadeCard>

        {/* Sector Allocation */}
        {totalAlloc > 0 && (
          <FadeCard delay={60} style={s.section}>
            <SectionLabel text="Sector Allocation" />
            <View style={card.glass}>
              {Object.entries(sectorAlloc).map(([sec, val]: any) => (
                <View key={sec} style={s.sectorRow}>
                  <View style={[s.sectorDot, { backgroundColor: SECTOR_COLORS[sec] ?? colors.faint }]} />
                  <Text style={s.sectorName}>{sec}</Text>
                  <View style={{ flex: 1 }}>
                    <ProgressBar value={(val / totalAlloc) * 100} color={SECTOR_COLORS[sec]} height={4} />
                  </View>
                  <Text style={type.caption}>{((val / totalAlloc) * 100).toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </FadeCard>
        )}

        {/* Holdings */}
        <FadeCard delay={100} style={s.section}>
          <SectionLabel text={`Holdings (${holdings.length})`} />
          {holdings.length === 0 ? (
            <EmptyState message="No open positions yet" cta="Browse signals →" />
          ) : (
            <View style={card.glass}>
              {holdings.map((h: any, i: number) => (
                <View key={h.symbol} style={[s.holdRow, i > 0 && s.holdBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.holdSymbol}>{h.symbol}</Text>
                    <Text style={type.caption}>{h.quantity} shares · avg ₹{h.avgBuyPrice?.toFixed(0)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.holdValue}>₹{(h.currentPrice * h.quantity).toLocaleString('en-IN')}</Text>
                    <Text style={[type.caption, { color: h.unrealisedPnl >= 0 ? colors.emerald : colors.red }]}>
                      {h.unrealisedPnl >= 0 ? '+' : ''}₹{h.unrealisedPnl?.toFixed(0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </FadeCard>

      </ScrollView>

      {/* Trade Modal */}
      <Modal visible={!!modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.handle} />

            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: modal === 'BUY' ? colors.emerald : colors.red }]}>
                {modal} Order
              </Text>
              <TouchableOpacity onPress={() => setModal(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[type.body, { fontSize: 22, color: colors.muted }]}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={[type.label, { marginBottom: 8 }]}>Symbol</Text>
            <TextInput
              value={symbol} onChangeText={t => setSymbol(t.toUpperCase())}
              placeholder="e.g. RELIANCE" placeholderTextColor={colors.faint}
              style={s.modalInput}
            />

            <Text style={[type.label, { marginTop: 16, marginBottom: 8 }]}>Quantity</Text>
            <TextInput
              value={qty} onChangeText={setQty}
              placeholder="Number of shares" placeholderTextColor={colors.faint}
              keyboardType="numeric" style={s.modalInput}
            />

            {!!tradeMsg && (
              <Text style={[type.body, { fontSize: 13, marginTop: 10, color: tradeMsg.includes('placed') ? colors.emerald : colors.red }]}>
                {tradeMsg}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleTrade} disabled={tradeLoading} activeOpacity={0.82}
              style={[s.modalBtn, { backgroundColor: modal === 'BUY' ? colors.emerald : colors.red }]}
            >
              {tradeLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={[btn.primaryText, { color: '#fff' }]}>Confirm {modal}</Text>}
            </TouchableOpacity>

            <Text style={[type.caption, { textAlign: 'center', marginTop: 12 }]}>
              Virtual trade · No real funds involved
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { paddingBottom: 120 },
  center:      { alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: space.screenX, paddingTop: space.screenH, paddingBottom: space.xl },
  totalValue:  { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 4, letterSpacing: -1 },
  pnl:         { fontSize: 13, fontWeight: '600', marginTop: 4, letterSpacing: 0.1 },
  tradeBtns:   { gap: 8, marginTop: 6 },
  tradeBtn:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  tradeBtnText:{ fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  kpiRow:      { paddingHorizontal: space.screenX, gap: 10, paddingBottom: space.lg },
  kpiCard:     { minWidth: 130 },
  section:     { paddingHorizontal: space.screenX, marginBottom: space.xl },
  sectorRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  sectorDot:   { width: 8, height: 8, borderRadius: 4 },
  sectorName:  { fontSize: 12, color: colors.muted, width: 68 },
  holdRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  holdBorder:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  holdSymbol:  { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  holdValue:   { fontSize: 14, fontWeight: '600', color: colors.text },
  // Modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalSheet:  { backgroundColor: '#0e0c0a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderTopWidth: 1, borderTopColor: colors.borderGold },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ghost, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  modalInput:  { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 15, color: colors.text, fontSize: 15 },
  modalBtn:    { borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: 22 },
});
