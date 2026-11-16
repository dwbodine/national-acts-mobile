import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, ScrollView, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../../auth/AuthProvider';
import { ApiError } from '../../api/client';
import { Button, styles } from '../../components/ui';
import { checkIn } from './checkin.service';
import { getTicketId, resultMessage } from './ticket';

export function CheckInScreen() {
  const { user, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [result, setResult] = useState<{ text: string; id?: string; status?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { mounted.current = false; subscription.remove(); };
  }, []);
  async function scan(data: string) {
    if (locked.current || !user?.token) return;
    locked.current = true;
    setBusy(true);
    let id: string | undefined;
    try {
      id = getTicketId(data);
      const ticket = await checkIn(id, user.token);
      if (ticket.ticketId !== id) throw new Error('Server returned a different ticket. Please verify with staff.');
      if (mounted.current) setResult({ text: resultMessage(ticket), id, status: ticket.checkInStatus });
    } catch (e) {
      if (!mounted.current) return;
      if (e instanceof ApiError && e.status === 401) {
        try { await logout(); }
        catch { setResult({ text: 'Session expired. Please sign out and sign in again.' }); }
        return;
      }
      setResult({ text: e instanceof Error ? e.message : 'Unable to check in. Check your connection.', id });
    } finally { if (mounted.current) setBusy(false); }
  }
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Ticket check-in</Text><Text style={styles.text}>Point the camera at a ticket’s QR code. Keep the result visible until you’re ready for the next guest.</Text>
    {!permission ? <ActivityIndicator /> : !permission.granted ? <View style={{ gap: 16 }}>
      <Text style={styles.text}>Camera access is needed to scan tickets.</Text>
      <Button title={permission.canAskAgain ? 'Allow camera access' : 'Open device settings'} onPress={() => { void (permission.canAskAgain ? requestPermission() : Linking.openSettings()).catch(() => setCameraError('Unable to open camera permissions. Check device settings.')); }} />
    </View> : !busy && !result && active && !cameraError ? <CameraView style={{ height: 320, borderRadius: 16, overflow: 'hidden' }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => void scan(data)} onMountError={() => setCameraError('Unable to start camera. Check camera permissions and try again.')} /> : null}
    {!!cameraError && <><Text style={styles.error}>{cameraError}</Text><Button title="Retry camera" onPress={() => setCameraError('')} /></>}
    {busy && <><ActivityIndicator size="large" /><Text style={styles.text}>Checking ticket…</Text></>}
    {result && <View accessibilityLiveRegion="assertive" style={{ padding: 20, gap: 14, borderRadius: 12, backgroundColor: result.status === 1 ? '#164936' : result.status === 2 ? '#55421e' : '#542b35' }}>
      <Text style={[styles.title, { fontSize: 24 }]}>{result.text}</Text>{!!result.id && <Text style={styles.text}>Ticket: {result.id}</Text>}
      <Button title="Scan next ticket" onPress={() => { setResult(null); locked.current = false; }} />
    </View>}
  </ScrollView>;
}

