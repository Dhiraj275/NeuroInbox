import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { Category, SmsMessage } from '../types';

export const categorizeSms = (messages: SmsMessage[]): Record<Category, SmsMessage[]> => {
  const result: Record<Category, SmsMessage[]> = {
    All: [],
    Personal: [],
    Transactions: [],
    OTPs: [],
    Promotions: [],
  };

  messages.forEach((sms) => {
    result.All.push(sms);

    const address = sms.address.toLowerCase();
    const body = sms.body.toLowerCase();

    const isPhone = /^\+?91\d{10}$/.test(sms.address);
    const isTelecom = /\b(?:jio|idea|vi|vodafone|voda|bsnl|airtel)\b/i.test(address);

    // Personal
    if (isPhone) {
      result.Personal.push(sms);
    }

    // Transactions
    if (/\b(debited|credited|upi|dr\.?|cr\.?|withdrawn|spent|received)\b/i.test(body)) {
      result.Transactions.push(sms);
    }

    // OTPs
    if (/\b(otp|code|verification|password)\b/i.test(body)) {
      result.OTPs.push(sms);
    }

    // Offers
    if (
      sms.address.endsWith("P") ||
      (sms.address.endsWith("S") && isTelecom)
    ) {
      result.Promotions.push(sms);
    }
  });

  return result;
};

export const useSms = () => {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 100;

  const categorizedMessages = useMemo(() => {
    return categorizeSms(messages);
  }, [messages]);

  const fetchSmsBatch = useCallback(async (startIndex: number, isInitial: boolean = false) => {
    if (Platform.OS !== 'android') {
      setError('SMS reading is only supported on Android.');
      return;
    }

    try {
      if (isInitial) {
        setLoading(true);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
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
        const filter = {
          box: 'inbox',
          indexFrom: startIndex,
          maxCount: PAGE_SIZE,
        };

        SmsAndroid.list(
          JSON.stringify(filter),
          (fail: string) => {
            setError(fail);
            if (isInitial) setLoading(false);
            else setLoadingMore(false);
          },
          (count: number, smsList: string) => {
            const arr = JSON.parse(smsList) as SmsMessage[];
            if (isInitial) {
              setMessages(arr);
            } else {
              setMessages(prev => {
                const existingIds = new Set(prev.map(sms => sms._id));
                const uniqueNew = arr.filter(sms => !existingIds.has(sms._id));
                return [...prev, ...uniqueNew];
              });
            }

            if (arr.length < PAGE_SIZE) {
              setHasMore(false);
            }
            if (isInitial) setLoading(false);
            else setLoadingMore(false);
          },
        );
      } else {
        setError('SMS permission denied');
        if (isInitial) setLoading(false);
        else setLoadingMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchSmsBatch(0, true);
  }, [fetchSmsBatch]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchSmsBatch(messages.length, false);
  }, [fetchSmsBatch, loading, loadingMore, hasMore, messages.length]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    messages,
    categorizedMessages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    refetch,
  };
};

