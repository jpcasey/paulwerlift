import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Bot, User, ArrowRight, Compass } from 'lucide-react';
import { type HistoryItem, type Routine, type ChatMessage } from '../store/workoutStore';

interface CoachProps {
  apiKey: string;
  chatHistory: ChatMessage[];
  onUpdateHistory: (messages: ChatMessage[]) => void;
  onClearHistory: () => void;
  history: HistoryItem[];
  routines: Routine[];
  unit: 'lbs' | 'kgs';
}

export default function Coach({
  apiKey,
  chatHistory,
  onUpdateHistory,
  onClearHistory,
  history,
  routines,
  unit
}: CoachProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to the bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Compile full workout stats to supply to the system instruction
  const compileSystemContext = () => {
    // Summarize completed sessions logs
    const historyText = history.slice(0, 15).map(h => {
      const exercisesText = h.exercises.map(e => {
        const completedSets = e.sets.filter(s => s.completed);
        if (completedSets.length === 0) return null;
        const setsStr = `${completedSets.length} sets × ${completedSets[0]?.reps || 5} @ ${completedSets[0]?.weight} ${unit}`;
        const cueStr = e.notes ? ` (Cue: "${e.notes}")` : '';
        return `${e.name}: ${setsStr}${cueStr}`;
      }).filter(Boolean).join(', ');
      
      const journalStr = h.notes ? ` [Session Journal: "${h.notes}"]` : '';
      return `- Date: ${h.date.split('T')[0]} | Program: ${h.routineName} | Lifts: (${exercisesText})${journalStr}`;
    }).join('\n');

    // Summarize routines presets
    const routinesText = routines.map(r => {
      const exercisesStr = r.exercises.map(e => `${e.name} (${e.sets.length}x${e.sets[0]?.reps || 5})`).join(', ');
      const descStr = r.description ? ` | Program details: "${r.description}"` : '';
      return `- ${r.name}: ${exercisesStr}${descStr}`;
    }).join('\n');

    return `You are "PaulwerLift Coach", a world-class strength training assistant and personal lifting coach trained in Starting Strength and Stronglifts 5x5 compound progression principles.
Your trainee's name is Paul. You have secure, private access to Paul's strength training history.

Paul's weight unit is: ${unit}

=== PAUL'S ROUTINE PRESETS ===
${routinesText}

=== PAUL'S HISTORICAL LOGS (Newest to Oldest) ===
${historyText || 'No workouts completed yet. Paul is about to start his first program!'}

=== COACHING INSTRUCTIONS ===
1. Speak directly as an elite strength coach. Be highly technical, extremely encouraging, and actionable. Praise logs and reference specific weights and cues.
2. Avoid standard corporate medical disclaimers unless Paul mentions a serious physical injury (e.g. sharp joint pain or tears); maintain a natural gym-coach tone.
3. Identify plateauing: if Paul's Bench or Squat is stalled at the same weight for 3 or more sessions, suggest a deload (e.g., reduce working weight by 10% and focus on perfect bar speed).
4. Review cues: praise Paul's biofeedback notes and reference them in your replies (e.g. form tips, recovery cues).
5. Suggest accessories when asked based on his current program lifts.
6. Keep responses relatively concise and mobile-friendly (1-3 readable paragraphs). Use Markdown highlights, bullet points, or tables to make routines or statistics easily scannable on an iPhone screen.`;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !apiKey || isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    const newUserMessage: ChatMessage = { role: 'user', content: textToSend };
    const updatedChat = [...chatHistory, newUserMessage];
    onUpdateHistory(updatedChat);
    setInputText('');

    try {
      // Map chat log format to match Gemini API role formatting requirements ('user' and 'model')
      const contentsApiPayload = updatedChat.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const systemInstructionPayload = {
        parts: [{ text: compileSystemContext() }]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contentsApiPayload,
          systemInstruction: systemInstructionPayload
        })
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const coachResponseText = data.candidates[0].content.parts[0].text;
        const newModelMessage: ChatMessage = { role: 'model', content: coachResponseText };
        onUpdateHistory([...updatedChat, newModelMessage]);
      } else {
        const errorDetail = data.error?.message || 'Invalid response from AI server.';
        setErrorMessage(`Coach API Error: ${errorDetail}`);
      }
    } catch (err: any) {
      setErrorMessage(`Network Error: Could not connect to Gemini. ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sleek client-side regex markdown converter
  const renderMarkdown = (text: string) => {
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Header formats
    formatted = formatted.replace(/^### (.*$)/gim, '<h4 style="margin: 10px 0 6px 0; font-weight: 800; color: var(--color-purple-light); font-family: var(--font-heading);">$1</h4>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h3 style="margin: 12px 0 8px 0; font-weight: 800; color: var(--color-purple-light); font-family: var(--font-heading);">$1</h3>');

    // Bold tags
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 800;">$1</strong>');

    // Bullet lists
    formatted = formatted.replace(/^\s*[-*]\s+(.*)$/gm, '<li style="margin-left: 14px; margin-bottom: 4px; list-style-type: disc;">$1</li>');
    formatted = formatted.replace(/(<li.*<\/li>)/g, '<ul style="margin: 6px 0; padding-left: 8px;">$1</ul>');
    formatted = formatted.replace(/<\/ul>\s*<ul style="margin: 6px 0; padding-left: 8px;">/g, ''); // combine consecutive lists

    // Markdown tables parsing
    const lines = formatted.split('\n');
    let insideTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!insideTable) {
          insideTable = true;
          tableRows = [];
        }
        // Skip separator row (e.g. |---|---|)
        if (line.includes('---') || line.includes('-|-')) {
          continue;
        }
        
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const cellTag = tableRows.length === 0 ? 'th' : 'td';
        const cellStyles = cellTag === 'th' 
          ? 'padding: 6px 10px; border-bottom: 2px solid var(--border-color); font-weight: 800; text-align: left; background: rgba(255,255,255,0.03);'
          : 'padding: 6px 10px; border-bottom: 1px solid var(--border-light); font-size: 12px;';
        
        const rowMarkup = `<tr style="border-bottom: 1px solid var(--border-light);">${cells.map(c => `<${cellTag} style="${cellStyles}">${c}</${cellTag}>`).join('')}</tr>`;
        tableRows.push(rowMarkup);
        lines[i] = ''; // clear line
      } else {
        if (insideTable) {
          insideTable = false;
          lines[i - 1] = `<div style="overflow-x:auto; margin: 10px 0;"><table style="width:100%; border-collapse:collapse; text-align:left; border:1px solid var(--border-color); border-radius: 8px;">${tableRows.join('')}</table></div>`;
        }
      }
    }
    
    formatted = lines.filter(l => l !== '').join('\n');

    // Single linebreaks
    formatted = formatted.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} style={{ lineHeight: '1.5' }} />;
  };

  // Quick prompt presets
  const suggestionPills = [
    { text: '📊 Analyze my progress', prompt: 'Gemini, please analyze my workout history since February. Identify progress curves, strengths, and areas where I have been stalled.' },
    { text: '🏋️ Deload advice / Plateaus', prompt: 'Based on my lifting history, am I plateauing on any compound movement? If so, what deload protocol do you recommend for my next workout?' },
    { text: '💪 Suggest accessories', prompt: 'Review my routines. What machine or bodyweight accessory lifts would you recommend I add, and what set/rep protocols should I follow for them?' }
  ];

  if (!apiKey) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(139, 92, 246, 0.08)', 
            border: '1.5px dashed rgba(139, 92, 246, 0.3)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-purple-light)',
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}
        >
          <Bot size={32} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
          Gym Coach Offline
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '300px', lineHeight: '1.5', marginBottom: '24px' }}>
          To unlock your personal strength coach, go to Settings and enter your free Gemini API Key. It takes less than 30 seconds!
        </p>

        <a 
          href="#settings"
          onClick={(e) => {
            e.preventDefault();
            // Programmatically trigger clicking the settings navigation tab
            const settingsBtn = document.querySelector('button[title*="Settings"]') || document.querySelectorAll('.nav-item')[2] || document.querySelectorAll('.bottom-nav button')[3];
            if (settingsBtn) (settingsBtn as HTMLButtonElement).click();
          }}
          className="btn btn-primary"
          style={{ width: 'auto', display: 'flex', gap: '8px', padding: '12px 24px' }}
        >
          Go to Settings
          <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'relative' }}>
      
      {/* Coach Header Panel */}
      <div 
        style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid var(--border-light)', 
          background: 'rgba(7, 7, 9, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-purple-bg)', 
                border: '1.5px solid rgba(139, 92, 246, 0.4)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--color-purple-light)'
              }}
            >
              <Bot size={20} />
            </div>
            {/* Pulsing Active Dot */}
            <span 
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-emerald)', 
                border: '2px solid #000000',
                display: 'block'
              }} 
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: 0 }}>
              AI Gym Coach
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--color-emerald-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Online & Ready
            </span>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              fontWeight: '700'
            }}
            title="Clear Chat Conversation"
          >
            <Trash2 size={13} style={{ color: 'var(--color-rose)' }} />
            Clear Chat
          </button>
        )}
      </div>

      {/* Main Dialogue Scroll Window */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          paddingBottom: '20px'
        }}
      >
        {chatHistory.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            <Sparkles size={32} style={{ color: 'var(--color-purple)', marginBottom: '16px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
              Ask your Strength Coach!
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '280px', lineHeight: '1.5', marginBottom: '24px' }}>
              Your coach is equipped with your complete Starting Strength history since February. Click a suggestion below or write a custom message!
            </p>

            {/* suggestion pills inside empty view */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px' }}>
              {suggestionPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(pill.prompt)}
                  className="btn btn-secondary"
                  style={{ 
                    padding: '10px 14px', 
                    fontSize: '12.5px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    textAlign: 'left',
                    borderRadius: '12px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={14} style={{ color: 'var(--color-purple-light)' }} />
                    {pill.text}
                  </span>
                  <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', maxWidth: '85%', alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  {/* Bubble Avatars */}
                  <div 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      backgroundColor: isUser ? 'rgba(255,255,255,0.05)' : 'var(--color-purple-bg)', 
                      border: `1.5px solid ${isUser ? 'var(--border-color)' : 'rgba(139, 92, 246, 0.3)'}`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: isUser ? 'var(--text-secondary)' : 'var(--color-purple-light)',
                      flexShrink: 0
                    }}
                  >
                    {isUser ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Speech Bubble */}
                  <div 
                    style={{ 
                      padding: '12px 14px', 
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      backgroundColor: isUser ? 'var(--bg-surface-elevated)' : 'rgba(139, 92, 246, 0.05)',
                      border: `1px solid ${isUser ? 'var(--border-color)' : 'rgba(139, 92, 246, 0.15)'}`,
                      color: 'var(--text-primary)',
                      fontSize: '13.5px',
                      textAlign: 'left',
                      boxShadow: isUser ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.02)'
                    }}
                  >
                    {isUser ? msg.content : renderMarkdown(msg.content)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Animated Dots Typing Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '80%', alignItems: 'flex-start' }}>
              <div 
                style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--color-purple-bg)', 
                  border: '1.5px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--color-purple-light)',
                  flexShrink: 0
                }}
              >
                <Bot size={14} />
              </div>
              <div 
                style={{ 
                  padding: '12px 18px', 
                  borderRadius: '4px 16px 16px 16px',
                  backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {/* 3 Bouncing Dots */}
                <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-purple-light)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-purple-light)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                <span className="dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-purple-light)', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Connection Error Message Banner */}
        {errorMessage && (
          <div 
            style={{ 
              alignSelf: 'center',
              padding: '10px 14px', 
              borderRadius: '10px', 
              fontSize: '12px',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              backgroundColor: 'rgba(244, 63, 94, 0.05)',
              color: 'var(--color-rose)',
              textAlign: 'center',
              maxWidth: '90%'
            }}
          >
            {errorMessage}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* suggestion pills above input bar if history exists */}
      {chatHistory.length > 0 && !isLoading && (
        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            padding: '8px 16px', 
            borderTop: '1px solid var(--border-light)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            background: 'rgba(7, 7, 9, 0.3)'
          }}
        >
          {suggestionPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(pill.prompt)}
              className="btn btn-secondary"
              style={{ 
                padding: '6px 12px', 
                fontSize: '11.5px', 
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                width: 'auto',
                minHeight: '28px',
                borderColor: 'rgba(255,255,255,0.06)'
              }}
            >
              {pill.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Form Bar */}
      <div 
        style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid var(--border-light)', 
          background: 'rgba(7, 7, 9, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            placeholder={isLoading ? 'Coach is analyzing...' : 'Ask about your plateaus, lifts, or form cues...'}
            className="text-input"
            style={{ flex: 1, padding: '10px 14px', fontSize: '13.5px' }}
            disabled={isLoading}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-icon-only"
            style={{ 
              width: '42px', 
              minHeight: '42px', 
              borderRadius: '12px', 
              backgroundColor: 'var(--color-purple)', 
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
              cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: inputText.trim() && !isLoading ? 1 : 0.6
            }}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
}
