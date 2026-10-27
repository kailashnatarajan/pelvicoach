import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getVideoSource } from '../constants/exerciseVideos';
import { Colors } from '../theme/colors';

interface ExerciseVideoPlayerProps {
  videoFilename?: string;
  exerciseTitle: string;
}

export const ExerciseVideoPlayer: React.FC<ExerciseVideoPlayerProps> = ({
  videoFilename,
  exerciseTitle,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const videoSource = getVideoSource(videoFilename);

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const restartVideo = async () => {
    if (!videoRef.current) return;
    await videoRef.current.replayAsync();
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        {!hasError ? (
          <Video
            ref={videoRef}
            style={styles.video}
            source={videoSource}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          // Visual Demonstration Fallback Guide (Safe mode)
          <View style={styles.fallbackBox}>
            <Ionicons name="body-outline" size={64} color={Colors.primary} />
            <Text style={styles.fallbackTitle}>Demonstration Guide</Text>
            <Text style={styles.fallbackSub}>
              Sit tall with your back straight. Gently tighten your pelvic floor muscles upward, like pausing urination.
            </Text>
          </View>
        )}

        {isLoading && !hasError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading demonstration...</Text>
          </View>
        )}
      </View>

      {/* Large Elderly-Friendly Video Controls */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          onPress={togglePlayback}
          style={styles.controlButton}
          activeOpacity={0.8}
          accessibilityLabel={isPlaying ? 'Pause demonstration video' : 'Play demonstration video'}
        >
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={48}
            color={Colors.primaryDark}
          />
          <Text style={styles.controlText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={restartVideo}
          style={styles.controlButton}
          activeOpacity={0.8}
          accessibilityLabel="Restart video"
        >
          <Ionicons name="refresh-circle" size={48} color={Colors.textSecondary} />
          <Text style={styles.controlText}>RESTART</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  videoWrapper: {
    width: '100%',
    height: 240,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  fallbackBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%',
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
  },
  fallbackSub: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 54,
  },
  controlText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
});
