const { withAndroidManifest } = require('@expo/config-plugins');

const withRemoveAudioPermission = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Remove READ_MEDIA_AUDIO permission
    if (androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = androidManifest['uses-permission'].filter(
        (permission) => {
          const permissionName = permission.$?.['android:name'];
          return permissionName !== 'android.permission.READ_MEDIA_AUDIO';
        }
      );
    }

    return config;
  });
};

module.exports = withRemoveAudioPermission;
