import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appbar, Avatar, Button, Divider, IconButton, Text, useTheme } from 'react-native-paper';
import { useContacts } from '../features/contacts/hooks/useContacts';
import { getThreadIdForAddress, sendSms } from '../features/sms/services/defaultSmsService';
import { formatPhoneNumber } from '../features/sms/utils/phoneUtils';

interface ContactSuggestion {
  address: string;
  name: string;
  photoUri: string | null;
}

export default function ComposeScreen() {
  const theme = useTheme();
  const { contactInfoMap, hasPermission, requestPermission } = useContacts();

  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<ContactSuggestion | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive unique contacts list from contactInfoMap
  const allContacts = useMemo(() => {
    const map = new Map<string, ContactSuggestion>();
    Object.entries(contactInfoMap).forEach(([address, info]) => {
      const key = `${info.name}-${address}`;
      if (!map.has(key)) {
        map.set(key, {
          address,
          name: info.name,
          photoUri: info.photoUri,
        });
      }
    });
    return Array.from(map.values());
  }, [contactInfoMap]);

  // Filter contacts based on recipientQuery
  const filteredContacts = useMemo(() => {
    if (!recipientQuery.trim()) return [];
    const query = recipientQuery.toLowerCase().trim();
    return allContacts.filter(
      c => c.name.toLowerCase().includes(query) || c.address.includes(query)
    ).slice(0, 15);
  }, [allContacts, recipientQuery]);

  const handleSelectContact = async (contact: ContactSuggestion) => {
    setSelectedRecipient(contact);
    setRecipientQuery(contact.name || contact.address);
    try {
      const threadId = await getThreadIdForAddress(contact.address);
      router.replace({
        pathname: '/thread/[threadId]' as any,
        params: {
          threadId: threadId,
          address: contact.address,
          contactName: contact.name || '',
        },
      });
    } catch (e) {
      console.error('Error redirecting to contact thread:', e);
    }
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setRecipientQuery('');
  };

  const getRecipientNumber = (): string => {
    if (selectedRecipient) return selectedRecipient.address;
    return formatPhoneNumber(recipientQuery.trim()) || recipientQuery.trim();
  };

  const handleSend = async () => {
    const targetAddress = getRecipientNumber();
    if (!targetAddress) {
      setErrorMessage('Please enter a valid phone number or select a contact.');
      return;
    }
    if (!messageBody.trim()) {
      setErrorMessage('Please enter a message.');
      return;
    }

    setErrorMessage(null);
    setSending(true);

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'SMS Permission',
            message: 'App needs permission to send SMS messages.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setErrorMessage('SMS permission denied.');
          setSending(false);
          return;
        }
      }

      const success = await sendSms(targetAddress, messageBody.trim());
      if (success) {
        // Navigate to thread screen
        router.replace({
          pathname: '/thread/[threadId]' as any,
          params: {
            threadId: 0, // Native useSmsThread queries thread by address / threadId
            address: targetAddress,
            contactName: selectedRecipient?.name || '',
          },
        });
      } else {
        setErrorMessage('Failed to send SMS. Make sure NeuroInbox is set as your default SMS app.');
      }
    } catch (err) {
      console.error('Error sending SMS:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const renderContactItem = useCallback(({ item }: { item: ContactSuggestion }) => {
    const avatarLabel = item.name.substring(0, 1).toUpperCase();
    return (
      <TouchableOpacity
        style={[styles.contactRow, { borderBottomColor: theme.colors.surfaceVariant }]}
        onPress={() => handleSelectContact(item)}
      >
        {item.photoUri ? (
          <Avatar.Image size={40} source={{ uri: item.photoUri }} />
        ) : (
          <Avatar.Text
            size={40}
            label={avatarLabel}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
        )}
        <View style={styles.contactDetails}>
          <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {item.address}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [theme]);

  return (
    <KeyboardAvoidingView
      behavior={'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.elevation.level2 }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="New Conversation" titleStyle={{ fontWeight: 'bold' }} />
      </Appbar.Header>

      {/* Recipient ("To:") Section */}
      <View style={[styles.recipientContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
        <Text variant="bodyMedium" style={[styles.toLabel, { color: theme.colors.outline }]}>
          To:
        </Text>
        <TextInput
          style={[styles.recipientInput, { color: theme.colors.onSurface }]}
          placeholder="Type a name or phone number"
          placeholderTextColor={theme.colors.outline}
          value={recipientQuery}
          onChangeText={text => {
            setRecipientQuery(text);
            if (selectedRecipient && text !== selectedRecipient.name) {
              setSelectedRecipient(null);
            }
          }}
          autoCapitalize="none"
          keyboardType="default"
        />
        {recipientQuery.length > 0 && (
          <IconButton icon="close-circle" size={20} onPress={handleClearRecipient} />
        )}
      </View>
      <Divider />

      {/* Error Banner */}
      {errorMessage && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
          <Text style={{ color: theme.colors.onErrorContainer }}>{errorMessage}</Text>
        </View>
      )}

      {/* Main Content: Contact Autocomplete or Message Composer */}
      {filteredContacts.length > 0 && !selectedRecipient ? (
        <View style={{ flex: 1 }}>
          <Text variant="labelSmall" style={[styles.sectionHeader, { color: theme.colors.outline }]}>
            SUGGESTED CONTACTS
          </Text>
          <FlatList
            data={filteredContacts}
            keyExtractor={item => `${item.name}-${item.address}`}
            renderItem={renderContactItem}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : (
        <View style={styles.composerArea}>
          {!hasPermission && (
            <TouchableOpacity style={styles.permissionTip} onPress={requestPermission}>
              <Text variant="bodySmall" style={{ color: theme.colors.primary, textAlign: 'center' }}>
                Grant contacts permission to search contacts by name
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
        </View>
      )}

      {/* Bottom Message Input Bar */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.inputPill, { backgroundColor: theme.colors.elevation.level1 }]}>
          <TextInput
            placeholder="Text message"
            placeholderTextColor={theme.colors.outline}
            value={messageBody}
            onChangeText={setMessageBody}
            style={[styles.input, { color: theme.colors.onSurface }]}
            multiline
            editable={!sending}
          />
        </View>
        <IconButton
          icon="send"
          mode="contained"
          containerColor={theme.colors.primary}
          iconColor={theme.colors.onPrimary}
          disabled={!recipientQuery.trim() || !messageBody.trim() || sending}
          onPress={handleSend}
          size={22}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  toLabel: {
    fontWeight: 'bold',
    marginRight: 12,
    fontSize: 16,
  },
  recipientInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontWeight: 'bold',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactDetails: {
    marginLeft: 14,
    flex: 1,
  },
  composerArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  permissionTip: {
    paddingVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputPill: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    textAlignVertical: 'center',
    margin: 0,
    padding: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
