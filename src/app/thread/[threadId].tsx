import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, PermissionsAndroid, StyleSheet, TextInput, View } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { Appbar, IconButton, Text, useTheme } from 'react-native-paper';
import { useSmsThread } from '../../features/sms/hooks/useSmsThread';
import { SmsMessage } from '../../features/sms/types';

export default function ThreadScreen() {
  const { threadId, address } = useLocalSearchParams();
  const theme = useTheme();
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const { messages, loading, error, refetch } = useSmsThread(Number(threadId));

  // The Catch: Short-codes / alphanumeric addresses are one-way and cannot be replied to.
  const isReplyable = address ? !/[a-zA-Z]/.test(address as string) : false;

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(Number(dateStr));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateStr: string) => {
    const d = new Date(Number(dateStr));
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;

    try {
      setSending(true);

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission',
          message: 'App needs permission to send SMS messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        SmsAndroid.autoSend(
          address as string,
          replyText,
          (fail: string) => {
            console.error('Failed to send SMS:', fail);
            setSending(false);
          },
          (success: string) => {
            setReplyText('');
            setSending(false);
            refetch(); // Refresh list to show the sent message
          }
        );
      } else {
        setSending(false);
      }
    } catch (err) {
      console.error(err);
      setSending(false);
    }
  };

  const renderItem = ({ item, index }: { item: SmsMessage; index: number }) => {
    // 2 is outgoing (Sent) in Android SMS ContentProvider
    const isOutgoing = item.type === 2;

    // Show date headers when date changes between messages
    let showDateHeader = false;
    if (index === messages.length - 1) {
      showDateHeader = true;
    } else {
      const prevMessage = messages[index + 1]; // because list is inverted, index + 1 is the previous message in time
      const currentDate = formatMessageDate(item.date);
      const prevDate = formatMessageDate(prevMessage.date);
      if (currentDate !== prevDate) {
        showDateHeader = true;
      }
    }

    return (
      <View style={styles.messageRow}>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text variant="bodySmall" style={[styles.dateHeaderText, { color: theme.colors.outline }]}>
              {formatMessageDate(item.date)}
            </Text>
          </View>
        )}
        <View style={[
          styles.bubbleContainer,
          isOutgoing ? styles.outgoingAlign : styles.incomingAlign
        ]}>
          <View style={[
            styles.bubble,
            isOutgoing
              ? [styles.outgoingBubble, { backgroundColor: theme.colors.primary }]
              : [styles.incomingBubble, { backgroundColor: theme.colors.surfaceVariant }]
          ]}>
            <Text selectable style={[
              styles.messageText,
              { color: isOutgoing ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }
            ]}>
              {item.body}
            </Text>
            <Text style={[
              styles.timeText,
              { color: isOutgoing ? theme.colors.primaryContainer : theme.colors.outline }
            ]}>
              {formatMessageTime(item.date)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={"height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.elevation.level2 }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={address as string || "Thread"}
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

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
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text>No messages in this thread.</Text>
            </View>
          }
        />
      )}

      {isReplyable ? (
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.inputPill, { backgroundColor: theme.colors.elevation.level1 }]}>
            <TextInput
              placeholder="Text message"
              placeholderTextColor={theme.colors.outline}
              value={replyText}
              onChangeText={setReplyText}
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
            disabled={!replyText.trim() || sending}
            onPress={handleSend}
            size={22}
            style={styles.sendButton}
          />
        </View>
      ) : (
        <View style={[styles.disabledBar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <IconButton icon="lock-outline" size={16} iconColor={theme.colors.outline} style={styles.lockIcon} />
          <Text style={[styles.disabledText, { color: theme.colors.outline }]}>
            Replies are not supported for this sender ID
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    width: '100%',
    marginVertical: 4,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bubbleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  incomingAlign: {
    justifyContent: 'flex-start',
  },
  outgoingAlign: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  incomingBubble: {
    borderBottomLeftRadius: 4,
  },
  outgoingBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
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
  disabledBar: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  lockIcon: {
    margin: 0,
    padding: 0,
  },
  disabledText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
