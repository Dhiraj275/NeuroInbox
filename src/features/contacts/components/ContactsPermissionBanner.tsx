import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useContacts } from '../hooks/useContacts';

export const ContactsPermissionBanner: React.FC = () => {
  const theme = useTheme();
  const { permissionStatus, requestPermission, openSettings } = useContacts();
  const [dismissed, setDismissed] = useState(false);

  if (permissionStatus === 'granted' || dismissed) {
    return null;
  }

  const isNeverAskAgain = permissionStatus === 'never_ask_again';

  const handleAction = () => {
    if (isNeverAskAgain) {
      openSettings();
    } else {
      requestPermission();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.elevation.level1 }]}>
      <View style={styles.textContainer}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Show Contact Names
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
          Allow contacts permission to view names instead of phone numbers.
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <Button
          mode="text"
          compact
          onPress={() => setDismissed(true)}
          textColor={theme.colors.outline}
        >
          Dismiss
        </Button>
        <Button
          mode="contained-tonal"
          compact
          onPress={handleAction}
        >
          {isNeverAskAgain ? 'Settings' : 'Enable'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
