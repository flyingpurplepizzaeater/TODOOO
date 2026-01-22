/**
 * Animated splash screen overlay.
 *
 * CONTEXT.md: "Animated loading animation (brief, e.g., checkmark drawing)"
 *
 * Shows on app launch, animates checkmark, then fades out.
 * Only renders on native platforms (web doesn't need splash).
 */
import { useEffect, useState } from 'react';
import { hideSplash, isNativePlatform } from '../capacitor';

interface SplashAnimationProps {
  onComplete?: () => void;
}

export function SplashAnimation({ onComplete }: SplashAnimationProps) {
  const [phase, setPhase] = useState<'drawing' | 'holding' | 'fading' | 'done'>('drawing');

  useEffect(() => {
    // Only animate on native platforms
    if (!isNativePlatform()) {
      setPhase('done');
      onComplete?.();
      return;
    }

    // Animation timeline:
    // 0-600ms: checkmark draws
    // 600-1000ms: hold
    // 1000-1300ms: fade out
    const drawTimer = setTimeout(() => setPhase('holding'), 600);
    const holdTimer = setTimeout(() => setPhase('fading'), 1000);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      hideSplash();
      onComplete?.();
    }, 1300);

    return () => {
      clearTimeout(drawTimer);
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  // Don't render anything once done
  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#14b8a6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
    >
      {/* Animated checkmark */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
      >
        {/* Circle background */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="white"
          opacity="0.95"
        />
        {/* Animated checkmark path */}
        <path
          d="M35 60 L52 77 L85 44"
          stroke="#14b8a6"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: phase === 'drawing' ? 100 : 0,
            transition: 'stroke-dashoffset 500ms ease-out',
          }}
        />
      </svg>
      {/* App name below checkmark */}
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          color: 'white',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 2,
          opacity: phase === 'drawing' ? 0 : 1,
          transform: phase === 'drawing' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 300ms ease-out, transform 300ms ease-out',
        }}
      >
        TODOOO
      </div>
    </div>
  );
}
