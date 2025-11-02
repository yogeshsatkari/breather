import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const REMINDERS_STORAGE_KEY = "@breathwise_reminders";
const NOTIFICATION_IDS_KEY = "@breathwise_notification_ids";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Set up Android notification channel for offline notifications
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Breathing Reminders",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2563EB",
    sound: true,
    showBadge: false,
  });
}

// Request notification permissions
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Notification permissions are required for reminders to work!");
    return false;
  }

  return true;
};

// Parse time string and return hour/minute for daily triggers
const parseTimeForDailyTrigger = (timeString) => {
  const [time, ampm] = timeString.split(" ");
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return { hour: hours, minute: minutes };
};

// Schedule a single notification
const scheduleNotification = async (reminder, index) => {
  const { hour, minute } = parseTimeForDailyTrigger(reminder.time);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Break Free",
      body: `Time for your 2 minutes ${reminder.label.toLowerCase()} breathing!`,
      sound: "default",
    },
    trigger:
      Platform.OS === "android"
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: "default",
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
  });

  return { id: identifier, index, label: reminder.label };
};

// Cancel all existing notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Clear stored notification IDs
  try {
    await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
  } catch (error) {
    console.error("Error clearing notification IDs:", error);
  }
};

// Schedule notifications for all reminders
// Schedule notifications for all reminders
export const scheduleAllReminders = async () => {
  try {
    // Cancel existing notifications first
    await cancelAllNotifications();

    // Get saved reminders
    const savedReminders = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!savedReminders) {
      console.log("No reminders to schedule");
      return;
    }

    const allReminders = JSON.parse(savedReminders);
    
    // Filter to only enabled reminders
    const enabledReminders = allReminders.filter(reminder => reminder.enabled !== false);
    
    if (enabledReminders.length === 0) {
      console.log("No enabled reminders to schedule");
      return;
    }

    const notificationIds = [];

    // Schedule each enabled reminder
    for (let i = 0; i < enabledReminders.length; i++) {
      const notificationInfo = await scheduleNotification(enabledReminders[i], i);
      notificationIds.push(notificationInfo);
    }

    // Store notification IDs for later cancellation
    await AsyncStorage.setItem(
      NOTIFICATION_IDS_KEY,
      JSON.stringify(notificationIds)
    );

    console.log(
      `Scheduled ${notificationIds.length} enabled notifications:`,
      notificationIds
    );
    return notificationIds;
  } catch (error) {
    console.error("Error scheduling reminders:", error);
    throw error;
  }
};

// Get currently scheduled notifications (for debugging)
export const getScheduledNotifications = async () => {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications;
};

// Initialize notifications on app start
export const initializeNotifications = async () => {
  try {
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Schedule existing reminders
    await scheduleAllReminders();
    return true;
  } catch (error) {
    console.error("Error initializing notifications:", error);
    return false;
  }
};
