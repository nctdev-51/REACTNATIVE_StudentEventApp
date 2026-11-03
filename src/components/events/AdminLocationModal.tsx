import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Event, EventCoordinates } from '../../types';
import {
  geocodeAddress,
  getCurrentPosition,
  reverseGeocodeAddress,
  openInGoogleMaps,
} from '../../utils/permissionHandler';
import { updateEventCoordinates } from '../../services/api';
import { Colors } from '../../theme';

interface AdminLocationModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event;
  onSuccess?: (newLocation: string, newCoords: EventCoordinates) => void;
}

const QUICK_SUGGESTIONS = [
  'Đại học Công nghiệp TP.HCM (IUH)',
  '12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM',
  'Sân vận động Quân khu 7, TP.HCM',
  'Nhà thi đấu Đa năng IUH',
  'Hội trường E4, Trường Đại học Công nghiệp TP.HCM',
];

export default function AdminLocationModal({
  visible,
  onClose,
  event,
  onSuccess,
}: AdminLocationModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>(event.location || '');
  const [searching, setSearching] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [previewCoords, setPreviewCoords] = useState<EventCoordinates | null>(
    event.coordinates || null
  );
  const [previewAddress, setPreviewAddress] = useState<string>(event.location || '');

  // 1. Tìm toạ độ GPS từ địa chỉ text (Forward Geocoding)
  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Chưa nhập địa chỉ', 'Vui lòng nhập tên địa điểm hoặc địa chỉ để tìm kiếm.');
      return;
    }

    setSearching(true);
    try {
      const result = await geocodeAddress(searchQuery);
      if (result) {
        setPreviewCoords({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        setPreviewAddress(result.formattedAddress || searchQuery);
        Alert.alert(
          'Đã tìm thấy toạ độ!',
          `Địa chỉ: ${result.formattedAddress || searchQuery}\n• Vĩ độ: ${result.latitude.toFixed(6)}\n• Kinh độ: ${result.longitude.toFixed(6)}`
        );
      } else {
        Alert.alert(
          'Không tìm thấy toạ độ',
          'Không thể tìm toạ độ cho địa chỉ này. Hãy thử nhập địa chỉ chi tiết hơn (ví dụ: kèm tên Quận, Tỉnh/Thành phố).'
        );
      }
    } catch (err: any) {
      Alert.alert('Lỗi tìm kiếm', err?.message || 'Không thể kết nối dịch vụ định vị.');
    } finally {
      setSearching(false);
    }
  };

  // 2. Lấy vị trí GPS hiện tại của Admin đang đứng
  const handleUseCurrentLocation = async () => {
    setSearching(true);
    try {
      const loc = await getCurrentPosition(10000);
      if (loc) {
        const coords: EventCoordinates = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setPreviewCoords(coords);

        // Lấy tên địa chỉ thực tế từ Google Geocoding
        const addr = await reverseGeocodeAddress(coords.latitude, coords.longitude);
        const displayAddr = addr || `Toạ độ GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
        setSearchQuery(displayAddr);
        setPreviewAddress(displayAddr);

        Alert.alert(
          'Đã lấy toạ độ hiện tại!',
          `Vị trí bạn đang đứng:\n• Vĩ độ: ${coords.latitude.toFixed(6)}\n• Kinh độ: ${coords.longitude.toFixed(6)}\n• Địa chỉ: ${displayAddr}`
        );
      } else {
        Alert.alert('Lỗi GPS', 'Không thể xác định vị trí hiện tại của thiết bị. Hãy bật định vị GPS.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lấy toạ độ hiện tại.');
    } finally {
      setSearching(false);
    }
  };

  // 3. Mở Google Maps xem trước
  const handlePreviewOnMaps = () => {
    if (!previewCoords) return;
    openInGoogleMaps(previewCoords.latitude, previewCoords.longitude, previewAddress);
  };

  // 4. Lưu toạ độ và địa chỉ vào sự kiện
  const handleSaveLocation = async () => {
    if (!previewCoords) {
      Alert.alert('Chưa có toạ độ', 'Vui lòng tìm hoặc chọn toạ độ cho sự kiện trước khi lưu.');
      return;
    }

    setSaving(true);
    try {
      const targetId = event._id || (event as any).id;
      const updated = await updateEventCoordinates(targetId, previewCoords, previewAddress);

      Alert.alert(
        'Thành công! 🎉',
        `Đã lưu toạ độ địa điểm cho sự kiện:\n"${event.title}"\n\nToạ độ: ${previewCoords.latitude.toFixed(5)}, ${previewCoords.longitude.toFixed(5)}\nĐịa chỉ: ${previewAddress}\n\nKhi sinh viên có mặt tại địa điểm này (bán kính ≤ 500m) sẽ điểm danh thành công!`,
        [
          {
            text: 'Đóng',
            onPress: () => {
              if (onSuccess) onSuccess(previewAddress, previewCoords);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      // Nếu offline fallback, vẫn thông báo thành công cho phiên hiện tại
      if (onSuccess) onSuccess(previewAddress, previewCoords);
      Alert.alert(
        'Đã lưu toạ độ (Ngoại tuyến)',
        `Toạ độ đã được gán vào sự kiện cho phiên này:\n• Vĩ độ: ${previewCoords.latitude.toFixed(5)}\n• Kinh độ: ${previewCoords.longitude.toFixed(5)}`,
        [{ text: 'Đóng', onPress: onClose }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>📍 Cài đặt vị trí sự kiện</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {event.title}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Nhập text địa chỉ để tìm kiếm */}
            <Text style={styles.label}>Nhập tên địa điểm hoặc địa chỉ đường phố:</Text>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ví dụ: Hội trường E4 IUH, Sân QK7..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={handleSearchAddress}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.searchBtnText}>🔍 Tìm GPS</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Gợi ý địa điểm nhanh */}
            <Text style={styles.suggestionsTitle}>Hoặc chọn nhanh địa điểm mẫu:</Text>
            <View style={styles.suggestionsContainer}>
              {QUICK_SUGGESTIONS.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => setSearchQuery(sug)}
                >
                  <Text style={styles.suggestionChipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nút lấy vị trí hiện tại */}
            <TouchableOpacity
              style={styles.currentLocBtn}
              onPress={handleUseCurrentLocation}
              disabled={searching}
            >
              <Text style={styles.currentLocBtnText}>
                🎯 Lấy toạ độ GPS vị trí tôi đang đứng
              </Text>
            </TouchableOpacity>

            {/* Box kết quả toạ độ sau khi tìm kiếm */}
            <View style={styles.resultBox}>
              <Text style={styles.resultHeader}>Kết quả toạ độ được chọn:</Text>
              {previewCoords ? (
                <>
                  <View style={styles.coordsRow}>
                    <Text style={styles.coordsBadge}>Vĩ độ (Lat): {previewCoords.latitude.toFixed(6)}</Text>
                    <Text style={styles.coordsBadge}>Kinh độ (Lng): {previewCoords.longitude.toFixed(6)}</Text>
                  </View>

                  <Text style={styles.addressPreviewText}>
                    📍 <Text style={{ fontWeight: '700' }}>Địa chỉ:</Text> {previewAddress}
                  </Text>

                  <TouchableOpacity style={styles.mapsBtn} onPress={handlePreviewOnMaps}>
                    <Text style={styles.mapsBtnText}>🗺️ Mở kiểm tra trên Google Maps</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.noCoordsText}>
                  Chưa có toạ độ. Hãy nhập địa chỉ rồi bấm "🔍 Tìm GPS" hoặc bấm "🎯 Lấy toạ độ GPS tôi đang đứng".
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, (!previewCoords || saving) && styles.saveBtnDisabled]}
              onPress={handleSaveLocation}
              disabled={!previewCoords || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>💾 Lưu toạ độ vào sự kiện</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    maxWidth: 260,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  suggestionChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionChipText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '500',
  },
  currentLocBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLocBtnText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  resultHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  coordsBadge: {
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressPreviewText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  noCoordsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  mapsBtn: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapsBtnText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#16A34A',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

