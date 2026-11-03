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

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavProp>();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
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
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={styles.appName}>StudentEvent</Text>
            <Text style={styles.tagline}>Sự kiện IUH – Hệ thống Quản trị & Sinh viên</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập tài khoản</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email tài khoản</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="sv01@iuh.edu.vn hoặc admin.doan@iuh.edu.vn"
                  placeholderTextColor={Colors.gray400}
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
              <Text style={styles.label}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={Colors.gray400}
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

            {/* Demo Accounts Quick Selection */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>🧪 Bấm chọn tài khoản thử nghiệm nhanh:</Text>
              <View style={styles.demoRow}>
                {/* Sinh viên */}
                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    email === 'sv01@iuh.edu.vn' && styles.demoPillActive,
                  ]}
                  onPress={fillStudent}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoEmoji}>👨‍🎓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoRole}>Sinh viên</Text>
                    <Text style={styles.demoAccount}>sv01@iuh.edu.vn</Text>
                  </View>
                </TouchableOpacity>

                {/* Admin */}
                <TouchableOpacity
                  style={[
                    styles.demoPill,
                    styles.demoPillAdmin,
                    email === 'admin.doan@iuh.edu.vn' && styles.demoPillActiveAdmin,
                  ]}
                  onPress={fillAdmin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.demoEmoji}>🛡️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoRoleAdmin}>Quản trị viên (Admin)</Text>
                    <Text style={styles.demoAccount}>admin.doan@iuh.edu.vn</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
            >
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    backgroundColor: '#F8FAFC',
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  logoEmoji: {
    fontSize: 34,
  },
  appName: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    color: Colors.gray900,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.gray900,
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
    paddingVertical: 14,
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
    borderTopColor: '#F1F5F9',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  demoRow: {
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  demoPillActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  demoPillAdmin: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FDF4FF',
  },
  demoPillActiveAdmin: {
    borderColor: '#9333EA',
    backgroundColor: '#FAF5FF',
  },
  demoEmoji: {
    fontSize: 22,
  },
  demoRole: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  demoRoleAdmin: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E22CE',
  },
  demoAccount: {
    fontSize: 11,
    color: '#64748B',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  registerText: {
    fontSize: Typography.base,
    color: Colors.gray500,
  },
  registerLink: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: '700',
  },
});
