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

### Notes

- This app uses **expo-router**; routes live under the `app/` directory.
- Run all commands from the project root: `/Users/chriscecora/Documents/pdprojects/ai4/aipad`.
