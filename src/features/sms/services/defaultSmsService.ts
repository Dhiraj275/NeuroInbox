import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const { DefaultSmsModule } = NativeModules;
const smsEventEmitter = DefaultSmsModule ? new NativeEventEmitter(DefaultSmsModule) : null;

export interface SmsReceivedEvent {
  address: string;
  body: string;
  timestamp: number;
}

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

/**
 * Sends an SMS message to a phone number.
 */
export const sendSms = async (phoneNumber: string, message: string): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  if (!DefaultSmsModule) {
    console.warn('DefaultSmsModule is missing from NativeModules!');
    return false;
  }
  try {
    return await DefaultSmsModule.sendSms(phoneNumber, message);
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

/**
 * Subscribes to real-time incoming SMS events.
 */
export const subscribeToSmsReceived = (
  callback: (event: SmsReceivedEvent) => void
): (() => void) => {
  if (Platform.OS !== 'android' || !smsEventEmitter) {
    return () => {};
  }
  const subscription = smsEventEmitter.addListener('onSmsReceived', callback);
  return () => {
    subscription.remove();
  };
};
