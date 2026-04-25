import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const ITANGO_AUTH_KEY = 'itango-session-v1';

function itangoFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = '';
  try {
    const raw = sessionStorage.getItem(ITANGO_AUTH_KEY);
    if (raw) token = JSON.parse(raw).token || '';
  } catch {}
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
}

import {
  Bot, Send, Folder, ChevronRight, ChevronDown,
  Play, GitCommit, Settings, RefreshCw, CheckCircle2, AlertTriangle,
  Shield, Activity, Zap, X, Loader2, Globe, Lock,
  Cpu, Code2, BarChart3, RotateCcw, MessageSquare, Menu
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Provider = 'claude' | 'openai' | 'gemini';
type Model = { id: string; label: string; provider: Provider; description: string };
type ToolCallRecord = { tool: string; input: Record<string, unknown>; result: string; error?: boolean; ts: number };
type Message = { role: 'user' | 'assistant'; content: string; ts: number; toolCalls?: ToolCallRecord[] };
type FileNode = { name: string; path: string; type: 'file' | 'dir'; size?: number; sha?: string };
type AnalysisType = 'general' | 'seo' | 'security' | 'performance';

const MODELS: Model[] = [
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'claude', description: 'Balanced & fast' },
  { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6',   provider: 'claude', description: 'Most powerful' },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  provider: 'claude', description: 'Ultra fast' },
  { id: 'gpt-4o',            label: 'GPT-4o',            provider: 'openai', description: 'OpenAI flagship' },
  { id: 'gemini-pro',        label: 'Gemini Pro',        provider: 'gemini', description: 'Google AI' },
];

const PROVIDER_COLORS: Record<Provider, string> = {
  claude: '#c9a84c',
  openai: '#10d9a0',
  gemini: '#4fc3f7',
};

// ─── CSS-in-JS style helpers ──────────────────────────────────────────────────
const gold = '#c9a84c';
const emerald = '#10d9a0';
const bgBase = '#04040b';
const bgPanel = '#060810';
const bgCard = '#080c14';
const bgHover = 'rgba(255,255,255,0.03)';
const borderDim = 'rgba(255,255,255,0.06)';
const borderGold = `rgba(201,168,76,0.22)`;
const textPrimary = '#f0f4ff';
const textSecondary = '#6b7490';
const textMuted = '#2e3650';

// ─── Monaco language detector ─────────────────────────────────────────────────
function getMonacoLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', scss: 'scss', html: 'html', md: 'markdown',
    mdx: 'markdown', yaml: 'yaml', yml: 'yaml', py: 'python', sh: 'shell',
    sql: 'sql', prisma: 'plaintext', env: 'plaintext', txt: 'plaintext',
    xml: 'xml', svg: 'xml', toml: 'ini',
  };
  return map[ext] ?? 'plaintext';
}

// ─── File tree node ───────────────────────────────────────────────────────────
function FileTreeNode({
  node, depth, onSelect, selected, onExpand, expanded, loading,
}: {
  node: FileNode; depth: number; selected?: string; onSelect: (n: FileNode) => void;
  onExpand: (path: string) => void; expanded: Set<string>; loading: Set<string>;
}) {
  const isDir = node.type === 'dir';
  const isOpen = expanded.has(node.path);
  const isLoading = loading.has(node.path);
  const isSelected = selected === node.path;

  const getFileColor = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) return '#4fc3f7';
    if (name.endsWith('.css')) return '#c084fc';
    if (name.endsWith('.json')) return '#fb923c';
    if (name.endsWith('.md')) return '#94a3b8';
    if (name.endsWith('.js')) return '#fbbf24';
    if (name.endsWith('.html')) return '#f87171';
    return '#6b7490';
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) return '◆';
    if (name.endsWith('.css')) return '◉';
    if (name.endsWith('.json')) return '{}';
    if (name.endsWith('.md')) return '≡';
    if (name.endsWith('.js')) return '◈';
    if (name.endsWith('.html')) return '◇';
    return '·';
  };

  return (
    <div>
      <button
        onClick={() => isDir ? onExpand(node.path) : onSelect(node)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingLeft: `${10 + depth * 14}px`,
          paddingRight: '10px',
          paddingTop: '5px',
          paddingBottom: '5px',
          textAlign: 'left',
          fontSize: '11px',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          margin: '1px 4px',
          background: isSelected
            ? 'rgba(201,168,76,0.1)'
            : 'transparent',
          color: isSelected ? gold : isDir ? '#8fa0bc' : getFileColor(node.name),
          transition: 'background 0.15s, color 0.15s',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        onMouseEnter={e => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = bgHover;
        }}
        onMouseLeave={e => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {isDir ? (
          isLoading
            ? <Loader2 size={11} style={{ color: gold, flexShrink: 0 }} className="animate-spin" />
            : isOpen
              ? <ChevronDown size={11} style={{ color: '#4a5568', flexShrink: 0 }} />
              : <ChevronRight size={11} style={{ color: '#4a5568', flexShrink: 0 }} />
        ) : (
          <span style={{ fontSize: '9px', flexShrink: 0, minWidth: '12px', textAlign: 'center', fontWeight: 700, color: getFileColor(node.name) }}>
            {getFileIcon(node.name)}
          </span>
        )}
        {isDir ? (
          <Folder size={11} style={{ flexShrink: 0, color: isOpen ? gold : '#5a6880' }} />
        ) : null}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, letterSpacing: '0.01em' }}>
          {node.name}
        </span>
        {isSelected && (
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: gold, flexShrink: 0 }} />
        )}
      </button>
    </div>
  );
}

// ─── Markdown message renderer ────────────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const lang = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return (
            <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(79,195,247,0.15)' }}>
              {lang && (
                <div style={{
                  padding: '5px 12px',
                  background: 'rgba(79,195,247,0.08)',
                  fontSize: '10px',
                  color: '#4fc3f7',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                }}>
                  {lang}
                </div>
              )}
              <pre style={{
                margin: 0,
                padding: '12px 14px',
                background: '#020408',
                color: '#e6edf3',
                fontSize: '11px',
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                overflowX: 'auto',
                lineHeight: '1.65',
              }}>
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return (
          <p key={i} style={{
            fontSize: '13px',
            lineHeight: '1.7',
            color: '#c8d0e0',
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}>
            {part}
          </p>
        );
      })}
    </div>
  );
}

