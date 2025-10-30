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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function BottomSheetReminder({ onClose }) {
  const [selectedTimes, setSelectedTimes] = useState([
    { label: "Morning", time: "07:00 AM" },
    { label: "Noon", time: "12:00 PM" },
    { label: "Evening", time: "06:00 PM" },
    { label: "Night", time: "10:00 PM" },
  ]);

  const [showPicker, setShowPicker] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [pickerTime, setPickerTime] = useState(new Date());

  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const openTimePicker = (index) => {
    // Parse current time for pre-selection
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

  const handleSaveReminders = () => {
    console.log("Saved times:", selectedTimes);
    handleClose();
  };

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Daily Timer</Text>
              </View>

              {selectedTimes.map((slot, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.label}>{slot.label}</Text>
                  <TouchableOpacity
                    onPress={() => openTimePicker(i)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.time}>{slot.time}</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.doneBtn}
                activeOpacity={0.8}
                onPress={handleSaveReminders}
              >
                <Text style={styles.doneText}>Save Reminders</Text>
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
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 360,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    color: "#374151",
  },
  time: {
    fontSize: 16,
    color: "#4B9CD3",
    fontWeight: "600",
  },
  doneBtn: {
    backgroundColor: "#4B9CD3",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  doneText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
