import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../types/event";
import { isEventPast } from "../../services/api";
import { useAppTheme } from "../../theme/ThemeContext";

interface EventCardProps {
  event: Event;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export default function EventCard({ event }: EventCardProps) {
  const { theme, isDark } = useAppTheme();
  const isPast = isEventPast(event);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isPast
            ? isDark
              ? "#1E293B"
              : "#F8FAFC"
            : theme.surface,
          borderColor: isPast
            ? isDark
              ? "#334155"
              : "#E2E8F0"
            : theme.border,
          borderWidth: 1,
        },
        isPast && styles.pastCard,
      ]}
    >
      <Image
        source={{ uri: event.images[0] }}
        style={[styles.image, isPast && styles.pastImage]}
      />

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isPast
                ? isDark
                  ? "#94A3B8"
                  : "#64748B"
                : theme.textPrimary,
            },
          ]}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.info, { color: theme.textSecondary }]}>{formatDate(event.time.start)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.info, { color: theme.textSecondary }]} numberOfLines={1}>{event.location}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: isDark
                  ? "rgba(37,99,235,0.22)"
                  : "#e8f0ff",
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: isDark ? "#93C5FD" : "#2563eb" },
              ]}
            >
              {event.category}
            </Text>
          </View>

          {isPast ? (
            <View
              style={[
                styles.pastBadge,
                isDark && { backgroundColor: "rgba(239,68,68,0.2)" },
              ]}
            >
              <Text
                style={[
                  styles.pastBadgeText,
                  isDark && { color: "#FCA5A5" },
                ]}
              >
                Đã kết thúc
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.upcomingBadge,
                isDark && { backgroundColor: "rgba(34,197,94,0.2)" },
              ]}
            >
              <Text
                style={[
                  styles.upcomingBadgeText,
                  isDark && { color: "#86EFAC" },
                ]}
              >
                Sắp diễn ra
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.point,
              { color: isDark ? "#4ADE80" : "#16a34a" },
            ]}
          >
            +{event.trainingPoints} điểm
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  image: {
    width: 95,
    height: 95,
    borderRadius: 12,
    marginRight: 12,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  info: {
    fontSize: 13,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },

  point: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Past event styling
  pastCard: {
    opacity: 0.85,
  },
  pastImage: {
    opacity: 0.75,
  },
  pastBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pastBadgeText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "700",
  },
  upcomingBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  upcomingBadgeText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "700",
  },
});
