// src/screens/UploadScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { uploadVideo as uploadVideoApi } from '../services/backendApi';
import Screen from '../components/ui/Screen';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Body, Caption, Subtitle, Title } from '../components/ui/Typography';
import { useTheme } from '../theme/ThemeProvider';

export default function UploadScreen() {
  const theme = useTheme();
  const [caption, setCaption] = useState('');
  const [videoUri, setVideoUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickVideo = async () => {
    setError('');
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setError('Camera roll permission is required to select videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const uploadVideo = async () => {
    if (!videoUri || !caption.trim()) {
      setError('Please select a video and add a caption.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await uploadVideoApi({
        fileUri: videoUri,
        caption: caption.trim(),
        tags: [],
      });

      setCaption('');
      setVideoUri('');
    } catch (e) {
      setError(e?.message || 'Failed to upload video.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Title>Upload</Title>
          <Body color={theme.colors.textSecondary} style={{ marginTop: 4 }}>
            Share your next build, story, or progress update.
          </Body>
        </View>

        <Card style={styles.formCard}>
          <Subtitle>Video file</Subtitle>
          <Button
            title={videoUri ? 'Video selected' : 'Pick video'}
            onPress={pickVideo}
            variant="secondary"
            style={styles.pickButton}
          />

          {videoUri ? (
            <Caption numberOfLines={1}>Source: {videoUri}</Caption>
          ) : (
            <Caption>No file selected yet.</Caption>
          )}

          <Input
            label="Caption"
            placeholder="Tell people what this is about"
            value={caption}
            onChangeText={(value) => {
              if (error) setError('');
              setCaption(value);
            }}
            multiline
            style={styles.captionInput}
          />

          {error ? <Caption color={theme.colors.danger} style={styles.errorText}>{error}</Caption> : null}

          <Button
            title="Upload video"
            onPress={uploadVideo}
            loading={uploading}
            disabled={uploading}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 14,
  },
  formCard: {
    padding: 18,
  },
  pickButton: {
    marginTop: 10,
    marginBottom: 8,
  },
  captionInput: {
    marginTop: 12,
    minHeight: 84,
  },
  errorText: {
    marginTop: -2,
    marginBottom: 10,
    fontWeight: '600',
  },
});
