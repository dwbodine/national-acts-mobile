import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { Button, colors, styles } from '../components/ui';
import { useAuth } from './AuthProvider';
export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    setBusy(true); setError('');
    try { await login(username, password); setPassword(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Staff sign in</Text><Text style={styles.text}>Use your National Acts account to start checking in tickets.</Text>
      <Text style={styles.text}>Username</Text><TextInput accessibilityLabel="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" placeholderTextColor={colors.muted} editable={!busy} />
      <Text style={styles.text}>Password</Text><TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" editable={!busy} onSubmitEditing={() => { if (username && password) void submit(); }} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={() => void submit()} disabled={busy || !username.trim() || !password} />
    </ScrollView>
  </KeyboardAvoidingView>;
}
