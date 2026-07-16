import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { SmsMessage } from '../types';

export const useSms = () => {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSms = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setError('SMS reading is only supported on Android.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'App needs access to read your SMS to categorize them.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        var filter = {
          box: 'inbox',
          indexFrom: 0,
          maxCount: 100,
        };

        SmsAndroid.list(
          JSON.stringify(filter),
          (fail: string) => {
            setError(fail);
            setLoading(false);
          },
          (count: number, smsList: string) => {
            const arr = JSON.parse(smsList) as SmsMessage[];
            setMessages(arr);
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
  }, []);

  useEffect(() => {
    fetchSms();
  }, [fetchSms]);

  return { messages, loading, error, refetch: fetchSms };
};
