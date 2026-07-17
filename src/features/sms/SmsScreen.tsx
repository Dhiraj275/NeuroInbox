import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Divider, FAB, Text, useTheme } from 'react-native-paper';
import { CategoryChips } from './components/CategoryChips';
import { SmsItem } from './components/SmsItem';
import { SmsSkeleton } from './components/SmsSkeleton';
import { useSms } from './hooks/useSms';
import { Category, SmsMessage } from './types';

const CATEGORIES: Category[] = ["All", "Personal", "Transactions", "OTPs", "Offers"];

const renderItem = ({ item }: { item: SmsMessage }) => (
  <SmsItem item={item} />
);

const renderSeparator = () => <Divider />;

export const SmsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>("Personal");
  const [isSwitching, setIsSwitching] = useState(false);
  const [groupByThread, setGroupByThread] = useState(false);
  const theme = useTheme();
  const { categorizedMessages, loading, loadingMore, loadMore, error, refetch } = useSms();

  const filteredSMS = categorizedMessages[selectedCategory] || [];

  const processedSMS = useMemo(() => {
    if (!groupByThread) return filteredSMS;

    const seenThreads = new Set<number>();
    return filteredSMS.filter((sms) => {
      if (sms.thread_id === undefined || sms.thread_id === null) {
        return true;
      }
      if (seenThreads.has(sms.thread_id)) {
        return false;
      }
      seenThreads.add(sms.thread_id);
      return true;
    });
  }, [filteredSMS, groupByThread]);

  const switchCategory = (category: Category) => {
    setIsSwitching(true);
    const timer = setTimeout(() => {
      setIsSwitching(false);
    }, 150);
    setSelectedCategory(category);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Action icon="menu" onPress={() => { }} />
        <Appbar.Content title="NeuroInbox" />
        <Appbar.Action
          icon={groupByThread ? "forum" : "forum-outline"}
          onPress={() => setGroupByThread(!groupByThread)}
          accessibilityLabel="Toggle thread view"
        />
        <Appbar.Action icon="magnify" onPress={() => { }} />
        <Appbar.Action icon="dots-vertical" onPress={() => { }} />
      </Appbar.Header>

      <CategoryChips
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={switchCategory}
      />

      {loading || isSwitching ? (
        <View style={{ flex: 1 }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <SmsSkeleton key={index} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: theme.colors.error, textAlign: 'center', padding: 20 }}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={processedSMS}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={true}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
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
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
