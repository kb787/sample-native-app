// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Request permissions for notifications
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }
    
    // Only getting token on physical devices to avoid errors on simulators
    if (Constants.expoConfig?.extra?.eas?.projectId) {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Configure notification settings
export async function configureNotifications(): Promise<void> {
  // Configure how notifications appear when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Schedule a notification for a task
// export async function scheduleNotification(
//   id: string,
//   title: string,
//   body: string,
//   date: Date
// ): Promise<string> {
//   // Make sure permissions are granted
//   await registerForPushNotificationsAsync();

//   // Schedule the notification
//   const identifier = await Notifications.scheduleNotificationAsync({
//     content: {
//       title,
//       body,
//       data: { id },
//     },
//     trigger: { type: 'timeInterval',seconds: 60, repeats: true }
  
//   });

//   return identifier;
// }

// Cancel a scheduled notification
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}


  

