# NeuroInbox 🚀

> **Note:** 🚧 This application is currently **in development**. Features, UI, and functionality are subject to change.

NeuroInbox is a React Native mobile application built with Expo that organizes and categorizes your SMS messages into an intuitive, modern inbox. The app features a Material Design UI using `react-native-paper` and dynamically switches themes based on your device's system settings.

## Features ✨
- **Native SMS Fetching:** Automatically reads incoming and existing SMS messages directly from your Android device using `react-native-get-sms-android`.
- **Smart Categorization:** Filters your SMS into useful categories like Personal, Transactions, OTPs, and Offers.
- **Material Design:** A beautiful, responsive user interface built using `react-native-paper`.
- **Dynamic Theming:** Seamlessly adapts to your device's light or dark mode preferences.
- **Feature-Based Architecture:** Scalable and maintainable project structure.

## Tech Stack 🛠
- [Expo](https://expo.dev) / React Native
- [React Native Paper](https://reactnativepaper.com/) (Material Design)
- [React Native Get SMS Android](https://github.com/briankabiro/react-native-get-sms-android) (Native Android SMS capabilities)

## Requirements ⚠️
Because this application relies on native Android permissions (`READ_SMS`) and a native Android package (`react-native-get-sms-android`), **it cannot be run using the standard Expo Go app.**

You must build the project as a custom development client (or use Expo Prebuild). **This app only works on Android devices or emulators.**

## Getting Started 🏁

### 1. Install dependencies
```bash
npm install
```

### 2. Run the App on Android (Development Client)
Connect your physical Android device via USB debugging or start an Android Emulator, then run:

```bash
npx expo run:android
```

This command will:
1. Generate the native `android` folder (if missing).
2. Compile the custom native code and inject the required permissions.
3. Install the development client on your device/emulator.
4. Start the Metro bundler.

### 3. Grant Permissions
Upon launching the application for the first time, you will be prompted to grant SMS read permissions. Allow this permission to view your messages in the NeuroInbox dashboard.

### Troubleshooting Build Issues 🐛
If you encounter build errors related to `react-native-get-sms-android` preventing the Android app from compiling, it may be because the package relies on the deprecated `jcenter()` repository.

To fix this:
1. Open the file `node_modules/react-native-get-sms-android/android/build.gradle`.
2. Locate `jcenter()` (usually under the `repositories` block).
3. Replace `jcenter()` with `mavenCentral()`.
4. Run the build command again.

## Project Structure 📁
This project follows a feature-based folder structure:

```
src/
 ├── app/               # Expo Router entry points (_layout.tsx, index.tsx)
 └── features/          
      └── sms/          # Encapsulated SMS feature module
           ├── components/
           │    ├── CategoryChips.tsx
           │    └── SmsItem.tsx
           ├── hooks/
           │    └── useSms.ts
           ├── SmsScreen.tsx
           └── types.ts
```

## Contributing 🤝
Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

## License 📄
This project is licensed under the MIT License - see the LICENSE file for details.
