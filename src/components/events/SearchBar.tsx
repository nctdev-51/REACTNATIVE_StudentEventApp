import { StyleSheet, TextInput, View, Text } from "react-native";

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>

      <TextInput
        style={styles.input}
        placeholder="Tìm kiếm sự kiện..."
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },

  icon: {
    fontSize: 18,
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
});