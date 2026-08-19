import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Contacts, { Contact } from 'react-native-contacts';
import { formatPhoneNumber } from '../../sms/utils/phoneUtils';
import { ContactInfo, PermissionStatus, PhoneToContactMap, PhoneToNameMap } from '../types';

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
        message: 'NeuroInbox needs contact access to resolve phone numbers to contact names and photos.',
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

export interface ContactMapsResult {
  nameMap: PhoneToNameMap;
  infoMap: PhoneToContactMap;
}

/**
 * Fetches device contacts with photos and creates O(1) lookup maps.
 */
export const loadPhoneToContactMaps = async (): Promise<ContactMapsResult> => {
  if (Platform.OS !== 'android') return { nameMap: {}, infoMap: {} };

  try {
    const contacts: Contact[] = await Contacts.getAll();
    const nameMap: PhoneToNameMap = {};
    const infoMap: PhoneToContactMap = {};

    contacts.forEach((contact) => {
      const name =
        contact.displayName?.trim() ||
        [contact.givenName, contact.familyName].filter(Boolean).join(' ').trim();

      if (!name || !contact.phoneNumbers || contact.phoneNumbers.length === 0) {
        return;
      }

      const photoUri = (contact.hasThumbnail && contact.thumbnailPath) ? contact.thumbnailPath : null;
      const contactInfo: ContactInfo = { name, photoUri };

      contact.phoneNumbers.forEach((phoneObj) => {
        const rawNum = phoneObj.number;
        if (!rawNum) return;

        // 1. Standard format (+91XXXXXXXXXX)
        const formatted = formatPhoneNumber(rawNum);
        if (formatted) {
          nameMap[formatted] = name;
          infoMap[formatted] = contactInfo;
        }

        // 2. Pure 10 digits key
        const pureDigits = rawNum.replace(/\D/g, '');
        if (pureDigits.length >= 10) {
          const last10 = pureDigits.slice(-10);
          nameMap[last10] = name;
          infoMap[last10] = contactInfo;
        }
      });
    });

    return { nameMap, infoMap };
  } catch (error) {
    console.error('Error loading contacts:', error);
    return { nameMap: {}, infoMap: {} };
  }
};

/**
 * Legacy compatibility helper.
 */
export const loadPhoneToNameMap = async (): Promise<PhoneToNameMap> => {
  const result = await loadPhoneToContactMaps();
  return result.nameMap;
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

/**
 * Resolves contact info (name + photoUri) in O(1) time.
 */
export const resolveContactInfo = (
  address: string,
  map: PhoneToContactMap
): ContactInfo | null => {
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
