import { useState } from 'react';
import { Dumbbell, TrendingUp, Settings as SettingsIcon, Zap, MessageSquare } from 'lucide-react';
import { useWorkoutStore } from './store/workoutStore';
import RoutineList from './components/RoutineList';
import WorkoutPlayer from './components/WorkoutPlayer';
import RestTimer from './components/RestTimer';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Coach from './components/Coach';

type Tab = 'workouts' | 'analytics' | 'coach' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workouts');
  const store = useWorkoutStore();

  const {
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
  } = store;

  // Render correct main panel view based on active tab state
  const renderTabContent = () => {
    switch (activeTab) {
      case 'workouts':
        if (activeWorkout && activeStartTime) {
          return (
            <WorkoutPlayer
              activeWorkout={activeWorkout}
              activeStartTime={activeStartTime}
              history={history}
              unit={unit}
              updateSet={updateSet}
              addSet={addSet}
              deleteSet={deleteSet}
              onFinishWorkout={finishWorkout}
              onCancelWorkout={cancelWorkout}
              onAddExercise={addExerciseToActiveWorkout}
              onDeleteExercise={deleteExerciseFromActiveWorkout}
              activeNotes={activeNotes}
              onUpdateNotes={setActiveNotes}
              onUpdateExerciseNotes={updateExerciseNotes}
            />
          );
        }
        return (
          <RoutineList
            routines={routines}
            onStartWorkout={startWorkout}
            onAddCustomRoutine={addCustomRoutine}
            onDeleteRoutine={deleteRoutine}
            unit={unit}
          />
        );
      case 'analytics':
        return (
          <Analytics
            history={history}
            unit={unit}
            onUpdateHistoryNotes={updateHistoryNotes}
          />
        );
      case 'coach':
        return (
          <Coach
            apiKey={geminiApiKey}
            chatHistory={chatHistory}
            onUpdateHistory={updateChatHistory}
            onClearHistory={clearChatHistory}
            history={history}
            routines={routines}
            unit={unit}
          />
        );
      case 'settings':
        return (
          <Settings
            unit={unit}
            onToggleUnit={toggleUnit}
            onExport={exportData}
            onImport={importData}
            geminiApiKey={geminiApiKey}
            onUpdateGeminiApiKey={setGeminiApiKey}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Dynamic Header */}
      <header className="app-header">
        <h1 className="app-title">
          <Zap size={22} fill="url(#neonGrad)" stroke="none" />
          PaulwerLift
        </h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700' }}>
          {unit === 'lbs' ? 'LBS' : 'KGS'}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Persistent Rest Timer Countdown - displays floating under header across all tabs */}
        <RestTimer
          timer={restTimer}
          onAdjust={adjustRestTimer}
          onStop={stopRestTimer}
        />
        
        {renderTabContent()}
      </main>

      {/* Bottom iOS Navigation Tabs Dashboard */}
      {/* Hide navigation bar if you are actively working out to keep the interface focused */}
      {(!activeWorkout) && (
        <nav className="bottom-nav">
          <button 
            className={`nav-item ${activeTab === 'workouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('workouts')}
          >
            <Dumbbell size={20} />
            Workouts
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={20} />
            Analytics
          </button>

          <button 
            className={`nav-item ${activeTab === 'coach' ? 'active' : ''}`}
            onClick={() => setActiveTab('coach')}
          >
            <MessageSquare size={20} />
            AI Coach
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={20} />
            Settings
          </button>
        </nav>
      )}

      {/* Inline SVG elements to feed our gradient configurations */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}
