## Frontend (Expo) – Getting Started

### Prerequisites

- **Node.js**: v18 or newer, and **npm**
- **iOS (optional)**: Xcode + iOS Simulator
- **Android (optional)**: Android Studio + Android Emulator
- **Physical device (optional)**: Install the Expo Go app from the App Store/Google Play

### Install dependencies

```bash
cd /Users/chriscecora/Documents/pdprojects/ai4/aipad
npm install
```

### Start the development server

```bash
npm run dev
```

When the dev server starts, use the on-screen prompts:

- **w**: open in the browser (web)
- **i**: launch iOS simulator
- **a**: launch Android emulator
- Or scan the QR code with the **Expo Go** app on a physical device

### Useful commands

- **Clear Metro cache**: `npm run dev -- --clear` (or `npm run dev -- -c`)
- **Build for web (static export)**: `npm run build:web`
- **Lint**: `npm run lint`

### Build on an Android device

1. Install Android Studio and ensure the Android SDK, platform tools, and an emulator or physical device with USB debugging are available.
2. If you are using a real device, enable **Developer options → USB debugging**, then connect it via USB and run `adb devices` to verify it is detected.
3. From the project root, install native dependencies and build the Android binary:

   ```bash
   npm run android
   ```

   This runs `expo run:android`, producing a debug build that is installed on the connected device/emulator.
4. For a release-signed build, first configure signing in `android/app/build.gradle`, then run:

   ```bash
   npx expo run:android --variant release
   ```

   The resulting APK/AAB is located under `android/app/build/outputs/` and can be side-loaded or uploaded to a store.

### Notes

- This app uses **expo-router**; routes live under the `app/` directory.
- Run all commands from the project root: `/Users/chriscecora/Documents/pdprojects/ai4/aipad`.
