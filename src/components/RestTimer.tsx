import { useEffect, useRef } from 'react';
import { FastForward, Plus, Minus, Timer } from 'lucide-react';
import type { RestTimerState } from '../store/workoutStore';

interface RestTimerProps {
  timer: RestTimerState;
  onAdjust: (seconds: number) => void;
  onStop: () => void;
}

export default function RestTimer({ timer, onAdjust, onStop }: RestTimerProps) {
  const { remainingSeconds, targetSeconds, isRunning } = timer;
  const prevRemainingRef = useRef<number>(remainingSeconds);

  // Play browser chime beep and vibrate when timer hits exactly 0
  useEffect(() => {
    if (isRunning && remainingSeconds === 0 && prevRemainingRef.current > 0) {
      playChime();
      triggerVibration();
    }
    prevRemainingRef.current = remainingSeconds;
  }, [remainingSeconds, isRunning]);

  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const now = audioCtx.currentTime;

      // Synthesize a beautiful double chime chime (A5 chord notes: 880Hz & 1109Hz)
      const synthBeep = (freq: number, startDelay: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startDelay);
        
        // Custom gain envelope to sound like a digital wristwatch bell
        gain.gain.setValueAtTime(0, now + startDelay);
        gain.gain.linearRampToValueAtTime(0.2, now + startDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);
        
        osc.start(now + startDelay);
        osc.stop(now + startDelay + duration);
      };

      // Double beep
      synthBeep(880, 0, 0.18);
      synthBeep(880, 0.25, 0.28);
    } catch (e) {
      console.warn('Audio Context beep failed to play:', e);
    }
  };

  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      try {
        // Double pulse haptic vibration pattern
        navigator.vibrate([150, 100, 150]);
      } catch (err) {
        console.log('Haptic vibration failed:', err);
      }
    }
  };

  if (remainingSeconds <= 0 || !isRunning) return null;

  // Format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG circular path math
  const progressPercent = remainingSeconds / targetSeconds;

  return (
    <div 
      className="card timer-pulse"
      style={{
        background: 'rgba(18, 18, 22, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '20px',
        padding: '16px 20px',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 50,
        animation: 'timerAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* SVG Circular Progress Ring */}
        <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '56px', height: '56px' }}>
            {/* Background ring */}
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="rgba(245, 158, 11, 0.15)"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Countdown stroke */}
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="var(--color-amber)"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 * (1 - progressPercent)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <Timer 
            size={18} 
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: 'var(--color-amber)'
            }} 
          />
        </div>

        <div>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              color: 'var(--color-amber)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              display: 'block'
            }}
          >
            Rest Timer Running
          </span>
          <span 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '26px', 
              fontWeight: '800', 
              color: 'var(--text-primary)',
              lineHeight: '1',
              letterSpacing: '-0.02em'
            }}
          >
            {formatTime(remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Adjust & Skip controls */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button 
          onClick={() => onAdjust(-30)} 
          className="btn btn-secondary btn-icon-only"
          style={{ width: '40px', minHeight: '40px', borderColor: 'rgba(255, 255, 255, 0.05)' }}
          title="Subtract 30s"
        >
          <Minus size={14} />
        </button>
        <button 
          onClick={() => onAdjust(30)} 
          className="btn btn-secondary btn-icon-only"
          style={{ width: '40px', minHeight: '40px', borderColor: 'rgba(255, 255, 255, 0.05)' }}
          title="Add 30s"
        >
          <Plus size={14} />
        </button>
        <button 
          onClick={onStop} 
          className="btn btn-emerald btn-icon-only"
          style={{ 
            width: '40px', 
            minHeight: '40px', 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--color-amber)', 
            color: 'var(--color-amber)',
            boxShadow: 'none'
          }}
          title="Skip Rest"
        >
          <FastForward size={14} />
        </button>
      </div>

      <style>{`
        @keyframes timerAppear {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
