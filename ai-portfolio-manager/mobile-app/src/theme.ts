import { StyleSheet, Platform } from 'react-native';

// ─── Palette ───────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds — layered depth
  bg:          '#050505',
  bgDeep:      '#020202',
  bgCard:      'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',
  bgElevated:  'rgba(14,12,10,0.97)',

  // Borders
  border:      'rgba(255,255,255,0.09)',
  borderGold:  'rgba(207,171,103,0.25)',
  borderStrong:'rgba(255,255,255,0.14)',

  // Gold spectrum
  gold:        '#cfab67',
  goldLight:   '#e8c97a',
  goldDim:     'rgba(207,171,103,0.55)',
  goldGlow:    'rgba(207,171,103,0.12)',
  goldSubtle:  'rgba(207,171,103,0.08)',

  // Text spectrum
  text:        '#f4efe6',
  textDim:     'rgba(244,239,230,0.75)',
  muted:       'rgba(244,239,230,0.45)',
  faint:       'rgba(244,239,230,0.20)',
  ghost:       'rgba(244,239,230,0.10)',

  // Semantics
  emerald:     '#34d399',
  emeraldDim:  'rgba(52,211,153,0.12)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.12)',
  blue:        '#60a5fa',
};

// ─── Spacing ───────────────────────────────────────────────────────────────
export const space = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  section: 32,
  screenH: 64,   // top padding for screens
  screenX: 20,   // horizontal screen padding
};

// ─── Border Radius ─────────────────────────────────────────────────────────
export const radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   26,
  pill: 999,
};

// ─── Shadows ───────────────────────────────────────────────────────────────
export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
  }),
  gold: Platform.select({
    ios: {
      shadowColor: colors.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
  }),
};

// ─── Typography ────────────────────────────────────────────────────────────
export const type = {
  display: {
    fontSize: 38,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.muted,
    lineHeight: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.muted,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.faint,
    letterSpacing: 0.3,
  },
  number: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.gold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'] as any,
  },
};

// Alias for backwards compat
export const typography = {
  heading:  type.heading,
  label:    type.label,
  body:     type.body,
  caption:  type.caption,
};

// ─── Reusable Card Styles ──────────────────────────────────────────────────
export const card = StyleSheet.create({
  glass: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.xl,
    ...shadow.card,
  },
  stat: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.lg,
  },
  sm: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
  },
  gold: {
    backgroundColor: colors.goldSubtle,
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.lg,
    padding: space.xl,
  },
  elevated: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.xl,
    padding: space.xxl,
    ...shadow.card,
  },
});

// ─── Button Styles ─────────────────────────────────────────────────────────
export const btn = StyleSheet.create({
  primary: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadow.gold,
  },
  primaryText: {
    color: '#060606',
    fontWeight: '700' as const,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.borderGold,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ghostText: {
    color: colors.gold,
    fontWeight: '600' as const,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  danger: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.red + '40',
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  dangerText: {
    color: colors.red,
    fontWeight: '700' as const,
    fontSize: 13,
  },
});

// ─── Input ─────────────────────────────────────────────────────────────────
export const input = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});

// ─── Pill / Badge ──────────────────────────────────────────────────────────
export const pill = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    borderColor: colors.borderGold,
    backgroundColor: colors.goldSubtle,
  },
  baseText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  activeText: {
    color: colors.gold,
  },
});
