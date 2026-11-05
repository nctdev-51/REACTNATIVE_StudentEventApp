import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loginUser, clearError } from '../../features/auth/authSlice';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const { theme, isDark } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    dispatch(clearError());
    const result = await dispatch(loginUser({ email: email.trim(), password }));
    if (loginUser.rejected.match(result)) {
      Alert.alert('Đăng nhập thất bại', result.payload as string);
    }
    // Nếu thành công, RootNavigator sẽ tự chuyển sang MainStack (Sinh viên) hoặc AdminStack (Admin)
  };

  const fillStudent = () => {
    setEmail('sv01@iuh.edu.vn');
    setPassword('123456');
  };

  const fillAdmin = () => {
    setEmail('admin.doan@iuh.edu.vn');
    setPassword('admin123');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View style={styles.brandSection}>
            <View style={[styles.logoCircle, { backgroundColor: isDark ? theme.surfaceSecondary : '#EEF2FF' }]}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={[styles.appName, { color: theme.textPrimary }]}>StudentEvent IUH</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Hệ thống Quản lý Sự kiện – Đại học Công nghiệp TP.HCM</Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Đăng nhập tài khoản</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email tài khoản</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                  focusedField === 'email' && { borderColor: theme.primary, backgroundColor: theme.surface },
                ]}
              >
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="sv01@iuh.edu.vn hoặc admin.doan@iuh.edu.vn"
                  placeholderTextColor={theme.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  accessibilityLabel="Nhập email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                  focusedField === 'password' && { borderColor: theme.primary, backgroundColor: theme.surface },
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Nhập mật khẩu"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Đăng nhập"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
              )}
            </TouchableOpacity>

            {/* Quick Login Accounts */}
            <View style={[styles.demoSection, { borderTopColor: theme.border }]}>
              <Text style={[styles.demoTitle, { color: theme.textSecondary }]}>Đăng nhập nhanh:</Text>
              <View style={styles.demoRow}>
                {/* Sinh viên */}
                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    email === 'sv01@iuh.edu.vn' && { borderColor: theme.primary, backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' },
                  ]}
                  onPress={fillStudent}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoEmoji}>👨‍🎓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.demoRole, { color: theme.textPrimary }]}>Sinh viên</Text>
                    <Text style={[styles.demoAccount, { color: theme.textTertiary }]}>sv01@iuh.edu.vn</Text>
                  </View>
                </TouchableOpacity>

                {/* Admin */}
                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    { backgroundColor: isDark ? 'rgba(126,34,206,0.1)' : '#FDF4FF', borderColor: isDark ? '#7C3AED' : '#E9D5FF' },
                    email === 'admin.doan@iuh.edu.vn' && { borderColor: '#9333EA', backgroundColor: isDark ? 'rgba(147,51,234,0.2)' : '#FAF5FF' },
                  ]}
                  onPress={fillAdmin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoEmoji}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.demoRoleAdmin, { color: isDark ? '#C084FC' : '#7E22CE' }]}>Quản trị viên (Admin)</Text>
                    <Text style={[styles.demoAccount, { color: theme.textTertiary }]}>admin.doan@iuh.edu.vn</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: theme.textSecondary }]}>Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
            >
              <Text style={[styles.registerLink, { color: theme.primary }]}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sm,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    height: '100%',
  },
  eyeIcon: {
    fontSize: 18,
    padding: Spacing.xs,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.lg,
  },
  loginBtnDisabled: {
    backgroundColor: Colors.gray400,
    elevation: 0,
    shadowOpacity: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  demoRow: {
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  demoEmoji: {
    fontSize: 22,
  },
  demoRole: {
    fontSize: 13,
    fontWeight: '700',
  },
  demoRoleAdmin: {
    fontSize: 13,
    fontWeight: '700',
  },
  demoAccount: {
    fontSize: 11,
    marginTop: 1,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  registerText: {
    fontSize: Typography.base,
  },
  registerLink: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
});
