import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, Easing, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

const STATS = [
  { label: 'AI Signals',       value: '500+' },
  { label: 'Markets Tracked',  value: '12'   },
  { label: 'Accuracy Rate',    value: '87%'  },
];

const FEATURES = [
  { icon: '◈', title: 'AI Signals',        desc: 'Real-time BUY/SELL signals powered by machine learning' },
  { icon: '◉', title: 'Portfolio Intel',   desc: 'Track P&L, holdings and benchmarks in one place'       },
  { icon: '◎', title: 'Backtesting',       desc: 'Validate strategies against years of historical data'   },
  { icon: '⬡', title: 'Risk Profiling',    desc: 'Personalised investable capacity computed for you'      },
];

export function LandingScreen({ navigation }: any) {
  const shimmer  = useRef(new Animated.Value(0)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;
  const panY     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, delay: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Shimmer loop on gold line
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Grid pan animation
    Animated.loop(
      Animated.timing(panY, { toValue: height, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const lines = Array.from({ length: 6 });

  return (
    <View style={s.root}>
      {/* Background grid lines */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {lines.map((_, i) => (
          <View key={i} style={[s.gridLine, { left: (width / 5) * i }]} />
        ))}
        <Animated.View style={[s.gridShimmer, { transform: [{ translateY: panY }] }]}>
          <LinearGradient colors={['transparent', 'rgba(207,171,103,0.08)', 'transparent']} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </View>

      {/* Ambient glows */}
      <LinearGradient
        colors={['rgba(207,171,103,0.12)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.glowTL}
      />
      <LinearGradient
        colors={['transparent', 'rgba(52,211,153,0.04)', 'rgba(96,165,250,0.07)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.glowBR}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* Logo row */}
          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Text style={s.logoLetter}>F</Text>
            </View>
            <Text style={s.logoText}>FINTECH</Text>
          </View>

          {/* Gold separator */}
          <Animated.View style={[s.goldLine, { opacity: shimmerOpacity }]} />

          {/* Hero headline */}
          <Text style={s.eyebrow}>AI PORTFOLIO INTELLIGENCE</Text>
          <Text style={s.headline}>defy{'\n'}market{'\n'}gravity.</Text>
          <Text style={s.sub}>
            A luxury AI investing interface engineered for conviction, composure, and asymmetrical advantage.
          </Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            {STATS.map(({ label, value }) => (
              <View key={label} style={s.statItem}>
                <Text style={s.statValue}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* CTA buttons */}
          <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={s.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          {/* Feature cards */}
          <Text style={s.featuresLabel}>WHAT YOU GET</Text>
          {FEATURES.map(({ icon, title, desc }) => (
            <View key={title} style={s.featureCard}>
              <Text style={s.featureIcon}>{icon}</Text>
              <View style={s.featureText}>
                <Text style={s.featureTitle}>{title}</Text>
                <Text style={s.featureDesc}>{desc}</Text>
              </View>
            </View>
          ))}

          {/* Bottom tagline */}
          <View style={s.footer}>
            <View style={s.goldLineSm} />
            <Text style={s.footerText}>Built for investors who think differently.</Text>
            <View style={s.goldLineSm} />
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#050505' },
  scroll:           { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 60 },

  // Background
  gridLine:         { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(207,171,103,0.03)' },
  gridShimmer:      { position: 'absolute', top: -height, left: 0, right: 0, height, opacity: 0.8 },
  glowTL:           { position: 'absolute', top: 0, left: 0, width: width * 1.2, height: height * 0.6 },
  glowBR:           { position: 'absolute', bottom: 0, right: 0, width: width, height: height * 0.5 },

  // Logo
  logoRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoCircle:       { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(207,171,103,0.3)', alignItems: 'center', justifyContent: 'center' },
  logoLetter:       { color: colors.gold, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  logoText:         { color: colors.text, fontSize: 13, fontWeight: '700', letterSpacing: 5 },

  // Separator
  goldLine:         { height: 1, backgroundColor: colors.gold, width: 40, marginBottom: 28 },

  // Hero
  eyebrow:          { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 4, marginBottom: 16 },
  headline:         { color: colors.text, fontSize: 64, fontWeight: '800', lineHeight: 64, letterSpacing: -2, marginBottom: 20 },
  sub:              { color: colors.muted, fontSize: 15, lineHeight: 24, marginBottom: 36, maxWidth: 320 },

  // Stats
  statsRow:         { flexDirection: 'row', gap: 0, marginBottom: 36, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingVertical: 20 },
  statItem:         { flex: 1, alignItems: 'center' },
  statValue:        { color: colors.gold, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:        { color: colors.faint, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 3, textAlign: 'center' },

  // CTAs
  primaryBtn:       { backgroundColor: colors.gold, borderRadius: 50, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  primaryBtnText:   { color: '#060606', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  secondaryBtn:     { borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginBottom: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secondaryBtnText: { color: colors.muted, fontWeight: '600', fontSize: 14 },

  // Features
  featuresLabel:    { color: colors.faint, fontSize: 10, fontWeight: '700', letterSpacing: 3, marginBottom: 16 },
  featureCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 18, marginBottom: 12 },
  featureIcon:      { color: colors.gold, fontSize: 22, marginTop: 2 },
  featureText:      { flex: 1 },
  featureTitle:     { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  featureDesc:      { color: colors.muted, fontSize: 13, lineHeight: 20 },

  // Footer
  footer:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 40, justifyContent: 'center' },
  goldLineSm:       { height: 1, backgroundColor: 'rgba(207,171,103,0.3)', flex: 1 },
  footerText:       { color: colors.faint, fontSize: 11, letterSpacing: 1, textAlign: 'center' },
});
