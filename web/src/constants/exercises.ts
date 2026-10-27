import { Exercise } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Pelvic Floor Hold',
    description: 'Gently tighten your pelvic-floor muscles and hold steady.',
    instructions:
      'Sit comfortably with feet flat. Gently squeeze as if stopping the flow of urine. Keep your stomach, thighs, and buttocks relaxed. Hold steadily then gently release.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    video_filename: 'pelvic-floor-hold.mp4',
    duration: '5 minutes',
    difficulty: 'Beginner',
    default_target: 65,
    default_hold: 5,
    default_repetitions: 10,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Quick Contractions',
    description: 'Rapid, rhythmic tightening to strengthen quick-response muscle fibers.',
    instructions:
      'Squeeze your pelvic floor quickly for 1 second, then release immediately for 1 second. Repeat rhythmically without holding your breath.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    video_filename: 'pelvic-floor-basic.mp4',
    duration: '3 minutes',
    difficulty: 'Intermediate',
    default_target: 70,
    default_hold: 2,
    default_repetitions: 10,
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Deep Pelvic Relax',
    description: 'Gentle release and breath synchronization for muscle rest.',
    instructions:
      'Take a slow deep breath into your belly. As you exhale, feel your pelvic floor completely soften and drop downward without straining.',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    video_filename: 'pelvic-floor-relax.mp4',
    duration: '4 minutes',
    difficulty: 'Gentle',
    default_target: 50,
    default_hold: 6,
    default_repetitions: 8,
  },
];
