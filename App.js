import React, { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { initializeNotifications } from "./utils/notifications";
import auth from "@react-native-firebase/auth";
import { statusCodes } from "@react-native-google-signin/google-signin";
import { Text, View, Image, TouchableOpacity } from "react-native";
import { signInWithGoogle, signOutUser } from "./utils/auth";

const Stack = createNativeStackNavigator();

// Get configuration from environment variables
const posthogApiKey =
  Constants.expoConfig?.extra?.posthogApiKey ||
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost =
  Constants.expoConfig?.extra?.posthogHost ||
  process.env.EXPO_PUBLIC_POSTHOG_HOST;

// Login screen component (inside PostHogProvider)
function LoginScreen() {
  const posthog = usePostHog();
  const [openedFromNotification, setOpenedFromNotification] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false); // Add loading state
  const hasCapturedAppOpen = useRef(false);

  useEffect(() => {
    let wasOpenedFromNotification = false;

    // Check if app was launched from a notification by setting up listener first
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);

        // If this is the first response and happens immediately, it means app was opened from notification
        if (!hasCapturedAppOpen.current) {
          wasOpenedFromNotification = true;
          setOpenedFromNotification(true);
        }

        posthog.capture("notification_opened", {
          notification_type: response.notification.request.content.title,
          timestamp: new Date().toISOString(),
        });
      });

    // Initialize notifications
    initializeNotifications();

    // Set up notification received listener
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        posthog.capture("notification_received", {
          notification_type: notification.request.content.title,
          timestamp: new Date().toISOString(),
        });
      }
    );

    // Capture app open after a brief delay to allow initial notification to be detected
    const timer = setTimeout(() => {
      if (!hasCapturedAppOpen.current) {
        hasCapturedAppOpen.current = true;

        posthog.capture("app_opened", {
          opened_from_notification: wasOpenedFromNotification,
          timestamp: new Date().toISOString(),
        });
      }
    }, 50); // Small delay to catch immediate notification responses

    return () => {
      notificationListener.remove();
      responseListener.remove();
      clearTimeout(timer);
    };
  }, [posthog]);

  const signIn = async () => {
    try {
      setIsSigningIn(true); // Set loading state
      posthog.capture("sign_in_button_clicked");
      await signInWithGoogle();
      // Don't set loading to false here - let auth state change handle it
    } catch (error) {
      // Check if this is a cancellation error
      const isCancelled = error?.code === statusCodes.SIGN_IN_CANCELLED;
      setIsSigningIn(false); // Reset loading on error
      if (isCancelled) {
        posthog.capture("sign_in_cancelled");
      } else {
        posthog.capture("sign_in_failed", { error: error.message });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {isSigningIn ? (
        // Show loading screen during sign-in
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: "#6B7280" }}>
            Signing you in...
          </Text>
        </View>
      ) : (
        // Original login UI
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
          }}
        >
          {/* Logo and text positioned above center */}
          <View
            style={{
              position: "absolute",
              top: "16%",
              left: 0,
              right: 0,
              alignItems: "center",
              transform: [{ translateY: -50 }],
            }}
          >
            {/* App Icon/Logo */}
            <View
              style={{
                // width: 60,
                // height: 60,
                borderRadius: 10,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 30,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Image
                source={require("./assets/splash-image.png")}
                style={{
                  width: 80,
                  height: 80,
                }}
                resizeMode="contain"
              />
            </View>

            {/* Welcome Text */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#1F2937",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Welcome to Reset
            </Text>
          </View>

          {/* Button at true center */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "100%",
                alignItems: "center",
                shadowColor: "#000",
                // shadowOffset: { width: 0, height: 3 },
                // shadowOpacity: 0.06,
                // shadowRadius: 6,
                // elevation: 3,
              }}
            >
              <TouchableOpacity
                style={{
                  width: "100%",
                  maxWidth: 450,
                  height: 56,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 3,
                }}
                onPress={signIn}
              >
                <Image
                  source={require("./assets/android_dark_sq_SI_4x.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 4,
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Authenticated app component (inside PostHogProvider)
function AuthenticatedApp({ user }) {
  const posthog = usePostHog();

  useEffect(() => {
    if (user) {
      posthog.identify(user.uid, {
        email: user.email,
        name: user.displayName,
      });
      posthog.capture("sign_in_success");
    }
  }, [user, posthog]);

  const signOut = async () => {
    posthog.capture("sign_out");
    await signOutUser();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      edges={["top", "bottom"]}
    >
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            initialParams={{ user }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            initialParams={{ user, signOut }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

// Main app component with PostHogProvider wrapping everything
function AppContent() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  if (initializing) return null;

  return (
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{
        host: posthogHost,
      }}
      autocapture={false} // try it better
    >
      {user ? <AuthenticatedApp user={user} /> : <LoginScreen />}
    </PostHogProvider>
  );
}

export default AppContent;
