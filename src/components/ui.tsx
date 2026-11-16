import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
export const colors = { background: '#10151e', panel: '#1c2533', text: '#f4f6fa', muted: '#b4bfd0', accent: '#f0b957' };
export function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.5 }]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 18, flexGrow: 1 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  text: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  error: { color: '#ffb5b5', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#596779', borderRadius: 10, padding: 16, color: colors.text, fontSize: 16 },
  button: { backgroundColor: colors.accent, padding: 16, borderRadius: 10, alignItems: 'center', minHeight: 50 },
  buttonText: { color: '#10151e', fontWeight: '700', fontSize: 16 },
});
