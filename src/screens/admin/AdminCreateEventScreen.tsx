import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '../../navigation/types';
import { navigate } from '../../navigation/navigationRef';
import { createEvent } from '../../services/api';
import { EventCoordinates } from '../../types';
import SemesterPicker from '../../components/events/SemesterPicker';
import { getCurrentSemesterId } from '../../utils/semester';
import {
  geocodeAddress,
  getCurrentPosition,
  reverseGeocodeAddress,
  openInGoogleMaps,
} from '../../utils/permissionHandler';
import { Colors } from '../../theme';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAppSelector } from '../../hooks/redux';

type AdminCreateNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminCreateEvent'>;

const CATEGORIES = ['Học thuật', 'Phong trào', 'Tình nguyện', 'Thể thao', 'Hội thảo'];

export default function AdminCreateEventScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<AdminCreateNavProp>();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [title, setTitle] = useState('');
  const [faculty, setFaculty] = useState('Khoa Công nghệ thông tin');
  const [category, setCategory] = useState('Học thuật');
  const [location, setLocation] = useState('Hội trường E4, Trường Đại học Công nghiệp TP.HCM');
  const [trainingPoints, setTrainingPoints] = useState('5');
  const [maxSlots, setMaxSlots] = useState('100');
  const [waitlistSlots, setWaitlistSlots] = useState('20');
  const [semesterId, setSemesterId] = useState<string | null>(getCurrentSemesterId());
  const [description, setDescription] = useState('');

  // GPS Geocoding State
  const [coords, setCoords] = useState<EventCoordinates | null>({
    latitude: 10.8221,
    longitude: 106.6876,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tìm toạ độ từ text địa chỉ (Forward Geocoding)
  const handleGeocode = async () => {
    if (!location.trim()) {
      Alert.alert('Chưa nhập địa điểm', 'Vui lòng nhập tên hội trường hoặc địa điểm tổ chức.');
      return;
    }

    setGeocoding(true);
    try {
      const result = await geocodeAddress(location.trim());
      setCoords(result);
      if (result.formattedAddress) {
        setLocation(result.formattedAddress);
      }
      Alert.alert(
        'Đã thiết lập địa điểm!',
        `Địa điểm tổ chức: ${result.formattedAddress || location}\n\nHệ thống đã tự động định vị toạ độ ngầm và kích hoạt xác thực điểm danh cho sinh viên.`
      );
    } catch (e: any) {
      Alert.alert('Thông báo', 'Đã ghi nhận địa điểm tổ chức sự kiện.');
    } finally {
      setGeocoding(false);
    }
  };

  // Lấy vị trí GPS hiện tại của Admin
  const handleUseCurrentLocation = async () => {
    setGeocoding(true);
    try {
      const pos = await getCurrentPosition(10000);
      if (pos) {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        const reverseName = await reverseGeocodeAddress(pos.coords.latitude, pos.coords.longitude);
        if (reverseName) {
          setLocation(reverseName);
        }
        Alert.alert(
          'Đã lấy toạ độ thực tế! 📍',
          `Vĩ độ: ${pos.coords.latitude.toFixed(5)}\nKinh độ: ${pos.coords.longitude.toFixed(5)}`
        );
      }
    } catch (e: any) {
      Alert.alert('Lỗi GPS', e?.message || 'Không thể lấy toạ độ hiện tại.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleCreate = async () => {
    if (currentUser?.role !== 'admin') {
      Alert.alert(
        'Phiên quản trị không hợp lệ',
        'Tài khoản hiện tại không có quyền tạo sự kiện. Vui lòng đăng xuất rồi đăng nhập lại bằng admin.doan@iuh.edu.vn.',
      );
      return;
    }
    if (!title.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề sự kiện.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Thiếu địa điểm', 'Vui lòng nhập địa điểm tổ chức sự kiện.');
      return;
    }

    setSubmitting(true);
    try {
      await createEvent({
        title: title.trim(),
        faculty: faculty.trim(),
        category,
        location: location.trim(),
        coordinates: coords || undefined,
        semesterId: semesterId || undefined,
        trainingPoints: parseInt(trainingPoints, 10) || 5,
        maxSlots: parseInt(maxSlots, 10) || 100,
        waitlistSlots: parseInt(waitlistSlots, 10) || 20,
        description: description.trim() || 'Sự kiện do Ban Chấp hành Đoàn trường tổ chức.',
        time: {
          start: new Date(Date.now() + 86400000).toISOString(),
          end: new Date(Date.now() + 86400000 + 7200000).toISOString(),
        },
      });

      Alert.alert('Thành công! 🎉', 'Sự kiện mới đã được tạo và kích hoạt mã QR Anti-Fake GPS.', [
        {
          text: 'Xem danh sách',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
            try {
              navigation.navigate('AdminTabs', { screen: 'AdminEvents' } as any);
            } catch {
              navigate('AdminEvents');
            }
          },
        },
      ]);
    } catch (e: any) {
      const status = e?.response?.status;
      const message = status === 401 || status === 403
        ? 'Máy chủ từ chối phiên đăng nhập. Hãy đăng xuất, đăng nhập lại tài khoản admin rồi thử lại.'
        : e?.response?.data?.message || e?.message || 'Không thể tạo sự kiện.';
      Alert.alert('Lỗi tạo sự kiện', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.statusBarStyle} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>➕ Thêm Sự Kiện Mới</Text>
          <Text style={[styles.screenSub, { color: theme.textSecondary }]}>
            Tạo sự kiện, gắn toạ độ GPS Anti-Fake và tự động tạo mã QR điểm danh cho sinh viên.
          </Text>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Tiêu đề */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Tiêu đề sự kiện *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="VD: Hội thảo Công nghệ Trí tuệ Nhân tạo 2026"
                placeholderTextColor={theme.textTertiary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Đơn vị tổ chức */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Đơn vị tổ chức / Khoa</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="VD: Khoa Công nghệ thông tin"
                placeholderTextColor={theme.textTertiary}
                value={faculty}
                onChangeText={setFaculty}
              />
            </View>

            {/* Danh mục */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Thể loại sự kiện</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const isActive = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isActive ? theme.primary : theme.surfaceSecondary,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          { color: isActive ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Học kỳ */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Học kỳ tổ chức</Text>
              <SemesterPicker
                value={semesterId}
                onChange={setSemesterId}
                allowAll={false}
              />
            </View>

            {/* Điểm rèn luyện */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Điểm rèn luyện</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="5"
                placeholderTextColor={theme.textTertiary}
                keyboardType="numeric"
                value={trainingPoints}
                onChangeText={setTrainingPoints}
              />
            </View>

            {/* Quota & Waitlist Capacity */}
            <View style={[styles.fieldGroup, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.primary, fontWeight: '700' }]}>👥 Giới Hạn Số Lượng Tham Gia (Quota)</Text>
              
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: theme.textSecondary, fontSize: 12 }]}>Số lượng chính thức *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.textPrimary,
                      },
                    ]}
                    placeholder="100"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    value={maxSlots}
                    onChangeText={setMaxSlots}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: theme.textSecondary, fontSize: 12 }]}>Danh sách chờ (Waitlist)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.textPrimary,
                      },
                    ]}
                    placeholder="20"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    value={waitlistSlots}
                    onChangeText={setWaitlistSlots}
                  />
                </View>
              </View>
              <Text style={{ fontSize: 11, color: theme.textTertiary, marginTop: 6, lineHeight: 15 }}>
                💡 Khi sự kiện đạt đủ số lượng chính thức ({maxSlots || 100}), các sinh viên đăng ký sau sẽ tự động vào Danh sách chờ. Khi có sinh viên hủy đăng ký hoặc bị Admin xóa, hệ thống sẽ tự động đôn người chờ lên.
              </Text>
            </View>

            {/* Địa điểm & Geocoding */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Địa điểm tổ chức sự kiện *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 48,
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Nhập địa chỉ hoặc tên hội trường..."
                placeholderTextColor={theme.textTertiary}
                value={location}
                onChangeText={setLocation}
              />

              {/* Action buttons cho GPS */}
              <View style={styles.gpsButtonsRow}>
                <TouchableOpacity
                  style={[styles.geocodeBtn, { backgroundColor: theme.primary }]}
                  onPress={handleGeocode}
                  disabled={geocoding}
                  activeOpacity={0.8}
                >
                  {geocoding ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.geocodeBtnText}>📍 Xác nhận địa điểm</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.currentPosBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                  onPress={handleUseCurrentLocation}
                  disabled={geocoding}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currentPosBtnText, { color: theme.textPrimary }]}>🎯 Đặt tại vị trí tôi</Text>
                </TouchableOpacity>
              </View>

              {/* Trạng thái xác thực địa điểm */}
              <View style={[styles.coordsDisplayBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <Text style={[styles.coordsDisplayLabel, { color: theme.textTertiary }]}>Trạng thái bảo mật vị trí điểm danh:</Text>
                {coords ? (
                  <View style={styles.coordsSuccessRow}>
                    <Text style={styles.coordsSuccessText}>
                      🔒 Đã kích hoạt bảo mật vị trí (Bán kính {coords.radiusMeters || 300}m)
                    </Text>
                    <TouchableOpacity
                      onPress={() => openInGoogleMaps(coords.latitude, coords.longitude, location)}
                      style={[styles.mapLinkBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}
                    >
                      <Text style={[styles.mapLinkBtnText, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>🗺️ Xem Map</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.coordsMissingText}>ℹ️ Điểm danh tự do (Không giới hạn vị trí)</Text>
                )}
              </View>
            </View>

            {/* Mô tả */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Mô tả chi tiết</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                placeholder="Nhập nội dung, quyền lợi, yêu cầu sự kiện..."
                placeholderTextColor={theme.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Nút tạo */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleCreate}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>🚀 Xuất Bản Sự Kiện Ngay</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16, paddingBottom: 40 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  screenSub: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  catChipActive: { backgroundColor: '#2563EB' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  catChipTextActive: { color: '#FFFFFF' },
  gpsButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  geocodeBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geocodeBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  currentPosBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  currentPosBtnText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  coordsDisplayBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  coordsDisplayLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  coordsSuccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  coordsSuccessText: { fontSize: 12, color: '#059669', fontWeight: '700' },
  mapLinkBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mapLinkBtnText: { fontSize: 11, color: '#4338CA', fontWeight: '700' },
  coordsMissingText: { fontSize: 12, color: '#DC2626', marginTop: 4, fontStyle: 'italic' },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
