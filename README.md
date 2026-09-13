# NeuroInbox 🚀

[![Latest Release](https://img.shields.io/github/v/release/Dhiraj275/NeuroInbox?style=for-the-badge&logo=github&color=208AEF)](https://github.com/Dhiraj275/NeuroInbox/releases/latest)
[![Download APK](https://img.shields.io/badge/Download-APK%20v1.0.0-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Dhiraj275/NeuroInbox/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Android%207.0%2B-007ACC?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Dhiraj275/NeuroInbox)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A native Android SMS client and organizer built with Expo SDK 57 and React Native. NeuroInbox categorizes SMS headers following TRAI standards, supports full Default SMS application capabilities, and handles external dialer intent routing.

---

## 📥 Download Latest Release

Get the compiled, ready-to-install Android APK directly from the release page:

[![Download NeuroInbox v1.0.0 APK](https://img.shields.io/badge/⬇️_Download_NeuroInbox_v1.0.0_APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Dhiraj275/NeuroInbox/releases/latest)

> 🔗 **All Releases & Assets**: [GitHub Releases Page](https://github.com/Dhiraj275/NeuroInbox/releases)

---

## ✨ Key Features

- **TRAI Header Categorization**: Categorizes SMS headers into Personal, Transactions, OTPs, Government (`-G`), Services (`-S`), and Promotions using Telecom Regulatory Authority of India (TRAI) routing specifications.
- **Default SMS App Capabilities**: Handles native SMS sending via system `SmsManager`, thread resolution (`Telephony.Threads.getOrCreateThreadId`), message deletion, and system read/seen flag updates.
- **External Dialer Intent Interception**: Intercepts `smsto:` and `sms:` actions sent by Google Phone, Google Contacts, and third-party dialers to open target conversation threads directly.
- **Compose & Contact Autocomplete**: Recipient search with live device contact thumbnail resolution, phone number normalization (`formatPhoneNumber`), and `+91` deduplication.
- **Notification Deep-Linking**: Native Android `SmsReceiver` and `NotificationHelper` push notifications with deep-link navigation directly into specific thread screens.
- **100% On-Device & Private**: All message parsing, contact resolution, and categorization occur entirely on-device with zero telemetry or remote network dependency.
- **Material Design 3 & Safe Area Layout**: Adaptive light/dark theme implementation with `react-native-paper` and dynamic status bar inset handling (`useSafeAreaInsets` & `StatusBar.currentHeight`).

---

## 🛠 Technical Stack

- **Core**: Expo SDK 57 (New Architecture & React 19), React Native 0.86
- **Routing**: Expo Router (File-based navigation)
- **UI Framework**: React Native Paper (Material Design 3)
- **Native Android Layer**: Custom Kotlin modules (`DefaultSmsModule.kt`, `SmsReceiver.kt`, `NotificationHelper.kt`, `MainActivity.kt`)

---

## ⚠️ System Requirements

- **Android OS**: Android 7.0 (API Level 24) or higher
- **Android Permissions**: `READ_SMS`, `SEND_SMS`, `RECEIVE_SMS`, `WRITE_SMS`, `READ_CONTACTS`, `POST_NOTIFICATIONS`

---

## 🏁 Development & Build Guide

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

### 🐛 Troubleshooting Build Issues

If you encounter build errors related to `react-native-get-sms-android` during compilation, it is because the legacy library references the deprecated `jcenter()` repository in its module configuration.

**Fix**:
1. Open `node_modules/react-native-get-sms-android/android/build.gradle`.
2. Locate `jcenter()` under the `repositories` block.
3. Replace `jcenter()` with `mavenCentral()`.
4. Re-run your build command (`npx expo run:android` or `./gradlew assembleRelease`).

---

## 📁 Project Architecture

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

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
