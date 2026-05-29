import { useState, useEffect } from 'react';

// Core Type Definitions
export interface SetLog {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: SetLog[];
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  description?: string;
}

export interface HistoryItem {
  id: string;
  routineId: string;
  routineName: string;
  date: string; // ISO date string
  durationMinutes: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface RestTimerState {
  targetSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export interface ExerciseInfo {
  id: string;
  name: string;
  increment: number;
  kind: 'barbell' | 'machine' | 'bodyweight';
}

// Default Exercises and standard progression increments (in lbs)
export const EXERCISES: Record<string, ExerciseInfo> = {
  squat: { id: 'squat', name: 'Squat', increment: 5, kind: 'barbell' },
  bench: { id: 'bench', name: 'Bench Press', increment: 5, kind: 'barbell' },
  deadlift: { id: 'deadlift', name: 'Deadlift', increment: 10, kind: 'barbell' },
  ohp: { id: 'ohp', name: 'Overhead Press', increment: 5, kind: 'barbell' },
  powerclean: { id: 'powerclean', name: 'Power Clean', increment: 5, kind: 'barbell' },
  row: { id: 'row', name: 'Barbell Row', increment: 5, kind: 'barbell' },
  machinerow: { id: 'machinerow', name: 'Machine Row', increment: 5, kind: 'machine' },
  machineshoulderpress: { id: 'machineshoulderpress', name: 'Machine Shoulder Press', increment: 5, kind: 'machine' },
  latpulldown: { id: 'latpulldown', name: 'Lat Pulldown', increment: 5, kind: 'machine' },
  deadhang: { id: 'deadhang', name: 'Dead Hang', increment: 0, kind: 'bodyweight' }
};

export const getExerciseKind = (exerciseId: string, name: string): 'barbell' | 'machine' | 'bodyweight' => {
  const cleanId = exerciseId.toLowerCase();
  const cleanName = name.toLowerCase();

  const seeded = EXERCISES[cleanId as keyof typeof EXERCISES];
  if (seeded) return seeded.kind;

  if (
    cleanName.includes('barbell') ||
    cleanName.includes('squat') ||
    cleanName.includes('bench') ||
    cleanName.includes('deadlift') ||
    cleanName.includes('bar ') ||
    (cleanName.includes('press') && !cleanName.includes('machine') && !cleanName.includes('cable'))
  ) {
    return 'barbell';
  }

  if (
    cleanName.includes('hang') ||
    cleanName.includes('pullup') ||
    cleanName.includes('pull-up') ||
    cleanName.includes('chin-up') ||
    cleanName.includes('chin up') ||
    cleanName.includes('chinups') ||
    cleanName.includes('dip') ||
    cleanName.includes('bodyweight') ||
    cleanName.includes('pushup') ||
    cleanName.includes('push-up') ||
    cleanName.includes('plank')
  ) {
    return 'bodyweight';
  }

  return 'machine'; // Safe neutral default for custom accessories
};

export const getBarbellWeight = (exerciseId: string, name: string, unit: 'lbs' | 'kgs'): number => {
  const cleanId = exerciseId.toLowerCase();
  const cleanName = name.toLowerCase();

  // Deadlifts use a 60 lbs Trap Bar (approx 27.5 kgs scaled)
  if (cleanId === 'deadlift' || cleanName.includes('deadlift') || cleanName.includes('trap') || cleanName.includes('hex')) {
    return unit === 'lbs' ? 60 : 27.5;
  }

  // Standard straight barbell
  return unit === 'lbs' ? 45 : 20;
};

// Default pre-seeded weights for starting (lbs)
const DEFAULT_WEIGHTS: Record<string, number> = {
  squat: 135,
  bench: 135,
  deadlift: 185,
  ohp: 95,
  powerclean: 95,
  row: 115
};

// Seed Starting Strength and Stronglifts Routines
export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'ss-a',
    name: 'Starting Strength A',
    description: 'Focus on primary compound power movements: Squat, Bench Press, and Deadlift.',
    exercises: [
      { exerciseId: 'squat', name: 'Squat', sets: Array(3).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.squat, reps: 5, completed: false })) },
      { exerciseId: 'bench', name: 'Bench Press', sets: Array(3).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.bench, reps: 5, completed: false })) },
      { exerciseId: 'deadlift', name: 'Deadlift', sets: Array(1).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.deadlift, reps: 5, completed: false })) }
    ]
  },
  {
    id: 'ss-b',
    name: 'Starting Strength B',
    description: 'Alternating Starting Strength workout: Squat, Overhead Press, and Power Clean.',
    exercises: [
      { exerciseId: 'squat', name: 'Squat', sets: Array(3).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.squat, reps: 5, completed: false })) },
      { exerciseId: 'ohp', name: 'Overhead Press', sets: Array(3).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.ohp, reps: 5, completed: false })) },
      { exerciseId: 'powerclean', name: 'Power Clean', sets: Array(3).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.powerclean, reps: 5, completed: false })) }
    ]
  },
  {
    id: 'sl-a',
    name: 'Stronglifts 5x5 A',
    description: 'High-volume progressive overload compound routine: Squats, Bench Press, and Barbell Rows.',
    exercises: [
      { exerciseId: 'squat', name: 'Squat', sets: Array(5).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.squat, reps: 5, completed: false })) },
      { exerciseId: 'bench', name: 'Bench Press', sets: Array(5).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.bench, reps: 5, completed: false })) },
      { exerciseId: 'row', name: 'Barbell Row', sets: Array(5).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.row, reps: 5, completed: false })) }
    ]
  },
  {
    id: 'sl-b',
    name: 'Stronglifts 5x5 B',
    description: 'High-volume compound routine: Squats, Overhead Press, and heavy Deadlift.',
    exercises: [
      { exerciseId: 'squat', name: 'Squat', sets: Array(5).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.squat, reps: 5, completed: false })) },
      { exerciseId: 'ohp', name: 'Overhead Press', sets: Array(5).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.ohp, reps: 5, completed: false })) },
      { exerciseId: 'deadlift', name: 'Deadlift', sets: Array(1).fill(null).map(() => ({ weight: DEFAULT_WEIGHTS.deadlift, reps: 5, completed: false })) }
    ]
  }
];

