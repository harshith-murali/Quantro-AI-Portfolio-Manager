import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, space } from '../theme';
import { LogoMark, Field, PrimaryButton } from '../components/UI';

export function RegisterScreen({ navigation }: any) {
  const { setAccessToken, setUser } = useStore();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('Error', 'Fill in all fields'); return; }
    setLoading(true);
    try {
      const { user, accessToken } = await api.auth.register({ name, email, password });
      setAccessToken(accessToken);
      setUser(user);
    } catch (e: any) {
      Alert.alert('Registration failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['rgba(207,171,103,0.05)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.logoRow}>
            <LogoMark size={38} />
            <Text style={s.logoLabel}>FINTECH</Text>
          </View>

          <Text style={s.headline}>Create{'\n'}account.</Text>
          <Text style={[type.body, { marginBottom: 36 }]}>Start your investing journey today</Text>

          <View style={s.form}>
            <Field label="Full Name"  value={name}     onChangeText={setName}     placeholder="Your name" />
            <Field label="Email"      value={email}    onChangeText={setEmail}    placeholder="you@example.com" keyboard="email-address" />
            <Field label="Password"   value={password} onChangeText={setPassword} placeholder="Create a password" secure />
            <PrimaryButton label="CREATE ACCOUNT" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />
          </View>

          <View style={s.divRow}>
            <View style={s.divLine} />
            <Text style={type.caption}>or</Text>
            <View style={s.divLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7} style={s.linkRow}>
            <Text style={type.caption}>Already have an account? </Text>
            <Text style={[type.caption, { color: colors.gold, fontWeight: '700' }]}>Sign in</Text>
          </TouchableOpacity>

          {/* Trust badges */}
          <View style={s.trust}>
            {['Virtual funds only', 'AI-powered signals', 'No real trades'].map(t => (
              <View key={t} style={s.trustItem}>
                <Text style={s.trustDot}>·</Text>
                <Text style={[type.caption, { letterSpacing: 0 }]}>{t}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  scroll:    { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 44 },
  logoLabel: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 4 },
  headline:  { fontSize: 42, fontWeight: '800', color: colors.text, letterSpacing: -1.5, lineHeight: 48, marginBottom: 10 },
  form:      { gap: 18 },
  divRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  divLine:   { flex: 1, height: 1, backgroundColor: colors.border },
  linkRow:   { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  trust:     { gap: 6 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustDot:  { color: colors.gold, fontSize: 16 },
});
