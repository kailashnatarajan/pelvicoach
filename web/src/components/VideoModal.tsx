import { Play, Sparkles, X } from 'lucide-react';
import React from 'react';
import { Exercise } from '../types';

interface VideoModalProps {
  exercise: Exercise;
  onClose: () => void;
  onStart: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ exercise, onClose, onStart }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: '#CCFBF1',
                  color: '#0F766E',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Demonstration Video
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748B' }}>
                {exercise.duration} • {exercise.difficulty}
              </span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#0F172A" />
          </button>
        </div>

        {/* Video Player Box */}
        <div
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#0F172A',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <video
            controls
            autoPlay
            loop
            style={{ width: '100%', maxHeight: '320px', display: 'block', backgroundColor: '#000' }}
            src={exercise.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Instructions */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #E2E8F0',
            marginBottom: '20px',
          }}
        >
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
            Instructions
          </h4>
          <p style={{ fontSize: '16px', color: '#334155', lineHeight: 1.6 }}>{exercise.instructions}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, minHeight: '52px' }}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onStart();
            }}
            style={{ flex: 2, minHeight: '52px' }}
          >
            <Play size={20} fill="#FFFFFF" />
            <span>START EXERCISE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
