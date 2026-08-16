import { useContext } from 'react';
import { ContactsContext } from '../context/ContactsContext';
import { ContactsContextValue } from '../types';

export const useContacts = (): ContactsContextValue => {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};
