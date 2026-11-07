import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../types/event";
import { useAppTheme } from "../../theme/ThemeContext";

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";

interface FeaturedEventCardProps {
  event: Event;
}

function formatDate(dateString?: string) {
  if (!dateString) return "--/--/----";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "--/--/----";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export default function FeaturedEventCard({
  event,
}: FeaturedEventCardProps) {
  const { theme } = useAppTheme();

  const imageUri =
    event.images && event.images.length > 0 && event.images[0]
      ? event.images[0]
      : DEFAULT_EVENT_IMAGE;

  return (
    <View style={styles.card}>
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>
              {event.category || "Chung"}
            </Text>
          </View>

          <Text
            style={styles.title}
            numberOfLines={2}
          >
            {event.title}
          </Text>

<<<<<<< HEAD
          <Text style={styles.info}>
            📅 {formatDate(event.time?.start)}
          </Text>

          <Text
            style={styles.info}
            numberOfLines={1}
          >
            📍 {event.location || "Đang cập nhật địa điểm"}
          </Text>
=======
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
            <Text style={styles.info}>{formatDate(event.time.start)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={15} color="#FFFFFF" />
            <Text style={styles.info} numberOfLines={1}>{event.location}</Text>
          </View>
>>>>>>> 2fec513 (feat: enhance event registration handling and UI components for better user experience)
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 18,
  },

  image: {
    flex: 1,
    justifyContent: "flex-end",
  },

  imageStyle: {
    borderRadius: 18,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  content: {
    padding: 16,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
  },

  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  info: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
});
