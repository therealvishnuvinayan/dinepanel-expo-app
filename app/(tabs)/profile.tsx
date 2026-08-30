import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  LogOut,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const menuItems: { label: string; icon: LucideIcon }[] = [
  { label: 'Personal details', icon: UserRound },
  { label: 'Payment & rewards', icon: CreditCard },
  { label: 'Notifications', icon: Bell },
  { label: 'Help & support', icon: CircleHelp },
  { label: 'Terms & privacy', icon: FileText },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const displayName = user?.name?.trim() || 'DinePanel member';
  const phone = user?.phone ?? '';
  const displayPhone = phone.startsWith('+971')
    ? `+971 ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`
    : phone;

  const openItem = (label: string) => {
    Alert.alert(label, 'This account area is ready for the next prototype stage.');
  };

  const logOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.eyebrow}>Your account</Text>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.phone}>{displayPhone}</Text>
        </View>
        <View style={styles.memberBadge}>
          <Text style={styles.memberText}>Member</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <View key={item.label}>
              <Pressable
                onPress={() => openItem(item.label)}
                style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
              >
                <View style={styles.menuIcon}>
                  <Icon color={colors.textSecondary} size={19} strokeWidth={2} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight color={colors.textTertiary} size={18} strokeWidth={2} />
              </Pressable>
              {index < menuItems.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
      </View>

      <Pressable onPress={() => void logOut()} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <LogOut color={colors.danger} size={19} strokeWidth={2} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Text style={styles.version}>DinePanel prototype · Dubai, UAE</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  eyebrow: { color: colors.primary, fontSize: typography.small, fontWeight: '700', marginBottom: spacing.xs },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: -0.75,
  },
  profileCard: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: typography.heading, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: spacing.sm },
  name: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  phone: { color: colors.textSecondary, fontSize: typography.caption },
  memberBadge: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  memberText: { color: colors.primary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  menu: {
    marginTop: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
  },
  menuRow: { height: 64, flexDirection: 'row', alignItems: 'center' },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, color: colors.text, fontSize: typography.small, fontWeight: '600', marginLeft: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 50 },
  logout: {
    height: 56,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: '#FFF7F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  logoutText: { color: colors.danger, fontSize: typography.small, fontWeight: '700' },
  version: { color: colors.textTertiary, fontSize: 11, textAlign: 'center', marginTop: spacing.xl },
  pressed: { opacity: 0.62 },
});
