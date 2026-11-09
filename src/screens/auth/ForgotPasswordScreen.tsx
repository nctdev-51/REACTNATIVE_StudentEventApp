import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { requestPasswordReset, resetPassword } from "../../services/api";
import { useAppTheme } from "../../theme";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    try {
      setBusy(true);
      const result = await requestPasswordReset(email.trim());
      setSent(true);
      Alert.alert("Kiểm tra email", result.demoCode ? `Mã demo: ${result.demoCode}` : "Mã gồm 6 số đã được gửi. Mã có hiệu lực 15 phút.");
    } catch (error: any) { Alert.alert("Không thể gửi mã", error?.response?.data?.message ?? error?.message); } finally { setBusy(false); }
  };
  const save = async () => {
    try {
      setBusy(true);
      await resetPassword(email.trim(), code.trim(), password);
      Alert.alert("Thành công", "Đặt lại mật khẩu thành công.", [{ text: "Đăng nhập", onPress: () => navigation.goBack() }]);
    } catch (error: any) { Alert.alert("Không thể đặt lại", error?.response?.data?.message ?? error?.message); } finally { setBusy(false); }
  };
  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}><View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <Text style={[styles.title, { color: theme.textPrimary }]}>Quên mật khẩu</Text>
    <Text style={[styles.help, { color: theme.textSecondary }]}>Nhập email để nhận mã xác nhận 6 số.</Text>
    <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" editable={!busy} />
    {sent && <><TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={code} onChangeText={setCode} placeholder="Mã xác nhận" keyboardType="number-pad" maxLength={6} editable={!busy} /><TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} value={password} onChangeText={setPassword} placeholder="Mật khẩu mới (ít nhất 6 ký tự)" secureTextEntry editable={!busy} /></>}
    <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} disabled={busy} onPress={sent ? save : send}><Text style={styles.buttonText}>{busy ? "Đang xử lý..." : sent ? "Đặt lại mật khẩu" : "Gửi mã xác nhận"}</Text></TouchableOpacity>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, justifyContent: "center", padding: 24 }, card: { borderWidth: 1, borderRadius: 16, padding: 20 }, title: { fontSize: 24, fontWeight: "700" }, help: { marginVertical: 12, lineHeight: 20 }, input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 }, button: { borderRadius: 10, alignItems: "center", padding: 14 }, buttonText: { color: "white", fontWeight: "700" } });
