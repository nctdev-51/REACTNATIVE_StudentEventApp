import React from "react";
import { Text as RNText, TextProps as RNTextProps, Platform, StyleSheet } from "react-native";

export interface AppTextProps extends RNTextProps {
  size?: "$1" | "$2" | "$3" | "$4" | "$5" | "$6" | "$7" | "$8" | string;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  color?: string;
  textAlign?: "auto" | "left" | "right" | "center" | "justify";
  marginBottom?: number;
  marginTop?: number;
  marginLeft?: number;
  marginRight?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  lineHeight?: number;
  fontStyle?: "normal" | "italic";
  flex?: number;
}

const sizeMap: Record<string, number> = {
  $1: 11,
  $2: 12.5,
  $3: 14,
  $4: 16,
  $5: 18,
  $6: 20,
  $7: 23,
  $8: 26,
};

/**
 * Text Component chuẩn font hệ thống (Roboto / SF Pro / System UI)
 * Đồng bộ phong cách hiển thị sắc nét, tròn trịa, chuẩn dấu tiếng Việt như trang chủ HomeScreen.
 */
export const AppText: React.FC<AppTextProps> = ({
  size,
  fontSize,
  fontWeight = "400",
  color,
  textAlign,
  marginBottom,
  marginTop,
  marginLeft,
  marginRight,
  marginHorizontal,
  marginVertical,
  lineHeight,
  fontStyle,
  flex,
  style,
  children,
  ...rest
}) => {
  const resolvedFontSize = fontSize ?? (size ? sizeMap[size] ?? 14 : 14);

  return (
    <RNText
      style={[
        styles.defaultFont,
        {
          fontSize: resolvedFontSize,
          fontWeight,
          color,
          textAlign,
          marginBottom,
          marginTop,
          marginLeft,
          marginRight,
          marginHorizontal,
          marginVertical,
          lineHeight,
          fontStyle,
          flex,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

export const AppHeading: React.FC<AppTextProps> = (props) => (
  <AppText
    fontWeight={props.fontWeight || "700"}
    size={props.size || "$6"}
    {...props}
  />
);

export const AppParagraph: React.FC<AppTextProps> = (props) => (
  <AppText
    size={props.size || "$3"}
    lineHeight={props.lineHeight || 20}
    {...props}
  />
);

const styles = StyleSheet.create({
  defaultFont: {
    // Font hệ thống nguyên bản giống hệt trang chủ HomeScreen
    ...Platform.select({
      ios: {
        fontFamily: "System",
      },
      android: {
        fontFamily: "Roboto",
        includeFontPadding: false,
      },
      default: {
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      },
    }),
  },
});

export default AppText;
