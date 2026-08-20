import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { SmsMessage } from '../types';
import { formatPhoneNumber } from '../utils/phoneUtils';
import { markThreadAsRead, subscribeToSmsReceived } from '../services/defaultSmsService';

export const useSmsThread = (threadId: number) => {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setError('SMS reading is only supported on Android.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'App needs access to read your SMS to display the thread.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Querying all boxes by setting box to '' to get both inbox and sent
        const filter = {
          box: '',
          thread_id: threadId,
          maxCount: 200, // Load a reasonable conversation length
        };

        SmsAndroid.list(
          JSON.stringify(filter),
          (fail: string) => {
            setError(fail);
            setLoading(false);
          },
          (count: number, smsList: string) => {
            const rawArr = JSON.parse(smsList) as SmsMessage[];
            const arr = rawArr.map(sms => ({
              ...sms,
              read: 1, // Mark locally as read since thread is opened
              address: formatPhoneNumber(sms.address),
            }));
            // Sort by date descending so we can render inverted (newest at bottom)
            const sorted = arr.sort((a, b) => Number(b.date) - Number(a.date));

            // Deduplicate by _id and matching content (address + body + timestamp within 3s)
            const seenIds = new Set<string>();
            const uniqueMessages: SmsMessage[] = [];

            for (const sms of sorted) {
              if (seenIds.has(sms._id)) continue;
              seenIds.add(sms._id);

              const isDuplicate = uniqueMessages.some(existing =>
                existing.address === sms.address &&
                existing.body === sms.body &&
                Math.abs(Number(existing.date) - Number(sms.date)) < 3000
              );

              if (!isDuplicate) {
                uniqueMessages.push(sms);
              }
            }

            setMessages(uniqueMessages);
            setLoading(false);

            // Persist read status (READ=1, SEEN=1) in Android system SMS Provider
            markThreadAsRead(threadId).catch(err => {
              console.error('Failed to mark thread as read in system database:', err);
            });
          },
        );
      } else {
        setError('SMS permission denied');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
    const unsubscribe = subscribeToSmsReceived(() => {
      fetchThread();
    });
    return () => unsubscribe();
  }, [fetchThread]);

  return { messages, loading, error, refetch: fetchThread };
};
