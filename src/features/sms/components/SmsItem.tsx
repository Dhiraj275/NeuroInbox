import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Avatar, Text, useTheme } from 'react-native-paper';
import { SmsMessage } from '../types';

interface SmsItemProps {
  item: SmsMessage;
}

export const SmsItem: React.FC<SmsItemProps> = React.memo(({ item }) => {
  const theme = useTheme();
  
  const isUnread = item.read === 0;

  const getAvatarLabel = (sender: string) => {
    if (sender.startsWith('+') || sender.match(/^\d/)) {
      return '#';
    }
    return sender.substring(0, 1).toUpperCase();
  };

  const formattedDate = new Date(Number(item.date)).toLocaleDateString();

  return (
    <List.Item
      title={item.address}
      titleStyle={{ fontWeight: isUnread ? 'bold' : 'normal', color: theme.colors.onSurface }}
      description={item.body}
      style={{ paddingHorizontal: 10 }}
      descriptionNumberOfLines={1}
      descriptionStyle={{ color: isUnread ? theme.colors.onSurface : theme.colors.outline }}
      left={props => (
        <Avatar.Text
          {...props}
          size={40}
          label={getAvatarLabel(item.address)}
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
      onPress={() => { }}
    />
  );
});

const styles = StyleSheet.create({
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
