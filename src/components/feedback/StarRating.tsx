import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  starActive: string;
  starInactive: string;
}

export default function StarRating({
  value,
  onChange,
  size = 36,
  starActive,
  starInactive,
}: StarRatingProps) {
  const ratingLabels: Record<number, string> = {
    1: "1/5 - Cần cải thiện",
    2: "2/5 - Tạm được",
    3: "3/5 - Bình thường",
    4: "4/5 - Tốt, hài lòng",
    5: "5/5 - Rất xuất sắc & bổ ích",
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.starRow}
        accessibilityRole="adjustable"
        accessibilityLabel={`Đánh giá ${value} sao trên 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= value;
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${star} sao`}
              style={styles.touchable}
            >
              <Ionicons
                name={isFilled ? "star" : "star-outline"}
                size={size}
                color={isFilled ? starActive : starInactive}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.labelText, { color: starActive }]}>
        {ratingLabels[value] || `${value}/5 sao`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 14,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  touchable: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
});
