import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api';
import { useStore } from '../store';
import { colors, type, input, btn, space, radius } from '../theme';
import { LogoMark, Field, PrimaryButton } from '../components/UI';

export function LoginScreen({ navigation }: any) {
  const { setAccessToken, setUser } = useStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Fill in all fields'); return; }
    setLoading(true);
    try {
      const { user, accessToken } = await api.auth.login({ email, password });
      setAccessToken(accessToken);
      setUser(user);
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      {/* Subtle ambient glow */}
      <LinearGradient
        colors={['rgba(207,171,103,0.06)', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.kav}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.logoRow}>
            <LogoMark size={38} />
            <Text style={s.logoLabel}>FINTECH</Text>
          </View>

          {/* Headline */}
          <Text style={s.headline}>Welcome{'\n'}back.</Text>
          <Text style={[type.body, { marginBottom: 36 }]}>Sign in to your account to continue</Text>

          {/* Form */}
          <View style={s.form}>
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboard="email-address" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secure />
            <PrimaryButton label="SIGN IN" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />
          </View>

          {/* Divider */}
          <View style={s.divRow}>
            <View style={s.divLine} />
            <Text style={s.divText}>or</Text>
            <View style={s.divLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7} style={s.linkRow}>
            <Text style={type.caption}>Don't have an account? </Text>
            <Text style={[type.caption, { color: colors.gold, fontWeight: '700' }]}>Create one</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: colors.bg },
  kav:      { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 60 },
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 44 },
  logoLabel:{ color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 4 },
  headline: { fontSize: 42, fontWeight: '800', color: colors.text, letterSpacing: -1.5, lineHeight: 48, marginBottom: 10 },
  form:     { gap: 18 },
  divRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  divLine:  { flex: 1, height: 1, backgroundColor: colors.border },
  divText:  { ...type.caption },
  linkRow:  { flexDirection: 'row', justifyContent: 'center' },
});
