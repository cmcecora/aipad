# Android Permission Error Fix

## Problem

The expo-media-library plugin automatically adds `READ_MEDIA_AUDIO` permission to the AndroidManifest.xml, which causes an error when requesting permissions.

## Solution

Added a post-prebuild script that automatically removes the `READ_MEDIA_AUDIO` permission.

### Usage:
```bash
npm run prebuild
```

This runs:
1. `expo prebuild --clean`
2. Removes READ_MEDIA_AUDIO from AndroidManifest.xml

### Manual Fix (if needed):
```bash
sed -i.bak '/READ_MEDIA_AUDIO/d' android/app/src/main/AndroidManifest.xml
```

### Verify:
```bash
grep "READ_MEDIA_AUDIO" android/app/src/main/AndroidManifest.xml
```
Should return nothing.

## Permissions Requested

✅ CAMERA, RECORD_AUDIO, READ_MEDIA_VIDEO, READ_MEDIA_IMAGES, ACCESS_MEDIA_LOCATION
❌ READ_MEDIA_AUDIO (removed - not needed)