export function useWorkoutStore() {
  // Load data from localStorage or fallback
  const [unit, setUnit] = useState<'lbs' | 'kgs'>(() => {
    return (localStorage.getItem('ag_unit') as 'lbs' | 'kgs') || 'lbs';
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('ag_routines');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('ag_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeWorkout, setActiveWorkout] = useState<Routine | null>(() => {
    const saved = localStorage.getItem('ag_active');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeStartTime, setActiveStartTime] = useState<string | null>(() => {
    return localStorage.getItem('ag_active_start_time');
  });

  const [restTimer, setRestTimer] = useState<RestTimerState>({
    targetSeconds: 90,
    remainingSeconds: 0,
    isRunning: false
  });

  const [activeNotes, setActiveNotes] = useState<string>(() => {
    return localStorage.getItem('ag_active_notes') || '';
  });

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('ag_gemini_key') || '';
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ag_coach_chat');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist states automatically on modification
  useEffect(() => {
    localStorage.setItem('ag_unit', unit);
  }, [unit]);

  useEffect(() => {
    localStorage.setItem('ag_active_notes', activeNotes);
  }, [activeNotes]);

  useEffect(() => {
    localStorage.setItem('ag_gemini_key', geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    localStorage.setItem('ag_coach_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('ag_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('ag_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('ag_active', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('ag_active');
    }
  }, [activeWorkout]);

  useEffect(() => {
    if (activeStartTime) {
      localStorage.setItem('ag_active_start_time', activeStartTime);
    } else {
      localStorage.removeItem('ag_active_start_time');
    }
  }, [activeStartTime]);

  // Handle rest timer countdown
  useEffect(() => {
    let interval: any = null;
    if (restTimer.isRunning && restTimer.remainingSeconds > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => ({
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
          isRunning: prev.remainingSeconds - 1 > 0
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimer.isRunning, restTimer.remainingSeconds]);

  // Toggle weight units (lbs <-> kgs)
  const toggleUnit = () => {
    setUnit((prev) => {
      const next = prev === 'lbs' ? 'kgs' : 'lbs';
      // If switching units, perform approximate weight conversions for routines so weights remain logical
      setRoutines((prevRoutines) =>
        prevRoutines.map((r) => ({
          ...r,
          exercises: r.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) => ({
              ...s,
              weight: Math.round(next === 'kgs' ? s.weight / 2.20462 : s.weight * 2.20462)
            }))
          }))
        }))
      );
      if (activeWorkout) {
        setActiveWorkout((prevActive) => {
          if (!prevActive) return null;
          return {
            ...prevActive,
            exercises: prevActive.exercises.map((ex) => ({
              ...ex,
              sets: ex.sets.map((s) => ({
                ...s,
                weight: Math.round(next === 'kgs' ? s.weight / 2.20462 : s.weight * 2.20462)
              }))
            }))
          };
        });
      }
      return next;
    });
  };

  // Start a workout using a routine template
  const startWorkout = (routineId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    // Create a copy of the routine to serve as active session log.
    // Propose weights by reading the last completed metrics from history!
    const activeExercises = routine.exercises.map((ex) => {
      // Find the last completed session of this specific exercise
      const lastSession = [...history]
        .reverse()
        .find((h) => h.exercises.some((e) => e.exerciseId === ex.exerciseId));
      
      const lastExercise = lastSession?.exercises.find((e) => e.exerciseId === ex.exerciseId);

      // If we have history for this exercise, let's load those weights
      if (lastExercise && lastExercise.sets.length > 0) {
        const lastWeights = lastExercise.sets.map((s) => s.weight);
        const lastWeight = Math.max(...lastWeights);

        // Check if all sets in the last session were fully completed
        const allCompleted = lastExercise.sets.every((s) => s.completed && s.reps >= 5);
        let proposedWeight = lastWeight;

        if (allCompleted) {
          // Progress overload rules!
          const inc = EXERCISES[ex.exerciseId as keyof typeof EXERCISES]?.increment || 5;
          // Scale increment if in KGs
          const incrementAmount = unit === 'kgs' ? Math.round(inc / 2.2) : inc;
          proposedWeight = lastWeight + incrementAmount;
        }

        return {
          ...ex,
          sets: ex.sets.map((s, idx) => ({
            weight: proposedWeight,
            reps: lastExercise.sets[idx]?.reps || s.reps,
            completed: false
          }))
        };
      }

      // No history, use template weights
      return {
        ...ex,
        sets: ex.sets.map((s) => ({
          ...s,
          completed: false
        }))
      };
    });

    setActiveWorkout({
      ...routine,
      exercises: activeExercises
    });
    setActiveStartTime(new Date().toISOString());
  };

  // Cancel current active workout
  const cancelWorkout = () => {
    setActiveWorkout(null);
    setActiveStartTime(null);
    setRestTimer((prev) => ({ ...prev, isRunning: false, remainingSeconds: 0 }));
    setActiveNotes('');
  };

  // Finish active session and apply progressive overload increments
  const finishWorkout = () => {
    if (!activeWorkout || !activeStartTime) return;

    const endTime = new Date();
    const startTime = new Date(activeStartTime);
    const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

    // Compile workout history item
    const historyItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      routineId: activeWorkout.id,
      routineName: activeWorkout.name,
      date: new Date().toISOString(),
      durationMinutes,
      exercises: activeWorkout.exercises.map((ex) => ({
        ...ex,
        // Only keep sets that were completed, or save them all but preserve 'completed' flag
        sets: ex.sets.map((s) => ({ ...s }))
      })),
      notes: activeNotes.trim() || undefined
    };

    // Save history
    setHistory((prev) => [historyItem, ...prev]);

    // Update routine templates with the latest weights so they load for future sessions!
    setRoutines((prevRoutines) =>
      prevRoutines.map((r) => {
        if (r.id !== activeWorkout.id) return r;
        return {
          ...r,
          exercises: r.exercises.map((ex) => {
            const activeEx = activeWorkout.exercises.find((e) => e.exerciseId === ex.exerciseId);
            if (!activeEx) return ex;

            // Check if all active sets were successfully completed
            const allSuccess = activeEx.sets.every((s) => s.completed && s.reps >= 5);
            let nextWeight = Math.max(...activeEx.sets.map((s) => s.weight));

            if (allSuccess) {
              const inc = EXERCISES[ex.exerciseId as keyof typeof EXERCISES]?.increment || 5;
              const incrementAmount = unit === 'kgs' ? Math.round(inc / 2.2) : inc;
              nextWeight = nextWeight + incrementAmount;
            }

            return {
              ...ex,
              sets: ex.sets.map((s, idx) => ({
                ...s,
                weight: nextWeight,
                reps: activeEx.sets[idx]?.reps || s.reps
              }))
            };
          })
        };
      })
    );

    // Clear active session
    setActiveWorkout(null);
    setActiveStartTime(null);
    setRestTimer((prev) => ({ ...prev, isRunning: false, remainingSeconds: 0 }));
    setActiveNotes('');
  };

  // Edit sets details in the workout player
  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<SetLog>) => {
    if (!activeWorkout) return;

    setActiveWorkout((prev) => {
      if (!prev) return null;
      const nextExercises = [...prev.exercises];
      const nextSets = [...nextExercises[exerciseIndex].sets];
      
      // Merge updates
      const updatedSet = {
        ...nextSets[setIndex],
        ...updates
      };

      nextSets[setIndex] = updatedSet;
      nextExercises[exerciseIndex] = {
        ...nextExercises[exerciseIndex],
        sets: nextSets
      };

      return {
        ...prev,
        exercises: nextExercises
      };
    });

    // Auto-trigger rest timer when a set is marked COMPLETED
    if (updates.completed === true) {
      startRestTimer(90); // Propose 90 seconds (1.5 mins) default rest, adjustable in timer
    }
  };

  // Add a new set to an active exercise
  const addSet = (exerciseIndex: number) => {
    if (!activeWorkout) return;

    setActiveWorkout((prev) => {
      if (!prev) return null;
      const nextExercises = [...prev.exercises];
      const ex = nextExercises[exerciseIndex];
      const lastSet = ex.sets[ex.sets.length - 1] || { weight: 135, reps: 5 };
      
      const newSet: SetLog = {
        weight: lastSet.weight,
        reps: lastSet.reps,
        completed: false
      };

      nextExercises[exerciseIndex] = {
        ...ex,
        sets: [...ex.sets, newSet]
      };

      return {
        ...prev,
        exercises: nextExercises
      };
    });
  };

  // Remove a set from an active exercise
  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;

    setActiveWorkout((prev) => {
      if (!prev) return null;
      const nextExercises = [...prev.exercises];
      const ex = nextExercises[exerciseIndex];
      if (ex.sets.length <= 1) return prev; // Keep at least one set

      nextExercises[exerciseIndex] = {
        ...ex,
        sets: ex.sets.filter((_, idx) => idx !== setIndex)
      };

      return {
        ...prev,
        exercises: nextExercises
      };
    });
  };

  // Rest Timer Controls
  const startRestTimer = (seconds: number) => {
    // Play a subtle haptic feedback block if running natively
    if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch (_) {}
    }

    setRestTimer({
      targetSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true
    });
  };

  const adjustRestTimer = (secondsToAdd: number) => {
    setRestTimer((prev) => {
      const nextVal = Math.max(0, prev.remainingSeconds + secondsToAdd);
      return {
        ...prev,
        remainingSeconds: nextVal,
        isRunning: nextVal > 0
      };
    });
  };

  const stopRestTimer = () => {
    setRestTimer((prev) => ({ ...prev, isRunning: false, remainingSeconds: 0 }));
  };

  // Add custom routine preset
  const addCustomRoutine = (
    name: string, 
    exerciseSpecs: { exerciseId: string; setsCount: number; weight: number; reps: number }[],
    description?: string
  ) => {
    const newRoutine: Routine = {
      id: 'custom-' + Math.random().toString(36).substring(2, 9),
      name,
      description,
      exercises: exerciseSpecs.map((spec) => ({
        exerciseId: spec.exerciseId,
        name: EXERCISES[spec.exerciseId as keyof typeof EXERCISES]?.name || spec.exerciseId,
        sets: Array(spec.setsCount).fill(null).map(() => ({
          weight: spec.weight,
          reps: spec.reps,
          completed: false
        }))
      }))
    };

    setRoutines((prev) => [...prev, newRoutine]);
  };

  // Delete a custom routine
  const deleteRoutine = (routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
  };

  // Add an exercise dynamically during an active workout
  const addExerciseToActiveWorkout = (exerciseId: string, customName?: string) => {
    if (!activeWorkout) return;

    const name = customName || EXERCISES[exerciseId as keyof typeof EXERCISES]?.name || exerciseId;
    const isDeadhang = exerciseId === 'deadhang' || name.toLowerCase().includes('hang');

    const newExercise: WorkoutExercise = {
      exerciseId,
      name,
      sets: Array(3).fill(null).map(() => ({
        weight: isDeadhang ? 0 : (unit === 'lbs' ? 100 : 45),
        reps: isDeadhang ? 60 : 8, // 60 seconds default for dead hangs, 8 reps for other lifts
        completed: false
      }))
    };

    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: [...prev.exercises, newExercise]
      };
    });
  };

  // Delete an exercise completely from an active workout
  const deleteExerciseFromActiveWorkout = (exerciseIndex: number) => {
    if (!activeWorkout) return;

    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter((_, idx) => idx !== exerciseIndex)
      };
    });
  };

  // Export all local database structures as JSON
  const exportData = () => {
    const dataStr = JSON.stringify({
      version: '1.0',
      unit,
      routines,
      history
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    return URL.createObjectURL(blob);
  };

  // Import external database structures
  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.unit) setUnit(parsed.unit);
      if (parsed.routines) setRoutines(parsed.routines);
      if (parsed.history) setHistory(parsed.history);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Invalid JSON format.' };
    }
  };

  // Edit notes for a specific exercise during active workout
  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const nextExercises = [...prev.exercises];
      nextExercises[exerciseIndex] = {
        ...nextExercises[exerciseIndex],
        notes
      };
      return {
        ...prev,
        exercises: nextExercises
      };
    });
  };

  // Update notes of a completed history item retroactively
  const updateHistoryNotes = (historyId: string, notes: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === historyId ? { ...item, notes: notes.trim() || undefined } : item
      )
    );
  };

  const updateChatHistory = (messages: ChatMessage[]) => {
    setChatHistory(messages);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  return {
    unit,
    toggleUnit,
    routines,
    history,
    activeWorkout,
    activeStartTime,
    restTimer,
    startWorkout,
    cancelWorkout,
    finishWorkout,
    updateSet,
    addSet,
    deleteSet,
    startRestTimer,
    adjustRestTimer,
    stopRestTimer,
    addCustomRoutine,
    deleteRoutine,
    exportData,
    importData,
    addExerciseToActiveWorkout,
    deleteExerciseFromActiveWorkout,
    activeNotes,
    setActiveNotes,
    updateExerciseNotes,
    updateHistoryNotes,
    geminiApiKey,
    setGeminiApiKey,
    chatHistory,
    updateChatHistory,
    clearChatHistory
  };
}
export type WorkoutStore = ReturnType<typeof useWorkoutStore>;
