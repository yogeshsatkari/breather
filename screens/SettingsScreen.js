import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen({ navigation }) {
  const openLink = (url) => Linking.openURL(url);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Options */}
      <View style={styles.content}>
        {[
          { label: "Terms of Service", link: "https://bramble-pull-2fa.notion.site/Terms-of-Service-Break-Free-29ef34e14bad80488ab3f96d7e86408a" },
          { label: "Privacy Policy", link: "https://bramble-pull-2fa.notion.site/Privacy-Policy-Break-Free-29ef34e14bad8010a145de033b4f9c24" },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.option}
            onPress={() => openLink(item.link)}
            activeOpacity={0.6}
          >
            <Text style={styles.optionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.option, { borderBottomWidth: 0 }]}
          onPress={() => alert("Account deletion coming soon")}
          activeOpacity={0.6}
        >
          <Text style={[styles.optionText, styles.deleteText]}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <Text style={styles.versionText}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20, // Top padding for content spacing
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingTop: 40, // Increased spacing from top
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  deleteText: {
    color: "#DC2626",
  },
  versionText: {
    marginTop: "auto",
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    marginBottom: 40, // Extra bottom margin to ensure no overlap with navigation
  },
});