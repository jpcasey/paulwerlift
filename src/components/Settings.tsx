import React, { useRef, useState } from 'react';
import { ToggleLeft, ToggleRight, Download, Upload, ShieldAlert, CheckCircle2, RefreshCw, Key, Eye, EyeOff, Sparkles, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  unit: 'lbs' | 'kgs';
  onToggleUnit: () => void;
  onExport: () => string;
  onImport: (jsonData: string) => { success: boolean; error?: string };
  geminiApiKey: string;
  onUpdateGeminiApiKey: (key: string) => void;
}

export default function Settings({
  unit,
  onToggleUnit,
  onExport,
  onImport,
  geminiApiKey,
  onUpdateGeminiApiKey
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  
  // Gemini key UI states
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const handleExport = () => {
    try {
      const url = onExport();
      const a = document.createElement('a');
      a.href = url;
      a.download = `paulwerlift-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = onImport(text);
      if (res.success) {
        setImportStatus({ type: 'success', message: 'Backup imported successfully! Your history has been restored.' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setImportStatus({ type: 'error', message: res.error || 'Failed to parse the backup file.' });
      }
    };
    reader.readAsText(file);
  };

  // Test the Gemini key with a simple request and provide active model diagnostics if it fails
  const testApiKeyConnection = async () => {
    if (!geminiApiKey.trim()) {
      setTestStatus({ type: 'error', message: 'Please enter a Gemini API Key first.' });
      return;
    }

    setTestStatus({ type: 'testing', message: 'Testing connection...' });

    try {
      // 1. Try a test request using gemini-2.5-flash
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello! Please reply with exactly one word: "Connected".' }] }]
        })
      });

      const data = await res.json();

      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        setTestStatus({
          type: 'success',
          message: 'Connection successful! Your personal AI Lift Coach is now fully active.'
        });
        return;
      }

      // 2. If it fails (e.g. Model Not Found 404), let's query what models are actually enabled for this key!
      setTestStatus({ type: 'testing', message: 'Querying available models for your API key...' });

      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
      
      if (listRes.ok) {
        const listData = await listRes.json();
        const availableModelNames = listData.models
          ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          ?.map((m: any) => m.name.replace('models/', '')) || [];
        
        if (availableModelNames.length > 0) {
          setTestStatus({
            type: 'error',
            message: `Model not found. Your key has access to: [ ${availableModelNames.join(', ')} ]. Please ensure you enable the Generative Language API in Google Cloud Console.`
          });
        } else {
          setTestStatus({
            type: 'error',
            message: `API key connected, but no content generation models are enabled. Available API response: ${JSON.stringify(listData)}`
          });
        }
      } else {
        const listErrData = await listRes.json().catch(() => ({}));
        const listErrMsg = listErrData.error?.message || 'Failed to list models.';
        setTestStatus({
          type: 'error',
          message: `Connection failed. Error: ${data.error?.message || 'Unknown'}. Diagnostic: ${listErrMsg}`
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: `Network error: ${err.message || 'Check your internet connection.'}`
      });
    }
  };

  return (
    <div style={{ padding: '0 20px 20px 20px', textAlign: 'left' }}>
      
      <div style={{ margin: '20px 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
          Application Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Configure units, toggle weight formats, and manage your local offline-first workout backups.
        </p>
      </div>

      {/* 1. Unit selector card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-heading)', display: 'block' }}>
            System Weight Unit
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Lifting calculations will display in {unit === 'lbs' ? 'Pounds (lbs)' : 'Kilograms (kgs)'}
          </span>
        </div>

        <button 
          onClick={onToggleUnit}
          style={{
            background: 'none',
            border: 'none',
            color: unit === 'lbs' ? 'var(--color-purple)' : 'var(--color-emerald)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title={`Switch weight unit (Current: ${unit})`}
        >
          {unit === 'lbs' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800' }}>LBS</span>
              <ToggleLeft size={36} strokeWidth={1.5} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--color-emerald)' }}>KGS</span>
              <ToggleRight size={36} strokeWidth={1.5} />
            </div>
          )}
        </button>
      </div>

      {/* 2. Gemini Coach setup card */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} style={{ color: 'var(--color-purple)' }} />
          Gemini Personal Gym Coach
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '14px', lineHeight: '1.4' }}>
          Equip your app with a hyper-contextual AI strength coach. Your logs, form cues, and notes are analyzed client-side to keep your coaching completely private and secure.
        </p>

        {/* API Key text field */}
        <div className="input-group" style={{ marginBottom: '14px' }}>
          <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Key size={11} />
            Gemini API Key
          </span>
          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              className="text-input"
              style={{ flex: 1, padding: '10px 42px 10px 12px', fontSize: '13.5px' }}
              value={geminiApiKey}
              onChange={(e) => onUpdateGeminiApiKey(e.target.value.trim())}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
              title={showApiKey ? 'Hide Key' : 'Show Key'}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Connection status tester */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}
            disabled={testStatus.type === 'testing'}
            onClick={testApiKeyConnection}
          >
            {testStatus.type === 'testing' ? 'Testing Connection...' : 'Test & Save Connection'}
          </button>
        </div>

        {/* Test Alert Banners */}
        {testStatus.type !== 'idle' && (
          <div 
            style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              borderRadius: '10px', 
              fontSize: '12px',
              border: '1px solid',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              backgroundColor: testStatus.type === 'success' 
                ? 'var(--color-emerald-bg)' 
                : testStatus.type === 'testing' 
                  ? 'var(--color-purple-bg)' 
                  : 'rgba(244, 63, 94, 0.05)',
              borderColor: testStatus.type === 'success' 
                ? 'var(--color-emerald)' 
                : testStatus.type === 'testing' 
                  ? 'var(--color-purple)' 
                  : 'rgba(244, 63, 94, 0.25)',
              color: testStatus.type === 'success' 
                ? 'var(--color-emerald-light)' 
                : testStatus.type === 'testing' 
                  ? 'var(--color-purple-light)' 
                  : 'var(--color-rose)'
            }}
          >
            {testStatus.type === 'success' ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            ) : testStatus.type === 'testing' ? (
              <RefreshCw size={16} className="spin" style={{ flexShrink: 0, animation: 'spin 1.5s linear infinite' }} />
            ) : (
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            )}
            <span>{testStatus.message}</span>
          </div>
        )}

        {/* Expandable setup instructions details card */}
        <details 
          style={{ 
            fontSize: '12.5px', 
            color: 'var(--text-secondary)', 
            borderTop: '1px solid var(--border-light)', 
            paddingTop: '12px',
            cursor: 'pointer'
          }}
        >
          <summary style={{ fontWeight: '700', color: 'var(--color-purple-light)', outline: 'none' }}>
            🔑 How to get a free API Key?
          </summary>
          <div style={{ marginTop: '8px', paddingLeft: '8px', lineHeight: '1.5', cursor: 'default' }}>
            <ol style={{ paddingLeft: '16px', margin: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-emerald-light)', textDecoration: 'underline' }}>Google AI Studio</a>.</li>
              <li>Sign in with your standard Google Account.</li>
              <li>Click **"Get API key"** in the top-left menu.</li>
              <li>Click the blue **"Create API key"** button, select **"Create API key in new project"**, and copy it!</li>
            </ol>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              *Note: The free tier allows up to 15 requests per minute, which is more than enough for workout reviews!
            </span>
          </div>
        </details>
      </div>

      {/* 3. Data management card */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-heading)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={16} style={{ color: 'var(--color-purple)' }} />
          Local Database Backups
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '20px', lineHeight: '1.4' }}>
          Since PaulwerLift is an offline-first app, all your sessions are stored securely inside Safari's local memory. To ensure you never lose your data, download a backup below!
        </p>

        {/* Action Button Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Download size={16} />
            Export Backup File (JSON)
          </button>

          <button 
            className="btn btn-outline" 
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}
          >
            <Upload size={16} />
            Import Backup File (JSON)
          </button>
          
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Backup alerts status */}
        {importStatus.type !== 'idle' && (
          <div 
            style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '10px', 
              fontSize: '12px',
              border: '1px solid',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              backgroundColor: importStatus.type === 'success' ? 'var(--color-emerald-bg)' : 'var(--color-rose-bg)',
              borderColor: importStatus.type === 'success' ? 'var(--color-emerald)' : 'var(--color-rose)',
              color: importStatus.type === 'success' ? 'var(--color-emerald-light)' : 'var(--color-rose)'
            }}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            ) : (
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Safety recommendations notice */}
      <div 
        style={{ 
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          borderRadius: '14px',
          padding: '14px',
          fontSize: '12px',
          color: 'var(--color-amber)',
          display: 'flex',
          gap: '10px'
        }}
      >
        <ShieldAlert size={18} style={{ flexShrink: 0 }} />
        <div style={{ lineHeight: '1.45' }}>
          <span style={{ fontWeight: '700', display: 'block', marginBottom: '2px' }}>PWA App Tips:</span>
          If you run into issues on iOS, simply select Safari Settings, tap "Add to Home Screen" again, and perform an export beforehand to secure your lifting statistics.
        </div>
      </div>

    </div>
  );
}
