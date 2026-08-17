import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Avatar, Text, Checkbox, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { SmsMessage } from '../types';
import { useContacts } from '../../contacts/hooks/useContacts';

interface SmsItemProps {
  item: SmsMessage;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: (item: SmsMessage) => void;
  onLongPress?: (item: SmsMessage) => void;
}

export const SmsItem: React.FC<SmsItemProps> = React.memo(({
  item,
  isSelectionMode = false,
  isSelected = false,
  onSelectToggle,
  onLongPress,
}) => {
  const theme = useTheme();
  const { getContactName } = useContacts();
  
  const isUnread = item.read === 0;
  const contactName = getContactName(item.address);
  const displayTitle = contactName || item.address;

  const getAvatarLabel = () => {
    if (contactName) {
      return contactName.trim().substring(0, 1).toUpperCase();
    }
    if (item.address.startsWith('+') || item.address.match(/^\d/)) {
      return '#';
    }
    return item.address.substring(0, 1).toUpperCase();
  };

  const formattedDate = new Date(Number(item.date)).toLocaleDateString();

  const handlePress = () => {
    if (isSelectionMode) {
      onSelectToggle?.(item);
    } else {
      router.push({
        pathname: '/thread/[threadId]' as any,
        params: { threadId: item.thread_id, address: item.address, contactName: contactName || '' }
      });
    }
  };

  const handleLongPress = () => {
    if (!isSelectionMode) {
      onLongPress?.(item);
    } else {
      onSelectToggle?.(item);
    }
  };

  return (
    <List.Item
      title={displayTitle}
      titleStyle={{ fontWeight: isUnread ? 'bold' : 'normal', color: theme.colors.onSurface }}
      description={item.body}
      style={[
        { paddingHorizontal: 10 },
        isSelected && { backgroundColor: theme.colors.primaryContainer + '40' }
      ]}
      descriptionNumberOfLines={1}
      descriptionStyle={{ color: isUnread ? theme.colors.onSurface : theme.colors.outline }}
      left={props => isSelectionMode ? (
        <View style={styles.checkboxContainer}>
          <Checkbox.Android
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => onSelectToggle?.(item)}
            color={theme.colors.primary}
          />
        </View>
      ) : (
        <Avatar.Text
          {...props}
          size={40}
          label={getAvatarLabel()}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.onPrimaryContainer}
        />
      )}
      right={() => (
        <View style={styles.rightContainer}>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>{formattedDate}</Text>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
        </View>
      )}
      onPress={handlePress}
      onLongPress={handleLongPress}
    />
  );
});

const styles = StyleSheet.create({
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 8,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 0,
    gap: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