// ─── Tool activity strip ──────────────────────────────────────────────────────
function ToolActivityStrip({ toolCalls }: { toolCalls: ToolCallRecord[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!toolCalls.length) return null;

  const toolIcon = (name: string) => {
    switch (name) {
      case 'list_files':   return '📁';
      case 'read_file':    return '📄';
      case 'write_file':   return '✏️';
      case 'search_code':  return '🔍';
      case 'get_repo_info': return 'ℹ️';
      default:             return '⚙️';
    }
  };

  const toolLabel = (tc: ToolCallRecord) => {
    if (tc.error) {
      switch (tc.tool) {
        case 'list_files':  return `Failed: list ${(tc.input.path as string) || 'root'}`;
        case 'read_file':   return `Failed: read ${tc.input.path}`;
        case 'write_file':  return `Failed: write ${tc.input.path}`;
        case 'search_code': return `Failed: search "${tc.input.query}"`;
        default:            return `Failed: ${tc.tool}`;
      }
    }
    switch (tc.tool) {
      case 'list_files':   return `Listed ${(tc.input.path as string) || 'repo root'}`;
      case 'read_file':    return `Read ${tc.input.path}`;
      case 'write_file':   return `Committed ${tc.input.path}`;
      case 'search_code':  return `Searched "${tc.input.query}"`;
      case 'get_repo_info': return 'Got repo info';
      default:             return tc.tool;
    }
  };

  return (
    <div style={{
      marginBottom: '10px',
      borderRadius: '8px',
      border: '1px solid rgba(79,195,247,0.12)',
      background: 'rgba(79,195,247,0.04)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 10px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Zap size={11} style={{ color: '#4fc3f7', flexShrink: 0 }} />
        <span style={{ fontSize: '10px', color: '#4fc3f7', fontWeight: 600, letterSpacing: '0.06em', flex: 1 }}>
          {toolCalls.length} TOOL CALL{toolCalls.length > 1 ? 'S' : ''}
          {' · '}
          {toolCalls.filter(t => !t.error).length} succeeded
          {toolCalls.some(t => t.error) ? `, ${toolCalls.filter(t => t.error).length} failed` : ''}
        </span>
        <span style={{ fontSize: '10px', color: '#4fc3f7', opacity: 0.6 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Compact pill row — always visible */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '0 10px 8px' }}>
        {toolCalls.map((tc, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '20px', fontSize: '10px',
            background: tc.error ? 'rgba(239,68,68,0.1)' : 'rgba(16,217,160,0.08)',
            border: `1px solid ${tc.error ? 'rgba(239,68,68,0.2)' : 'rgba(16,217,160,0.18)'}`,
            color: tc.error ? '#f87171' : '#34d399',
          }}>
            <span>{toolIcon(tc.tool)}</span>
            <span>{toolLabel(tc)}</span>
          </span>
        ))}
      </div>

      {/* Expanded detail view */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(79,195,247,0.1)',
          padding: '8px 10px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {toolCalls.map((tc, i) => (
            <div key={i} style={{ fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span>{toolIcon(tc.tool)}</span>
                <span style={{ color: '#4fc3f7', fontWeight: 600 }}>{tc.tool}</span>
                <span style={{ color: textSecondary, fontSize: '10px' }}>
                  {JSON.stringify(tc.input).slice(0, 80)}
                </span>
              </div>
              <pre style={{
                margin: 0, padding: '6px 8px', borderRadius: '6px',
                background: 'rgba(0,0,0,0.4)',
                color: tc.error ? '#f87171' : '#94a3b8',
                fontSize: '10px', fontFamily: 'monospace',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: '80px', overflowY: 'auto',
                border: `1px solid ${tc.error ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
              }}>
                {tc.result}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Commit modal ─────────────────────────────────────────────────────────────
function CommitModal({ filePath, onConfirm, onCancel, loading }: {
  filePath: string; onConfirm: (msg: string) => void; onCancel: () => void; loading: boolean;
}) {
  const [msg, setMsg] = useState('iTango AI: update file');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,3,10,0.85)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        borderRadius: '16px',
        padding: '28px',
        maxWidth: '440px',
        width: 'calc(100% - 32px)',
        background: 'linear-gradient(135deg, #09101e 0%, #060c18 100%)',
        border: `1px solid ${borderGold}`,
        boxShadow: `0 0 60px rgba(201,168,76,0.08), 0 24px 48px rgba(0,0,0,0.6)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
            background: 'rgba(201,168,76,0.1)',
            border: `1px solid rgba(201,168,76,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitCommit size={20} style={{ color: gold }} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, letterSpacing: '0.01em' }}>
              Commit Changes
            </div>
            <div style={{ fontSize: '11px', color: textSecondary, marginTop: '2px' }}>
              Push to GitHub and deploy
            </div>
          </div>
        </div>

        <div style={{
          padding: '12px 14px',
          borderRadius: '8px',
          background: 'rgba(201,168,76,0.05)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7490', marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
            Target file
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: gold }}>
            {filePath}
          </div>
        </div>

        <div style={{
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(251,146,60,0.05)',
          border: '1px solid rgba(251,146,60,0.15)',
          fontSize: '11px',
          color: '#c9a84c',
          lineHeight: '1.5',
        }}>
          ⚠ Changes will affect <strong>mayobebros.com</strong> once deployed. Review carefully.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', color: textSecondary, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
            Commit message
          </label>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#030509',
              border: `1px solid ${borderDim}`,
              color: textPrimary,
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
            placeholder="Describe your changes..."
            onFocus={e => (e.target.style.border = `1px solid ${borderGold}`)}
            onBlur={e => (e.target.style.border = `1px solid ${borderDim}`)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: textSecondary, fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(msg)}
            disabled={loading || !msg.trim()}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              background: loading ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.18)',
              border: `1px solid ${loading ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.4)'}`,
              color: gold, fontSize: '13px', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <GitCommit size={14} />}
            {loading ? 'Committing…' : 'Commit & Push'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<any>(null);
  const [keys, setKeys] = useState<Record<string, string>>({ claude: '', openai: '', gemini: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    itangoFetch('/api/itango/settings', { credentials: 'include' })
      .then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  const saveKey = async (provider: string) => {
    setSaving(true);
    await itangoFetch('/api/itango/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey: keys[provider] }),
    });
    setSaving(false); setSaved(provider);
    setTimeout(() => setSaved(''), 2000);
  };

  const setActive = async (provider: string) => {
    await itangoFetch('/api/itango/settings', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setActive: provider }),
    });
    setSettings((s: any) => s ? { ...s, activeProvider: provider } : s);
  };

  const providers = [
    { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-api03-...', color: '#c9a84c' },
    { id: 'openai', label: 'OpenAI GPT', placeholder: 'sk-proj-...', color: '#10d9a0' },
    { id: 'gemini', label: 'Google Gemini', placeholder: 'AIzaSy...', color: '#4fc3f7' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,3,10,0.88)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        borderRadius: '18px',
        padding: '28px',
        maxWidth: '500px',
        width: 'calc(100% - 32px)',
        background: 'linear-gradient(135deg, #09101e 0%, #060c18 100%)',
        border: `1px solid ${borderGold}`,
        boxShadow: `0 0 80px rgba(201,168,76,0.06), 0 32px 64px rgba(0,0,0,0.7)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(201,168,76,0.1)',
              border: `1px solid rgba(201,168,76,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings size={17} style={{ color: gold }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>AI Engine Settings</div>
              <div style={{ fontSize: '11px', color: textSecondary }}>Configure providers & integrations</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#404a60', lineHeight: '1.5' }}>
          API keys are stored securely in server memory and .env file. They are never exposed to the browser.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {providers.map(p => (
            <div key={p.id} style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${settings?.activeProvider === p.id ? p.color + '33' : borderDim}`,
              transition: 'border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}44` }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{p.label}</span>
                  {settings?.providers?.[p.id]?.configured && (
                    <span style={{
                      fontSize: '9px', padding: '2px 7px', borderRadius: '20px',
                      background: 'rgba(16,217,160,0.1)',
                      border: '1px solid rgba(16,217,160,0.25)',
                      color: emerald, fontWeight: 700, letterSpacing: '0.08em',
                    }}>CONFIGURED</span>
                  )}
                </div>
                {settings?.activeProvider !== p.id ? (
                  <button
                    onClick={() => setActive(p.id)}
                    style={{
                      fontSize: '11px', padding: '4px 12px', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: textSecondary, cursor: 'pointer', fontWeight: 500,
                    }}
                  >Set Active</button>
                ) : (
                  <span style={{
                    fontSize: '10px', padding: '3px 10px', borderRadius: '20px',
                    background: p.color + '18',
                    border: `1px solid ${p.color}33`,
                    color: p.color, fontWeight: 700, letterSpacing: '0.08em',
                  }}>ACTIVE</span>
                )}
              </div>
              {settings?.providers?.[p.id]?.keyHint && (
                <div style={{ fontSize: '11px', color: textMuted, fontFamily: 'monospace' }}>
                  Current: {settings.providers[p.id].keyHint}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  placeholder={p.placeholder}
                  value={keys[p.id]}
                  onChange={e => setKeys(k => ({ ...k, [p.id]: e.target.value }))}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: '7px',
                    fontSize: '11px', fontFamily: 'monospace',
                    background: '#030509',
                    border: `1px solid ${borderDim}`,
                    color: textPrimary, outline: 'none',
                  }}
                  onFocus={e => (e.target.style.border = `1px solid ${p.color}44`)}
                  onBlur={e => (e.target.style.border = `1px solid ${borderDim}`)}
                />
                <button
                  onClick={() => saveKey(p.id)}
                  disabled={saving || !keys[p.id]}
                  style={{
                    padding: '8px 14px', borderRadius: '7px',
                    fontSize: '12px', fontWeight: 700,
                    background: saved === p.id ? 'rgba(16,217,160,0.12)' : `${p.color}18`,
                    border: `1px solid ${saved === p.id ? 'rgba(16,217,160,0.3)' : p.color + '33'}`,
                    color: saved === p.id ? emerald : p.color,
                    cursor: saving || !keys[p.id] ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {saved === p.id ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '14px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${borderDim}`,
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={11} /> Integrations
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'GitHub', value: settings?.github?.repo || 'not set', ok: settings?.github?.configured },
              { label: 'Vercel', value: settings?.vercel?.configured ? 'connected' : 'not set', ok: settings?.vercel?.configured },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.ok ? emerald : '#ef4444', flexShrink: 0 }} />
                <span style={{ color: textSecondary }}>{item.label}:</span>
                <span style={{ color: item.ok ? '#8fa0bc' : '#4a3535', fontFamily: 'monospace', fontSize: '10px' }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: textMuted, marginTop: '8px' }}>
            Set GITHUB_TOKEN, VERCEL_TOKEN, VERCEL_PROJECT_ID in your .env file
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ITangoEditorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem(ITANGO_AUTH_KEY);
    if (!raw) { navigate('/itango-login', { replace: true }); return; }
    try {
      const { exp, token } = JSON.parse(raw);
      if (Date.now() >= exp || !token) {
        sessionStorage.removeItem(ITANGO_AUTH_KEY);
        navigate('/itango-login', { replace: true });
      }
    } catch {
      sessionStorage.removeItem(ITANGO_AUTH_KEY);
      navigate('/itango-login', { replace: true });
    }
  }, [navigate]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `iTango AI Website Editor is online.\n\nI have full access to your Mayobe Bros codebase. I can:\n• Read and analyze any file\n• Suggest and write code improvements\n• Fix bugs and optimize performance\n• Improve SEO and content structure\n\nSelect a file from the tree on the left, or ask me anything about your website.`,
    ts: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

  // File tree state
  const [treeRoot, setTreeRoot] = useState<FileNode[]>([]);
  const [treeChildren, setTreeChildren] = useState<Record<string, FileNode[]>>({});
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src']));
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSha, setFileSha] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // UI state
  const [rightTab, setRightTab] = useState<'editor' | 'preview' | 'activity'>('editor');
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState('https://www.mayobebros.com');
  const [previewInput, setPreviewInput] = useState('https://www.mayobebros.com');
  const [deployments, setDeployments] = useState<any[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Repo/branch state
  const [repos, setRepos] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showRepoPanel, setShowRepoPanel] = useState(false);
  const [reposLoading, setReposLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Responsive breakpoints ────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  const [mobileTab, setMobileTab] = useState<'chat' | 'editor' | 'files'>('chat');
  const [showFileTree, setShowFileTree] = useState(false); // tablet: toggled via header button

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    itangoFetch('/api/itango/files', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setTreeRoot(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (rightTab === 'activity') {
      itangoFetch('/api/itango/activity', { credentials: 'include' })
        .then(r => r.json()).then(d => setActivityLog(d.log || [])).catch(() => {});
    }
    if (rightTab === 'preview') {
      setDeploymentsLoading(true);
      itangoFetch('/api/itango/deployments', { credentials: 'include' })
        .then(r => r.json()).then(d => setDeployments(d.deployments || [])).catch(() => {})
        .finally(() => setDeploymentsLoading(false));
    }
  }, [rightTab]);

  const loadRepos = async () => {
    setReposLoading(true);
    try {
      const res = await itangoFetch('/api/itango/repos', { credentials: 'include' });
      const d = await res.json();
      setRepos(d.repos || []);
    } finally {
      setReposLoading(false);
    }
  };

  const loadBranches = async (repo: string) => {
    const res = await itangoFetch(`/api/itango/branches?repo=${encodeURIComponent(repo)}`, { credentials: 'include' });
    const d = await res.json();
    setBranches(d.branches || []);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDir = async (path: string) => {
    if (treeChildren[path]) {
      setExpandedDirs(prev => {
        const next = new Set(prev);
        next.has(path) ? next.delete(path) : next.add(path);
        return next;
      });
      return;
    }
    setLoadingDirs(prev => new Set(prev).add(path));
    try {
      const res = await itangoFetch(`/api/itango/files?path=${encodeURIComponent(path)}`, { credentials: 'include' });
      const d = await res.json();
      setTreeChildren(prev => ({ ...prev, [path]: d.items || [] }));
      setExpandedDirs(prev => new Set(prev).add(path));
    } finally {
      setLoadingDirs(prev => { const n = new Set(prev); n.delete(path); return n; });
    }
  };

  const loadFile = async (node: FileNode) => {
    setSelectedFile(node);
    setFileLoading(true);
    try {
      const res = await itangoFetch(`/api/itango/file?path=${encodeURIComponent(node.path)}`, { credentials: 'include' });
      const d = await res.json();
      if (d.error) { showToast(d.error, 'error'); return; }
      setFileContent(d.content);
      setEditedContent(d.content);
      setFileSha(d.sha);
      setIsDirty(false);
      setRightTab('editor');
    } finally {
      setFileLoading(false);
    }
  };

  const handleAnalyze = async (type: AnalysisType) => {
    if (!selectedFile || !fileContent) return;
    setAnalysisLoading(true);
    const prompt = `Analyze ${selectedFile.path} (${type} review):\n\n\`\`\`\n${fileContent.slice(0, 6000)}\n\`\`\``;
    await sendMessage(prompt, true);
    setAnalysisLoading(false);
  };

  const sendMessage = useCallback(async (overrideInput?: string, skipAppend?: boolean) => {
    const text = (overrideInput ?? input).trim();
    if (!text || streaming) return;
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    if (!skipAppend) setMessages(newMessages);
    else setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', ts: Date.now() }]);
    try {
      const context = selectedFile
        ? `File: ${selectedFile.path}\nContent (first 1500 chars):\n${fileContent.slice(0, 1500)}`
        : '';
      const res = await itangoFetch('/api/itango/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel.id,
          systemContext: context,
        }),
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status} — non-JSON response` }));
      if (!res.ok || data.error) {
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem(ITANGO_AUTH_KEY);
          setMessages(prev => prev.slice(0, -1).concat({ role: 'assistant', content: 'Session expired. Redirecting to login…', ts: Date.now() }));
          setTimeout(() => { window.location.href = '/itango-login'; }, 1800);
          return;
        }
        setMessages(prev => prev.slice(0, -1).concat({ role: 'assistant', content: `Error: ${data.error || `Server error (${res.status})`}`, ts: Date.now() }));
        return;
      }
      const reply: string = data.reply || '(empty response)';
      const toolCalls: ToolCallRecord[] = data.toolCalls || [];
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: reply, toolCalls };
        return copy;
      });
    } catch (err: any) {
      setMessages(prev => prev.slice(0, -1).concat({ role: 'assistant', content: `Network error: ${err.message}`, ts: Date.now() }));
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, selectedModel, selectedFile, fileContent]);

  const handleCommit = async (commitMessage: string) => {
    if (!selectedFile) return;
    setCommitLoading(true);
    try {
      const res = await itangoFetch('/api/itango/commit', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path, content: editedContent, message: commitMessage, sha: fileSha }),
      });
      const d = await res.json();
      if (d.error) { showToast(d.error, 'error'); return; }
      setFileContent(editedContent);
      setIsDirty(false);
      setShowCommitModal(false);
      // Update SHA so a second commit to the same file doesn't get a 409 conflict
      if (d.sha) setFileSha(d.sha);
      showToast('Changes committed to GitHub');
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDeploy = async (target: 'preview' | 'production') => {
    setDeployLoading(true);
    try {
      const res = await itangoFetch('/api/itango/deploy', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const d = await res.json();
      if (d.error) { showToast(d.error, 'error'); return; }
      showToast(`Deployment triggered${d.url ? ` → ${d.url}` : ''}`);
      if (d.url) {
        setPreviewUrl(d.url);
        setPreviewInput(d.url);
        setRightTab('preview');
      }
    } finally {
      setDeployLoading(false);
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0): JSX.Element[] =>
    nodes.flatMap(node => [
      <FileTreeNode
        key={node.path}
        node={node}
        depth={depth}
        selected={selectedFile?.path}
        onSelect={loadFile}
        onExpand={loadDir}
        expanded={expandedDirs}
        loading={loadingDirs}
      />,
      ...(node.type === 'dir' && expandedDirs.has(node.path) && treeChildren[node.path]
        ? renderTree(treeChildren[node.path], depth + 1)
        : []),
    ]);

  const quickPrompts = [
    'What files handle authentication?',
    'Suggest SEO improvements for the homepage',
    'Find performance bottlenecks in the codebase',
    'How can I improve the mobile experience?',
    'Show me how routing works in this project',
  ];

  return (
    <div style={{
      background: bgBase,
      minHeight: '100vh',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── LUXURY HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        height: isMobile ? '48px' : '56px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 20px',
        gap: isMobile ? '8px' : '12px',
        background: 'linear-gradient(90deg, #05060f 0%, #080c1a 50%, #05060f 100%)',
        borderBottom: `1px solid ${borderGold}`,
        boxShadow: `0 1px 30px rgba(201,168,76,0.05)`,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Tablet: file tree toggle */}
          {isTablet && !isMobile && (
            <button
              onClick={() => setShowFileTree(v => !v)}
              title="Toggle file tree"
              style={{
                width: '32px', height: '32px', borderRadius: '7px',
                background: showFileTree ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showFileTree ? borderGold : borderDim}`,
                color: showFileTree ? gold : textSecondary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Menu size={14} />
            </button>
          )}
          <div style={{
            width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.04) 100%)',
            border: `1px solid rgba(201,168,76,0.35)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 24px rgba(201,168,76,0.12), inset 0 1px 0 rgba(201,168,76,0.15)`,
          }}>
            <Cpu size={isMobile ? 14 : 17} style={{ color: gold }} />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 800, color: textPrimary, letterSpacing: '0.02em', lineHeight: 1.2 }}>
              iTango <span style={{ color: gold, fontWeight: 700 }}>AI</span>
            </div>
            {!isMobile && (
              <div style={{ fontSize: '9px', color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                Website Editor
              </div>
            )}
          </div>
          {/* Live badge — hide on mobile */}
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(16,217,160,0.06)',
              border: '1px solid rgba(16,217,160,0.2)',
            }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: emerald,
                boxShadow: `0 0 6px ${emerald}`,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: emerald, letterSpacing: '0.12em' }}>LIVE</span>
            </div>
          )}
        </div>

        {/* Divider — hide on mobile */}
        {!isMobile && <div style={{ width: '1px', height: '24px', background: borderDim, margin: '0 4px' }} />}

        {/* File path breadcrumb — hide on mobile */}
        {!isMobile && selectedFile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '6px',
            background: 'rgba(79,195,247,0.06)',
            border: '1px solid rgba(79,195,247,0.12)',
            maxWidth: isTablet ? '160px' : '300px',
            overflow: 'hidden',
          }}>
            <Code2 size={11} style={{ color: '#4fc3f7', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4fc3f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFile.path}
            </span>
            {isDirty && (
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fb923c', flexShrink: 0 }} />
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Model selector — always visible but compact on mobile */}
        <select
          value={selectedModel.id}
          onChange={e => setSelectedModel(MODELS.find(m => m.id === e.target.value) || MODELS[0])}
          style={{
            padding: isMobile ? '5px 8px' : '6px 12px',
            borderRadius: '8px',
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: 600,
            background: '#080c14',
            border: `1px solid ${PROVIDER_COLORS[selectedModel.provider]}33`,
            color: PROVIDER_COLORS[selectedModel.provider],
            outline: 'none',
            cursor: 'pointer',
            maxWidth: isMobile ? '120px' : 'none',
          }}
        >
          {MODELS.map(m => (
            <option key={m.id} value={m.id}>{isMobile ? m.label.split(' ').slice(0, 2).join(' ') : m.label}</option>
          ))}
        </select>

        {/* Deploy preview — hidden on mobile */}
        {!isMobile && (
          <button
            onClick={() => handleDeploy('preview')}
            disabled={deployLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600,
              background: 'rgba(201,168,76,0.08)',
              border: `1px solid rgba(201,168,76,0.2)`,
              color: gold, cursor: deployLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'; }}
          >
            {deployLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {!isTablet && 'Deploy Preview'}
          </button>
        )}

        {/* Deploy production — hidden on mobile */}
        {!isMobile && (
          <button
            onClick={() => {
              if (confirm('Deploy to PRODUCTION? This will update the live website immediately.')) {
                handleDeploy('production');
              }
            }}
            disabled={deployLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', cursor: deployLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <Lock size={12} />
            {!isTablet && ' Production'}
          </button>
        )}

        {/* Settings — always visible */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            width: isMobile ? '30px' : '34px', height: isMobile ? '30px' : '34px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${borderDim}`,
            color: textSecondary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = textPrimary; (e.currentTarget as HTMLElement).style.borderColor = borderGold; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = textSecondary; (e.currentTarget as HTMLElement).style.borderColor = borderDim; }}
        >
          <Settings size={14} />
        </button>
      </header>

      {/* ── 3-COLUMN LAYOUT ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', paddingBottom: isMobile ? '56px' : 0 }}>

        {/* ── LEFT: File Tree ──────────────────────────────────────────────────── */}
        <aside style={{
          width: '210px',
          flexShrink: 0,
          display: isMobile
            ? (mobileTab === 'files' ? 'flex' : 'none')
            : isTablet
              ? (showFileTree ? 'flex' : 'none')
              : 'flex',
          flexDirection: 'column',
          background: bgPanel,
          borderRight: `1px solid ${borderDim}`,
          overflow: 'hidden',
          // On mobile/tablet, file tree takes full available space
          flex: (isMobile || (isTablet && showFileTree)) ? '1 1 0' : undefined,
        }}>
          {/* Tree header */}
          <div style={{
            padding: '10px 12px 8px',
            borderBottom: `1px solid ${borderDim}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Folder size={12} style={{ color: gold }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Repository
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => {
                    setShowRepoPanel(v => !v);
                    if (!repos.length) loadRepos();
                  }}
                  title="Switch repository / branch"
                  style={{
                    width: '22px', height: '22px', borderRadius: '5px',
                    background: showRepoPanel ? 'rgba(201,168,76,0.1)' : 'transparent',
                    border: showRepoPanel ? `1px solid ${borderGold}` : 'none',
                    color: showRepoPanel ? gold : textMuted, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = gold; }}
                  onMouseLeave={e => { if (!showRepoPanel) (e.currentTarget as HTMLElement).style.color = textMuted; }}
                >
                  <BarChart3 size={11} />
                </button>
                <button
                  onClick={() => {
                    itangoFetch('/api/itango/files', { credentials: 'include' })
                      .then(r => r.json()).then(d => setTreeRoot(d.items || [])).catch(() => {});
                  }}
                  style={{
                    width: '22px', height: '22px', borderRadius: '5px',
                    background: 'transparent', border: 'none',
                    color: textMuted, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Refresh file tree"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = textSecondary; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = textMuted; }}
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>

            {/* Repo/Branch panel */}
            {showRepoPanel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {reposLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0' }}>
                    <Loader2 size={11} className="animate-spin" style={{ color: textMuted }} />
                    <span style={{ fontSize: '10px', color: textMuted }}>Loading repos…</span>
                  </div>
                ) : repos.length === 0 ? (
                  <button
                    onClick={loadRepos}
                    style={{
                      fontSize: '10px', padding: '4px 8px', borderRadius: '5px',
                      background: 'rgba(201,168,76,0.08)', border: `1px solid ${borderGold}`,
                      color: gold, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    Load GitHub repos
                  </button>
                ) : (
                  <select
                    onChange={async e => {
                      const repo = e.target.value;
                      if (!repo) return;
                      await loadBranches(repo);
                      setTreeChildren({});
                      setExpandedDirs(new Set());
                      setSelectedFile(null);
                    }}
                    style={{
                      width: '100%', padding: '5px 8px', borderRadius: '6px',
                      fontSize: '10px', background: '#030509',
                      border: `1px solid ${borderDim}`, color: textPrimary, outline: 'none',
                    }}
                  >
                    <option value="">Select repo…</option>
                    {repos.map((r: any) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                )}
                {branches.length > 0 && (
                  <select
                    style={{
                      width: '100%', padding: '5px 8px', borderRadius: '6px',
                      fontSize: '10px', background: '#030509',
                      border: `1px solid ${borderDim}`, color: textPrimary, outline: 'none',
                    }}
                  >
                    {branches.map((b: any) => (
                      <option key={b.sha} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Tree content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {treeRoot.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Folder size={22} style={{ color: textMuted, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '11px', color: textMuted, lineHeight: '1.5' }}>
                  Add GITHUB_TOKEN to .env to browse files
                </p>
              </div>
            ) : renderTree(treeRoot)}
          </div>
        </aside>

        {/* ── CENTER: Chat Interface ───────────────────────────────────────────── */}
        <main style={{
          flex: isMobile ? '1 1 0' : isTablet ? '6 1 0' : '1 1 0',
          minWidth: 0,
          display: isMobile ? (mobileTab === 'chat' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          background: bgBase,
          borderRight: `1px solid ${borderDim}`,
        }}>
          {/* Chat header */}
          <div style={{
            height: '44px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '10px',
            borderBottom: `1px solid ${borderDim}`,
            background: bgPanel,
          }}>
            <Bot size={14} style={{ color: gold }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary, letterSpacing: '0.02em' }}>
              AI Assistant
            </span>
            <div style={{
              padding: '2px 8px', borderRadius: '20px',
              background: `${PROVIDER_COLORS[selectedModel.provider]}12`,
              border: `1px solid ${PROVIDER_COLORS[selectedModel.provider]}25`,
              fontSize: '10px', fontWeight: 600,
              color: PROVIDER_COLORS[selectedModel.provider],
              letterSpacing: '0.05em',
            }}>
              {selectedModel.label}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                    background: 'rgba(201,168,76,0.1)',
                    border: `1px solid rgba(201,168,76,0.2)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: '10px', marginTop: '2px',
                  }}>
                    <Bot size={13} style={{ color: gold }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '86%',
                  padding: m.role === 'user' ? '10px 14px' : '12px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  background: m.role === 'user'
                    ? 'rgba(201,168,76,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  border: m.role === 'user'
                    ? `1px solid rgba(201,168,76,0.22)`
                    : `1px solid ${borderDim}`,
                }}>
                  {m.role === 'assistant' && i === messages.length - 1 && streaming && !m.content ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 2px' }}>
                      {[0, 1, 2].map(j => (
                        <div key={j} style={{
                          width: '6px', height: '6px', borderRadius: '50%', background: gold,
                          animation: 'bounce 1.2s infinite',
                          animationDelay: `${j * 0.18}s`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      {m.toolCalls && m.toolCalls.length > 0 && (
                        <ToolActivityStrip toolCalls={m.toolCalls} />
                      )}
                      <MessageContent content={m.content} />
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts — shown only on first message */}
          {messages.length === 1 && (
            <div style={{ padding: '0 18px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                Quick prompts
              </div>
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  style={{
                    textAlign: 'left', padding: '8px 12px', borderRadius: '8px',
                    fontSize: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${borderDim}`,
                    color: textSecondary, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = borderGold;
                    (e.currentTarget as HTMLElement).style.color = gold;
                    (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = borderDim;
                    (e.currentTarget as HTMLElement).style.color = textSecondary;
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '14px 16px',
            borderTop: `1px solid ${borderDim}`,
            background: bgPanel,
          }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              padding: '10px 12px',
              borderRadius: '12px',
              background: bgCard,
              border: `1px solid ${borderDim}`,
              transition: 'border-color 0.2s',
            }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = borderGold; }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = borderDim; }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask iTango anything…"
                rows={2}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '13px',
                  color: textPrimary,
                  lineHeight: '1.6',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: !input.trim() || streaming ? 'rgba(201,168,76,0.08)' : gold,
                  border: `1px solid ${!input.trim() || streaming ? borderGold : gold}`,
                  color: !input.trim() || streaming ? 'rgba(201,168,76,0.5)' : '#050507',
                  cursor: !input.trim() || streaming ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
            <div style={{ fontSize: '10px', color: textMuted, marginTop: '6px', textAlign: 'center' }}>
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </main>

        {/* ── RIGHT: Editor / Preview / Activity ──────────────────────────────── */}
        <section style={{
          flex: isMobile ? '1 1 0' : isTablet ? '4 1 0' : '1.3 1 0',
          minWidth: 0,
          display: isMobile ? (mobileTab === 'editor' ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          background: bgPanel,
        }}>
          {/* Tab bar */}
          <div style={{
            height: '44px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'stretch',
            borderBottom: `1px solid ${borderDim}`,
            background: bgCard,
          }}>
            {[
              { id: 'editor', label: 'Code Editor', Icon: Code2 },
              { id: 'preview', label: 'Live Preview', Icon: Globe },
              { id: 'activity', label: 'Activity', Icon: Activity },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '0 18px',
                  fontSize: '12px', fontWeight: 600,
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: rightTab === tab.id ? textPrimary : textSecondary,
                  borderBottom: rightTab === tab.id ? `2px solid ${gold}` : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (rightTab !== tab.id) (e.currentTarget as HTMLElement).style.color = '#a0b0c8'; }}
                onMouseLeave={e => { if (rightTab !== tab.id) (e.currentTarget as HTMLElement).style.color = textSecondary; }}
              >
                <tab.Icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── EDITOR ── */}
          {rightTab === 'editor' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!selectedFile ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '12px',
                }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '16px',
                    background: 'rgba(201,168,76,0.06)',
                    border: `1px solid ${borderGold}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Code2 size={26} style={{ color: 'rgba(201,168,76,0.4)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, margin: '0 0 4px' }}>
                      No file selected
                    </p>
                    <p style={{ fontSize: '12px', color: textMuted, margin: 0 }}>
                      Choose a file from the tree to start editing
                    </p>
                  </div>
                </div>
              ) : fileLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Loader2 size={24} style={{ color: gold }} className="animate-spin" />
                    <span style={{ fontSize: '12px', color: textSecondary }}>Loading file…</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Analysis + action toolbar */}
                  <div style={{
                    padding: '8px 14px',
                    borderBottom: `1px solid ${borderDim}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: bgCard,
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '10px', color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginRight: '2px' }}>
                      Analyze:
                    </span>
                    {(['general', 'seo', 'security', 'performance'] as AnalysisType[]).map(t => {
                      const icons: Record<AnalysisType, string> = { general: '⌕', seo: '↗', security: '⛨', performance: '⚡' };
                      return (
                        <button
                          key={t}
                          onClick={() => handleAnalyze(t)}
                          disabled={analysisLoading}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '4px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${borderDim}`,
                            color: textSecondary, cursor: analysisLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = gold;
                            (e.currentTarget as HTMLElement).style.borderColor = borderGold;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = textSecondary;
                            (e.currentTarget as HTMLElement).style.borderColor = borderDim;
                          }}
                        >
                          {analysisLoading && <Loader2 size={9} className="animate-spin" />}
                          {icons[t]} {t}
                        </button>
                      );
                    })}
                    <div style={{ flex: 1 }} />
                    {isDirty && (
                      <button
                        onClick={() => { setEditedContent(fileContent); setIsDirty(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', borderRadius: '6px',
                          fontSize: '11px', fontWeight: 600,
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${borderDim}`,
                          color: textSecondary, cursor: 'pointer',
                        }}
                        title="Discard changes"
                      >
                        <RotateCcw size={10} /> Reset
                      </button>
                    )}
                    <button
                      onClick={() => setShowCommitModal(true)}
                      disabled={!isDirty}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 14px', borderRadius: '7px',
                        fontSize: '12px', fontWeight: 700,
                        background: isDirty ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isDirty ? 'rgba(201,168,76,0.35)' : borderDim}`,
                        color: isDirty ? gold : textMuted,
                        cursor: isDirty ? 'pointer' : 'not-allowed',
                        transition: 'all 0.15s',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <GitCommit size={11} />
                      Commit
                      {isDirty && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fb923c' }} />}
                    </button>
                  </div>

                  {/* Monaco Code Editor */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Editor
                      height="100%"
                      language={getMonacoLanguage(selectedFile?.name ?? '')}
                      value={editedContent}
                      onChange={val => {
                        const v = val ?? '';
                        setEditedContent(v);
                        setIsDirty(v !== fileContent);
                      }}
                      theme="vs-dark"
                      options={{
                        fontSize: 13,
                        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                        fontLigatures: true,
                        lineHeight: 1.65,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        tabSize: 2,
                        insertSpaces: true,
                        automaticLayout: true,
                        padding: { top: 14, bottom: 14 },
                        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                        renderLineHighlight: 'gutter',
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true },
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PREVIEW ── */}
          {rightTab === 'preview' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* URL bar */}
              <div style={{
                padding: '8px 10px',
                borderBottom: `1px solid ${borderDim}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: bgCard,
                flexShrink: 0,
              }}>
                <Globe size={12} style={{ color: '#4fc3f7', flexShrink: 0 }} />
                <input
                  value={previewInput}
                  onChange={e => setPreviewInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') setPreviewUrl(previewInput); }}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${borderDim}`, borderRadius: '6px',
                    padding: '4px 10px', fontSize: '11px', fontFamily: 'monospace',
                    color: textSecondary, outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(79,195,247,0.4)')}
                  onBlur={e => (e.target.style.borderColor = borderDim)}
                  placeholder="https://..."
                />
                <button
                  onClick={() => setPreviewUrl(previewInput)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: 600,
                    background: 'rgba(79,195,247,0.08)',
                    border: '1px solid rgba(79,195,247,0.2)',
                    color: '#4fc3f7', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <Play size={9} /> Go
                </button>
                <button
                  onClick={() => { if (iframeRef.current) iframeRef.current.src = previewUrl; }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '6px',
                    fontSize: '11px', fontWeight: 600,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${borderDim}`,
                    color: textSecondary, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <RefreshCw size={10} />
                </button>
              </div>

              {/* Recent Vercel deployments */}
              {deployments.length > 0 && (
                <div style={{
                  padding: '6px 10px',
                  borderBottom: `1px solid ${borderDim}`,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.01)',
                  flexShrink: 0, overflowX: 'auto',
                }}>
                  <span style={{ fontSize: '10px', color: textMuted, flexShrink: 0, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Deployments:
                  </span>
                  {deployments.slice(0, 5).map((d: any) => (
                    <button
                      key={d.id}
                      onClick={() => { if (d.url) { setPreviewInput(d.url); setPreviewUrl(d.url); } }}
                      title={d.url || 'No URL'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '3px 8px', borderRadius: '5px', flexShrink: 0,
                        fontSize: '10px', fontWeight: 600, fontFamily: 'monospace',
                        background: d.state === 'READY' ? 'rgba(16,217,160,0.07)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${d.state === 'READY' ? 'rgba(16,217,160,0.25)' : borderDim}`,
                        color: d.state === 'READY' ? emerald : d.state === 'ERROR' ? '#ef4444' : textSecondary,
                        cursor: d.url ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{
                        width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                        background: d.state === 'READY' ? emerald : d.state === 'ERROR' ? '#ef4444' : '#fb923c',
                      }} />
                      {d.target === 'production' ? 'prod' : 'preview'} · {new Date(d.createdAt).toLocaleDateString()}
                    </button>
                  ))}
                  {deploymentsLoading && <Loader2 size={11} style={{ color: textMuted }} className="animate-spin" />}
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={previewUrl}
                style={{ flex: 1, width: '100%', border: 'none' }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title="Site Preview"
              />
            </div>
          )}

          {/* ── ACTIVITY LOG ── */}
          {rightTab === 'activity' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '9px',
                    background: 'rgba(16,217,160,0.08)',
                    border: '1px solid rgba(16,217,160,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={14} style={{ color: emerald }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>Security Activity</div>
                    <div style={{ fontSize: '10px', color: textSecondary }}>All system events</div>
                  </div>
                </div>
                <button
                  onClick={() => itangoFetch('/api/itango/activity', { credentials: 'include' }).then(r => r.json()).then(d => setActivityLog(d.log || []))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px', borderRadius: '7px',
                    fontSize: '11px', fontWeight: 600,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${borderDim}`,
                    color: textSecondary, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={10} /> Refresh
                </button>
              </div>

              {activityLog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Activity size={28} style={{ color: textMuted, margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: '13px', color: textSecondary, margin: '0 0 4px' }}>No activity recorded</p>
                  <p style={{ fontSize: '11px', color: textMuted, margin: 0 }}>Events will appear here as you use the editor</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activityLog.map((entry: any) => {
                    const riskColor = entry.risk === 'high' ? '#ef4444' : entry.risk === 'medium' ? '#fb923c' : emerald;
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 14px', borderRadius: '9px',
                          background: entry.risk === 'high'
                            ? 'rgba(239,68,68,0.05)'
                            : entry.risk === 'medium'
                              ? 'rgba(251,146,60,0.05)'
                              : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${riskColor}22`,
                        }}
                      >
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: riskColor, flexShrink: 0, boxShadow: `0 0 6px ${riskColor}55` }} />
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#4fc3f7', flexShrink: 0, minWidth: '100px' }}>
                          {entry.action}
                        </span>
                        <span style={{ fontSize: '12px', color: textSecondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.detail}
                        </span>
                        <span style={{ fontSize: '10px', color: textMuted, flexShrink: 0, fontFamily: 'monospace' }}>
                          {new Date(entry.ts).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ─────────────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          height: '56px',
          display: 'flex', alignItems: 'stretch',
          background: 'linear-gradient(180deg, #060810 0%, #040508 100%)',
          borderTop: `1px solid ${borderGold}`,
          boxShadow: `0 -4px 20px rgba(0,0,0,0.5)`,
        }}>
          {([
            { id: 'chat',   label: 'Chat',   Icon: MessageSquare },
            { id: 'editor', label: 'Editor', Icon: Code2 },
            { id: 'files',  label: 'Files',  Icon: Folder },
          ] as { id: 'chat' | 'editor' | 'files'; label: string; Icon: React.ComponentType<{ size: number; style?: React.CSSProperties }> }[]).map(tab => {
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: active ? gold : textSecondary,
                  borderTop: active ? `2px solid ${gold}` : '2px solid transparent',
                  transition: 'all 0.15s',
                  paddingBottom: '2px',
                }}
              >
                <tab.Icon size={18} style={{ color: active ? gold : textSecondary }} />
                <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, letterSpacing: '0.06em', color: active ? gold : textSecondary }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}
      {showCommitModal && selectedFile && (
        <CommitModal
          filePath={selectedFile.path}
          onConfirm={handleCommit}
          onCancel={() => setShowCommitModal(false)}
          loading={commitLoading}
        />
      )}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      {/* ── TOAST ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: isMobile ? '68px' : '24px', right: '24px', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 18px', borderRadius: '12px',
          background: toast.type === 'success' ? 'rgba(16,217,160,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(16,217,160,0.3)' : 'rgba(239,68,68,0.3)'}`,
          boxShadow: `0 8px 32px ${toast.type === 'success' ? 'rgba(16,217,160,0.12)' : 'rgba(239,68,68,0.12)'}`,
          color: toast.type === 'success' ? emerald : '#f87171',
          fontSize: '13px', fontWeight: 600,
          backdropFilter: 'blur(8px)',
          animation: 'slideUp 0.2s ease',
        }}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} />
            : <AlertTriangle size={16} />
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}
