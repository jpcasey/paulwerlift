import { useState } from 'react';
import { Play, Plus, Dumbbell, Trash2, X } from 'lucide-react';
import { type Routine, EXERCISES } from '../store/workoutStore';

interface RoutineListProps {
  routines: Routine[];
  onStartWorkout: (id: string) => void;
  onAddCustomRoutine: (name: string, specs: any[], description?: string) => void;
  onDeleteRoutine: (id: string) => void;
  unit: 'lbs' | 'kgs';
}

export default function RoutineList({ routines, onStartWorkout, onAddCustomRoutine, onDeleteRoutine, unit }: RoutineListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDescription, setNewRoutineDescription] = useState('');
  
  // Custom routine builder choices state
  const [selectedSpecs, setSelectedSpecs] = useState<Array<{ exerciseId: string; setsCount: number; weight: number; reps: number }>>([
    { exerciseId: 'squat', setsCount: 3, weight: unit === 'lbs' ? 135 : 60, reps: 5 }
  ]);

  const handleAddSpecRow = () => {
    setSelectedSpecs((prev) => [
      ...prev,
      { exerciseId: 'bench', setsCount: 3, weight: unit === 'lbs' ? 135 : 60, reps: 5 }
    ]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    if (selectedSpecs.length <= 1) return;
    setSelectedSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSpec = (idx: number, field: string, value: any) => {
    setSelectedSpecs((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: value
      };
      return next;
    });
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    onAddCustomRoutine(newRoutineName, selectedSpecs, newRoutineDescription.trim() || undefined);
    
    // Reset form state
    setNewRoutineName('');
    setNewRoutineDescription('');
    setSelectedSpecs([{ exerciseId: 'squat', setsCount: 3, weight: unit === 'lbs' ? 135 : 60, reps: 5 }]);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '0 20px 20px 20px' }}>
      {/* Intro Header Section */}
      <div style={{ margin: '20px 0', textAlign: 'left' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
          Choose a Workout Program
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Select a routine template below to start your lifting session. Proposes weights based on progressive overload rules.
        </p>
      </div>

      {/* Routine Cards Listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {routines.map((routine) => {
          const isCustom = routine.id.startsWith('custom-');
          return (
            <div key={routine.id} className="card" style={{ textAlign: 'left', position: 'relative' }}>
              
              {/* Delete custom routine button */}
              {isCustom && (
                <button
                  onClick={() => onDeleteRoutine(routine.id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: 'none',
                    color: 'var(--color-rose)',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Delete Routine"
                >
                  <Trash2 size={15} />
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`badge ${isCustom ? 'badge-emerald' : 'badge-purple'}`}>
                  {isCustom ? 'Custom Preset' : 'Standard Routine'}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
                {routine.name}
              </h3>

              {routine.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginTop: '0px', marginBottom: '12px', lineHeight: '1.4' }}>
                  {routine.description}
                </p>
              )}

              {/* Exercises Summary Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {routine.exercises.map((ex, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{ex.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {ex.sets.length} sets × {ex.sets[0]?.reps || 5} @{' '}
                      <span style={{ fontWeight: '700', color: 'var(--color-purple-light)' }}>
                        {ex.sets[0]?.weight} {unit}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-primary"
                onClick={() => onStartWorkout(routine.id)}
              >
                <Play size={16} fill="white" />
                Start Workout
              </button>
            </div>
          );
        })}

        {/* Add custom routine card button */}
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
            color: 'var(--text-secondary)'
          }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          Create Custom Routine Presets
        </button>
      </div>

      {/* Modern Custom Routine Drawer Modal */}
      {isModalOpen && (
        <div className="drawer-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="drawer"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            <div className="drawer-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell style={{ color: 'var(--color-purple)' }} />
                Create Custom Routine
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="btn-icon-only btn-secondary"
                style={{ borderRadius: '50%', width: '36px', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCustom}>
              <div className="input-group">
                <span className="input-label">Routine Name</span>
                <input
                  type="text"
                  placeholder="e.g. Hypertrophy Pull Day"
                  required
                  className="text-input"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginTop: '12px' }}>
                <span className="input-label">Routine Description (Optional)</span>
                <textarea
                  placeholder="e.g. Secondary focus on accessory volume and back hypertrophy."
                  className="text-input"
                  style={{
                    width: '100%',
                    minHeight: '50px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-sans)',
                    resize: 'vertical'
                  }}
                  value={newRoutineDescription}
                  onChange={(e) => setNewRoutineDescription(e.target.value)}
                />
              </div>

              <div style={{ margin: '20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="input-label">Exercises Setup</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon-only"
                    style={{ width: '32px', minHeight: '32px', borderRadius: '8px' }}
                    onClick={handleAddSpecRow}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedSpecs.map((spec, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        alignItems: 'center',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {/* Exercise dropdown selection */}
                      <select
                        className="text-input"
                        style={{ flex: 1.5, padding: '8px', fontSize: '13px' }}
                        value={spec.exerciseId}
                        onChange={(e) => handleUpdateSpec(idx, 'exerciseId', e.target.value)}
                      >
                        {Object.values(EXERCISES).map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                      </select>

                      {/* Sets count */}
                      <input
                        type="number"
                        placeholder="Sets"
                        required
                        className="text-input"
                        style={{ width: '55px', padding: '8px', textAlign: 'center', fontSize: '13px' }}
                        value={spec.setsCount || ''}
                        onChange={(e) => handleUpdateSpec(idx, 'setsCount', Number(e.target.value))}
                        title="Sets"
                      />

                      {/* Weight input */}
                      <input
                        type="number"
                        placeholder="Weight"
                        required
                        className="text-input"
                        style={{ width: '70px', padding: '8px', textAlign: 'center', fontSize: '13px' }}
                        value={spec.weight || ''}
                        onChange={(e) => handleUpdateSpec(idx, 'weight', Number(e.target.value))}
                        title={`Weight in ${unit}`}
                      />

                      {/* Delete spec row button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        disabled={selectedSpecs.length <= 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: selectedSpecs.length <= 1 ? 'var(--text-muted)' : 'var(--color-rose)',
                          padding: '4px',
                          cursor: selectedSpecs.length <= 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
