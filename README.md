# NeuroInbox 🚀

> **Version 1.0.0** — A smart, privacy-focused, Material Design 3 SMS messenger and organizer for Android.

NeuroInbox is an Android SMS application built with Expo (SDK 57) and React Native. It intelligently categorizes SMS messages, supports full Default SMS App capabilities, seamlessly deep-links with external dialers (Google Phone, Contacts), and presents messages in a Material Design 3 user interface.

---

## ✨ Features

- 🏷️ **TRAI SMS Header Categorization**: Automatically filters messages based on Telecom Regulatory Authority of India (TRAI) header rules (`-G` for Government, `-S` for Service messages, along with OTPs, Transactions, Personal, and Promotions).
- 📲 **Default SMS Application Support**: Supports native SMS sending via system `SmsManager`, message deletion, read flag synchronization (`Telephony.Sms.READ`), and Default SMS app prompts.
- 📞 **External Dialer & Contacts Integration**: Intercepts `smsto:` and `sms:` intents from Google Phone, Google Contacts, and system dialers to open target conversation threads directly.
- ✉️ **Compose New SMS & Contact Autocomplete**: Fast contact search with live device contact photo caching and phone number deduplication (`formatPhoneNumber`).
- 🔔 **Notifications & Deep-Linking**: Instant incoming SMS notifications with deep-link navigation into conversation threads.
- 🎨 **Material Design 3 & Dynamic Theming**: Built with `react-native-paper`, supporting automatic Light/Dark mode themes and safe area inset protections.
- 🧵 **Flexible Viewing Modes**: Toggle between grouped conversation threads or individual message lists via the Quick Actions 3-dots menu.

---

## 🛠 Tech Stack

- **Framework**: [Expo SDK 57](https://expo.dev) / React Native (New Architecture & React 19)
- **UI System**: [React Native Paper](https://reactnativepaper.com/) (Material Design 3)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Native Android Modules**: Custom Kotlin native modules (`DefaultSmsModule`, `SmsReceiver`, `NotificationHelper`)

---

## ⚠️ Requirements

- **Operating System**: Android 7.0 (API Level 24) or higher.
- **Permissions**: `READ_SMS`, `SEND_SMS`, `RECEIVE_SMS`, `WRITE_SMS`, `READ_CONTACTS`, `POST_NOTIFICATIONS`.
- **Note**: Because this application relies on native Android Telephony ContentProviders and custom native Kotlin modules, it requires a custom development client build (`npx expo run:android`) or standalone APK installation.

---

## 🏁 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Dhiraj275/NeuroInbox.git
cd NeuroInbox
npm install
```

### 2. Run on Android Device / Emulator

Connect your physical Android device via USB debugging or launch an Android Emulator:

```bash
npx expo run:android
```

### 3. Build Release APK

To build a standalone debug/release APK for distribution:

```bash
cd android
./gradlew assembleDebug
# APK generated at android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📁 Project Structure

```
NeuroInbox/
 ├── android/           # Native Android project & custom Kotlin modules
 └── src/
      ├── app/          # Expo Router file routes (_layout.tsx, index.tsx, compose.tsx, thread/[threadId].tsx)
      └── features/     # Feature-based modular structure
           ├── contacts/# Contact photo caching & permissions
           └── sms/     # SMS hooks, components, native service bridge & phone utilities
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
