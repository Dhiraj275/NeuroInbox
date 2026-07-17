import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { SmsMessage } from '../types';

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
            const arr = JSON.parse(smsList) as SmsMessage[];
            // Sort by date descending so we can render inverted (newest at bottom)
            const sorted = arr.sort((a, b) => Number(b.date) - Number(a.date));
            setMessages(sorted);
            setLoading(false);
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
  }, [fetchThread]);

  return { messages, loading, error, refetch: fetchThread };
};
