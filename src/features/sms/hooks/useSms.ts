import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { isDefaultSmsApp, requestDefaultSmsApp, subscribeToSmsReceived } from '../services/defaultSmsService';
import { Category, SmsMessage } from '../types';
import { formatPhoneNumber } from '../utils/phoneUtils';

export const categorizeSms = (messages: SmsMessage[]): Record<Category, SmsMessage[]> => {
  const result: Record<Category, SmsMessage[]> = {
    All: [],
    Personal: [],
    Transactions: [],
    OTPs: [],
    Government: [],
    Services: [],
    Promotions: [],
  };

  messages.forEach((sms) => {
    result.All.push(sms);

    const rawAddress = sms.address.trim();
    const addressUpper = rawAddress.toUpperCase();
    const addressLower = rawAddress.toLowerCase();
    const bodyLower = sms.body.toLowerCase();

    const isPhone = /^\+\d{10,15}$/.test(addressLower) || /^\+?91\d{10}$/.test(addressLower);

    // TRAI DLT Header identification rules:
    // -G suffix / Government headers (e.g., AD-GOVMSG, AX-UIDAIG, XX-XXXX-G)
    const isGovernment =
      addressUpper.endsWith("-G") ||
      (addressUpper.length >= 6 && addressUpper.endsWith("G") && !isPhone)
    // -S suffix / Service headers (e.g., VM-INDGAS, AX-JIO-S, XX-XXXX-S)
    const isService =
      addressUpper.endsWith("-S") ||
      (addressUpper.length >= 6 && addressUpper.endsWith("S") && !isPhone) ||
      /\b(?:jio|idea|vi|vodafone|voda|bsnl|airtel|tatasky|dth|broadband|electricity|utility)\b/i.test(addressLower) ||
      /\b(recharge|bill due|plan expire|data limit|service request|complaint|ticket)\b/i.test(bodyLower);

    if (isGovernment) {
      result.Government.push(sms);
    }

    if (isService && !isGovernment) {
      result.Services.push(sms);
    }

    // Personal (Direct mobile number, not government/service/OTP)
    if (isPhone && !/\b(otp|code|verification|password|credentials)\b/i.test(bodyLower) && !isGovernment) {
      result.Personal.push(sms);
    }

    // Transactions
    if (/\b(debited|credited|upi|dr\.?|cr\.?|withdrawn|spent|received|transferred|acct|a\/c)\b/i.test(bodyLower)) {
      result.Transactions.push(sms);
    }

    // OTPs
    if (/\b(otp|code|verification|password|login pin)\b/i.test(bodyLower)) {
      result.OTPs.push(sms);
    }

    // Promotions (TRAI -P suffix or offer headers)
    if (
      addressUpper.endsWith("-P") ||
      (addressUpper.length >= 6 && addressUpper.endsWith("P") && !isPhone) ||
      /\b(offer|discount|sale|flat|win|cashback|buy 1 get 1|promo)\b/i.test(bodyLower)
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

      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any);
        } catch (e) {
          // Non-critical if user dismisses notification prompt
        }
      }

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const filter = {
          box: '',
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
            const rawArr = JSON.parse(smsList) as SmsMessage[];
            const arr = rawArr.map(sms => ({
              ...sms,
              address: formatPhoneNumber(sms.address),
            }));
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

  const deleteMessages = useCallback(async (ids: string[]): Promise<{ successCount: number; failCount: number; isNotDefaultApp?: boolean }> => {
    const isDefault = await isDefaultSmsApp();
    if (!isDefault) {
      await requestDefaultSmsApp();
      const doubleCheck = await isDefaultSmsApp();
      if (!doubleCheck) {
        return { successCount: 0, failCount: ids.length, isNotDefaultApp: true };
      }
    }

    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      await new Promise<void>((resolve) => {
        SmsAndroid.delete(
          Number(id),
          (fail: string) => {
            console.error(`Failed to delete SMS ${id}:`, fail);
            failCount++;
            resolve();
          },
          (res: string) => {
            successCount++;
            resolve();
          }
        );
      });
    }

    if (successCount > 0) {
      const deletedIdsSet = new Set(ids);
      setMessages(prev => prev.filter(sms => !deletedIdsSet.has(sms._id)));
    }

    return { successCount, failCount };
  }, []);

  useEffect(() => {
    refetch();
    const unsubscribe = subscribeToSmsReceived(() => {
      refetch();
    });
    return () => unsubscribe();
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
    deleteMessages,
  };
};
