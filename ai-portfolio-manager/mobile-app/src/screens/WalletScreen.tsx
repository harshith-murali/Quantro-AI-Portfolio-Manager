import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius } from '../theme';
import { ScreenHeader, SectionLabel, FadeCard } from '../components/UI';

export function WalletScreen() {
  const { accessToken } = useStore();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      const [b, h] = await Promise.all([
        api.wallet.balance(accessToken),
        api.transactions.list(accessToken)
      ]);
      setBalance(b.balance ?? 0);
      setHistory(h ?? []);
    } catch { }
    finally { setLoading(false); }
  };

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return Alert.alert('Invalid amount');
    setActing(true);
    try {
      await api.wallet.deposit({ amount: val }, accessToken!);
      setAmount('');
      fetchData();
      Alert.alert('Success', `Deposited ₹${val}`);
    } catch { Alert.alert('Error', 'Deposit failed'); }
    finally { setActing(false); }
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
          <Text style={type.label}>WALLET</Text>
          <Text style={s.title}>Capital</Text>
        </View>

        {/* Balance Card */}
        <FadeCard delay={0} style={s.hero}>
          <LinearGradient
            colors={['rgba(207,171,103,0.15)', 'rgba(207,171,103,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={s.heroLabel}>Available Balance</Text>
          <Text style={s.heroValue}>₹{balance.toLocaleString('en-IN')}</Text>
        </FadeCard>

        {/* Quick Actions */}
        <SectionLabel text="Deposit Funds" style={s.sectionLabel} />
        <View style={[card.glass, s.actionBox]}>
          <TextInput
            placeholder="Amount (₹)"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric"
            style={s.input}
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity onPress={handleDeposit} disabled={acting} style={s.btn}>
            {acting ? <ActivityIndicator size="small" color="#000" /> : <Text style={s.btnText}>Deposit</Text>}
          </TouchableOpacity>
        </View>

        {/* History */}
        <SectionLabel text="Recent Transactions" style={s.sectionLabel} />
        <View style={[card.glass, s.history]}>
          {history.length === 0 ? (
            <Text style={s.empty}>No recent transactions</Text>
          ) : (
            history.slice(0, 10).map((tx, i) => (
              <View key={tx.id || i} style={[s.tx, i > 0 && s.border]}>
                <View>
                  <Text style={s.txType}>{tx.type}</Text>
                  <Text style={type.caption}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[s.txAmt, { color: tx.type === 'DEPOSIT' || tx.type === 'SELL' ? colors.emerald : colors.red }]}>
                  {tx.type === 'DEPOSIT' || tx.type === 'SELL' ? '+' : '-'}₹{tx.amount?.toLocaleString('en-IN') || tx.totalAmount?.toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </View>
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
  hero: { marginHorizontal: space.screenX, padding: 24, borderRadius: 24, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderGold, overflow: 'hidden', marginBottom: space.lg },
  heroLabel: { fontSize: 12, fontWeight: '700', color: colors.textDim, letterSpacing: 1 },
  heroValue: { fontSize: 36, fontWeight: '800', color: colors.text, marginTop: 8 },
  sectionLabel: { paddingHorizontal: space.screenX, marginBottom: 12 },
  actionBox: { marginHorizontal: space.screenX, flexDirection: 'row', padding: 12, alignItems: 'center', gap: 12, marginBottom: space.lg },
  input: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  btn: { backgroundColor: colors.gold, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { fontWeight: '800', fontSize: 14, color: '#000' },
  history: { marginHorizontal: space.screenX, paddingHorizontal: 16 },
  empty: { padding: 24, textAlign: 'center', color: colors.textDim, fontSize: 14 },
  tx: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  border: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  txType: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  txAmt: { fontSize: 16, fontWeight: '700' },
});
