import React from "react";
import { StyleSheet, TextInput, View, Text } from "react-native";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { setSearchQuery } from "../../features/events/eventsSlice";
import { useAppTheme } from "../../theme";

export default function SearchBar() {
  const dispatch = useAppDispatch();
  const { theme } = useAppTheme();

  const searchQuery = useAppSelector(
    (state) => state.events.filter.searchQuery,
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
        },
      ]}
    >
      <Text style={styles.icon}>🔍</Text>

      <TextInput
        style={[styles.input, { color: theme.textPrimary }]}
        placeholder="Tìm kiếm sự kiện theo tên hoặc địa điểm..."
        placeholderTextColor={theme.textTertiary}
        value={searchQuery}
        onChangeText={(text) => dispatch(setSearchQuery(text))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 14.5,
  },
});
