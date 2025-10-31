import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TimerCircle from "../components/TimerCircle";
import BottomSheetReminder from "../components/BottomSheetReminder";

export default function HomeScreen({ navigation }) {
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  const handleStopSession = () => {
    setSessionActive(false); // triggers reset inside TimerCircle via prop
  };

  return (
    <View style={styles.container}>
      {/* Hide header & hero during active session */}
      {!sessionActive && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>Break Free</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Ready for your 2-minute break?</Text>
            <Text style={styles.heroSubtitle}>
              Take a deep breath and find your center.
            </Text>
          </View>
        </>
      )}

      {/* Timer Section */}
      <View
        style={[
          styles.timerContainer,
          sessionActive && { flex: 1, marginTop: 0 },
        ]}
      >
        <TimerCircle
          duration={120}
          onStart={() => setSessionActive(true)}
          onComplete={() => setSessionActive(false)}
          onStop={() => setSessionActive(false)}
          isSessionActive={sessionActive}
        />
      </View>

      {/* ❌ Stop Icon — visible during all active meditation stages */}
      {sessionActive && (
        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.8}
          onPress={handleStopSession}
        >
          <Ionicons name="close" size={24} color="#4B5563" />
        </TouchableOpacity>
      )}

      {/* Reminder Button */}
      {!sessionActive && (
        <TouchableOpacity
          style={styles.reminderButton}
          activeOpacity={0.8}
          onPress={() => setShowReminderSheet(true)}
        >
          <Text style={styles.reminderText}>🌤️ Remind me to take a break</Text>
        </TouchableOpacity>
      )}

      {/* Reminder Bottom Sheet */}
      {showReminderSheet && (
        <BottomSheetReminder onClose={() => setShowReminderSheet(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  hero: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
  },
  timerContainer: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderButton: {
    marginTop: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
    alignSelf: "center",
  },
  reminderText: {
    color: "#111827",
    fontWeight: "500",
    fontSize: 15,
  },
  closeButton: {
    position: "absolute",
    top: 60, // same as container paddingTop for alignment
    right: 24, // same as header horizontal padding
    padding: 6,
    borderRadius: 8,
  },
});
