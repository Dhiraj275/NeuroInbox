# Changelog

All notable changes to **NeuroInbox** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-13

### 🚀 Highlights
- **First Official Release of NeuroInbox!**
- A smart, privacy-focused, Material Design 3 SMS client for Android.

### ✨ Features & Capabilities
- **TRAI Categorization Engine**:
  - Automatically categorizes incoming and existing SMS headers according to Telecom Regulatory Authority of India (TRAI) standards (`-G` for Government, `-S` for Service messages, along with OTPs, Transactions, Personal, and Promotions).
- **Default SMS Application Support**:
  - Full native Default SMS app permissions and capabilities.
  - Native SMS sending via `SmsManager` with system content provider persistence (`Telephony.Sms.Sent`).
  - Thread message read status management (`Telephony.Sms.READ` & `SEEN`).
  - Batch message deletion with confirmation modal.
- **External Dialer & Contacts Integration**:
  - Intercepts external `smsto:`, `sms:`, `mms:`, and `mmsto:` intents from Google Phone, Google Contacts, and third-party dialers.
  - Resolves system `threadId` via `Telephony.Threads.getOrCreateThreadId` and seamlessly navigates directly to the target conversation.
- **Compose New SMS & Contact Search**:
  - Dedicated `/compose` route with real-time device contact autocomplete.
  - Phone number normalization (`formatPhoneNumber`) to eliminate duplicate `+91` contact rows.
  - Instant redirection to existing conversation threads when selecting contacts.
- **Notifications & Deep Linking**:
  - Custom incoming SMS notifications (`SmsReceiver` & `NotificationHelper`).
  - Direct deep-link navigation into target threads upon tapping notifications.
  - Safe back-navigation fallback to main inbox when app is opened via deep links.
- **Thread & List Display Modes**:
  - Group messages into conversation threads or view as individual messages.
  - Quick Actions 3-dots menu (`Show Messages` / `Show Threads` and `Refresh Inbox`).
- **UI & UX Excellence**:
  - Material Design 3 theme via `react-native-paper` with automatic Light/Dark mode.
  - Fixed-size contact avatar containers to prevent layout shift.
  - `SafeAreaView` inset protection and dynamic status bar height calculations (`useSafeAreaInsets` & `StatusBar.currentHeight`).
