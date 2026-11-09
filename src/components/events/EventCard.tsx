import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../types/event";
import { useAppTheme } from "../../theme/ThemeContext";
import { formatEventDateTime } from "../../utils/dateUtils";
const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const { theme, isDark } = useAppTheme();
  const now = new Date();
  const startTime = new Date(event.time.start);
  const endTime = new Date(event.time.end);

  const isValidTime =
    Number.isFinite(startTime.getTime()) && Number.isFinite(endTime.getTime());

  const eventStatus = !isValidTime
    ? "unknown"
    : now < startTime
      ? "upcoming"
      : now <= endTime
        ? "ongoing"
        : "completed";

  const isPast = eventStatus === "completed";

  const imageUri =
    event.images && event.images.length > 0 && event.images[0]
      ? event.images[0]
      : DEFAULT_EVENT_IMAGE;

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
          borderColor: isPast ? (isDark ? "#334155" : "#E2E8F0") : theme.border,
          borderWidth: 1,
        },
        isPast && styles.pastCard,
      ]}
    >
      <Image
        source={{ uri: imageUri }}
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

<<<<<<< HEAD
<<<<<<< HEAD
        <Text style={[styles.info, { color: theme.textSecondary }]}>
          📅 {formatDate(event.time?.start)}
        </Text>

        <Text
          style={[styles.info, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          📍 {event.location || "Đang cập nhật địa điểm"}
        </Text>
=======
        <View style={styles.infoRow}>
<<<<<<< HEAD
          <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.info, { color: theme.textSecondary }]}>{formatDate(event.time.start)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.info, { color: theme.textSecondary }]} numberOfLines={1}>{event.location}</Text>
=======
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.textSecondary}
          />
          <Text style={[styles.info, { color: theme.textSecondary }]}>
            {formatEventDateTime(event.time?.start, event.time?.end)}
          </Text>
        </View>

=======
        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.textSecondary}
          />
          <Text style={[styles.info, { color: theme.textSecondary }]}>
            {formatEventDateTime(event.time?.start, event.time?.end)}
          </Text>
        </View>

>>>>>>> b7e173633c3070070c82170d45aeead4b5764103
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={theme.textSecondary}
          />
          <Text
            style={[styles.info, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {event.location || "Đang cập nhật địa điểm"}
          </Text>
<<<<<<< HEAD
>>>>>>> d397c6d (update home and event card)
        </View>
>>>>>>> 2fec513 (feat: enhance event registration handling and UI components for better user experience)
=======
        </View>
>>>>>>> b7e173633c3070070c82170d45aeead4b5764103

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: isDark ? "rgba(37,99,235,0.22)" : "#e8f0ff",
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.categoryText,
                { color: isDark ? "#93C5FD" : "#2563eb" },
              ]}
            >
              {event.category || "Chung"}
            </Text>
          </View>

          {eventStatus === "completed" ? (
            <View
              style={[
                styles.pastBadge,
                isDark && { backgroundColor: "rgba(239,68,68,0.2)" },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.pastBadgeText, isDark && { color: "#FCA5A5" }]}
              >
                Đã kết thúc
              </Text>
            </View>
          ) : eventStatus === "ongoing" ? (
            <View
              style={[
                styles.upcomingBadge,
                isDark && { backgroundColor: "rgba(34,197,94,0.2)" },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.upcomingBadgeText,
                  isDark && { color: "#86EFAC" },
                ]}
              >
                Đang diễn ra
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
                {eventStatus === "unknown" ? "Chưa xác định" : "Sắp diễn ra"}
              </Text>
            </View>
          )}

          <Text
            numberOfLines={1}
            style={[styles.point, { color: isDark ? "#4ADE80" : "#16a34a" }]}
          >
            +{event.trainingPoints ?? 0} điểm
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
    minWidth: 0,
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
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },

  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 1,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },

  point: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
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
    flexShrink: 1,
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
    flexShrink: 1,
  },
  upcomingBadgeText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "700",
  },
});
