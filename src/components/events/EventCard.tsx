import { Image, StyleSheet, Text, View } from "react-native";
import { Event } from "../../types/event";

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
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: event.images[0] }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        <Text style={styles.info}>
          📅 {formatDate(event.time.start)}
        </Text>

        <Text
          style={styles.info}
          numberOfLines={1}
        >
          📍 {event.location}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {event.category}
            </Text>
          </View>

          <Text style={styles.point}>
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
    backgroundColor: "#ffffff",
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
    color: "#1f2937",
    marginBottom: 6,
  },

  info: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  categoryBadge: {
    backgroundColor: "#e8f0ff",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },

  categoryText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
  },

  point: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
});