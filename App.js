import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { initializeNotifications } from "./utils/notifications";
import auth from "@react-native-firebase/auth";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { Text } from "react-native";
import { signInWithGoogle, signOutUser } from "./utils/auth";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    // Initialize notifications when app starts
    initializeNotifications();

    // Add notification listeners for debugging
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOut = async () => {
    await signOutUser();
  };

  if (initializing) return null;

  if (!user) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>index</Text>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={signIn}
        />
      </SafeAreaView>
    );
  }

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
