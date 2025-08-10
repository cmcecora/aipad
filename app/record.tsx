import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function RecordScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);

  const ensurePermissions = async (): Promise<boolean> => {
    if (!camPerm?.granted) await requestCamPerm();
    if (!micPerm?.granted) await requestMicPerm();
    const mediaPerm = await MediaLibrary.requestPermissionsAsync();
    return Boolean(camPerm?.granted && micPerm?.granted && mediaPerm.status === 'granted');
  };

  const startRecording = async () => {
    if (!(await ensurePermissions()) || !cameraRef.current) {
      Alert.alert('Permissions required', 'Camera/Microphone/Photos permissions are needed.');
      return;
    }
    try {
      setIsRecording(true);
      const recording = await cameraRef.current.recordAsync({ maxDuration: 3600 }); // up to 1h
      if (!recording?.uri) throw new Error('No recording URI');

      // Save to gallery by default, create Raydel album
      const asset = await MediaLibrary.createAssetAsync(recording.uri);
      await MediaLibrary.createAlbumAsync('Raydel Recordings', asset, false);

      Alert.alert('Saved', Platform.OS === 'android' ? 'Video saved to Gallery' : 'Saved to Photos');
    } catch (e) {
      Alert.alert('Recording error', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      cameraRef.current?.stopRecording();
    } catch {
      // ignore
    }
  };

  const onStartStopPress = () => (isRecording ? stopRecording() : startRecording());

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="video" />
      <TouchableOpacity style={[styles.btn, isRecording && styles.btnStop]} onPress={onStartStopPress}>
        <Text style={styles.btnText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  btn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
  },
  btnStop: { backgroundColor: '#D93025' },
  btnText: { color: '#FFF', fontWeight: '700' },
});