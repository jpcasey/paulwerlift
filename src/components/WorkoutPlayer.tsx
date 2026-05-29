import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Calculator, AlertTriangle, CheckSquare, Clock, Flame, X, Lightbulb } from 'lucide-react';
import { getExerciseKind, type Routine, type SetLog, type HistoryItem } from '../store/workoutStore';
import PlateCalculator from './PlateCalculator';
import WarmupCalculator from './WarmupCalculator';

interface WorkoutPlayerProps {
  activeWorkout: Routine;
  activeStartTime: string;
  history: HistoryItem[];
  unit: 'lbs' | 'kgs';
  updateSet: (exIdx: number, setIdx: number, updates: Partial<SetLog>) => void;
  addSet: (exIdx: number) => void;
  deleteSet: (exIdx: number, setIdx: number) => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  onAddExercise: (id: string, name?: string) => void;
  onDeleteExercise: (exerciseIndex: number) => void;
  activeNotes: string;
  onUpdateNotes: (notes: string) => void;
  onUpdateExerciseNotes: (exerciseIndex: number, notes: string) => void;
}

export default function WorkoutPlayer({
  activeWorkout,
  activeStartTime,
  history,
  unit,
  updateSet,
  addSet,
  deleteSet,
  onFinishWorkout,
  onCancelWorkout,
  onAddExercise,
  onDeleteExercise,
  activeNotes,
  onUpdateNotes,
  onUpdateExerciseNotes
}: WorkoutPlayerProps) {
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  
  // Plate Calculator Drawer state
  const [plateCalcTarget, setPlateCalcTarget] = useState<{ weight: number; id: string; name: string } | null>(null);

  // Warm-up Calculator Drawer state
  const [warmupTarget, setWarmupTarget] = useState<{ name: string; weight: number } | null>(null);

  // Accessory Selector Drawer state
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [customExName, setCustomExName] = useState('');

  // Live timer interval calculation
  useEffect(() => {
    const start = new Date(activeStartTime).getTime();
    
    const updateTimer = () => {
      const diff = Date.now() - start;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const formatted = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      setElapsedTime(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeStartTime]);

  // Fetch previous history statistics for a specific exercise to render as visual guides
  const getPreviousExerciseStats = (exerciseId: string) => {
    const lastSession = [...history]
      .reverse()
      .find((h) => h.exercises.some((e) => e.exerciseId === exerciseId));
    
    return lastSession?.exercises.find((e) => e.exerciseId === exerciseId);
  };

  return (
    <div style={{ padding: '0 16px 80px 16px' }}>
      
      {/* Active Header Panel */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #181822, #0e0e12)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px',
          marginTop: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left'
        }}
      >
        <div>
          <span 
            className="badge badge-emerald" 
            style={{ 
              marginBottom: '6px', 
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)' 
            }}
          >
            Session In Progress
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
            {activeWorkout.name}
          </h2>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald-light)' }}>
          <Clock size={16} />
          <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
            {elapsedTime}
          </span>
        </div>
      </div>

      {/* Session Journal Notes */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px', textAlign: 'left', backgroundColor: 'rgba(255, 255, 255, 0.015)' }}>
        <span className="input-label" style={{ marginBottom: '6px', display: 'block', fontSize: '11px' }}>Session Notes / Biofeedback</span>
        <textarea
          placeholder="Jot down joint health, bar speed, energy level, rack settings..."
          className="text-input"
          style={{
            width: '100%',
            minHeight: '60px',
            resize: 'vertical',
            fontSize: '13.5px',
            fontFamily: 'var(--font-sans)',
            lineHeight: '1.4',
            padding: '8px 12px'
          }}
          value={activeNotes}
          onChange={(e) => onUpdateNotes(e.target.value)}
        />
      </div>

      {/* Exercises Log Listing */}
      {activeWorkout.exercises.map((ex, exIdx) => {
        const prevStats = getPreviousExerciseStats(ex.exerciseId);
        const kind = getExerciseKind(ex.exerciseId, ex.name);
        const isTimed = kind === 'bodyweight' && (ex.name.toLowerCase().includes('hang') || ex.name.toLowerCase().includes('hold') || ex.name.toLowerCase().includes('plank'));

        return (
          <div key={ex.exerciseId} className="card" style={{ padding: '16px', textAlign: 'left', marginBottom: '16px' }}>
            
            {/* Header info bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{ 
                    width: '6px', 
                    height: '20px', 
                    backgroundColor: 'var(--color-purple)', 
                    borderRadius: '3px',
                    display: 'inline-block' 
                  }} 
                />
                <h3 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {ex.name}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Warmups Launcher */}
                <button
                  className="btn btn-outline"
                  style={{
                    padding: '4px 10px',
                    minHeight: '32px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    width: 'auto',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    color: 'var(--color-purple-light)',
                    background: 'var(--color-purple-bg)'
                  }}
                  onClick={() => {
                    const workingWeight = ex.sets[0]?.weight || 135;
                    setWarmupTarget({ name: ex.name, weight: workingWeight });
                  }}
                >
                  <Flame size={12} fill="var(--color-purple-light)" stroke="none" />
                  Warmups
                </button>

                {/* Quick weight plate calculator helper link */}
                {kind === 'barbell' && (
                  <button
                    className="btn btn-secondary btn-icon-only"
                    style={{ width: '32px', minHeight: '32px', borderRadius: '8px' }}
                    onClick={() => {
                      const firstSetWeight = ex.sets[0]?.weight || 135;
                      setPlateCalcTarget({ weight: firstSetWeight, id: ex.exerciseId, name: ex.name });
                    }}
                    title="Open Plate Calculator"
                  >
                    <Calculator size={14} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                )}

                {/* Remove Exercise from Session */}
                <button
                  className="btn btn-outline btn-icon-only"
                  style={{ 
                    width: '32px', 
                    minHeight: '32px', 
                    borderRadius: '8px', 
                    color: 'var(--color-rose)', 
                    borderColor: 'rgba(244, 63, 94, 0.1)',
                    background: 'rgba(244, 63, 94, 0.05)'
                  }}
                  onClick={() => onDeleteExercise(exIdx)}
                  title="Remove Exercise from Session"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Render Last Session Cue if available */}
            {prevStats?.notes && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  backgroundColor: 'var(--color-purple-bg)',
                  border: '1px dashed rgba(139, 92, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  color: 'var(--color-purple-light)',
                  fontSize: '12.5px',
                  lineHeight: '1.4'
                }}
              >
                <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-purple-light)' }} />
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '9.5px', letterSpacing: '0.05em', display: 'block', marginBottom: '2px', color: 'rgba(167, 139, 250, 0.8)' }}>
                    Last Session Cue
                  </span>
                  “{prevStats.notes}”
                </div>
              </div>
            )}

            {/* Exercise-specific Note Input field */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Form cue or exercise note for this session..."
                className="text-input"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.15)'
                }}
                value={ex.notes || ''}
                onChange={(e) => onUpdateExerciseNotes(exIdx, e.target.value)}
              />
            </div>

            {/* Set Column Headers */}
            <div style={{ display: 'flex', padding: '0 4px', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ width: '40px', textAlign: 'center' }}>Set</span>
              <span style={{ flex: 1, paddingLeft: '8px' }}>Previous Stats</span>
              <span style={{ width: '75px', textAlign: 'center' }}>{kind === 'bodyweight' ? 'Added' : `Weight (${unit})`}</span>
              <span style={{ width: '65px', textAlign: 'center' }}>{isTimed ? 'Secs' : 'Reps'}</span>
              <span style={{ width: '50px', textAlign: 'center' }}>Done</span>
            </div>

            {/* Set Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ex.sets.map((set, setIdx) => {
                const prevSet = prevStats?.sets[setIdx];

                return (
                  <div
                    key={setIdx}
                    className={set.completed ? 'set-row-checked' : ''}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: set.completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-elevated)',
                      border: `1px solid ${set.completed ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      padding: '8px 4px',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Index */}
                    <span 
                      style={{ 
                        width: '40px', 
                        textAlign: 'center', 
                        fontFamily: 'var(--font-heading)',
                        fontWeight: '700',
                        fontSize: '13px',
                        color: set.completed ? 'var(--color-emerald-light)' : 'var(--text-secondary)'
                      }}
                    >
                      {setIdx + 1}
                    </span>

                    {/* Previous Stat Reference */}
                    <span 
                      style={{ 
                        flex: 1, 
                        fontSize: '12px', 
                        color: 'var(--text-muted)',
                        paddingLeft: '8px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {prevSet 
                        ? `${prevSet.weight} × ${prevSet.reps}`
                        : '—'
                      }
                    </span>

                    {/* Weight entry box */}
                    <div style={{ width: '75px', display: 'flex', justifyContent: 'center' }}>
                      <input
                        type="number"
                        placeholder={kind === 'bodyweight' ? 'BW' : '0'}
                        className="text-input"
                        style={{
                          width: '64px',
                          padding: '6px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          border: 'none',
                          background: set.completed ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.15)',
                          color: set.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                        }}
                        disabled={set.completed}
                        value={set.weight === 0 && kind === 'bodyweight' ? '' : set.weight || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>

                    {/* Reps entry box */}
                    <div style={{ width: '65px', display: 'flex', justifyContent: 'center' }}>
                      <input
                        type="number"
                        className="text-input"
                        style={{
                          width: '54px',
                          padding: '6px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          border: 'none',
                          background: set.completed ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.15)',
                          color: set.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                        }}
                        disabled={set.completed}
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>

                    {/* Completion Checkmark trigger */}
                    <div style={{ width: '50px', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="btn-check"
                        onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: `2px solid ${set.completed ? 'var(--color-emerald)' : 'rgba(255,255,255,0.15)'}`,
                          backgroundColor: set.completed ? 'var(--color-emerald)' : 'transparent',
                          color: set.completed ? '#000000' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        <Check size={16} strokeWidth={3} style={{ display: set.completed ? 'block' : 'none' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Set manipulators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                className="btn btn-outline"
                style={{
                  padding: '6px 12px',
                  minHeight: '32px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  width: 'auto'
                }}
                onClick={() => addSet(exIdx)}
              >
                <Plus size={12} />
                Add Set
              </button>

              <button
                className="btn btn-outline"
                style={{
                  padding: '6px 12px',
                  minHeight: '32px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--color-rose)',
                  borderColor: 'rgba(244, 63, 94, 0.1)',
                  display: ex.sets.length > 1 ? 'flex' : 'none',
                  alignItems: 'center',
                  gap: '4px',
                  width: 'auto'
                }}
                onClick={() => deleteSet(exIdx, ex.sets.length - 1)}
              >
                <Trash2 size={12} />
                Remove Set
              </button>
            </div>

          </div>
        );
      })}

      {/* Add Accessory Button */}
      <button
        className="btn btn-outline"
        style={{
          borderStyle: 'dashed',
          borderWidth: '1.5px',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          marginTop: '10px',
          marginBottom: '10px'
        }}
        onClick={() => setIsAddExerciseOpen(true)}
      >
        <Plus size={16} />
        Add Accessory / Ad-hoc Exercise
      </button>

      {/* Main Finish & Cancel Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        <button className="btn btn-emerald" onClick={onFinishWorkout}>
          <CheckSquare size={18} />
          Finish Workout Session
        </button>

        <button 
          className="btn btn-outline" 
          style={{ color: 'var(--color-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
          onClick={() => setIsCancelConfirmOpen(true)}
        >
          Cancel Workout
        </button>
      </div>

      {/* Plate Calculator overlay drawer */}
      {plateCalcTarget !== null && (
        <PlateCalculator
          isOpen={true}
          onClose={() => setPlateCalcTarget(null)}
          defaultWeight={plateCalcTarget.weight}
          exerciseId={plateCalcTarget.id}
          exerciseName={plateCalcTarget.name}
          unit={unit}
        />
      )}

      {/* Warm-up Calculator overlay drawer */}
      {warmupTarget !== null && (
        <WarmupCalculator
          isOpen={true}
          onClose={() => setWarmupTarget(null)}
          exerciseName={warmupTarget.name}
          workingWeight={warmupTarget.weight}
          unit={unit}
        />
      )}

      {/* Dynamic Add Accessory Exercise overlay drawer */}
      {isAddExerciseOpen && (
        <div className="drawer-overlay" onClick={() => setIsAddExerciseOpen(false)}>
          <div 
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="drawer-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} style={{ color: 'var(--color-purple)' }} />
                Add Accessory Exercise
              </h2>
              <button 
                onClick={() => setIsAddExerciseOpen(false)} 
                className="btn-icon-only btn-secondary"
                style={{ borderRadius: '50%', width: '36px', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Standard pre-seeded accessories grid */}
            <div style={{ marginBottom: '20px' }}>
              <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Choose Standard Accessory</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
                {[
                  { id: 'latpulldown', name: 'Lat Pulldown' },
                  { id: 'machinerow', name: 'Machine Row' },
                  { id: 'machineshoulderpress', name: 'Machine Press' },
                  { id: 'deadhang', name: 'Dead Hang' }
                ].map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '13px', padding: '10px', minHeight: '40px' }}
                    onClick={() => {
                      onAddExercise(acc.id);
                      setIsAddExerciseOpen(false);
                    }}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fully custom accessory builder */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginBottom: '20px' }}>
              <span className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Or Create Custom Accessory</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. Bicep Hammer Curl"
                  className="text-input"
                  style={{ flex: 1, padding: '10px' }}
                  value={customExName}
                  onChange={(e) => setCustomExName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', minHeight: '40px', padding: '10px 16px' }}
                  onClick={() => {
                    if (!customExName.trim()) return;
                    onAddExercise('custom-' + Math.random().toString(36).substring(2, 5), customExName.trim());
                    setCustomExName('');
                    setIsAddExerciseOpen(false);
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <button className="btn btn-secondary" onClick={() => setIsAddExerciseOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog drawer when cancelling active session */}
      {isCancelConfirmOpen && (
        <div className="drawer-overlay" onClick={() => setIsCancelConfirmOpen(false)}>
          <div 
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              textAlign: 'center', 
              maxHeight: '300px', 
              animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-rose)', marginBottom: '16px' }}>
              <AlertTriangle size={48} />
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              Discard Workout Session?
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Are you sure you want to stop this workout? Your logged reps and sets will be permanently deleted.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsCancelConfirmOpen(false)}
              >
                Go Back
              </button>
              
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--color-rose)', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)' }}
                onClick={onCancelWorkout}
              >
                Discard Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
