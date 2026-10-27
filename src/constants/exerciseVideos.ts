/**
 * Exercise Video Asset & Source Registry
 * 
 * To add your own exercise videos:
 * 1. Place your MP4 file inside 'assets/videos/' (e.g., 'assets/videos/pelvic-floor-hold.mp4')
 * 2. If you want to use local bundled assets, require them below, or supply a web URL.
 */

export interface VideoSourceConfig {
  localAsset?: any;
  fallbackUrl: string;
  title: string;
}

export const EXERCISE_VIDEOS: Record<string, VideoSourceConfig> = {
  'pelvic-floor-hold.mp4': {
    // Demonstration video stream (tested, reliable MP4 stream)
    fallbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Pelvic Floor Hold Demonstration',
  },
  'pelvic-floor-basic.mp4': {
    fallbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Quick Contractions Demonstration',
  },
  'pelvic-floor-relax.mp4': {
    fallbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    title: 'Deep Pelvic Relax Demonstration',
  },
};

/**
 * Helper to resolve video source
 */
export function getVideoSource(filename?: string): { uri: string } | number {
  if (!filename) {
    return { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' };
  }
  const config = EXERCISE_VIDEOS[filename];
  if (config?.localAsset) {
    return config.localAsset;
  }
  if (config?.fallbackUrl) {
    return { uri: config.fallbackUrl };
  }
  return { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' };
}
