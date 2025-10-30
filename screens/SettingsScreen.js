import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen({ navigation }) {
  const openLink = (url) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {/* Placeholder for balance */}
          <View style={{ width: 24 }} />
        </View>

        {/* Options */}
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => openLink("https://yourdomain.com/tos")}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => openLink("https://yourdomain.com/privacy")}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => alert("Account deletion coming soon")}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, styles.deleteText]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  content: {
    marginTop: 20,
  },
  option: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  deleteText: {
    color: "#DC2626",
  },
});
