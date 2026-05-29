import { useState } from 'react';
import { X, Calculator } from 'lucide-react';
import { getBarbellWeight } from '../store/workoutStore';

interface PlateCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWeight: number;
  unit: 'lbs' | 'kgs';
  exerciseId: string;
  exerciseName: string;
}

export default function PlateCalculator({ isOpen, onClose, defaultWeight, unit, exerciseId, exerciseName }: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState<number>(defaultWeight);

  if (!isOpen) return null;

  const barWeight = getBarbellWeight(exerciseId, exerciseName, unit);
  const isTrapBar = exerciseId === 'deadlift' || exerciseName.toLowerCase().includes('deadlift') || exerciseName.toLowerCase().includes('trap') || exerciseName.toLowerCase().includes('hex');
  const barLabel = isTrapBar ? 'Trap Bar Weight' : 'Barbell Weight';
  const availablePlates = unit === 'lbs' 
    ? [45, 35, 25, 10, 5, 2.5] 
    : [25, 20, 15, 10, 5, 2.5, 1.25];

  // Plate styling map (premium color themes representing standard gym plates)
  const plateColors: Record<number, { bg: string; text: string; label: string; height: string }> = unit === 'lbs' 
    ? {
        45: { bg: '#dc2626', text: '#ffffff', label: '45 lbs', height: '90px' }, // Red
        35: { bg: '#3b82f6', text: '#ffffff', label: '35 lbs', height: '80px' }, // Blue
        25: { bg: '#059669', text: '#ffffff', label: '25 lbs', height: '70px' }, // Green
        10: { bg: '#d97706', text: '#ffffff', label: '10 lbs', height: '55px' }, // Yellow
        5: { bg: '#475569', text: '#ffffff', label: '5 lbs', height: '45px' },   // Slate
        2.5: { bg: '#8c8c9a', text: '#ffffff', label: '2.5 lbs', height: '35px' } // Light gray
      }
    : {
        25: { bg: '#dc2626', text: '#ffffff', label: '25 kg', height: '90px' }, // Red
        20: { bg: '#3b82f6', text: '#ffffff', label: '20 kg', height: '80px' }, // Blue
        15: { bg: '#059669', text: '#ffffff', label: '15 kg', height: '70px' }, // Green
        10: { bg: '#d97706', text: '#ffffff', label: '10 kg', height: '55px' }, // Yellow
        5: { bg: '#475569', text: '#ffffff', label: '5 kg', height: '45px' },   // Slate
        2.5: { bg: '#8c8c9a', text: '#ffffff', label: '2.5 kg', height: '35px' }, // Light gray
        1.25: { bg: '#5b5b66', text: '#ffffff', label: '1.25 kg', height: '28px' } // Dark gray
      };

  // Calculate plate configuration
  const calculatePlates = () => {
    if (targetWeight <= barWeight) return { platesNeeded: [], remainingWeight: 0 };

    const weightPerSide = (targetWeight - barWeight) / 2;
    let remaining = weightPerSide;
    const platesNeeded: number[] = [];

    availablePlates.forEach((plate) => {
      while (remaining >= plate) {
        platesNeeded.push(plate);
        remaining -= plate;
        // Float precision safeguard
        remaining = Math.round(remaining * 100) / 100;
      }
    });

    return {
      platesNeeded,
      remainingWeight: remaining * 2
    };
  };

  const { platesNeeded, remainingWeight } = calculatePlates();

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        className="drawer" 
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <div className="drawer-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator style={{ color: 'var(--color-purple)' }} />
            Plate Calculator
          </h2>
          <button 
            onClick={onClose} 
            className="btn-icon-only btn-secondary"
            style={{ borderRadius: '50%', width: '36px', minHeight: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Target Weight Selector */}
        <div style={{ marginBottom: '24px' }}>
          <div className="input-group">
            <span className="input-label">Target Lift Weight ({unit})</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                className="text-input"
                style={{ flex: 1, fontSize: '20px', fontWeight: '700', textAlign: 'center' }}
                value={targetWeight || ''}
                onChange={(e) => setTargetWeight(Number(e.target.value))}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                {[-10, -5, +5, +10].map((amt) => (
                  <button
                    key={amt}
                    className="btn btn-secondary btn-icon-only"
                    style={{ width: '44px', minHeight: '44px', fontWeight: '700' }}
                    onClick={() => setTargetWeight((prev) => Math.max(barWeight, prev + amt))}
                  >
                    {amt > 0 ? `+${amt}` : amt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Display Barbell Plates visual representation */}
        <div 
          style={{
            background: 'linear-gradient(180deg, #181820, #0c0c10)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '30px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '180px',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Visual sleeve stack bar */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%', justifyContent: 'center' }}>
            {/* The Barbell shaft/collar lock */}
            <div style={{ width: '60px', height: '14px', backgroundColor: '#475569', borderRadius: '4px 0 0 4px', zIndex: 1 }} />
            <div style={{ width: '8px', height: '36px', backgroundColor: '#94a3b8', borderRadius: '2px', zIndex: 2, marginRight: '4px' }} />

            {/* Loaded Plates list */}
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', position: 'relative', minWidth: '150px' }}>
              {platesNeeded.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500', width: '100%', textAlign: 'center' }}>
                  Load only the bar ({barWeight} {unit})
                </div>
              ) : (
                platesNeeded.map((plate, idx) => {
                  const props = plateColors[plate] || { bg: '#888', text: '#fff', label: `${plate}`, height: '50px' };
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: props.bg,
                        color: props.text,
                        height: props.height,
                        width: '22px',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: '800',
                        fontFamily: 'var(--font-heading)',
                        boxShadow: 'inset -3px 0 5px rgba(0,0,0,0.3), 3px 0 6px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        userSelect: 'none',
                        transform: 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {plate}
                    </div>
                  );
                })
              )}
            </div>

            {/* Barbell collar sleeve end */}
            <div 
              style={{ 
                width: platesNeeded.length > 0 ? '50px' : '0px', 
                height: '10px', 
                backgroundColor: '#64748b', 
                borderRadius: '0 4px 4px 0',
                transition: 'width 0.25s ease'
              }} 
            />
          </div>
        </div>

        {/* Textual plate breakdowns list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{barLabel}:</span>
            <span style={{ fontWeight: '700' }}>{barWeight} {unit}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Weight per side:</span>
            <span style={{ fontWeight: '700', color: 'var(--color-purple-light)' }}>
              {targetWeight > barWeight ? ((targetWeight - barWeight) / 2).toFixed(1) : 0} {unit}
            </span>
          </div>
          {remainingWeight > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-amber)', padding: '6px 0' }}>
              <span>* Cannot load exactly:</span>
              <span>Short by {remainingWeight.toFixed(2)} {unit}</span>
            </div>
          )}
        </div>

        {/* List of plate counts */}
        {platesNeeded.length > 0 && (
          <div style={{ margin: '15px 0' }}>
            <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Plates needed per side:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Array.from(new Set(platesNeeded)).map((plate) => {
                const count = platesNeeded.filter((p) => p === plate).length;
                return (
                  <div
                    key={plate}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span 
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: plateColors[plate]?.bg || '#888',
                        boxShadow: `0 0 6px ${plateColors[plate]?.bg || '#888'}`
                      }} 
                    />
                    <span>{plate} {unit}</span>
                    <span style={{ color: 'var(--color-purple-light)', background: 'var(--color-purple-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                      x{count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={onClose}>
          Done
        </button>
      </div>
      
      {/* Slide up animation CSS */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
