import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  Flame,
  Info,
  Play,
  PlaySquare,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import React, { useState } from 'react';

export interface PatientVideosViewProps {
  onGoToBiofeedback?: () => void;
}

interface VideoTutorial {
  id: string;
  youtubeId: string;
  title: string;
  subtitle: string;
  duration: string;
  badge: string;
  badgeColor: { bg: string; text: string };
  keyPoints: string[];
  description: string;
}

const VIDEOS: VideoTutorial[] = [
  {
    id: 'vid-1',
    youtubeId: 'sv8D9r-yXCw',
    title: 'Pelvic Floor Muscle Isolation & Squeeze Technique',
    subtitle: 'Learn how to accurately find and gently lift the pelvic floor muscles',
    duration: '4 mins',
    badge: 'Essential Foundation',
    badgeColor: { bg: '#CCFBF1', text: '#0F766E' },
    description:
      'A foundational guide demonstrating proper mind-muscle connection. Learn how to draw inward and upward without pushing downward or holding your breath.',
    keyPoints: [
      'Imagine stopping the flow of urine mid-stream (as a visualization only).',
      'Draw the muscles inward and upward toward your navel.',
      'Keep your stomach, buttocks, and inner thighs relaxed.',
    ],
  },
  {
    id: 'vid-2',
    youtubeId: 'X5mBUQFyUzo',
    title: 'Preventing Tummy & Buttock Compensation',
    subtitle: 'Catching common substitution habits that cause false muscle contractions',
    duration: '5 mins',
    badge: 'Avoid Substitution',
    badgeColor: { bg: '#FEF3C7', text: '#B45309' },
    description:
      'Learn why bearing down with the stomach increases bladder pressure instead of strengthening. See how PelviCoach multi-sensor biofeedback detects abdominal co-activation.',
    keyPoints: [
      'Do not clench your glutes or squeeze your knees together.',
      'Place one hand on your belly: it should stay soft and still during the contraction.',
      'Squeeze gently; high effort often triggers abdominal substitution.',
    ],
  },
  {
    id: 'vid-3',
    youtubeId: '4Kias-eQu2o',
    title: 'Diaphragmatic Breathing & Pelvic Coordination',
    subtitle: 'How to breathe naturally without bearing down or holding breath',
    duration: '6 mins',
    badge: 'Breathing Control',
    badgeColor: { bg: '#E0F2FE', text: '#0369A1' },
    description:
      'The pelvic floor works in harmony with your respiratory diaphragm. This tutorial explains the natural breath cycle: inhaling to relax and exhaling on the squeeze.',
    keyPoints: [
      'Inhale deeply through your nose: feel your ribs expand and pelvic floor gently soften.',
      'Exhale slowly through relaxed lips: gently lift and tighten the pelvic floor.',
      'Never hold your breath during the hold phase.',
    ],
  },
  {
    id: 'vid-4',
    youtubeId: 'gkO22XpAzjk',
    title: 'Hold Duration & Rapid Contraction Training',
    subtitle: 'Building slow-twitch endurance holds and quick reactive muscle control',
    duration: '5 mins',
    badge: 'Strength & Stamina',
    badgeColor: { bg: '#F3E8FF', text: '#7E22CE' },
    description:
      'Master the two types of pelvic floor fibers: sustained holds (endurance for coughing/sneezing) and quick flick squeezes for reactive urinary continence.',
    keyPoints: [
      'Build up to steady 3 to 8 second sustained holds without fading.',
      'Practice quick 1-second rapid squeeze-and-releases.',
      'Rest completely between repetitions to avoid muscular fatigue.',
    ],
  },
];

export const PatientVideosView: React.FC<PatientVideosViewProps> = ({ onGoToBiofeedback }) => {
  const [activeVideoId, setActiveVideoId] = useState<string>(VIDEOS[0].id);

  const activeVideo = VIDEOS.find((v) => v.id === activeVideoId) || VIDEOS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Intro Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '22px',
                background: '#CCFBF1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F766E',
              }}
            >
              <Video size={24} />
            </div>
            <div>
              <span
                style={{
                  background: '#CCFBF1',
                  color: '#0F766E',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                }}
              >
                Patient Video Guide
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                Pelvic Floor Exercise & Technique Videos
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Watch these video demonstrations to learn proper pelvic floor muscle isolation, breathing, and avoiding compensation.
              </p>
            </div>
          </div>

          {onGoToBiofeedback && (
            <button
              onClick={onGoToBiofeedback}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
              }}
            >
              <span>Practice With Biofeedback</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN RESPONSIVE VIDEO GRID (Displays 2 videos per row on desktop/tablet) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
          gap: '22px',
        }}
      >
        {VIDEOS.map((vid, idx) => (
          <div
            key={vid.id}
            className="card"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1.5px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    background: vid.badgeColor.bg,
                    color: vid.badgeColor.text,
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '8px',
                  }}
                >
                  {vid.badge}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                  Duration: {vid.duration} · Video #{idx + 1}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
                {vid.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px', lineHeight: 1.4 }}>
                {vid.subtitle}
              </p>

              {/* Embedded YouTube Iframe */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '56.25%', // 16:9 Aspect Ratio
                  height: 0,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#0F172A',
                  marginBottom: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${vid.youtubeId}`}
                  title={vid.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '12px' }}>
                {vid.description}
              </p>

              {/* Key Clinical Tips */}
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F766E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} />
                  Technique Tips:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {vid.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Action Link to Practice */}
            {onGoToBiofeedback && (
              <button
                type="button"
                onClick={onGoToBiofeedback}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1.5px solid #0D9488',
                  background: '#F0FDFA',
                  color: '#0F766E',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Play size={14} />
                <span>Practice this exercise in Biofeedback</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
