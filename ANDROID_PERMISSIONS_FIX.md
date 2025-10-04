# Android Permissions Fix

## Problem

On Android 13+, Expo Go cannot provide full access to MediaLibrary due to scoped storage restrictions. This causes the error:

```
Error: Call to function 'ExpoMediaLibrary.getPermissionsAsync' has been rejected.
→ Caused by: Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library.
```

## Solution

Implemented platform-specific permission handling:

### iOS (No Changes)

- Continues to use MediaLibrary for saving videos to Photos app
- Videos are organized in "Raydel Recordings" album
- Full metadata support (duration, size, dimensions)

### Android (Updated Approach)

- **Skips MediaLibrary permissions entirely** - not needed when saving to app cache
- Videos are saved in camera's cache directory (accessible to the app without special permissions)
- Videos remain accessible for playback and upload within the app
- Only requires Camera and Microphone permissions

## Files Modified

### 1. `hooks/useVideoRecording.ts`

- Added Platform check for MediaLibrary permissions
- On Android: Uses dummy permission hook that always returns granted
- On iOS: Uses actual MediaLibrary.usePermissions()
- Updated permission request logic to skip MediaLibrary on Android
- Updated success message to reflect platform-specific behavior

### 2. `utils/videoUtils.ts`

- **saveToGallery()**: Platform-specific implementation
  - iOS: Uses MediaLibrary to save to Photos
  - Android: Returns video URI from cache (no additional saving needed)
- **getVideoMetadata()**: Platform-specific implementation
  - iOS: Full metadata from MediaLibrary
  - Android: Basic metadata (can't access full info without MediaLibrary)
- **validateVideoFile()**: Platform-specific implementation
  - iOS: Full validation with size and duration checks
  - Android: Skips validation (returns true to avoid MediaLibrary calls)

### 3. `components/VideoRecorder.tsx`

- Added Platform import
- Updated MediaLibrary permission hook to skip on Android
- Modified `requestAllPermissions()` to only request MediaLibrary on iOS
- Updated `saveVideoToGallery()` to use platform-specific logic

## Testing Recommendations

### On Android:

1. ✅ Camera and Microphone permissions work
2. ✅ Video recording works
3. ✅ Videos are saved to app cache
4. ✅ Videos can be played back from cache
5. ✅ Videos can be uploaded from cache
6. ⚠️ Videos are NOT saved to device Gallery (by design - requires development build)

### On iOS:

1. ✅ All permissions work as before
2. ✅ Videos saved to Photos app
3. ✅ Videos organized in "Raydel Recordings" album
4. ✅ Full metadata available

## Benefits

- ✅ Works in Expo Go on Android 13+
- ✅ No changes to iOS behavior
- ✅ Simple permission flow on Android
- ✅ Videos remain accessible within the app
- ✅ No need for development build to test camera functionality

## Limitations on Android (in Expo Go)

- Videos are stored in app cache, not device Gallery
- Cannot access full video metadata (size, duration) without MediaLibrary
- Videos may be cleared when app cache is cleared
- To save to Gallery on Android, create a development build with proper storage permissions

## Future Improvements

If you want to save to Android Gallery in the future:

1. Create a development build (not Expo Go)
2. Request `READ_MEDIA_VIDEO` and `READ_MEDIA_IMAGES` permissions
3. Use MediaLibrary in development build (will work there)
