import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Audio } from "expo-av";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TimerCircle({ duration = 120, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("Tap to Start");
  const [sound, setSound] = useState(null);

  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;

  // play and stop audio
  const playAudio = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/guide.mp3"),
        { shouldPlay: true }
      );
      setSound(sound);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  // handle countdown
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      stopAudio();
      setStatus("Complete");
      setIsRunning(false);
      onComplete && onComplete();
      return;
    }

    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // animate circle progress
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1 - timeLeft / duration,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // required for SVG
    }).start();
  }, [timeLeft]);

  const handleStart = async () => {
    if (!isRunning) {
      setIsRunning(true);
      setStatus("Meditating");
      await playAudio();
    }
  };

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Pressable onPress={handleStart}>
      <View style={styles.container}>
        <Svg width="240" height="240" viewBox="0 0 240 240">
          {/* Background ring */}
          <Circle
            stroke="#E5E7EB"
            fill="none"
            cx="120"
            cy="120"
            r={radius}
            strokeWidth={strokeWidth}
          />

          {/* Animated blue progress ring */}
          <AnimatedCircle
            cx="120"
            cy="120"
            r={radius}
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 120 120)"
          />
        </Svg>

        {/* Center text */}
        <View style={styles.textContainer}>
          <Text style={styles.timeText}>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  textContainer: {
    position: "absolute",
    alignItems: "center",
  },
  timeText: {
    fontSize: 36,
    fontWeight: "600",
    color: "#2563EB",
  },
  statusText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
});
