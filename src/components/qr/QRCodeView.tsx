/**
 * QRCodeView – Render mã QR offline 100% bằng thư viện `toqr`.
 *
 * SỬA LỖI YOGA LAYOUT:
 * - KHÔNG dùng `flexWrap: 'wrap'` trên mảng phẳng (gây lỗi float rounding khiến các ô bị nhảy dòng làm biến dạng QR).
 * - Sử dụng cấu trúc hàng: Mỗi hàng là một `<View style={{ flex: 1, flexDirection: 'row' }}>`
 *   và mỗi ô là `<View style={{ flex: 1, backgroundColor: ... }}>`.
 * - Đảm bảo ma trận vuông 100%, các ô đồng đều tuyệt đối, camera MLKit đọc tức thì.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
// @ts-ignore – toqr không có types hoàn chỉnh cho ESM/CJS interop trên RN
import { toQR } from 'toqr';

interface QRCodeViewProps {
  /** Nội dung cần encode thành mã QR */
  value: string;
  /** Tổng kích thước (px) của ảnh QR. Mặc định 240 */
  size?: number;
  /** Màu của ô đen (foreground). Mặc định '#0F172A' */
  darkColor?: string;
  /** Màu của ô trắng (background). Mặc định '#FFFFFF' */
  lightColor?: string;
  /** Số ô viền trắng xung quanh QR (Quiet Zone). Mặc định 2 */
  quietZone?: number;
}

export default function QRCodeView({
  value,
  size = 240,
  darkColor = '#0F172A',
  lightColor = '#FFFFFF',
  quietZone = 2,
}: QRCodeViewProps) {
  const { rows, totalModules } = useMemo(() => {
    try {
      const raw: Uint8Array = toQR(value);
      const moduleCount = Math.round(Math.sqrt(raw.length));
      if (moduleCount === 0) return { rows: [], totalModules: 0 };

      const total = moduleCount + quietZone * 2;
      const matrixRows: boolean[][] = [];

      // 1. Quiet zone trên
      for (let qy = 0; qy < quietZone; qy++) {
        matrixRows.push(new Array(total).fill(false));
      }

      // 2. Các hàng dữ liệu QR
      for (let r = 0; r < moduleCount; r++) {
        const rowCells: boolean[] = [];
        // Quiet zone trái
        for (let q = 0; q < quietZone; q++) rowCells.push(false);
        // Dữ liệu module (1 = đen, 0 = trắng)
        for (let c = 0; c < moduleCount; c++) {
          rowCells.push(raw[r * moduleCount + c] === 1);
        }
        // Quiet zone phải
        for (let q = 0; q < quietZone; q++) rowCells.push(false);
        matrixRows.push(rowCells);
      }

      // 3. Quiet zone dưới
      for (let qy = 0; qy < quietZone; qy++) {
        matrixRows.push(new Array(total).fill(false));
      }

      return { rows: matrixRows, totalModules: total };
    } catch (e) {
      console.warn('[QRCodeView] toQR encode error:', e);
      return { rows: [], totalModules: 0 };
    }
  }, [value, quietZone]);

  if (totalModules === 0) {
    return (
      <View
        style={[
          styles.errorBox,
          { width: size, height: size, backgroundColor: lightColor },
        ]}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: lightColor,
        overflow: 'hidden',
      }}
    >
      {rows.map((row, rIdx) => (
        <View key={`r-${rIdx}`} style={styles.row}>
          {row.map((isDark, cIdx) => (
            <View
              key={`c-${cIdx}`}
              style={{
                flex: 1,
                backgroundColor: isDark ? darkColor : lightColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  errorBox: {
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
});
