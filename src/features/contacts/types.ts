export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'never_ask_again';

export interface SimplifiedContact {
  recordID: string;
  displayName: string;
  phoneNumbers: string[];
}

export type PhoneToNameMap = Record<string, string>;

export interface ContactsContextValue {
  contactMap: PhoneToNameMap;
  loading: boolean;
  permissionStatus: PermissionStatus;
  hasPermission: boolean;
  getContactName: (address: string) => string | null;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  refetchContacts: () => Promise<void>;
}
