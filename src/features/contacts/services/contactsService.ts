import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Contacts, { Contact } from 'react-native-contacts';
import { formatPhoneNumber } from '../../sms/utils/phoneUtils';
import { PermissionStatus, PhoneToNameMap } from '../types';

/**
 * Checks if READ_CONTACTS permission is currently granted without triggering a dialog.
 */
export const checkContactsPermission = async (): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') return 'granted';

  try {
    const hasPerm = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS
    );
    return hasPerm ? 'granted' : 'undetermined';
  } catch (error) {
    console.error('Error checking contacts permission:', error);
    return 'undetermined';
  }
};

/**
 * Requests READ_CONTACTS permission at runtime.
 */
export const requestContactsPermission = async (): Promise<PermissionStatus> => {
  if (Platform.OS !== 'android') return 'granted';

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Permission Required',
        message: 'NeuroInbox needs contact access to resolve phone numbers to contact names.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Grant Access',
      }
    );

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'never_ask_again';
    } else {
      return 'denied';
    }
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return 'denied';
  }
};

/**
 * Opens system settings so user can manually enable permission if 'never_ask_again'.
 */
export const openAppSettings = (): void => {
  Linking.openSettings().catch((err) => {
    console.error('Unable to open app settings:', err);
  });
};

/**
 * Fetches device contacts and creates an O(1) phone number lookup dictionary.
 */
export const loadPhoneToNameMap = async (): Promise<PhoneToNameMap> => {
  if (Platform.OS !== 'android') return {};

  try {
    const contacts: Contact[] = await Contacts.getAllWithoutPhotos();
    const map: PhoneToNameMap = {};

    contacts.forEach((contact) => {
      const name =
        contact.displayName?.trim() ||
        [contact.givenName, contact.familyName].filter(Boolean).join(' ').trim();

      if (!name || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
        return;
      }

      contact.phoneNumbers.forEach((phoneObj) => {
        const rawNum = phoneObj.number;
        if (!rawNum) return;

        // 1. Standard format (+91XXXXXXXXXX)
        const formatted = formatPhoneNumber(rawNum);
        if (formatted) {
          map[formatted] = name;
        }

        // 2. Pure 10 digits key
        const pureDigits = rawNum.replace(/\D/g, '');
        if (pureDigits.length >= 10) {
          const last10 = pureDigits.slice(-10);
          map[last10] = name;
        }
      });
    });

    return map;
  } catch (error) {
    console.error('Error loading contacts:', error);
    return {};
  }
};

/**
 * Resolves contact name in O(1) time.
 */
export const resolveContactName = (
  address: string,
  map: PhoneToNameMap
): string | null => {
  if (!address || !map) return null;

  const formatted = formatPhoneNumber(address);
  if (formatted && map[formatted]) {
    return map[formatted];
  }

  const pureDigits = address.replace(/\D/g, '');
  if (pureDigits.length >= 10) {
    const last10 = pureDigits.slice(-10);
    if (map[last10]) {
      return map[last10];
    }
  }

  return null;
};
