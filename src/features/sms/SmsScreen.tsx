import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Divider, FAB, Text, useTheme } from 'react-native-paper';
import { CategoryChips } from './components/CategoryChips';
import { SmsItem } from './components/SmsItem';
import { useSms } from './hooks/useSms';
import { Category, SmsMessage } from './types';

const CATEGORIES: Category[] = ["All", "Personal", "Transactions", "OTPs", "Offers"];

export const SmsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const theme = useTheme();

  const { messages, loading, error, refetch } = useSms();

  // Very basic local filtering mockup. Real category filtering would require NLP or regex logic based on senders.
  const filteredSMS =
    selectedCategory === "All"
      ? messages
      : messages.filter((sms) => {
        const address = sms.address.toLowerCase();
        const body = sms.body.toLowerCase();
        const text = `${address} ${body}`;

        const isPhone = /^\+?91\d{10}$/.test(sms.address);
        const isTelecom = /\b(?:jio|idea|vi|vodafone|voda|bsnl|airtel)\b/i.test(address);

        switch (selectedCategory) {
          case "OTPs":
            return /\b(otp|code|verification|password)\b/i.test(body);

          case "Offers":
            return (
              sms.address.endsWith("P") ||
              (sms.address.endsWith("S") && isTelecom)
            );

          case "Transactions":
            return /\b(debited|credited|upi|dr\.?|cr\.?|withdrawn|spent|received)\b/i.test(body);

          case "Personal":
            return isPhone;

          default:
            return true;
        }
      });

  const renderItem = ({ item }: { item: SmsMessage }) => (
    <SmsItem item={item} />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Action icon="menu" onPress={() => { }} />
        <Appbar.Content title="NeuroInbox" />
        <Appbar.Action icon="refresh" onPress={refetch} />
        <Appbar.Action icon="magnify" onPress={() => { }} />
        <Appbar.Action icon="dots-vertical" onPress={() => { }} />
      </Appbar.Header>

      <CategoryChips
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.error, textAlign: 'center', padding: 20 }}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSMS}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text>No messages found.</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="message-plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => console.log('New Message')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80, // for FAB
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
