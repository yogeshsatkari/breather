import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  AppState,
} from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TimerCircle({
  duration = 120,
  onStart,
  onComplete,
  onStop,
  isSessionActive,
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [status, setStatus] = useState("Tap to Start");
  const [sound, setSound] = useState(null);

  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const prepareTimeout = useRef(null);

  /** ─────── AUDIO MODE CONFIG ─────── **/
  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true, // ✅ key for background playback
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    })();
  }, []);

  /** ─────── PRELOAD AUDIO ─────── **/
  useEffect(() => {
    let preloadedSound;
    const preloadAudio = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/guide1.mp3"),
          { shouldPlay: false }
        );
        setSound(sound);
        preloadedSound = sound;
      } catch (e) {
        console.warn("Audio preload error:", e);
      }
    };
    preloadAudio();
    return () => {
      if (preloadedSound) preloadedSound.unloadAsync();
    };
  }, []);

  /** ─────── AUDIO CONTROL ─────── **/
  const playAudio = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require("../assets/sounds/guide1.mp3"),
          { shouldPlay: true }
        );
        setSound(newSound);
      }
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
      } catch {}
    }
  };

  /** ─────── RESET SESSION ─────── **/
  const resetSession = async () => {
    await stopAudio();
    if (timerRef.current) clearInterval(timerRef.current);
    if (prepareTimeout.current) clearTimeout(prepareTimeout.current);
    setTimeLeft(duration);
    setIsRunning(false);
    setIsStarted(false);
    setIsPreparing(false);
    setStatus("Tap to Start");
    animatedValue.setValue(0);
    onStop && onStop();
  };

  /** ─────── TIMER ─────── **/
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft <= 0) {
      stopAudio();
      setStatus("Complete");
      setIsRunning(false);
      onComplete && onComplete();

      const resetTimeout = setTimeout(resetSession, 2000);
      return () => clearTimeout(resetTimeout);
    }

    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  /** ─────── PROGRESS ANIMATION ─────── **/
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1 - timeLeft / duration,
      duration: 600,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [timeLeft]);

  /** ─────── PULSE WHILE PREPARING ─────── **/
  useEffect(() => {
    if (!isPreparing) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isPreparing]);

  /** ─────── START HANDLER ─────── **/
  const handleStart = async () => {
    if (isStarted || isPreparing) return;
    setIsPreparing(true);
    setStatus("Preparing your session");
    onStart && onStart();
    await playAudio();

    prepareTimeout.current = setTimeout(() => {
      setIsPreparing(false);
      setIsStarted(true);
      setIsRunning(true);
      setStatus("Meditating");
    }, 30000);
  };

  /** ─────── STOP FROM CROSS ICON ─────── **/
  useEffect(() => {
    if (!isSessionActive) resetSession();
  }, [isSessionActive]);

  /** ─────── KEEP PLAYING IN BACKGROUND ─────── **/
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "background" && isRunning && sound) {
        await sound.playAsync(); // ensure continues in background
      }
    });
    return () => subscription.remove();
  }, [isRunning, sound]);

  /** ─────── SVG PROGRESS ─────── **/
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  /** ─────── UI ─────── **/
  return (
    <Pressable onPress={handleStart}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {isPreparing ? (
          <View style={styles.preparingContainer}>
            <Text style={styles.preparingTitle}>Settle in</Text>
            <Text style={styles.preparingSubtitle}>
              Finding your calm space...
            </Text>
            <Animated.View
              style={[
                styles.preparingGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={styles.preparingPulse} />
            </Animated.View>
          </View>
        ) : (
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Svg width="240" height="240" viewBox="0 0 240 240">
              <Defs>
                <RadialGradient id="matte" cx="50%" cy="50%" r="80%">
                  <Stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.9" />
                  <Stop offset="60%" stopColor="#3B82F6" stopOpacity="0.5" />
                  <Stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.3" />
                </RadialGradient>
              </Defs>

              {!isStarted && (
                <Circle cx="120" cy="120" r={radius} fill="url(#matte)" />
              )}

              {isStarted && (
                <>
                  <Circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="#D1D5DB"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
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
                </>
              )}
            </Svg>

            <View style={styles.textContainer}>
              {!isStarted ? (
                <Ionicons
                  name="play"
                  size={48}
                  color="#ffffff"
                  style={styles.shadowIcon}
                />
              ) : (
                <>
                  <Text style={styles.timeText}>
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </Text>
                  <Text style={styles.statusText}>{status}</Text>
                </>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

/** ─────── STYLES ─────── **/
const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  textContainer: { position: "absolute", alignItems: "center" },
  timeText: { fontSize: 36, fontWeight: "600", color: "#2563EB" },
  statusText: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  shadowIcon: {
    textShadowColor: "rgba(255,255,255,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  preparingContainer: { alignItems: "center", justifyContent: "center" },
  preparingTitle: {
    fontSize: 24,
    color: "#2563EB",
    fontWeight: "600",
    marginBottom: 8,
  },
  preparingSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  preparingGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  preparingPulse: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#60A5FA",
  },
});
