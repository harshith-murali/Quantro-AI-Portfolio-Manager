import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Animated, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, type, btn, card, input, pill, radius, space } from '../theme';

// ─── Screen Header ────────────────────────────────────────────────────────
export function ScreenHeader({ eyebrow, title, subtitle, right }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={hdr.root}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={type.label}>{eyebrow}</Text> : null}
        <Text style={[type.display, { marginTop: eyebrow ? 6 : 0 }]}>{title}</Text>
        {subtitle ? <Text style={[type.body, { marginTop: 6 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
const hdr = StyleSheet.create({
  root: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: space.screenX, paddingTop: space.screenH, paddingBottom: space.xl },
});

// ─── Section Label ────────────────────────────────────────────────────────
export function SectionLabel({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={sl.row}>
      <Text style={type.label}>{text}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={sl.action}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const sl = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  action: { fontSize: 12, color: colors.gold, fontWeight: '600', letterSpacing: 0.3 },
});

// ─── Stat Card ────────────────────────────────────────────────────────────
export function StatCard({ label, value, valueColor, sub, style }: {
  label: string; value: string; valueColor?: string; sub?: string; style?: ViewStyle;
}) {
  return (
    <View style={[card.stat, sc.root, style]}>
      <Text style={type.caption}>{label}</Text>
      <Text style={[sc.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      {sub ? <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  );
}
const sc = StyleSheet.create({
  root:  { gap: 4 },
  value: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginTop: 2 },
});

// ─── Gold Divider ─────────────────────────────────────────────────────────
export function GoldDivider({ style }: { style?: ViewStyle }) {
  return <View style={[gd.line, style]} />;
}
const gd = StyleSheet.create({
  line: { height: 1, backgroundColor: colors.borderGold, marginVertical: space.xl },
});

// ─── Pill Filter Row ──────────────────────────────────────────────────────
export function PillFilter<T extends string>({ options, value, onChange }: {
  options: T[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <>
      {options.map(opt => (
        <TouchableOpacity key={opt} onPress={() => onChange(opt)} activeOpacity={0.75}
          style={[pill.base, opt === value && pill.active]}>
          <Text style={[pill.baseText, opt === value && pill.activeText]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─── Signal Badge ─────────────────────────────────────────────────────────
const SIGNAL_PALETTE: Record<string, { border: string; bg: string; text: string }> = {
  BUY:  { border: colors.emerald + '50', bg: colors.emerald + '14', text: colors.emerald },
  SELL: { border: colors.red + '50',     bg: colors.red + '14',     text: colors.red     },
  HOLD: { border: colors.muted,          bg: colors.ghost,          text: colors.muted   },
};
export function SignalBadge({ signal }: { signal: string }) {
  const p = SIGNAL_PALETTE[signal] ?? SIGNAL_PALETTE['HOLD'];
  return (
    <View style={[sb.badge, { borderColor: p.border, backgroundColor: p.bg }]}>
      <Text style={[sb.text, { color: p.text }]}>{signal}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  text:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
});

// ─── Market Status Badge ──────────────────────────────────────────────────
export function MarketBadge({ open }: { open: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!open) return;
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
    ])).start();
  }, [open]);

  return (
    <View style={[mb.wrap, { borderColor: open ? colors.emerald + '40' : colors.border }]}>
      <Animated.View style={[mb.dot, { backgroundColor: open ? colors.emerald : colors.faint, opacity: open ? pulse : 1 }]} />
      <Text style={[mb.text, { color: open ? colors.emerald : colors.muted }]}>
        {open ? 'Open' : 'Closed'}
      </Text>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});

// ─── Primary Button ───────────────────────────────────────────────────────
export function PrimaryButton({ label, onPress, loading, disabled, style }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading || disabled} activeOpacity={0.82}
      style={[btn.primary, (disabled || loading) && { opacity: 0.55 }, style]}>
      {loading
        ? <ActivityIndicator color="#060606" />
        : <Text style={btn.primaryText}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Ghost Button ─────────────────────────────────────────────────────────
export function GhostButton({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.78} style={[btn.ghost, style]}>
      <Text style={btn.ghostText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────
export function Field({ label, value, onChangeText, placeholder, secure, keyboard, style }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; secure?: boolean; keyboard?: any; style?: ViewStyle;
}) {
  return (
    <View style={[fd.group, style]}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={colors.faint}
        secureTextEntry={secure} keyboardType={keyboard}
        autoCapitalize="none" style={input.base}
      />
    </View>
  );
}
const fd = StyleSheet.create({
  group: { gap: 7 },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────
export function ProgressBar({ value, color, height = 3 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={[pb.bg, { height }]}>
      <View style={[pb.fill, { width: `${Math.min(value, 100)}%`, backgroundColor: color ?? colors.gold }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  bg:   { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Fade-In Card wrapper ─────────────────────────────────────────────────
export function FadeCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Logo Mark ────────────────────────────────────────────────────────────
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <View style={[lm.wrap, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Text style={[lm.letter, { fontSize: size * 0.38 }]}>F</Text>
    </View>
  );
}
const lm = StyleSheet.create({
  wrap:   { backgroundColor: 'rgba(207,171,103,0.1)', borderWidth: 1, borderColor: colors.borderGold, alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.gold, fontWeight: '800', letterSpacing: 0 },
});

// ─── Empty State ──────────────────────────────────────────────────────────
export function EmptyState({ icon, message, cta, onCta }: { icon?: string; message: string; cta?: string; onCta?: () => void }) {
  return (
    <View style={es.root}>
      {icon ? <Text style={es.icon}>{icon}</Text> : null}
      <Text style={es.msg}>{message}</Text>
      {cta ? (
        <TouchableOpacity onPress={onCta} activeOpacity={0.75}>
          <Text style={es.cta}>{cta}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const es = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  icon: { fontSize: 32, opacity: 0.4 },
  msg:  { fontSize: 14, color: colors.faint, textAlign: 'center' },
  cta:  { fontSize: 13, color: colors.gold, fontWeight: '600' },
});
