import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkContactsPermission,
  loadPhoneToContactMaps,
  openAppSettings,
  requestContactsPermission,
  resolveContactInfo,
  resolveContactName,
} from '../services/contactsService';
import { ContactInfo, ContactsContextValue, PermissionStatus, PhoneToContactMap, PhoneToNameMap } from '../types';

export const ContactsContext = createContext<ContactsContextValue>({
  contactMap: {},
  contactInfoMap: {},
  loading: false,
  permissionStatus: 'undetermined',
  hasPermission: false,
  getContactName: () => null,
  getContactPhoto: () => null,
  getContactInfo: () => null,
  requestPermission: async () => false,
  openSettings: () => {},
  refetchContacts: async () => {},
});

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contactMap, setContactMap] = useState<PhoneToNameMap>({});
  const [contactInfoMap, setContactInfoMap] = useState<PhoneToContactMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  const loadContactsData = useCallback(async () => {
    setLoading(true);
    try {
      const { nameMap, infoMap } = await loadPhoneToContactMaps();
      setContactMap(nameMap);
      setContactInfoMap(infoMap);
    } catch (error) {
      console.error('Failed to load contacts map:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermissionState = useCallback(async () => {
    setLoading(true);
    try {
      const status = await checkContactsPermission();
      setPermissionStatus(status);
      if (status === 'granted') {
        await loadContactsData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking contacts permission state:', error);
      setLoading(false);
    }
  }, [loadContactsData]);

  useEffect(() => {
    checkPermissionState();
  }, [checkPermissionState]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const newStatus = await requestContactsPermission();
      setPermissionStatus(newStatus);

      if (newStatus === 'granted') {
        await loadContactsData();
        return true;
      } else if (newStatus === 'never_ask_again') {
        openAppSettings();
        setLoading(false);
        return false;
      } else {
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error during permission request:', error);
      setLoading(false);
      return false;
    }
  }, [loadContactsData]);

  const getContactName = useCallback(
    (address: string): string | null => {
      return resolveContactName(address, contactMap);
    },
    [contactMap]
  );

  const getContactInfo = useCallback(
    (address: string): ContactInfo | null => {
      return resolveContactInfo(address, contactInfoMap);
    },
    [contactInfoMap]
  );

  const getContactPhoto = useCallback(
    (address: string): string | null => {
      const info = resolveContactInfo(address, contactInfoMap);
      return info?.photoUri ?? null;
    },
    [contactInfoMap]
  );

  const value = useMemo(
    () => ({
      contactMap,
      contactInfoMap,
      loading,
      permissionStatus,
      hasPermission: permissionStatus === 'granted',
      getContactName,
      getContactPhoto,
      getContactInfo,
      requestPermission,
      openSettings: openAppSettings,
      refetchContacts: loadContactsData,
    }),
    [
      contactMap,
      contactInfoMap,
      loading,
      permissionStatus,
      getContactName,
      getContactPhoto,
      getContactInfo,
      requestPermission,
      loadContactsData,
    ]
  );

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
};
