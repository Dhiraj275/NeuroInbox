import { NativeModules, Platform } from 'react-native';

const { DefaultSmsModule } = NativeModules;

/**
 * Checks if NeuroInbox is currently set as the Android Default SMS App.
 */
export const isDefaultSmsApp = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  if (!DefaultSmsModule) {
    console.warn('DefaultSmsModule is missing from NativeModules!');
    return false;
  }
  try {
    return await DefaultSmsModule.isDefaultSmsApp();
  } catch (error) {
    console.error('Error checking default SMS app status:', error);
    return false;
  }
};

/**
 * Prompts the user to set NeuroInbox as the Default SMS App on Android.
 */
export const requestDefaultSmsApp = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  if (!DefaultSmsModule) {
    console.warn('DefaultSmsModule is missing from NativeModules!');
    return false;
  }
  try {
    return await DefaultSmsModule.requestDefaultSmsApp();
  } catch (error) {
    console.error('Error requesting default SMS app:', error);
    return false;
  }
};
