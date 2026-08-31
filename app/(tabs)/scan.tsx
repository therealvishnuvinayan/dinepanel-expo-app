import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, Flashlight, Keyboard, RotateCcw, ScanLine, Settings, Sparkles, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRewards } from '@/context/RewardsContext';
import { parseClaimToken } from '@/utils/claimUrl';

export default function ScanScreen() {
  const router = useRouter();
  const { createDemoBill, previewClaimToken } = useRewards();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanProgress] = useState(() => new Animated.Value(0));
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [openingDemo, setOpeningDemo] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [error, setError] = useState('');
  const scanGuard = useRef(false);

  useFocusEffect(
    useCallback(() => {
      scanGuard.current = false;
      setScanLocked(false);
      setProcessing(false);
      setError('');
      return () => {
        scanGuard.current = true;
        setFlashOn(false);
      };
    }, []),
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, { toValue: 1, duration: 2100, useNativeDriver: true }),
        Animated.timing(scanProgress, { toValue: 0, duration: 2100, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scanProgress]);

  const scanLinePosition = scanProgress.interpolate({ inputRange: [0, 1], outputRange: [8, 238] });

  const previewCode = useCallback(async (value: string, allowBareToken: boolean) => {
    if (scanGuard.current) return;
    scanGuard.current = true;
    setScanLocked(true);
    setProcessing(true);
    setError('');
    try {
      const token = parseClaimToken(value, allowBareToken);
      await previewClaimToken(token);
      setManualOpen(false);
      router.push('/bill/confirm');
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Unable to read this claim code.');
    } finally {
      setProcessing(false);
    }
  }, [previewClaimToken, router]);

  const resetScanner = () => {
    scanGuard.current = false;
    setScanLocked(false);
    setError('');
  };

  const openDemoBill = async () => {
    if (openingDemo) return;
    setOpeningDemo(true);
    setError('');
    try {
      await createDemoBill();
      router.push('/bill/confirm');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create the demo bill.');
    } finally {
      setOpeningDemo(false);
    }
  };

  const renderCamera = () => {
    if (!permission) {
      return <View style={styles.permissionState}><ActivityIndicator color={colors.primaryMuted} /><Text style={styles.permissionCopy}>Checking camera access…</Text></View>;
    }
    if (!permission.granted) {
      const canAsk = permission.canAskAgain;
      return (
        <View style={styles.permissionState}>
          <View style={styles.permissionIcon}><Camera color={colors.primaryMuted} size={28} /></View>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionCopy}>DinePanel only reads the secure QR code. No image is stored.</Text>
          <Button icon={canAsk ? Camera : Settings} label={canAsk ? 'Allow camera' : 'Open settings'} onPress={() => canAsk ? void requestPermission() : void Linking.openSettings()} />
        </View>
      );
    }
    return (
      <View style={styles.scanner}>
        <CameraView
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          enableTorch={flashOn}
          onBarcodeScanned={scanLocked ? undefined : ({ data }) => void previewCode(data, false)}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.cameraShade} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        {!processing && !error ? (
          <View pointerEvents="none" style={styles.qrHint}>
            <ScanLine color="rgba(255,255,255,0.72)" size={58} strokeWidth={1.2} />
            <Text style={styles.qrHintText}>Align DinePanel QR inside frame</Text>
          </View>
        ) : null}
        {processing ? <View style={styles.scanFeedback}><ActivityIndicator color={colors.white} /><Text style={styles.feedbackText}>Verifying bill…</Text></View> : null}
        {error ? (
          <View style={styles.scanFeedback}>
            <Text style={styles.feedbackTitle}>Code not accepted</Text>
            <Text style={styles.feedbackText}>{error}</Text>
            <Pressable onPress={resetScanner} style={styles.retry}><RotateCcw color={colors.dark} size={15} /><Text style={styles.retryText}>Scan again</Text></Pressable>
          </View>
        ) : null}
        {!scanLocked ? <Animated.View pointerEvents="none" style={[styles.scanLine, { transform: [{ translateY: scanLinePosition }] }]} /> : null}
      </View>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <Screen backgroundColor={colors.dark} contentStyle={styles.content} scroll={false}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>DinePanel scanner</Text><Text style={styles.title}>Scan your bill</Text></View>
          {permission?.granted ? <IconButton icon={Flashlight} label={flashOn ? 'Turn flash off' : 'Turn flash on'} onPress={() => setFlashOn((current) => !current)} tone="dark" /> : null}
        </View>
        <Text style={styles.subtitle}>Point your camera at the secure DinePanel QR shown by the restaurant.</Text>
        <View style={styles.scannerWrap}>{renderCamera()}</View>
        <View style={styles.actions}>
          <Pressable onPress={() => { resetScanner(); setManualOpen(true); }} style={({ pressed }) => [styles.manual, pressed && styles.pressed]}>
            <Keyboard color={colors.white} size={18} /><Text style={styles.manualText}>Enter claim code manually</Text>
          </Pressable>
          {__DEV__ ? (
            <Pressable disabled={openingDemo} onPress={openDemoBill} style={({ pressed }) => [styles.demo, pressed && styles.pressed]}>
              {openingDemo ? <ActivityIndicator color={colors.primaryMuted} size="small" /> : <Sparkles color={colors.primaryMuted} size={15} />}
              <Text style={styles.demoText}>{openingDemo ? 'Creating demo bill…' : 'Use development demo bill'}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.privacy}>Only the opaque claim code is read. Bill values always come from DinePanel.</Text>
      </Screen>

      <Modal animationType="slide" onRequestClose={() => setManualOpen(false)} transparent visible={manualOpen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <Pressable onPress={() => setManualOpen(false)} style={StyleSheet.absoluteFill} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetEyebrow}>Alternative entry</Text><Text style={styles.sheetTitle}>Enter claim code</Text></View>
              <IconButton icon={X} label="Close" onPress={() => setManualOpen(false)} />
            </View>
            <Text style={styles.sheetSubtitle}>Paste the opaque code or the complete DinePanel claim URL.</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={300}
              onChangeText={(value) => { setManualCode(value); if (error) resetScanner(); }}
              placeholder="dinepanel://claim/…"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.primary}
              style={styles.codeInput}
              value={manualCode}
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <Button disabled={!manualCode.trim() || processing} label="Find bill" loading={processing} onPress={() => void previewCode(manualCode, true)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  header: { paddingTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.primaryMuted, fontSize: typography.caption, fontWeight: '700', marginBottom: 5 },
  title: { color: colors.white, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { color: 'rgba(255,255,255,0.62)', fontSize: typography.small, lineHeight: 21, marginTop: spacing.sm, maxWidth: 350 },
  scannerWrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  scanner: { width: '100%', aspectRatio: 1, maxHeight: 344, borderRadius: 30, backgroundColor: colors.darkMuted, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cameraShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,19,13,0.14)' },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: colors.white },
  topLeft: { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  topRight: { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bottomLeft: { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  bottomRight: { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  qrHint: { alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderRadius: radius.md, backgroundColor: 'rgba(8,27,20,0.28)' },
  qrHintText: { color: colors.white, fontSize: typography.caption, fontWeight: '600' },
  scanLine: { position: 'absolute', left: 28, right: 28, top: 20, height: 2, borderRadius: radius.pill, backgroundColor: colors.primaryMuted, opacity: 0.9 },
  scanFeedback: { maxWidth: '84%', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: 'rgba(10,35,25,0.9)' },
  feedbackTitle: { color: colors.white, fontSize: typography.body, fontWeight: '700' },
  feedbackText: { color: 'rgba(255,255,255,0.78)', fontSize: typography.caption, lineHeight: 18, textAlign: 'center' },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 9, backgroundColor: colors.primaryMuted },
  retryText: { color: colors.dark, fontSize: typography.caption, fontWeight: '700' },
  permissionState: { width: '100%', aspectRatio: 1, maxHeight: 344, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.darkMuted },
  permissionIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: spacing.xs },
  permissionTitle: { color: colors.white, fontSize: typography.body, fontWeight: '700' },
  permissionCopy: { color: 'rgba(255,255,255,0.6)', fontSize: typography.caption, lineHeight: 18, textAlign: 'center', marginBottom: spacing.sm },
  actions: { alignItems: 'center', gap: spacing.sm },
  manual: { height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, width: '100%' },
  manualText: { color: colors.white, fontSize: typography.small, fontWeight: '700' },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.xs },
  demoText: { color: colors.primaryMuted, fontSize: typography.caption, fontWeight: '600' },
  privacy: { color: 'rgba(255,255,255,0.38)', fontSize: 11, textAlign: 'center', marginTop: spacing.xs },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,16,11,0.54)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.xl, paddingBottom: 38 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginTop: spacing.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  sheetEyebrow: { color: colors.primary, fontSize: typography.caption, fontWeight: '700', marginBottom: 4 },
  sheetTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.4 },
  sheetSubtitle: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 21, marginTop: spacing.sm },
  codeInput: { minHeight: 74, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: typography.small, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.md },
  modalError: { color: colors.danger, fontSize: typography.caption, lineHeight: 18, marginBottom: spacing.sm },
});
