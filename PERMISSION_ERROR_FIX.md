# Permission Error Fix - Complete Solution

## The Error

```
Save error: [Error: Call to function 'ExpoMediaLibrary.getAlbumAsync' has been rejected.
→ Caused by: Missing MEDIA_LIBRARY permissions.]
```

## Root Cause

The issue had TWO problems:

1. **React Hooks Rules Violation**: The code was conditionally calling `MediaLibrary.usePermissions()` based on Platform.OS, which violates React's rules of hooks. Hooks must ALWAYS be called in the same order.

2. **MediaLibrary Still Being Called on Android**: Even though we tried to skip permissions, the actual MediaLibrary functions (`getAlbumAsync`, `createAssetAsync`, etc.) were still being called on Android, which requires permissions that Expo Go can't provide.

## The Solution

### Fixed Files:

#### 1. `hooks/useVideoRecording.ts`

- **BEFORE** (Wrong): Conditionally calling the hook

  ```typescript
  const [mediaLibraryPerm, requestMediaLibraryPerm] = Platform.OS === 'ios'
    ? MediaLibrary.usePermissions()
    : [{ granted: true }, async () => ({ ... })];
  ```

- **AFTER** (Correct): Always call the hook, check Platform at runtime

  ```typescript
  const [mediaLibraryPerm, requestMediaLibraryPerm] =
    MediaLibrary.usePermissions();

  // Then in requestPermissions function:
  if (Platform.OS === 'ios') {
    if (!mediaLibraryPerm?.granted) {
      const mediaResult = await requestMediaLibraryPerm();
      // ... handle result
    }
  }
  ```

#### 2. `components/VideoRecorder.tsx`

- Same fix as above - always call `MediaLibrary.usePermissions()` hook
- Added nested Platform check in `requestAllPermissions()` function
- Ensures MediaLibrary functions are never called on Android

#### 3. `utils/videoUtils.ts`

- Already had Platform checks in place (no changes needed)
- `saveToGallery()` uses MediaLibrary only on iOS
- Android path returns mock asset without calling MediaLibrary

## Key Points

### ✅ React Rules of Hooks

- **MUST** call hooks at the top level of the component/hook
- **MUST** call hooks in the same order every time
- **CANNOT** call hooks conditionally (inside if statements at hook level)
- **CAN** check conditions inside the hook's logic

### ✅ Platform-Specific Logic

```typescript
// ❌ WRONG - Violates hooks rules
const [perm, request] =
  Platform.OS === 'ios' ? MediaLibrary.usePermissions() : [mockValue];

// ✅ CORRECT - Always call hook, check platform in logic
const [perm, request] = MediaLibrary.usePermissions();

if (Platform.OS === 'ios') {
  // Use the permission
  if (!perm?.granted) {
    await request();
  }
}
// Android automatically passes (no MediaLibrary calls)
```

## Testing

### iOS ✅

- Camera permission ✅
- Microphone permission ✅
- Photo Library permission ✅
- Videos saved to Photos app in album ✅
- Full metadata available ✅

### Android ✅

- Camera permission ✅
- Microphone permission ✅
- MediaLibrary permission skipped (not needed) ✅
- Videos saved to cache ✅
- No MediaLibrary errors ✅
- Videos accessible for playback/upload ✅

## Why This Works

1. **Hooks are always called**: Satisfies React's rules
2. **Platform checks at runtime**: Only iOS code path uses MediaLibrary
3. **Android never calls MediaLibrary**: No permission errors
4. **Videos still work**: Stored in camera cache on Android

## Benefits

- ✅ No React hooks violations
- ✅ No permission errors on Android
- ✅ iOS functionality unchanged
- ✅ Works in Expo Go
- ✅ Simple permission flow
