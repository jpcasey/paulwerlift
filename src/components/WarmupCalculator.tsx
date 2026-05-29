import { useState } from 'react';
import { X, Dumbbell, Check, Calculator } from 'lucide-react';
import { getExerciseKind, getBarbellWeight } from '../store/workoutStore';

interface WarmupCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  workingWeight: number;
  unit: 'lbs' | 'kgs';
}

interface WarmupSet {
  percentage: number;
  weight: number;
  reps: number;
  isBar: boolean;
  id: string;
}

export default function WarmupCalculator({ isOpen, onClose, exerciseName, workingWeight, unit }: WarmupCalculatorProps) {
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const barWeight = getBarbellWeight(exerciseName, exerciseName, unit);
  const step = unit === 'lbs' ? 5 : 2.5;
  const kind = getExerciseKind(exerciseName, exerciseName);

  const roundToNearest = (w: number) => {
    return Math.round(w / step) * step;
  };

  // Generate dynamic progressions based on exercise kinds
  const generateWarmupSets = (): WarmupSet[] => {
    if (kind === 'bodyweight') return [];

    // For machine stacks: Scale directly from 40% up to 90% target, bypassing the bar
    if (kind === 'machine') {
      const sets: WarmupSet[] = [];
      sets.push({ id: 'm1', percentage: 40, weight: Math.max(step, roundToNearest(workingWeight * 0.4)), reps: 5, isBar: false });
      sets.push({ id: 'm2', percentage: 70, weight: Math.max(step, roundToNearest(workingWeight * 0.7)), reps: 3, isBar: false });
      sets.push({ id: 'm3', percentage: 90, weight: Math.max(step, roundToNearest(workingWeight * 0.9)), reps: 2, isBar: false });
      return sets;
    }

    // Classic Free Weight Barbell progressions
    const gap = workingWeight - barWeight;
    if (gap <= 0) return [];

    const sets: WarmupSet[] = [];

    // If working weight is close to the bar weight, scale down the warmup sets
    if (gap < (unit === 'lbs' ? 30 : 15)) {
      sets.push({ id: 'w1', percentage: 0, weight: barWeight, reps: 5, isBar: true });
      sets.push({ id: 'w2', percentage: 50, weight: roundToNearest(barWeight + gap / 2), reps: 3, isBar: false });
    } else {
      // Standard Starting Strength warm-up matrix
      sets.push({ id: 'w1', percentage: 0, weight: barWeight, reps: 5, isBar: true });
      sets.push({ id: 'w2', percentage: 0, weight: barWeight, reps: 5, isBar: true });
      sets.push({ id: 'w3', percentage: 40, weight: roundToNearest(barWeight + gap * 0.4), reps: 5, isBar: false });
      sets.push({ id: 'w4', percentage: 70, weight: roundToNearest(barWeight + gap * 0.7), reps: 3, isBar: false });
      sets.push({ id: 'w5', percentage: 90, weight: roundToNearest(barWeight + gap * 0.9), reps: 2, isBar: false });
    }

    return sets;
  };

  const warmupSets = generateWarmupSets();

  // Greedy plate load breakdown formula for barbells
  const getPlateBreakdownString = (weight: number) => {
    if (weight <= barWeight) return 'Empty Barbell';
    const perSide = (weight - barWeight) / 2;
    const available = unit === 'lbs' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];

    let remaining = perSide;
    const plates: number[] = [];
    available.forEach((p) => {
      while (remaining >= p) {
        plates.push(p);
        remaining -= p;
        remaining = Math.round(remaining * 100) / 100;
      }
    });

    if (plates.length === 0) return 'Empty Barbell';
    return `Plates per side: ${plates.join(', ')} ${unit}`;
  };

  const toggleSetComplete = (setId: string) => {
    setCompletedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId]
    }));
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        className="drawer" 
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="drawer-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Dumbbell style={{ color: 'var(--color-purple)' }} />
            Warm-up Calculator
          </h2>
          <button 
            onClick={onClose} 
            className="btn-icon-only btn-secondary"
            style={{ borderRadius: '50%', width: '36px', minHeight: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic target weight displays */}
        <div 
          style={{ 
            background: 'var(--bg-surface-elevated)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '14px', 
            padding: '12px 16px', 
            marginBottom: '20px',
            textAlign: 'left'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Exercise target
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {exerciseName} Working Sets:{' '}
            <span style={{ color: 'var(--color-purple-light)' }}>
              {kind === 'bodyweight' && workingWeight === 0 ? 'Bodyweight' : `${workingWeight} ${unit}`}
            </span>
          </h3>
        </div>

        {/* Set checklist rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {kind === 'bodyweight' ? (
            <div 
              style={{ 
                padding: '20px 16px', 
                color: 'var(--color-amber)', 
                backgroundColor: 'rgba(245, 158, 11, 0.04)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '14px',
                fontSize: '13px', 
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                lineHeight: '1.4'
              }}
            >
              <span style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Bodyweight Prep Recommendation</span>
              This is a bodyweight movement. We recommend performing a brief active hang, dynamic shoulder circles, or light stretches to warm up your joints!
            </div>
          ) : warmupSets.length === 0 ? (
            <div style={{ padding: '30px 10px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
              Your target weight is at or below the barbell weight. Just start directly with your working sets!
            </div>
          ) : (
            warmupSets.map((set, idx) => {
              const isDone = completedSets[set.id];
              const plateHint = kind === 'barbell' 
                ? getPlateBreakdownString(set.weight)
                : `Selector stack: Load ${set.weight} ${unit}`;

              return (
                <div
                  key={set.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isDone ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Left Side: Set specs & Plate hint */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          background: 'rgba(255,255,255,0.06)', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Set {idx + 1}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {set.weight} {unit} × {set.reps} reps
                      </span>
                      {set.percentage > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--color-purple-light)', fontWeight: '600' }}>
                          ({set.percentage}%)
                        </span>
                      )}
                    </div>

                    {/* Dynamic plates/weight stack breakdown tooltip */}
                    <div 
                      style={{ 
                        fontSize: '11.5px', 
                        color: isDone ? 'var(--text-muted)' : 'var(--color-emerald-light)', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600'
                      }}
                    >
                      {kind === 'barbell' ? (
                        <>
                          <Calculator size={11} style={{ opacity: 0.7 }} />
                          <span>{plateHint}</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '9px', background: 'var(--color-purple-bg)', padding: '1px 5px', borderRadius: '4px', color: 'var(--color-purple-light)', fontWeight: '800', textTransform: 'uppercase' }}>Stack</span>
                          <span>{plateHint}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Checkmark button */}
                  <button
                    onClick={() => toggleSetComplete(set.id)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `2px solid ${isDone ? 'var(--color-emerald)' : 'rgba(255,255,255,0.15)'}`,
                      backgroundColor: isDone ? 'var(--color-emerald)' : 'transparent',
                      color: isDone ? '#000000' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    <Check size={16} strokeWidth={3} style={{ display: isDone ? 'block' : 'none' }} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button className="btn btn-secondary" onClick={onClose}>
          Done Warming Up
        </button>
      </div>
    </div>
  );
}
