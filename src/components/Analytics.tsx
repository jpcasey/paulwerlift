import { useState } from 'react';
import { TrendingUp, History, Calendar, Clock, Dumbbell, Award } from 'lucide-react';
import { type HistoryItem, EXERCISES } from '../store/workoutStore';

interface AnalyticsProps {
  history: HistoryItem[];
  unit: 'lbs' | 'kgs';
  onUpdateHistoryNotes: (historyId: string, notes: string) => void;
}

export default function Analytics({ history, unit, onUpdateHistoryNotes }: AnalyticsProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('squat');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState<string>('');

  // Format Dates beautifully
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Compile unique exercises that actually exist in your history logs
  const exerciseIdsInHistory = Array.from(
    new Set(
      history.flatMap((h) => h.exercises.map((e) => e.exerciseId))
    )
  );

  // If no specific history, fall back to default exercises to populate pills
  const availablePills = exerciseIdsInHistory.length > 0 
    ? exerciseIdsInHistory 
    : ['squat', 'bench', 'deadlift', 'ohp', 'powerclean', 'row'];

  // Parse history to build chart data: peak weight achieved in each session
  const getChartData = () => {
    const data: Array<{ date: string; weight: number }> = [];

    // Process from oldest to newest for chronological plotting
    [...history].reverse().forEach((item) => {
      const ex = item.exercises.find((e) => e.exerciseId === selectedExercise);
      if (ex) {
        // Find peak completed weight
        const completedSets = ex.sets.filter((s) => s.completed);
        if (completedSets.length > 0) {
          const maxWeight = Math.max(...completedSets.map((s) => s.weight));
          data.push({
            date: formatDate(item.date),
            weight: maxWeight
          });
        }
      }
    });

    return data;
  };

  const chartData = getChartData();

  // Draw SVG custom line chart math
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div style={{ padding: '40px 20px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
          No completed sets logged for {EXERCISES[selectedExercise as keyof typeof EXERCISES]?.name || selectedExercise} yet. 
          Complete a session to populate charts.
        </div>
      );
    }

    const width = 360;
    const height = 180;
    const paddingX = 30;
    const paddingY = 20;

    const weights = chartData.map((d) => d.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);

    // Grid details
    const ySpread = maxWeight === minWeight ? 20 : maxWeight - minWeight;
    const yMax = maxWeight + (ySpread * 0.1);
    const yMin = Math.max(0, minWeight - (ySpread * 0.1));
    const finalYSpread = yMax - yMin;

    // Calculate grid coordinate points
    const points = chartData.map((d, index) => {
      const x = paddingX + (index * (width - 2 * paddingX)) / Math.max(1, chartData.length - 1);
      const ratio = finalYSpread === 0 ? 0.5 : (d.weight - yMin) / finalYSpread;
      const y = height - paddingY - ratio * (height - 2 * paddingY);
      return { x, y, weight: d.weight, date: d.date };
    });

    const pointsString = points.map((p) => `${p.x},${p.y}`).join(' ');

    // Gradient fill area under the line
    const fillPointsString = points.length > 0
      ? `${points[0].x},${height - paddingY} ${pointsString} ${points[points.length - 1].x},${height - paddingY}`
      : '';

    return (
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Render peak stats badge */}
        <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '14px', marginBottom: '14px', padding: '0 4px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Personal Record</span>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-emerald-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={16} />
              {maxWeight} {unit}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Weight</span>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-purple-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={16} />
              {chartData[chartData.length - 1].weight} {unit}
            </div>
          </div>
        </div>

        {/* Dynamic Canvas SVG */}
        <div 
          style={{ 
            width: '100%', 
            overflowX: 'auto',
            background: 'rgba(255, 255, 255, 0.01)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)'
          }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-purple)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-purple)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Grid Line Marks */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />

            {/* Grid Weight Labels */}
            <text x={paddingX - 5} y={paddingY + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontWeight="700">
              {Math.round(yMax)}
            </text>
            <text x={paddingX - 5} y={height / 2 + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontWeight="700">
              {Math.round((yMax + yMin) / 2)}
            </text>
            <text x={paddingX - 5} y={height - paddingY + 3} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontWeight="700">
              {Math.round(yMin)}
            </text>

            {/* Area gradient under the line */}
            {points.length > 1 && (
              <polygon points={fillPointsString} fill="url(#areaGrad)" />
            )}

            {/* Main Overload Progress Line */}
            {points.length > 1 ? (
              <polyline
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsString}
              />
            ) : points.length === 1 ? (
              // If only 1 dot, just draw a singular center mark
              <circle cx={points[0].x} cy={points[0].y} r="5" fill="var(--color-purple)" />
            ) : null}

            {/* Glowing Dots per Lift Log */}
            {points.map((p, idx) => (
              <g key={idx} className="chart-dot-group" style={{ cursor: 'pointer' }}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="#070709"
                  stroke="var(--color-emerald-light)"
                  strokeWidth="2.5"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="var(--color-emerald-light)"
                  opacity="0"
                  style={{ transition: 'opacity 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.setAttribute('opacity', '0.15')}
                  onMouseLeave={(e) => e.currentTarget.setAttribute('opacity', '0')}
                />
                {/* Visual helper weight tag above dot */}
                <text 
                  x={p.x} 
                  y={p.y - 12} 
                  fill="var(--text-primary)" 
                  fontSize="8" 
                  fontWeight="800" 
                  textAnchor="middle"
                  style={{ background: '#000' }}
                >
                  {p.weight}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 20px 20px 20px', textAlign: 'left' }}>
      
      {/* 1. Lift progression graphs panel */}
      <div style={{ margin: '20px 0 10px 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
          <TrendingUp style={{ color: 'var(--color-purple)' }} />
          Progression Charts
        </h2>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        {/* Pills select scroll row */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '6px', 
            overflowX: 'auto', 
            marginBottom: '16px',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {availablePills.map((pId) => {
            const exName = EXERCISES[pId as keyof typeof EXERCISES]?.name || pId;
            const isActive = selectedExercise === pId;

            return (
              <button
                key={pId}
                className="btn btn-secondary"
                style={{
                  width: 'auto',
                  padding: '6px 12px',
                  minHeight: '32px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  backgroundColor: isActive ? 'var(--color-purple-bg)' : 'var(--bg-surface-elevated)',
                  borderColor: isActive ? 'var(--color-purple)' : 'var(--border-color)',
                  color: isActive ? 'var(--color-purple-light)' : 'var(--text-secondary)'
                }}
                onClick={() => setSelectedExercise(pId)}
              >
                {exName}
              </button>
            );
          })}
        </div>

        {renderChart()}
      </div>

      {/* 2. Completed logs feed history list */}
      <div style={{ margin: '10px 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
          <History style={{ color: 'var(--color-purple)' }} />
          Workout History
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
            No workouts completed yet! Choose a routine in the Workouts tab and complete your first session.
          </div>
        ) : (
          history.map((hItem) => (
            <div key={hItem.id} className="card" style={{ padding: '16px' }}>
              
              {/* Header block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                    {hItem.routineName}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={12} />
                      {formatDate(hItem.date)}
                    </span>
                    <span style={{ color: 'var(--border-color)' }}>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={12} />
                      {hItem.durationMinutes} mins
                    </span>
                  </div>
                </div>
              </div>

              {/* Log details exercises rows summaries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hItem.exercises.map((e, idx) => {
                  const completedSets = e.sets.filter((s) => s.completed);
                  if (completedSets.length === 0) return null;

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Dumbbell size={13} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: '600' }}>{e.name}</span>
                        </div>
                        
                        {/* Set count weights listings */}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {completedSets.length} sets × {completedSets[0]?.reps || 5} @{' '}
                          <span style={{ fontWeight: '700', color: 'var(--color-emerald-light)' }}>
                            {completedSets[0]?.weight} {unit}
                          </span>
                        </span>
                      </div>
                      {e.notes && (
                        <div style={{ paddingLeft: '19px', fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.45)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📝 Cue:</span>
                          <span>{e.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Retroactive Journal Notes Editor */}
              {editingHistoryId === hItem.id ? (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    className="text-input"
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      fontSize: '12.5px',
                      lineHeight: '1.4',
                      padding: '8px 12px',
                      fontFamily: 'var(--font-sans)'
                    }}
                    value={editingNotesText}
                    onChange={(e) => setEditingNotesText(e.target.value)}
                    placeholder="Jot down how the session went retroactively..."
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', minHeight: '28px', fontSize: '11px', borderRadius: '6px', width: 'auto' }}
                      onClick={() => setEditingHistoryId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-emerald"
                      style={{ padding: '4px 10px', minHeight: '28px', fontSize: '11px', borderRadius: '6px', width: 'auto' }}
                      onClick={() => {
                        onUpdateHistoryNotes(hItem.id, editingNotesText);
                        setEditingHistoryId(null);
                      }}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {hItem.notes ? (
                    <div 
                      style={{ 
                        marginTop: '12px', 
                        padding: '8px 12px', 
                        background: 'var(--bg-surface-elevated)', 
                        borderLeft: '3px solid var(--color-purple)', 
                        borderRadius: '4px 8px 8px 4px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.45',
                        fontStyle: 'italic',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <span style={{ flex: 1 }}>“{hItem.notes}”</span>
                      <button
                        onClick={() => {
                          setEditingHistoryId(hItem.id);
                          setEditingNotesText(hItem.notes || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          fontSize: '11.5px',
                          textDecoration: 'underline'
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setEditingHistoryId(hItem.id);
                          setEditingNotesText('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          color: 'rgba(139, 92, 246, 0.75)',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        + Add Journal Note
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
