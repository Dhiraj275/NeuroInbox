import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkContactsPermission,
  loadPhoneToNameMap,
  openAppSettings,
  requestContactsPermission,
  resolveContactName,
} from '../services/contactsService';
import { ContactsContextValue, PermissionStatus, PhoneToNameMap } from '../types';

export const ContactsContext = createContext<ContactsContextValue>({
  contactMap: {},
  loading: false,
  permissionStatus: 'undetermined',
  hasPermission: false,
  getContactName: () => null,
  requestPermission: async () => false,
  openSettings: () => {},
  refetchContacts: async () => {},
});

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contactMap, setContactMap] = useState<PhoneToNameMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  const loadContactsData = useCallback(async () => {
    setLoading(true);
    try {
      const map = await loadPhoneToNameMap();
      setContactMap(map);
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

  const value = useMemo(
    () => ({
      contactMap,
      loading,
      permissionStatus,
      hasPermission: permissionStatus === 'granted',
      getContactName,
      requestPermission,
      openSettings: openAppSettings,
      refetchContacts: loadContactsData,
    }),
    [
      contactMap,
      loading,
      permissionStatus,
      getContactName,
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
