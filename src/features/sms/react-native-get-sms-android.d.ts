declare module 'react-native-get-sms-android' {
  const SmsAndroid: {
    list: (
      filter: string,
      fail: (error: string) => void,
      success: (count: number, smsList: string) => void
    ) => void;
    autoSend: (
      phoneNumber: string,
      message: string,
      fail: (error: string) => void,
      success: (result: string) => void
    ) => void;
  };
  export default SmsAndroid;
}
