import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, card, space, radius, btn } from '../theme';
import { FadeCard, ProgressBar, SectionLabel, PrimaryButton, GhostButton } from '../components/UI';

const RISK_OPTIONS = [
  { value: 'CONSERVATIVE', label: 'Conservative', desc: '20% of surplus', icon: '▲', accent: colors.blue },
  { value: 'MODERATE',     label: 'Moderate',     desc: '35% of surplus', icon: '◆', accent: colors.gold },
  { value: 'AGGRESSIVE',   label: 'Aggressive',   desc: '50% of surplus', icon: '●', accent: colors.emerald },
] as const;

const GOAL_OPTIONS = [
  { value: 'SHORT_TERM',  label: 'Short Term',  desc: '< 1 year' },
  { value: 'MEDIUM_TERM', label: 'Medium Term', desc: '1–3 years' },
  { value: 'LONG_TERM',   label: 'Long Term',   desc: '3+ years' },
] as const;

const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  CONSERVATIVE: { label: 'The Protector', color: colors.blue,    bg: 'rgba(96,165,250,0.08)',  desc: 'Capital preservation is your north star. You sleep well knowing your money is safe.' },
  MODERATE:     { label: 'The Strategist',color: colors.gold,    bg: colors.goldSubtle,        desc: 'Balanced growth and risk. You think in years, not days.' },
  AGGRESSIVE:   { label: 'The Maverick',  color: colors.emerald, bg: colors.emeraldDim,        desc: 'High conviction. High reward. You know the game and play to win.' },
};

