import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Platform,
  BackHandler,
  Switch,  // Added Switch import
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleAllReminders } from "../utils/notifications";

const REMINDERS_STORAGE_KEY = "@breathwise_reminders";

export default function BottomSheetReminder({ onClose }) {
  const [selectedTimes, setSelectedTimes] = useState([
    { label: "Morning", time: "07:00 AM", enabled: true },
    { label: "Noon", time: "12:00 PM", enabled: true },
    { label: "Evening", time: "06:00 PM", enabled: true },
    { label: "Night", time: "10:00 PM", enabled: true },
  ]);

  const [showPicker, setShowPicker] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [pickerTime, setPickerTime] = useState(new Date());

  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load saved reminders on component mount
  useEffect(() => {
    loadSavedReminders();
  }, []);

  // Animate in
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 🔹 Handle Android Back Button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showPicker) {
          // if time picker open, close it first
          setShowPicker(false);
          return true;
        }
        handleClose();
        return true; // prevents app from exiting
      }
    );

    return () => backHandler.remove();
  }, [showPicker]);

  const loadSavedReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
      if (savedReminders) {
        const parsed = JSON.parse(savedReminders);
        // Ensure all reminders have enabled property (for backward compatibility)
        const updated = parsed.map(reminder => ({
          ...reminder,
          enabled: reminder.enabled !== undefined ? reminder.enabled : true
        }));
        setSelectedTimes(updated);
      }
    } catch (error) {
      console.error("Error loading saved reminders:", error);
    }
  };

  const saveRemindersToStorage = async (reminders) => {
    try {
      await AsyncStorage.setItem(
        REMINDERS_STORAGE_KEY,
        JSON.stringify(reminders)
      );
    } catch (error) {
      console.error("Error saving reminders:", error);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const mins = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${mins} ${ampm}`;
  };

  const handleTimeChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    const newTime = formatTime(selectedDate);
    const updated = [...selectedTimes];
    updated[currentIndex].time = newTime;
    setSelectedTimes(updated);
    setShowPicker(false);
  };

  const toggleReminder = (index) => {
    const updated = [...selectedTimes];
    updated[index].enabled = !updated[index].enabled;
    setSelectedTimes(updated);
  };

  const openTimePicker = (index) => {
    const [time, ampm] = selectedTimes[index].time.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hours = parseInt(hourStr, 10);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(parseInt(minuteStr, 10));
    setPickerTime(date);

    setCurrentIndex(index);
    setShowPicker(true);
  };

  const handleSaveReminders = async () => {
    try {
      await saveRemindersToStorage(selectedTimes);
      await scheduleAllReminders();
      handleClose();
    } catch (error) {
      console.error("Error saving reminders:", error);
      handleClose();
    }
  };

  return (
    <Modal
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalSafeArea} edges={['bottom']}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}
            >
              <View style={styles.sheet}>
                <View style={styles.header}>
                  <View style={styles.handle} />
                  <Text style={styles.title}>Set Daily Reminders</Text>
                </View>

                {selectedTimes.map((slot, i) => (
                  <View key={i} style={styles.row}>
                    <TouchableOpacity
                      style={styles.timeSection}
                      activeOpacity={0.7}
                      onPress={() => openTimePicker(i)}
                    >
                      <Text style={[styles.label, !slot.enabled && styles.disabledText]}>
                        {slot.label}
                      </Text>
                      <Text style={[styles.time, !slot.enabled && styles.disabledText]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                    
                    <Switch
                      value={slot.enabled}
                      onValueChange={() => toggleReminder(i)}
                      trackColor={{ false: "#767577", true: "#2563EB" }}
                      thumbColor={slot.enabled ? "#ffffff" : "#f4f3f4"}
                      style={styles.switch}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  key={`save-btn-${selectedTimes.map(t => `${t.time}-${t.enabled}`).join('-')}`}
                  style={styles.doneBtn}
                  activeOpacity={0.8}
                  onPress={handleSaveReminders}
                >
                  <Text style={styles.doneText}>Save</Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={pickerTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleTimeChange}
                    is24Hour={false}
                  />
                )}
              </View>
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    // Only this container gets animated
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 340,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  timeSection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    color: "#374151",
  },
  time: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "600",
  },
  switch: {
    marginLeft: 12,
  },
  disabledText: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  doneBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
  },
  doneText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});