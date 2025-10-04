import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface VideoMetadata {
  uri: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  filename: string;
}

export class VideoUtils {
  /**
   * Save video to device gallery with proper album organization
   */
  static async saveToGallery(
    videoUri: string, 
    albumName: string = 'Raydel Recordings'
  ): Promise<MediaLibrary.Asset | null> {
    try {
      // Check permissions - request audio access explicitly for Android
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Storage permission is needed to save videos');
        return null;
      }

      // Create asset from video
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      
      // Create or get album
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      return asset;
    } catch (error) {
      console.error('Error saving video to gallery:', error);
      Alert.alert('Save Error', 'Failed to save video to gallery');
      return null;
    }
  }

  /**
   * Get video metadata
   */
  static async getVideoMetadata(videoUri: string): Promise<VideoMetadata | null> {
    try {
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      
      return {
        uri: videoUri,
        duration: assetInfo.duration || 0,
        width: assetInfo.width || 0,
        height: assetInfo.height || 0,
        size: assetInfo.fileSize || 0,
        filename: assetInfo.filename || 'video.mp4'
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      return null;
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Validate video file
   */
  static validateVideoFile(uri: string, maxSizeBytes: number = 2 * 1024 * 1024 * 1024): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const metadata = await this.getVideoMetadata(uri);
        if (!metadata) {
          resolve(false);
          return;
        }

        // Check file size
        if (metadata.size > maxSizeBytes) {
          Alert.alert('File Too Large', `Video file is too large. Maximum size is ${this.formatFileSize(maxSizeBytes)}`);
          resolve(false);
          return;
        }

        // Check duration (minimum 10 seconds, maximum 2 hours)
        if (metadata.duration < 10) {
          Alert.alert('Video Too Short', 'Video must be at least 10 seconds long');
          resolve(false);
          return;
        }

        if (metadata.duration > 7200) { // 2 hours
          Alert.alert('Video Too Long', 'Video must be less than 2 hours long');
          resolve(false);
          return;
        }

        resolve(true);
      } catch (error) {
        console.error('Error validating video:', error);
        resolve(false);
      }
    });
  }

  /**
   * Get supported video formats
   */
  static getSupportedFormats(): string[] {
    if (Platform.OS === 'ios') {
      return ['mp4', 'mov', 'm4v'];
    } else {
      return ['mp4', 'avi', 'mkv', 'webm'];
    }
  }

  /**
   * Check if video format is supported
   */
  static isFormatSupported(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? this.getSupportedFormats().includes(extension) : false;
  }

  /**
   * Generate thumbnail from video (placeholder for future implementation)
   */
  static async generateThumbnail(videoUri: string): Promise<string | null> {
    // This would require additional libraries like expo-video-thumbnails
    // For now, return null and handle in UI
    console.log('Thumbnail generation not implemented yet for:', videoUri);
    return null;
  }

  /**
   * Cleanup temporary video files
   */
  static async cleanupTempFiles(tempUris: string[]): Promise<void> {
    try {
      // Implementation would depend on file system access
      // For now, just log the cleanup attempt
      console.log('Cleaning up temporary files:', tempUris);
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

export default VideoUtils;