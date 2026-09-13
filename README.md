# NeuroInbox

A native Android SMS client and organizer built with Expo SDK 57 and React Native. NeuroInbox categorizes SMS headers following TRAI standards, supports full Default SMS application capabilities, and handles external dialer intent routing.

---

## Key Features

- **TRAI Header Categorization**: Categorizes SMS headers into Personal, Transactions, OTPs, Government (`-G`), Services (`-S`), and Promotions using Telecom Regulatory Authority of India (TRAI) routing specifications.
- **Default SMS App Capabilities**: Handles native SMS sending via system `SmsManager`, thread resolution (`Telephony.Threads.getOrCreateThreadId`), message deletion, and system read/seen flag updates.
- **External Dialer Intent Interception**: Intercepts `smsto:` and `sms:` actions sent by Google Phone, Google Contacts, and third-party dialers to open target conversation threads directly.
- **Compose & Contact Autocomplete**: Recipient search with live device contact thumbnail resolution, phone number normalization (`formatPhoneNumber`), and `+91` deduplication.
- **Notification Deep-Linking**: Native Android `SmsReceiver` and `NotificationHelper` push notifications with deep-link navigation directly into specific thread screens.
- **100% On-Device & Private**: All message parsing, contact resolution, and categorization occur entirely on-device with zero telemetry or remote network dependency.
- **Material Design 3 & Safe Area Layout**: Adaptive light/dark theme implementation with `react-native-paper` and dynamic status bar inset handling (`useSafeAreaInsets` & `StatusBar.currentHeight`).

---

## Technical Stack

- **Core**: Expo SDK 57 (New Architecture & React 19), React Native 0.86
- **Routing**: Expo Router (File-based navigation)
- **UI Framework**: React Native Paper (Material Design 3)
- **Native Android Layer**: Custom Kotlin modules (`DefaultSmsModule.kt`, `SmsReceiver.kt`, `NotificationHelper.kt`, `MainActivity.kt`)

---

## System Requirements

- **Android OS**: Android 7.0 (API Level 24) or higher
- **Android Permissions**: `READ_SMS`, `SEND_SMS`, `RECEIVE_SMS`, `WRITE_SMS`, `READ_CONTACTS`, `POST_NOTIFICATIONS`

---

## Development & Build Guide

### 1. Installation

```bash
git clone https://github.com/Dhiraj275/NeuroInbox.git
cd NeuroInbox
npm install
```

### 2. Run Development Client

Connect an Android device via USB debugging or launch an emulator:

```bash
npx expo run:android
```

### 3. Build Release APK

```bash
cd android
./gradlew assembleRelease
# Output APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## Project Architecture

```
NeuroInbox/
 ├── android/           # Native Android gradle project & Kotlin bridge modules
 └── src/
      ├── app/          # Expo Router routes (_layout.tsx, index.tsx, compose.tsx, thread/[threadId].tsx)
      └── features/     
           ├── contacts/# Contact fetching, permissions, and thumbnail resolution
           └── sms/     # SMS hooks, components, TRAI parser, and default SMS service bridge
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