export function ProfileScreen() {
  const { accessToken, setUser, logout } = useStore();
  const [income,  setIncome]  = useState('');
  const [fixed,   setFixed]   = useState('');
  const [disc,    setDisc]    = useState('');
  const [savings, setSavings] = useState('');
  const [risk,    setRisk]    = useState<typeof RISK_OPTIONS[number]['value']>('MODERATE');
  const [goal,    setGoal]    = useState<typeof GOAL_OPTIONS[number]['value']>('MEDIUM_TERM');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ investableAmount: number; riskScore: number } | null>(null);

  const surplus            = Math.max(0, (Number(income) || 0) - (Number(fixed) || 0) - (Number(disc) || 0));
  const multiplier         = risk === 'AGGRESSIVE' ? 0.5 : risk === 'CONSERVATIVE' ? 0.2 : 0.35;
  const estimatedInvestable = Math.round(surplus * multiplier);
  const badge              = BADGE_CONFIG[risk];

  const handleSubmit = async () => {
    setLoading(true);
    const localRiskScore = risk === 'AGGRESSIVE' ? 8 : risk === 'CONSERVATIVE' ? 3 : 5;
    try {
      const payload = {
        monthlyIncome: Number(income),
        monthlyExpenses: (Number(fixed) || 0) + (Number(disc) || 0),
        currentSavings: Number(savings) || 0,
        financialGoal: goal,
        riskAppetite: risk === 'CONSERVATIVE' ? 'LOW' : risk === 'AGGRESSIVE' ? 'HIGH' : 'MEDIUM',
        investableAmount: estimatedInvestable,
      };
      const res = await api.profile.save(payload, accessToken!);
      const saved = res.profile ?? res;
      setUser(saved);
      setResult({ investableAmount: Number(saved.investableAmount) || estimatedInvestable, riskScore: saved.riskScore ?? localRiskScore });
    } catch {
      setResult({ investableAmount: estimatedInvestable, riskScore: localRiskScore });
    } finally {
      setLoading(false);
    }
  };

  // ── RESULT STATE ────────────────────────────────────────────────────────
  if (result) {
    return (
      <View style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Gold ambient */}
          <LinearGradient
            colors={['rgba(207,171,103,0.10)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
            style={StyleSheet.absoluteFillObject} pointerEvents="none"
          />

          <View style={s.header}>
            <Text style={type.label}>Investor Profile</Text>
            <Text style={s.headline}>Your capacity</Text>
          </View>

          {/* Investable Hero */}
          <FadeCard delay={0} style={[s.section]}>
            <View style={[s.heroResult]}>
              <LinearGradient
                colors={['rgba(207,171,103,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={type.label}>Monthly Investable Capacity</Text>
              <Text style={s.bigNumber}>₹{result.investableAmount.toLocaleString('en-IN')}</Text>
              <View style={s.riskScoreRow}>
                <Text style={[type.body, { fontSize: 13 }]}>Risk Score </Text>
                <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 18 }}>{result.riskScore}</Text>
                <Text style={[type.caption, { alignSelf: 'flex-end' }]}>/10</Text>
              </View>
              <ProgressBar value={result.riskScore * 10} color={badge.color} height={4} />
            </View>
          </FadeCard>

          {/* Profile Badge */}
          <FadeCard delay={80} style={s.section}>
            <View style={[card.glass, { borderColor: badge.color + '35', backgroundColor: badge.bg, overflow: 'hidden' }]}>
              <LinearGradient
                colors={[badge.color + '10', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[type.label, { color: badge.color, marginBottom: 4 }]}>Investor Archetype</Text>
              <Text style={[s.badgeTitle, { color: badge.color }]}>{badge.label}</Text>
              <Text style={[type.body, { marginTop: 10 }]}>{badge.desc}</Text>
              <View style={s.badgeStats}>
                {[
                  { label: 'Risk Profile', value: risk.charAt(0) + risk.slice(1).toLowerCase() },
                  { label: 'Goal',         value: goal === 'SHORT_TERM' ? 'Short' : goal === 'MEDIUM_TERM' ? 'Medium' : 'Long' },
                  { label: 'Risk Score',   value: `${result.riskScore}/10` },
                ].map(({ label, value }) => (
                  <View key={label} style={s.badgeStat}>
                    <Text style={type.caption}>{label}</Text>
                    <Text style={[type.heading, { fontSize: 15, marginTop: 2, color: badge.color }]}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeCard>

          {/* Actions */}
          <FadeCard delay={140} style={[s.section, { gap: 12 }]}>
            <GhostButton label="Edit Profile" onPress={() => setResult(null)} />
            <TouchableOpacity onPress={logout} style={s.logoutRow} activeOpacity={0.7}>
              <Text style={s.logoutText}>Sign out</Text>
            </TouchableOpacity>
          </FadeCard>

        </ScrollView>
      </View>
    );
  }

  // ── FORM STATE ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={type.label}>Investor Profile</Text>
          <Text style={s.headline}>Financial{'\n'}Profile</Text>
          <Text style={[type.body, { marginTop: 8 }]}>
            We compute your investable capacity and personalise every signal.
          </Text>
        </View>

        {/* Live Surplus Preview */}
        {surplus > 0 && (
          <FadeCard delay={0} style={s.section}>
            <View style={s.surplusCard}>
              <LinearGradient
                colors={['rgba(207,171,103,0.07)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View>
                <Text style={type.caption}>Monthly Surplus</Text>
                <Text style={[s.surplusValue]}>{`₹${surplus.toLocaleString('en-IN')}`}</Text>
              </View>
              <View style={s.surplusDivider} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={type.caption}>Estimated Investable</Text>
                <Text style={[s.surplusValue, { color: colors.gold }]}>{`₹${estimatedInvestable.toLocaleString('en-IN')}`}</Text>
              </View>
            </View>
          </FadeCard>
        )}

        {/* Financials */}
        <FadeCard delay={40} style={s.section}>
          <SectionLabel text="Financials" />
          <View style={s.fieldGrid}>
            {[
              { label: 'Monthly Income',    value: income,  set: setIncome,  hint: 'Gross monthly income'    },
              { label: 'Fixed Expenses',    value: fixed,   set: setFixed,   hint: 'Rent, EMIs, utilities'   },
              { label: 'Discretionary',     value: disc,    set: setDisc,    hint: 'Dining, entertainment'   },
              { label: 'Existing Savings',  value: savings, set: setSavings, hint: 'Liquid savings'           },
            ].map(({ label, value, set, hint }) => (
              <View key={label} style={s.fieldHalf}>
                <Text style={[type.label, { marginBottom: 6 }]}>{label}</Text>
                <TextInput
                  value={value} onChangeText={set} keyboardType="numeric" placeholder="₹0"
                  placeholderTextColor={colors.faint} style={s.input}
                />
                <Text style={[type.caption, { marginTop: 4 }]}>{hint}</Text>
              </View>
            ))}
          </View>
        </FadeCard>

        {/* Risk Appetite */}
        <FadeCard delay={80} style={s.section}>
          <SectionLabel text="Risk Appetite" />
          <View style={s.riskRow}>
            {RISK_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} onPress={() => setRisk(opt.value)} activeOpacity={0.8}
                style={[s.riskCard, risk === opt.value && { borderColor: opt.accent + '60', backgroundColor: opt.accent + '0C' }]}>
                <Text style={[s.riskIcon, { color: opt.accent }]}>{opt.icon}</Text>
                <Text style={[s.riskLabel, risk === opt.value && { color: opt.accent }]}>{opt.label}</Text>
                <Text style={type.caption}>{opt.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeCard>

        {/* Investment Goal */}
        <FadeCard delay={120} style={s.section}>
          <SectionLabel text="Investment Goal" />
          <View style={card.glass}>
            {GOAL_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={opt.value} onPress={() => setGoal(opt.value)} activeOpacity={0.8}
                style={[s.goalRow, i > 0 && s.goalBorder, goal === opt.value && s.goalActive]}>
                {goal === opt.value && (
                  <LinearGradient
                    colors={['rgba(207,171,103,0.05)', 'transparent']}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.goalLabel, goal === opt.value && { color: colors.gold }]}>{opt.label}</Text>
                  <Text style={type.caption}>{opt.desc}</Text>
                </View>
                <View style={[s.radioOuter, goal === opt.value && { borderColor: colors.gold }]}>
                  {goal === opt.value && <View style={s.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </FadeCard>

        {/* Submit */}
        <View style={[s.section, { gap: 14 }]}>
          <PrimaryButton label="COMPUTE CAPACITY →" onPress={handleSubmit} loading={loading} />
          <TouchableOpacity onPress={logout} style={s.logoutRow} activeOpacity={0.7}>
            <Text style={s.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { paddingBottom: 120 },
  header:      { paddingHorizontal: space.screenX, paddingTop: space.screenH, paddingBottom: space.xl },
  headline:    { fontSize: 36, fontWeight: '800', color: colors.text, marginTop: 4, letterSpacing: -1, lineHeight: 40 },
  section:     { paddingHorizontal: space.screenX, marginBottom: space.xl },

  // Surplus
  surplusCard: { ...card.glass, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  surplusValue:{ fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4, letterSpacing: -0.3 },
  surplusDivider: { width: 1, height: '60%', backgroundColor: colors.border },

  // Fields
  fieldGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  fieldHalf:   { width: '47%' },
  input:       { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15 },

  // Risk
  riskRow:     { flexDirection: 'row', gap: 10 },
  riskCard:    { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, alignItems: 'center', gap: 6 },
  riskIcon:    { fontSize: 14, marginBottom: 2 },
  riskLabel:   { fontSize: 12, fontWeight: '700', color: colors.muted, textAlign: 'center' },

  // Goal
  goalRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12, overflow: 'hidden' },
  goalBorder:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  goalActive:  {},
  goalLabel:   { fontSize: 14, fontWeight: '600', color: colors.textDim, marginBottom: 2 },
  radioOuter:  { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },

  // Result
  heroResult:  { ...card.glass, borderColor: colors.borderGold, overflow: 'hidden', gap: 10 },
  bigNumber:   { fontSize: 48, fontWeight: '800', color: colors.gold, letterSpacing: -2, marginVertical: 4 },
  riskScoreRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 10 },
  badgeTitle:  { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  badgeStats:  { flexDirection: 'row', gap: 10, marginTop: 20 },
  badgeStat:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radius.md, padding: 12, alignItems: 'center' },

  // Footer
  logoutRow:   { alignItems: 'center', paddingVertical: 14 },
  logoutText:  { fontSize: 13, color: colors.faint, letterSpacing: 0.2 },
});
