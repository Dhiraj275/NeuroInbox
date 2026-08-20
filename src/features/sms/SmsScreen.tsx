import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Button, Dialog, Divider, FAB, Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import { ContactsPermissionBanner } from '../contacts/components/ContactsPermissionBanner';
import { CategoryChips } from './components/CategoryChips';
import { SmsItem } from './components/SmsItem';
import { SmsSkeleton } from './components/SmsSkeleton';
import { useSms } from './hooks/useSms';
import { Category, SmsMessage } from './types';

const CATEGORIES: Category[] = ["All", "Personal", "Transactions", "OTPs", "Government", "Services", "Promotions"];

const renderSeparator = () => <Divider />;

export const SmsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>("Personal");
  const [isSwitching, setIsSwitching] = useState(false);
  const [groupByThread, setGroupByThread] = useState(true);

  // Selection & Deletion State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const theme = useTheme();
  const { categorizedMessages, loading, loadingMore, loadMore, error, refetch, deleteMessages } = useSms();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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

  // All message IDs belonging to the active category
  const categoryAllMessageIds = useMemo(() => {
    return filteredSMS.map(sms => sms._id);
  }, [filteredSMS]);

  const isAllCategorySelected = useMemo(() => {
    if (categoryAllMessageIds.length === 0) return false;
    return categoryAllMessageIds.every(id => selectedIds.has(id));
  }, [categoryAllMessageIds, selectedIds]);

  const handleSelectAllCategory = () => {
    if (isAllCategorySelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categoryAllMessageIds));
    }
  };

  const handleSelectToggle = useCallback((item: SmsMessage) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (groupByThread && item.thread_id !== undefined) {
        const threadMessages = filteredSMS.filter(s => s.thread_id === item.thread_id);
        const threadIds = threadMessages.map(s => s._id);
        const allSelected = threadIds.every(id => next.has(id));
        if (allSelected) {
          threadIds.forEach(id => next.delete(id));
        } else {
          threadIds.forEach(id => next.add(id));
        }
      } else {
        if (next.has(item._id)) {
          next.delete(item._id);
        } else {
          next.add(item._id);
        }
      }
      return next;
    });
  }, [groupByThread, filteredSMS]);

  const handleLongPress = useCallback((item: SmsMessage) => {
    setIsSelectionMode(true);
    handleSelectToggle(item);
  }, [handleSelectToggle]);

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const switchCategory = (category: Category) => {
    setIsSwitching(true);
    const timer = setTimeout(() => {
      setIsSwitching(false);
    }, 150);
    setSelectedCategory(category);
    setSelectedIds(new Set());
  };

  const handleDeleteConfirmed = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);

    const idsToDelete = Array.from(selectedIds);
    const { successCount, failCount } = await deleteMessages(idsToDelete);

    setIsDeleting(false);
    setShowDeleteDialog(false);
    exitSelectionMode();

    if (failCount > 0) {
      setSnackbarMessage(`Deleted ${successCount} message(s). ${failCount} failed.`);
    } else {
      setSnackbarMessage(`Successfully deleted ${successCount} message(s).`);
    }
  };

  const renderItem = useCallback(({ item }: { item: SmsMessage }) => {
    const isItemSelected = groupByThread && item.thread_id !== undefined
      ? filteredSMS.filter(s => s.thread_id === item.thread_id).every(s => selectedIds.has(s._id))
      : selectedIds.has(item._id);

    return (
      <SmsItem
        item={item}
        isSelectionMode={isSelectionMode}
        isSelected={isItemSelected}
        onSelectToggle={handleSelectToggle}
        onLongPress={handleLongPress}
      />
    );
  }, [isSelectionMode, selectedIds, groupByThread, filteredSMS, handleSelectToggle, handleLongPress]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isSelectionMode ? (
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <Appbar.Action icon="close" onPress={exitSelectionMode} accessibilityLabel="Cancel selection" />
          <Appbar.Content
            title={`${selectedIds.size} Selected`}
            subtitle={`${selectedCategory} Category`}
          />
          <Appbar.Action
            icon={isAllCategorySelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
            onPress={handleSelectAllCategory}
            accessibilityLabel="Select all of category"
          />
          <Appbar.Action
            icon="delete-outline"
            disabled={selectedIds.size === 0}
            onPress={() => setShowDeleteDialog(true)}
            accessibilityLabel="Delete selected messages"
          />
        </Appbar.Header>
      ) : (
        <Appbar.Header elevated>
          <Appbar.Action icon="menu" onPress={() => { }} />
          <Appbar.Content title="NeuroInbox" />
          <Appbar.Action
            icon={groupByThread ? "forum" : "forum-outline"}
            onPress={() => setGroupByThread(!groupByThread)}
            accessibilityLabel="Toggle thread view"
          />
          <Appbar.Action
            icon="checkbox-multiple-marked-outline"
            onPress={() => setIsSelectionMode(true)}
            accessibilityLabel="Enter selection mode"
          />
          <Appbar.Action icon="dots-vertical" onPress={() => { }} />
        </Appbar.Header>
      )}

      <CategoryChips
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={switchCategory}
      />

      <ContactsPermissionBanner />

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

      {!isSelectionMode && (
        <FAB
          icon="message-plus"
          style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
          color={theme.colors.onPrimaryContainer}
          onPress={() => console.log('New Message')}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => !isDeleting && setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Messages</Dialog.Title>
          <Dialog.Content>
            {isDeleting ? (
              <View style={styles.dialogLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.error} />
                <Text style={{ marginTop: 16 }}>Deleting selected messages...</Text>
              </View>
            ) : (
              <Text variant="bodyMedium">
                Are you sure you want to delete {selectedIds.size} selected message(s) from your device? This action cannot be undone.
              </Text>
            )}
          </Dialog.Content>
          {!isDeleting && (
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button textColor={theme.colors.error} onPress={handleDeleteConfirmed}>
                Delete
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* Snackbar notification */}
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarMessage(null),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
  dialogLoadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
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
