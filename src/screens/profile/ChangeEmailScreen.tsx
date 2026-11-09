import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { confirmEmailChange, requestEmailChange } from "../../services/api";
import { updateUser } from "../../features/auth/authSlice";
import { useAppDispatch } from "../../hooks/redux";
import { useAppTheme } from "../../theme";

export default function ChangeEmailScreen() {
  const { theme } = useAppTheme(); const navigation = useNavigation(); const dispatch = useAppDispatch();
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  const send = async () => { try { setBusy(true); const result = await requestEmailChange(email.trim()); setSent(true); Alert.alert("Kiểm tra email", result.demoCode ? `Mã demo: ${result.demoCode}` : "Mã xác nhận đã được gửi đến email mới."); } catch (e: any) { Alert.alert("Không thể gửi mã", e?.response?.data?.message ?? e?.message); } finally { setBusy(false); } };
  const confirm = async () => { try { setBusy(true); const user = await confirmEmailChange(code.trim()); dispatch(updateUser(user)); Alert.alert("Thành công", "Email đã được cập nhật.", [{ text: "Đóng", onPress: () => navigation.goBack() }]); } catch (e: any) { Alert.alert("Không thể đổi email", e?.response?.data?.message ?? e?.message); } finally { setBusy(false); } };
  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}><View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.title, { color: theme.textPrimary }]}>Xác nhận email mới</Text><Text style={[styles.help, { color: theme.textSecondary }]}>Email mới sẽ chỉ được thay đổi sau khi nhập đúng mã xác nhận.</Text><TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Email mới" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy} />{sent && <TextInput style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} placeholder="Mã xác nhận 6 số" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} editable={!busy} />}<TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} disabled={busy} onPress={sent ? confirm : send}><Text style={styles.buttonText}>{busy ? "Đang xử lý..." : sent ? "Xác nhận đổi email" : "Gửi mã xác nhận"}</Text></TouchableOpacity></View></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, justifyContent: "center", padding: 24 }, card: { borderWidth: 1, borderRadius: 16, padding: 20 }, title: { fontSize: 24, fontWeight: "700" }, help: { marginVertical: 12, lineHeight: 20 }, input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 }, button: { borderRadius: 10, alignItems: "center", padding: 14 }, buttonText: { color: "white", fontWeight: "700" } });
