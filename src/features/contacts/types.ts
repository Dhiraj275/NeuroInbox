export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'never_ask_again';

export interface SimplifiedContact {
  recordID: string;
  displayName: string;
  phoneNumbers: string[];
}

export interface ContactInfo {
  name: string;
  photoUri: string | null;
}

export type PhoneToNameMap = Record<string, string>;
export type PhoneToContactMap = Record<string, ContactInfo>;

export interface ContactsContextValue {
  contactMap: PhoneToNameMap;
  contactInfoMap: PhoneToContactMap;
  loading: boolean;
  permissionStatus: PermissionStatus;
  hasPermission: boolean;
  getContactName: (address: string) => string | null;
  getContactPhoto: (address: string) => string | null;
  getContactInfo: (address: string) => ContactInfo | null;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  refetchContacts: () => Promise<void>;
}
