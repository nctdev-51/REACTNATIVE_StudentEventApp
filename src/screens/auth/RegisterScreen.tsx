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
import { registerUser, clearError } from '../../features/auth/authSlice';
import { Colors, Spacing, BorderRadius, Typography, Shadow } from '../../theme';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Field {
  key: string;
  label: string;
  placeholder: string;
  icon: string;
  keyboardType?: any;
  autoCapitalize?: any;
  secure?: boolean;
}

const FIELDS: Field[] = [
  {
    key: 'studentId',
    label: 'Mã sinh viên',
    placeholder: 'VD: 20123456',
    icon: '🪪',
    autoCapitalize: 'characters',
  },
  {
    key: 'fullName',
    label: 'Họ và tên',
    placeholder: 'Nguyễn Văn A',
    icon: '👤',
    autoCapitalize: 'words',
  },
  {
    key: 'email',
    label: 'Email',
    placeholder: 'sv@iuh.edu.vn',
    icon: '📧',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    key: 'faculty',
    label: 'Khoa / Ngành',
    placeholder: 'VD: Công nghệ thông tin',
    icon: '🏫',
    autoCapitalize: 'words',
  },
  {
    key: 'password',
    label: 'Mật khẩu',
    placeholder: 'Tối thiểu 6 ký tự',
    icon: '🔒',
    secure: true,
  },
  {
    key: 'confirmPassword',
    label: 'Xác nhận mật khẩu',
    placeholder: 'Nhập lại mật khẩu',
    icon: '🔐',
    secure: true,
  },
];

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavProp>();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState<Record<string, string>>({
    studentId: '',
    fullName: '',
    email: '',
    faculty: '',
    password: '',
    confirmPassword: '',
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSecure, setShowSecure] = useState<Record<string, boolean>>({});

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSecure = (key: string) =>
    setShowSecure((prev) => ({ ...prev, [key]: !prev[key] }));

  const validate = (): string | null => {
    if (!form.studentId.trim()) return 'Vui lòng nhập mã sinh viên.';
    if (!form.fullName.trim()) return 'Vui lòng nhập họ và tên.';
    if (!form.email.trim() || !form.email.includes('@'))
      return 'Email không hợp lệ.';
    if (form.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (form.password !== form.confirmPassword)
      return 'Mật khẩu xác nhận không khớp.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Kiểm tra lại', validationError);
      return;
    }

    dispatch(clearError());
    const result = await dispatch(
      registerUser({
        studentId: form.studentId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        faculty: form.faculty.trim(),
        password: form.password,
      })
    );

    if (registerUser.rejected.match(result)) {
      Alert.alert('Đăng ký thất bại', result.payload as string);
    }
    // Nếu thành công, RootNavigator sẽ tự chuyển sang MainStack
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray50} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Đăng nhập</Text>
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>
              Đăng ký để tham gia các sự kiện của IUH
            </Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {FIELDS.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    focusedField === field.key && styles.inputWrapperFocused,
                  ]}
                >
                  <Text style={styles.inputIcon}>{field.icon}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.gray400}
                    value={form[field.key]}
                    onChangeText={(v) => updateField(field.key, v)}
                    keyboardType={field.keyboardType ?? 'default'}
                    autoCapitalize={field.autoCapitalize ?? 'sentences'}
                    autoCorrect={false}
                    secureTextEntry={
                      field.secure ? !showSecure[field.key] : false
                    }
                    onFocus={() => setFocusedField(field.key)}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                    accessibilityLabel={field.label}
                  />
                  {field.secure && (
                    <TouchableOpacity
                      onPress={() => toggleSecure(field.key)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.eyeIcon}>
                        {showSecure[field.key] ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Đăng ký"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Tạo tài khoản</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gray50 },
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  // Back
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 26,
    color: Colors.primary,
    fontWeight: '300',
    lineHeight: 28,
    marginRight: 4,
  },
  backLabel: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Title
  titleSection: { marginBottom: Spacing.xl },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: '800',
    color: Colors.gray900,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.gray500,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    ...Shadow.md,
  },

  // Fields
  fieldGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.gray600,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray50,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  inputIcon: { fontSize: 15, marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  eyeIcon: { fontSize: 18, paddingLeft: Spacing.sm },

  // Error
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.lg,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.gray400,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: '700',
  },

  // Login link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: { fontSize: Typography.base, color: Colors.gray500 },
  loginLink: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: '700',
  },
});
