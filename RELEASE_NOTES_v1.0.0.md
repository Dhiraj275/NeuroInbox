# NeuroInbox v1.0.0 Release Notes 🚀

We are excited to announce the **v1.0.0** release of **NeuroInbox** — a smart, Material Design 3 default SMS organizer and messenger built for Android!

---

## 🌟 Key Highlights

### 🏷️ TRAI SMS Categorization
- Automatically organizes your SMS inbox using Telecom Regulatory Authority of India (TRAI) header rules (`-G` for Government, `-S` for Service messages, OTPs, Transactions, Personal, and Promotions).

### 📱 Default SMS App Capabilities
- Can be set as your Android device's **Default SMS App**.
- Native SMS sending via system `SmsManager` with automatic storage in Android's system SMS provider (`Telephony.Sms.Sent`).
- Batch deletion of messages and threads with safety confirmation dialogs.
- Automatic read flag handling (`READ` & `SEEN` flags).

### 📞 External App & Dialer Deep-Linking
- Seamless integration with **Google Phone**, **Google Contacts**, and system dialers.
- Tapping "Message" or "Send SMS" in external apps opens the target conversation thread directly inside NeuroInbox.

### ✉️ Compose & Contact Autocomplete
- Dedicated **New Conversation** screen with live device contact autocomplete.
- Phone number normalization (`formatPhoneNumber`) to deduplicate `+91` / local numbers into clean contact entries.
- Selecting any contact immediately redirects to their existing conversation thread.

### 🔔 Incoming Notifications & Instant Deep Link Navigation
- Custom native incoming SMS notifications with action deep-links.
- Tapping a notification opens the specific thread; pressing back returns safely to your main inbox.

### 🎨 Material Design 3 & Safe Area Layout
- Built with `react-native-paper` MD3 design tokens.
- Supports automatic System Dark & Light mode.
- Precise `SafeAreaView` and dynamic status bar inset handling across notch, hole-punch, and edge-to-edge screens.

---

## 📦 Download & Installation

1. Download `app-debug.apk` or `app-release.apk` from the assets below.
2. Install the APK on your Android device (Android 7.0 / API 24 or higher required).
3. Set **NeuroInbox** as your Default SMS app when prompted.

---

## 💻 Building from Source

```bash
# 1. Clone repository
git clone https://github.com/Dhiraj275/NeuroInbox.git
cd NeuroInbox

# 2. Install dependencies
npm install

# 3. Build & Run on Android
npx expo run:android
```
