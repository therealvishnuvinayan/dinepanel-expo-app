import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Flashlight, Keyboard, ScanLine, Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
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

export default function ScanScreen() {
  const router = useRouter();
  const [scanProgress] = useState(() => new Animated.Value(0));
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 2100,
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 2100,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scanProgress]);

  const scanLinePosition = scanProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 238],
  });

  const openDemoBill = () => router.push('/bill/confirm');

  return (
    <>
      <StatusBar style="light" />
      <Screen backgroundColor={colors.dark} contentStyle={styles.content} scroll={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DinePanel scanner</Text>
            <Text style={styles.title}>Scan your bill</Text>
          </View>
          <IconButton
            icon={Flashlight}
            label={flashOn ? 'Turn flash off' : 'Turn flash on'}
            onPress={() => setFlashOn((current) => !current)}
            tone="dark"
          />
        </View>

        <Text style={styles.subtitle}>Point your camera at the QR code on your restaurant bill.</Text>

        <View style={styles.scannerWrap}>
          <View style={[styles.scanner, flashOn && styles.scannerLit]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.qrHint}>
              <ScanLine color="rgba(255,255,255,0.38)" size={58} strokeWidth={1.2} />
              <Text style={styles.qrHintText}>Align QR code inside frame</Text>
            </View>
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLinePosition }] }]} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => setManualOpen(true)} style={({ pressed }) => [styles.manual, pressed && styles.pressed]}>
            <Keyboard color={colors.white} size={18} strokeWidth={2} />
            <Text style={styles.manualText}>Enter code manually</Text>
          </Pressable>

          <Pressable onPress={openDemoBill} style={({ pressed }) => [styles.demo, pressed && styles.pressed]}>
            <Sparkles color={colors.primaryMuted} size={15} strokeWidth={2} />
            <Text style={styles.demoText}>Use demo bill</Text>
          </Pressable>
        </View>

        <Text style={styles.privacy}>Scanning reads only the bill QR code. No image is stored.</Text>
      </Screen>

      <Modal animationType="slide" onRequestClose={() => setManualOpen(false)} transparent visible={manualOpen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable onPress={() => setManualOpen(false)} style={StyleSheet.absoluteFill} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetEyebrow}>Alternative entry</Text>
                <Text style={styles.sheetTitle}>Enter bill code</Text>
              </View>
              <IconButton icon={X} label="Close" onPress={() => setManualOpen(false)} />
            </View>
            <Text style={styles.sheetSubtitle}>You’ll find the 8-character code below the QR on your receipt.</Text>
            <TextInput
              autoCapitalize="characters"
              autoFocus
              maxLength={12}
              onChangeText={setManualCode}
              placeholder="e.g. GC29482"
              placeholderTextColor={colors.textTertiary}
              selectionColor={colors.primary}
              style={styles.codeInput}
              value={manualCode}
            />
            <Button
              disabled={manualCode.trim().length < 5}
              label="Find bill"
              onPress={() => {
                setManualOpen(false);
                openDemoBill();
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  header: {
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { color: colors.primaryMuted, fontSize: typography.caption, fontWeight: '700', marginBottom: 5 },
  title: { color: colors.white, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { color: 'rgba(255,255,255,0.62)', fontSize: typography.small, lineHeight: 21, marginTop: spacing.sm, maxWidth: 330 },
  scannerWrap: { flex: 1, justifyContent: 'center', paddingVertical: spacing.lg },
  scanner: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 344,
    borderRadius: 30,
    backgroundColor: colors.darkMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scannerLit: { backgroundColor: '#486057' },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: colors.white },
  topLeft: { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  topRight: { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bottomLeft: { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  bottomRight: { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  qrHint: { alignItems: 'center', gap: spacing.md },
  qrHintText: { color: 'rgba(255,255,255,0.44)', fontSize: typography.caption, fontWeight: '600' },
  scanLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 20,
    height: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
    opacity: 0.82,
  },
  actions: { alignItems: 'center', gap: spacing.sm },
  manual: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    width: '100%',
  },
  manualText: { color: colors.white, fontSize: typography.small, fontWeight: '700' },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.xs },
  demoText: { color: colors.primaryMuted, fontSize: typography.caption, fontWeight: '600' },
  privacy: { color: 'rgba(255,255,255,0.38)', fontSize: 11, textAlign: 'center', marginTop: spacing.xs },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,16,11,0.54)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingBottom: 38,
  },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginTop: spacing.sm },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  sheetEyebrow: { color: colors.primary, fontSize: typography.caption, fontWeight: '700', marginBottom: 4 },
  sheetTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700', letterSpacing: -0.4 },
  sheetSubtitle: { color: colors.textSecondary, fontSize: typography.small, lineHeight: 21, marginTop: spacing.sm },
  codeInput: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});
